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

function addAudit(action, message, userId) {
  addDoc(collection(db, 'auditLogs'), {
    action, message, userId, timestamp: serverTimestamp()
  }).catch(() => {});
}

export const api = {
  login: async (email, password) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    const userDoc = await getDoc(doc(db, 'users', result.user.uid));
    const userData = userDoc.exists() ? userDoc.data() : {};
    return { user: { id: result.user.uid, ...userData } };
  },

  register: async (name, email, password) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    const userData = {
      name, email, role: 'worker',
      avatar: name[0].toUpperCase(),
      rate: 20, joinedAt: new Date().toISOString().split('T')[0]
    };
    await updateProfile(result.user, { displayName: name });
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
    const isAdmin = userDoc.exists() && userDoc.data().role === 'admin';
    let q;
    if (isAdmin) {
      q = query(collection(db, 'tasks'), orderBy('createdAt', 'desc'));
    } else {
      q = query(collection(db, 'tasks'),
        where('assignedTo', 'in', [u.uid, null])
      );
    }
    const snapshot = await getDocs(q);
    const tasks = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    return { tasks };
  },

  createTask: async (taskData) => {
    const u = auth.currentUser;
    const docRef = await addDoc(collection(db, 'tasks'), {
      type: taskData.type || 'CODE',
      title: (taskData.title || '').slice(0, 200),
      project: (taskData.project || '').slice(0, 200),
      status: 'Not Started',
      category: 'Active',
      priority: taskData.priority || 'Medium',
      rate: taskData.rate || '$25/hr',
      rateNum: taskData.rateNum || 25,
      dueDate: taskData.dueDate || 'Aug 15, 2026',
      description: (taskData.description || '').slice(0, 2000),
      assignedTo: taskData.assignedTo || null,
      createdBy: u.uid,
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
    addAudit('task_created', `Created: ${task.title}`, u.uid);
    return { task };
  },

  updateTaskStatus: async (id, status) => {
    const ref = doc(db, 'tasks', id);
    await updateDoc(ref, { status, category: status });
    const snap = await getDoc(ref);
    addAudit('task_updated', `${snap.data()?.title} → ${status}`, auth.currentUser.uid);
    return { task: { id, ...snap.data(), status } };
  },

  startTask: async (id) => {
    const ref = doc(db, 'tasks', id);
    const snap = await getDoc(ref);
    const task = snap.data();
    if (!task.startedAt) {
      await updateDoc(ref, { startedAt: serverTimestamp() });
    }
    await updateDoc(ref, { status: 'In Progress', category: 'In Progress' });
    const updated = await getDoc(ref);
    addAudit('task_started', `Started: ${task.title}`, auth.currentUser.uid);
    return { task: { id, ...updated.data() } };
  },

  submitTask: async (id, submission) => {
    const ref = doc(db, 'tasks', id);
    const snap = await getDoc(ref);
    const task = snap.data();
    let timeSpent = 0;
    if (task.startedAt) {
      const startedMs = task.startedAt instanceof Timestamp
        ? task.startedAt.toMillis()
        : new Date(task.startedAt).getTime();
      timeSpent = Math.floor((Date.now() - startedMs) / 1000);
    }
    const activeSeconds = submission.activeSecondsLogged || 0;
    const updates = {
      status: 'Submitted',
      category: 'Submitted',
      submittedCode: (submission.submittedCode || '').slice(0, 50000),
      submittedNotes: (submission.submittedNotes || '').slice(0, 2000),
      submittedFiles: Array.isArray(submission.submittedFiles) ? submission.submittedFiles.slice(0, 20) : [],
      submittedAt: serverTimestamp(),
      activeSecondsLogged: activeSeconds,
      loggedTime: submission.loggedTime || task.loggedTime,
      timeSpent,
      idleTime: Math.max(0, timeSpent - activeSeconds)
    };
    await updateDoc(ref, updates);
    const updated = await getDoc(ref);
    addAudit('task_submitted', `Submitted: ${task.title} (${submission.loggedTime})`, auth.currentUser.uid);
    return { task: { id, ...updated.data() } };
  },

  reviewTask: async (id, review) => {
    const ref = doc(db, 'tasks', id);
    const snap = await getDoc(ref);
    const task = snap.data();
    const newStatus = review.status === 'Approved' ? 'Completed' : 'In Progress';
    await updateDoc(ref, {
      status: newStatus,
      category: newStatus,
      reviewStatus: review.status,
      reviewComment: (review.comment || '').slice(0, 2000)
    });
    const updated = await getDoc(ref);
    addAudit('task_reviewed', `${task.title}: ${review.status}`, auth.currentUser.uid);
    return { task: { id, ...updated.data() } };
  },

  deleteTask: async (id) => {
    const ref = doc(db, 'tasks', id);
    const snap = await getDoc(ref);
    await deleteDoc(ref);
    addAudit('task_deleted', `Deleted: ${snap.data()?.title}`, auth.currentUser.uid);
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
    await addDoc(collection(db, 'timeLogs'), {
      userId: auth.currentUser.uid,
      taskId,
      clientTimestamp,
      inputHash,
      timestamp: serverTimestamp()
    });
    return { activeSeconds: 0, totalElapsed: 0, serverTimestamp: Date.now() };
  },

  getTimeBreakdown: async () => {
    const u = auth.currentUser;
    const q = query(collection(db, 'timeLogs'), where('userId', '==', u.uid));
    const snapshot = await getDocs(q);
    const breakdown = {};
    snapshot.docs.forEach(d => {
      const log = d.data();
      if (!breakdown[log.taskId]) breakdown[log.taskId] = { activeSeconds: 0, totalElapsed: 0 };
    });
    return { breakdown };
  },

  getEarnings: async () => {
    const u = auth.currentUser;
    const userDoc = await getDoc(doc(db, 'users', u.uid));
    const rate = userDoc.exists() ? userDoc.data().rate : 25;
    return { userId: u.uid, rate };
  },

  uploadFile: async (file, taskId) => {
    const storageRef = ref(storage, `tasks/${taskId}/${Date.now()}_${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    return getDownloadURL(snapshot.ref);
  },

  subscribeToTasks: (userId, isAdmin, callback) => {
    let q;
    if (isAdmin) {
      q = query(collection(db, 'tasks'), orderBy('createdAt', 'desc'));
    } else {
      q = query(collection(db, 'tasks'),
        where('assignedTo', 'in', [userId, null])
      );
    }
    return onSnapshot(q, (snapshot) => {
      const tasks = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
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
