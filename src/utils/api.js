import {
  collection, addDoc, updateDoc, deleteDoc, doc,
  getDocs, getDoc, query, where, onSnapshot, serverTimestamp,
  orderBy, Timestamp
} from 'firebase/firestore';
import {
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signOut, updateProfile
} from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth, storage } from '../firebase';
import { sanitizeInput, sanitizePlain } from './sanitize';
import { validateTaskInput, validateFileUpload } from './validators';

function toMillis(ts) {
  if (!ts) return 0;
  if (ts.toMillis) return ts.toMillis();
  if (ts.seconds) return ts.seconds * 1000;
  return new Date(ts).getTime() || 0;
}

function toIsoStr(ts) {
  if (!ts) return null;
  if (typeof ts === 'string') return ts;
  if (ts.toDate) return ts.toDate().toISOString();
  if (ts.seconds) return new Date(ts.seconds * 1000).toISOString();
  return null;
}

function cleanTask(d) {
  const data = d.data();
  return {
    id: d.id,
    ...data,
    createdAt: toIsoStr(data.createdAt),
    startedAt: toIsoStr(data.startedAt),
    submittedAt: toIsoStr(data.submittedAt),
  };
}

function addAudit(action, message, userId) {
  addDoc(collection(db, 'auditLogs'), {
    action, message, userId, timestamp: serverTimestamp()
  }).catch(() => {});
}

async function isAdmin() {
  const u = auth.currentUser;
  if (!u) return false;
  const snap = await getDoc(doc(db, 'users', u.uid));
  return snap.exists() && snap.data().role === 'admin';
}

async function requireAdmin() {
  const u = auth.currentUser;
  if (!u) throw new Error('Not authenticated');
  const snap = await getDoc(doc(db, 'users', u.uid));
  if (!snap.exists() || snap.data().role !== 'admin') throw new Error('Admin access required');
  return { uid: u.uid, data: snap.data() };
}

export const api = {
  login: async (email, password) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    const userDoc = await getDoc(doc(db, 'users', result.user.uid));
    const userData = userDoc.exists() ? userDoc.data() : {};
    return { user: { id: result.user.uid, ...userData } };
  },

  register: async (name, email, password) => {
    const cleanName = sanitizePlain(name);
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName: cleanName });
    const userData = {
      name: cleanName, email, role: 'worker',
      avatar: cleanName[0]?.toUpperCase() || 'U',
      rate: 20, joinedAt: new Date().toISOString().split('T')[0]
    };
    const userRef = doc(db, 'users', result.user.uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      const { setDoc } = await import('firebase/firestore');
      await setDoc(userRef, userData);
    }
    return { user: { id: result.user.uid, ...userData } };
  },

  logout: async () => { await signOut(auth); },

  me: async () => {
    const u = auth.currentUser;
    if (!u) throw new Error('Not authenticated');
    const userDoc = await getDoc(doc(db, 'users', u.uid));
    const userData = userDoc.exists() ? userDoc.data() : {};
    return { user: { id: u.uid, ...userData } };
  },

  getTasks: async () => {
    const u = auth.currentUser;
    if (!u) return { tasks: [] };
    const userDoc = await getDoc(doc(db, 'users', u.uid));
    const admin = userDoc.exists() && userDoc.data().role === 'admin';
    const snapshot = await getDocs(query(collection(db, 'tasks'), orderBy('createdAt', 'desc')));
    let tasks = snapshot.docs.map(cleanTask);
    if (!admin) {
      tasks = tasks.filter(t => t.assignedTo === u.uid || !t.assignedTo);
    }
    return { tasks };
  },

  createTask: async (taskData) => {
    const { uid } = await requireAdmin();
    const errors = validateTaskInput(taskData);
    if (errors.length) throw new Error(errors[0]);
    const docRef = await addDoc(collection(db, 'tasks'), {
      type: taskData.type || 'CODE',
      title: sanitizeInput(taskData.title),
      project: sanitizeInput(taskData.project),
      status: 'Not Started',
      category: 'Active',
      priority: taskData.priority || 'Medium',
      rate: taskData.rate || '$25/hr',
      rateNum: taskData.rateNum || 25,
      dueDate: taskData.dueDate || 'Aug 15, 2026',
      description: sanitizeInput(taskData.description),
      assignedTo: taskData.assignedTo || null,
      createdBy: uid,
      createdAt: serverTimestamp(),
      startedAt: null,
      loggedTime: '0h 00m',
      activeSecondsLogged: 0,
      idleTime: 0,
      timeSpent: 0,
      submittedCode: '',
      submittedNotes: '',
      submittedAt: null,
      submittedFiles: [],
      reviewStatus: '',
      reviewComment: ''
    });
    const task = { id: docRef.id, ...taskData, status: 'Not Started', createdAt: new Date().toISOString() };
    addAudit('task_created', `Created: ${taskData.title}`, uid);
    return { task };
  },

  updateTaskStatus: async (id, status) => {
    const { uid } = await requireAdmin();
    const ref = doc(db, 'tasks', id);
    await updateDoc(ref, { status, category: status });
    const snap = await getDoc(ref);
    addAudit('task_updated', `${snap.data()?.title} → ${status}`, uid);
    return { task: { id, ...snap.data(), status } };
  },

  startTask: async (id) => {
    const u = auth.currentUser;
    if (!u) throw new Error('Not authenticated');
    const ref = doc(db, 'tasks', id);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error('Task not found');
    const task = snap.data();
    if (task.status === 'In Progress' || task.status === 'Submitted' || task.status === 'Completed') {
      throw new Error('Task cannot be started in its current status');
    }
    await updateDoc(ref, {
      startedAt: task.startedAt || serverTimestamp(),
      status: 'In Progress',
      category: 'In Progress'
    });
    addAudit('task_started', `Started: ${task.title}`, u.uid);
    const updated = await getDoc(ref);
    return { task: cleanTask(updated) };
  },

  submitTask: async (id, submission) => {
    const u = auth.currentUser;
    if (!u) throw new Error('Not authenticated');
    const ref = doc(db, 'tasks', id);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error('Task not found');
    const task = snap.data();
    if (task.status !== 'In Progress') throw new Error('Only in-progress tasks can be submitted');
    let timeSpent = 0;
    if (task.startedAt) {
      const startedMs = toMillis(task.startedAt);
      timeSpent = Math.floor((Date.now() - startedMs) / 1000);
    }
    const activeSeconds = submission.activeSecondsLogged || 0;
    const updates = {
      status: 'Submitted',
      category: 'Submitted',
      submittedCode: sanitizeInput(submission.submittedCode || ''),
      submittedNotes: sanitizeInput(submission.submittedNotes || ''),
      submittedFiles: Array.isArray(submission.submittedFiles) ? submission.submittedFiles.slice(0, 20) : [],
      submittedAt: serverTimestamp(),
      activeSecondsLogged: activeSeconds,
      loggedTime: submission.loggedTime || task.loggedTime,
      timeSpent,
      idleTime: Math.max(0, timeSpent - activeSeconds)
    };
    await updateDoc(ref, updates);
    addAudit('task_submitted', `Submitted: ${task.title} (${submission.loggedTime})`, u.uid);
    const updated = await getDoc(ref);
    return { task: cleanTask(updated) };
  },

  reviewTask: async (id, review) => {
    const { uid } = await requireAdmin();
    const ref = doc(db, 'tasks', id);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error('Task not found');
    const task = snap.data();
    if (task.status !== 'Submitted') throw new Error('Only submitted tasks can be reviewed');
    const newStatus = review.status === 'Approved' ? 'Completed' : 'In Progress';
    await updateDoc(ref, {
      status: newStatus,
      category: newStatus,
      reviewStatus: review.status,
      reviewComment: sanitizeInput(review.comment || '')
    });
    addAudit('task_reviewed', `${task.title}: ${review.status}`, uid);
    const updated = await getDoc(ref);
    return { task: cleanTask(updated) };
  },

  deleteTask: async (id) => {
    const { uid } = await requireAdmin();
    const ref = doc(db, 'tasks', id);
    const snap = await getDoc(ref);
    await deleteDoc(ref);
    addAudit('task_deleted', `Deleted: ${snap.data()?.title}`, uid);
  },

  getWorkers: async () => {
    const q = query(collection(db, 'users'), where('role', '==', 'worker'));
    const snapshot = await getDocs(q);
    const workers = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    return { workers };
  },

  getAuditLog: async () => {
    const q = query(collection(db, 'auditLogs'), orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    const auditLog = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    return { auditLog: auditLog.slice(0, 200) };
  },

  sendHeartbeat: async (taskId, clientTimestamp, inputHash) => {
    const u = auth.currentUser;
    if (!u) return;
    await addDoc(collection(db, 'timeLogs'), {
      userId: u.uid,
      taskId,
      clientTimestamp,
      inputHash,
      timestamp: serverTimestamp()
    }).catch(() => {});
    return { activeSeconds: 0, totalElapsed: 0, serverTimestamp: Date.now() };
  },

  getTimeBreakdown: async () => {
    const u = auth.currentUser;
    if (!u) return { breakdown: {} };
    const q = query(collection(db, 'timeLogs'), where('userId', '==', u.uid));
    const snapshot = await getDocs(q);
    const breakdown = {};
    snapshot.docs.forEach(d => {
      const log = d.data();
      if (!breakdown[log.taskId]) breakdown[log.taskId] = { activeSeconds: 0, totalElapsed: 0 };
      breakdown[log.taskId].activeSeconds += log.activeSeconds || 0;
      breakdown[log.taskId].totalElapsed += log.totalElapsed || 0;
    });
    return { breakdown };
  },

  getEarnings: async () => {
    const u = auth.currentUser;
    if (!u) return { userId: '', rate: 25 };
    const userDoc = await getDoc(doc(db, 'users', u.uid));
    const rate = userDoc.exists() ? userDoc.data().rate : 25;
    return { userId: u.uid, rate };
  },

  uploadFile: async (file, taskId) => {
    const error = validateFileUpload(file);
    if (error) throw new Error(error);
    const storageRef = ref(storage, `tasks/${taskId}/${Date.now()}_${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    return getDownloadURL(snapshot.ref);
  },

  subscribeToTasks: (userId, isAdmin, callback) => {
    const q = query(collection(db, 'tasks'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      let tasks = snapshot.docs.map(cleanTask);
      if (!isAdmin) {
        tasks = tasks.filter(t => t.assignedTo === userId || !t.assignedTo);
      }
      callback(tasks);
    });
  },

  subscribeToWorkers: (callback) => {
    const q = query(collection(db, 'users'), where('role', '==', 'worker'));
    return onSnapshot(q, (snapshot) => {
      const workers = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      callback(workers);
    });
  },

  subscribeToAuditLog: (callback) => {
    const q = query(collection(db, 'auditLogs'), orderBy('timestamp', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const log = snapshot.docs.map(d => ({ id: d.id, ...d.data() })).slice(0, 200);
      callback(log);
    });
  }
};
