import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  signInWithCustomToken,
  onAuthStateChanged
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc
} from 'firebase/firestore';
import {
  LayoutDashboard,
  ListTodo,
  Clock,
  DollarSign,
  Wallet,
  FileText,
  HelpCircle,
  Settings,
  Bell,
  Star,
  Play,
  Pause,
  Square,
  Megaphone,
  CheckCircle2,
  ArrowRight,
  Plus,
  X,
  ShieldCheck,
  UserCheck,
  Trash2,
  Check,
  Sparkles,
  Database,
  Activity,
  Menu,
  ChevronRight
} from 'lucide-react';

const defaultFirebaseConfig = {
  apiKey: "demo-api-key",
  authDomain: "demo-app.firebaseapp.com",
  projectId: "demo-app",
  storageBucket: "demo-app.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:demo"
};

const firebaseConfig = typeof __firebase_config !== 'undefined'
  ? JSON.parse(__firebase_config)
  : defaultFirebaseConfig;

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'corein-worker-portal';

const defaultInitialTasks = [
  {
    id: 'PY-001',
    type: 'CODE',
    title: 'Python Hlo World',
    project: 'Python Starter Project',
    status: 'Not Started',
    loggedTime: '00:00:00',
    activeSeconds: 0,
    dueDate: 'Jul 30, 2026',
    category: 'Active',
    priority: 'High',
    rate: '$25/hr',
    description: 'Write a clean Python script that prints "Hello World". Click "Start Task" to begin active input tracking and submit your Python code when finished.'
  }
];

const announcementsData = [
  {
    id: 1,
    title: 'New project available: Medical QA Evaluation',
    desc: 'High priority project for medical domain experts.',
    time: '2h ago'
  },
  {
    id: 2,
    title: 'Scheduled maintenance on May 25, 2:00 AM UTC',
    desc: 'Platform may be unavailable during this window.',
    time: '1d ago'
  }
];

export default function App() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('worker');
  const [activeNav, setActiveNav] = useState('Dashboard');
  const [taskFilter, setTaskFilter] = useState('Active');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(true);

  const [activeTaskId, setActiveTaskId] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [taskActiveSeconds, setTaskActiveSeconds] = useState({});
  const [taskTotalElapsed, setTaskTotalElapsed] = useState({});

  const [lastKeyboardTimestamp, setLastKeyboardTimestamp] = useState(0);
  const [lastMouseTimestamp, setLastMouseTimestamp] = useState(0);
  const [isKeyboardActive, setIsKeyboardActive] = useState(false);
  const [isMouseActive, setIsMouseActive] = useState(false);
  const [isDualInputActive, setIsDualInputActive] = useState(false);

  const [submittingTask, setSubmittingTask] = useState(null);
  const [submissionCode, setSubmissionCode] = useState('print("Hello World!")');
  const [submissionNotes, setSubmissionNotes] = useState('');

  const [newTask, setNewTask] = useState({
    title: 'Python Hlo World',
    project: 'Python Starter Project',
    type: 'CODE',
    priority: 'High',
    rate: '$25/hr',
    dueDate: 'Jul 30, 2026',
    description: 'Write a basic Python program to output Hello World and verify setup.'
  });
  const [adminNotification, setAdminNotification] = useState('');

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Auth initialization error:", err);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const tasksCollectionRef = collection(db, 'artifacts', appId, 'public', 'data', 'tasks');

    const unsubscribe = onSnapshot(
      tasksCollectionRef,
      async (snapshot) => {
        if (snapshot.empty) {
          for (const item of defaultInitialTasks) {
            await addDoc(tasksCollectionRef, item);
          }
        } else {
          const loadedTasks = snapshot.docs.map((d) => ({
            firestoreId: d.id,
            ...d.data()
          }));
          setTasks(loadedTasks);
        }
        setLoadingTasks(false);
      },
      (error) => {
        console.error("Error listening to tasks database:", error);
        setTasks(defaultInitialTasks);
        setLoadingTasks(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!isTracking || !activeTaskId || isPaused) {
      setIsKeyboardActive(false);
      setIsMouseActive(false);
      setIsDualInputActive(false);
      return;
    }

    const handleKeyInput = () => {
      setLastKeyboardTimestamp(Date.now());
    };

    const handleMouseInput = () => {
      setLastMouseTimestamp(Date.now());
    };

    const keyEvents = ['keydown', 'keyup'];
    const mouseEvents = ['mousemove', 'mousedown', 'click', 'scroll', 'wheel', 'touchstart'];

    keyEvents.forEach((evt) => window.addEventListener(evt, handleKeyInput, { passive: true }));
    mouseEvents.forEach((evt) => window.addEventListener(evt, handleMouseInput, { passive: true }));

    const DUAL_IDLE_CUTOFF_MS = 8000;

    const interval = setInterval(() => {
      const now = Date.now();
      const kbMs = lastKeyboardTimestamp ? now - lastKeyboardTimestamp : 999999;
      const mouseMs = lastMouseTimestamp ? now - lastMouseTimestamp : 999999;

      const kbActive = kbMs <= DUAL_IDLE_CUTOFF_MS;
      const mActive = mouseMs <= DUAL_IDLE_CUTOFF_MS;
      const dualActive = kbActive && mActive;

      setIsKeyboardActive(kbActive);
      setIsMouseActive(mActive);
      setIsDualInputActive(dualActive);

      if (dualActive) {
        setTaskActiveSeconds((prev) => ({
          ...prev,
          [activeTaskId]: (prev[activeTaskId] || 0) + 1
        }));
      }

      setTaskTotalElapsed((prev) => ({
        ...prev,
        [activeTaskId]: (prev[activeTaskId] || 0) + 1
      }));
    }, 1000);

    return () => {
      keyEvents.forEach((evt) => window.removeEventListener(evt, handleKeyInput));
      mouseEvents.forEach((evt) => window.removeEventListener(evt, handleMouseInput));
      clearInterval(interval);
    };
  }, [isTracking, activeTaskId, isPaused, lastKeyboardTimestamp, lastMouseTimestamp]);

  const formatSecondsToTime = (totalSecs = 0) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const formatShortTime = (totalSecs = 0) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  const handleStartTask = (task) => {
    const tId = task.firestoreId || task.id;
    const now = Date.now();
    setActiveTaskId(tId);
    setIsTracking(true);
    setIsPaused(false);
    setLastKeyboardTimestamp(now);
    setLastMouseTimestamp(now);
    setIsKeyboardActive(true);
    setIsMouseActive(true);
    setIsDualInputActive(true);

    if (task.firestoreId) {
      const taskRef = doc(db, 'artifacts', appId, 'public', 'data', 'tasks', task.firestoreId);
      updateDoc(taskRef, { status: 'In Progress' }).catch(console.error);
    }
  };

  const handleStopOrPause = () => {
    setIsPaused(!isPaused);
  };

  const handleOpenSubmitModal = (task) => {
    setIsTracking(false);
    setSubmittingTask(task);
  };

  const handleConfirmTaskSubmission = async () => {
    if (!submittingTask) return;
    const tId = submittingTask.firestoreId || submittingTask.id;
    const activeSecs = taskActiveSeconds[tId] || submittingTask.activeSeconds || 0;
    const formattedLoggedTime = formatShortTime(activeSecs);

    try {
      if (submittingTask.firestoreId) {
        const taskRef = doc(db, 'artifacts', appId, 'public', 'data', 'tasks', submittingTask.firestoreId);
        await updateDoc(taskRef, {
          status: 'Submitted',
          category: 'Submitted',
          loggedTime: formattedLoggedTime,
          activeSecondsLogged: activeSecs,
          submittedCode: submissionCode,
          submittedNotes: submissionNotes,
          submittedAt: new Date().toISOString()
        });
      } else {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === submittingTask.id
              ? {
                  ...t,
                  status: 'Submitted',
                  category: 'Submitted',
                  loggedTime: formattedLoggedTime,
                  submittedCode: submissionCode
                }
              : t
          )
        );
      }

      setAdminNotification(`Task "${submittingTask.title}" submitted successfully with ${formattedLoggedTime} of active input time!`);
      setTimeout(() => setAdminNotification(''), 5000);
      setSubmittingTask(null);
      if (activeTaskId === tId) {
        setActiveTaskId(null);
        setIsTracking(false);
      }
    } catch (err) {
      console.error("Error submitting task:", err);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTask.title || !newTask.project) {
      setAdminNotification('Please fill in required fields (Title & Project).');
      return;
    }

    const taskData = {
      id: `${newTask.type}-${Math.floor(1000 + Math.random() * 9000)}`,
      type: newTask.type,
      title: newTask.title,
      project: newTask.project,
      status: 'Not Started',
      loggedTime: '0h 00m',
      dueDate: newTask.dueDate || 'Jul 30, 2026',
      category: 'Active',
      priority: newTask.priority,
      rate: newTask.rate,
      description: newTask.description || 'No detailed description provided.'
    };

    try {
      if (user) {
        const tasksCollectionRef = collection(db, 'artifacts', appId, 'public', 'data', 'tasks');
        await addDoc(tasksCollectionRef, taskData);
      } else {
        setTasks((prev) => [taskData, ...prev]);
      }

      setNewTask({
        title: '',
        project: '',
        type: 'CODE',
        priority: 'High',
        rate: '$25/hr',
        dueDate: 'Jul 30, 2026',
        description: ''
      });

      setAdminNotification('Task created and published to Real-Time DB!');
      setTimeout(() => setAdminNotification(''), 4000);
    } catch (err) {
      console.error("Error creating task:", err);
      setAdminNotification('Failed to create task.');
    }
  };

  const handleCompleteTask = async (task) => {
    try {
      if (task.firestoreId) {
        const taskRef = doc(db, 'artifacts', appId, 'public', 'data', 'tasks', task.firestoreId);
        await updateDoc(taskRef, {
          status: 'Completed',
          category: 'Completed',
          loggedTime: task.loggedTime === '0h 00m' ? `${Math.max(1, Math.floor(taskTotalElapsed[task.id] / 60))}m` : task.loggedTime
        });
      } else {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === task.id ? { ...t, status: 'Completed', category: 'Completed' } : t
          )
        );
      }
      if (selectedTask?.id === task.id) {
        setSelectedTask((prev) => ({ ...prev, status: 'Completed', category: 'Completed' }));
      }
      setAdminNotification(`Task "${task.title}" marked as Completed!`);
      setTimeout(() => setAdminNotification(''), 4000);
    } catch (err) {
      console.error("Error completing task:", err);
    }
  };

  const handleDeleteTask = async (task) => {
    try {
      if (task.firestoreId) {
        const taskRef = doc(db, 'artifacts', appId, 'public', 'data', 'tasks', task.firestoreId);
        await deleteDoc(taskRef);
      } else {
        setTasks((prev) => prev.filter((t) => t.id !== task.id));
      }
    } catch (err) {
      console.error("Error deleting task:", err);
    }
  };

  const navSections = [
    {
      title: 'WORK',
      items: [
        { name: 'Dashboard', icon: LayoutDashboard },
        { name: 'My Tasks', icon: ListTodo, badge: `${tasks.filter((t) => t.status !== 'Completed').length}` },
        { name: 'Active Tasks', icon: Activity },
        { name: 'Completed Tasks', icon: CheckCircle2 }
      ]
    },
    {
      title: 'MANAGEMENT',
      items: [
        { name: 'Admin Portal', icon: ShieldCheck, badge: 'ADMIN' }
      ]
    },
    {
      title: 'TIME & EARNINGS',
      items: [
        { name: 'Time Tracker', icon: Clock },
        { name: 'Earnings', icon: DollarSign },
        { name: 'Payouts', icon: Wallet },
        { name: 'Invoices', icon: FileText }
      ]
    },
    {
      title: 'ACCOUNT',
      items: [
        { name: 'Profile', icon: UserCheck },
        { name: 'Support', icon: HelpCircle },
        { name: 'Settings', icon: Settings }
      ]
    }
  ];

  const filteredTasks = tasks.filter((t) => {
    if (taskFilter === 'Active') return t.status !== 'Completed';
    if (taskFilter === 'In Progress') return t.status === 'In Progress';
    if (taskFilter === 'Submitted') return t.status === 'Submitted';
    if (taskFilter === 'Completed') return t.status === 'Completed';
    return true;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex font-sans antialiased">
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#0A1228] text-slate-300 flex flex-col transform transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-5 flex items-center justify-between border-b border-slate-800/60">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-600/30 font-bold">
              CORE
            </div>
            <div>
              <h1 className="font-bold text-white text-base tracking-wider uppercase">COREIN</h1>
              <p className="text-xs text-blue-400 font-medium">
                {role === 'admin' ? 'Admin Control' : 'Worker Portal'}
              </p>
            </div>
          </div>
          <button onClick={() => setMobileMenuOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3 bg-slate-900/60 border-b border-slate-800">
          <div className="flex bg-slate-800/80 p-1 rounded-lg text-xs font-semibold">
            <button
              onClick={() => { setRole('worker'); setActiveNav('Dashboard'); }}
              className={`flex-1 py-1.5 rounded-md flex items-center justify-center space-x-1 transition ${
                role === 'worker' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Worker View</span>
            </button>
            <button
              onClick={() => { setRole('admin'); setActiveNav('Admin Portal'); }}
              className={`flex-1 py-1.5 rounded-md flex items-center justify-center space-x-1 transition ${
                role === 'admin' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin Mode</span>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {navSections.map((section, idx) => (
            <div key={idx}>
              <p className="px-3 text-[11px] font-semibold text-slate-400 tracking-wider uppercase mb-2">
                {section.title}
              </p>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeNav === item.name;
                  return (
                    <button
                      key={item.name}
                      onClick={() => {
                        setActiveNav(item.name);
                        if (item.name === 'Admin Portal') setRole('admin');
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-semibold'
                          : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                        <span>{item.name}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                            item.badge === 'ADMIN'
                              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                              : isActive
                              ? 'bg-blue-800 text-blue-100'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-slate-800/80 text-xs text-slate-400 space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1.5">
              <Database className="w-3 h-3 text-emerald-400" /> Real-time Sync
            </span>
            <span className="text-emerald-400 font-mono">Online</span>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl lg:text-2xl font-bold text-slate-900">
                  {role === 'admin' ? 'Admin Task Control Panel' : 'Welcome back, Arjun!'}
                </h1>
                <span className="text-xl">{role === 'admin' ? '\u{1F6E1}\uFE0F' : '\u{1F44B}'}</span>
              </div>
              <p className="text-sm text-slate-500 hidden sm:block">
                {role === 'admin'
                  ? 'Assign tasks, monitor progress, and manage real-time worker workflows.'
                  : "Here's what's happening with your work today."}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <span className={`hidden sm:inline-flex text-xs font-bold px-3 py-1 rounded-full ${
              role === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-blue-100 text-blue-700'
            }`}>
              {role === 'admin' ? 'ADMIN MODE' : 'WORKER MODE'}
            </span>

            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-full transition"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                  2
                </span>
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50">
                  <div className="px-4 py-2 border-b border-slate-100 flex justify-between items-center">
                    <span className="font-semibold text-slate-800 text-sm">Notifications</span>
                    <span className="text-xs text-blue-600 cursor-pointer hover:underline">Clear</span>
                  </div>
                  <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                    <div className="p-3 hover:bg-slate-50 transition cursor-pointer">
                      <p className="text-xs font-semibold text-slate-800">Task Assigned</p>
                      <p className="text-xs text-slate-500 mt-0.5">Python Hlo World assigned to active queue.</p>
                      <span className="text-[10px] text-slate-400 mt-1 block">Just now</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120"
                alt="Arjun"
                className="w-9 h-9 rounded-full object-cover ring-2 ring-blue-500/20"
              />
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          {activeTaskId && (
            <div className="bg-slate-900 text-white p-4 lg:p-5 rounded-2xl shadow-xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 sticky top-20 z-20">
              <div className="flex items-center space-x-3 w-full md:w-auto">
                <div className={`w-3 h-3 rounded-full ${isDualInputActive ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'}`} />
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Currently Working On</span>
                  <h2 className="text-base font-bold text-white">
                    {tasks.find((t) => (t.firestoreId || t.id) === activeTaskId)?.title || 'Python Task'}
                  </h2>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-800/90 px-4 py-2.5 rounded-xl border border-slate-700">
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">Exact Dual-Input Time</span>
                  <span className="text-2xl font-mono font-bold text-emerald-400">
                    {formatSecondsToTime(taskActiveSeconds[activeTaskId] || 0)}
                  </span>
                </div>

                <div className="border-t sm:border-t-0 sm:border-l border-slate-700 pt-2 sm:pt-0 sm:pl-4 text-xs font-semibold space-y-1">
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className={`px-2 py-0.5 rounded font-mono flex items-center gap-1 ${isKeyboardActive ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'}`}>
                      Keyboard: {isKeyboardActive ? 'ACTIVE' : 'NO INPUT'}
                    </span>
                    <span className={`px-2 py-0.5 rounded font-mono flex items-center gap-1 ${isMouseActive ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'}`}>
                      Mouse: {isMouseActive ? 'ACTIVE' : 'NO INPUT'}
                    </span>
                  </div>

                  <div>
                    {isDualInputActive ? (
                      <span className="text-emerald-400 text-xs flex items-center gap-1.5 font-bold">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        Dual-Input Validated (Timer Incrementing)
                      </span>
                    ) : (
                      <span className="text-amber-400 text-xs flex items-center gap-1.5 font-bold">
                        <span className="w-2 h-2 rounded-full bg-amber-400" />
                        PAUSED - Requires BOTH Keyboard & Mouse Action
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
                <button
                  onClick={handleStopOrPause}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold border border-slate-700"
                >
                  {isPaused ? 'Resume' : 'Pause'}
                </button>
                <button
                  onClick={() => {
                    const task = tasks.find((t) => (t.firestoreId || t.id) === activeTaskId);
                    if (task) handleOpenSubmitModal(task);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Submit Task & Deliverable</span>
                </button>
              </div>
            </div>
          )}

          {adminNotification && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm font-medium flex items-center justify-between">
              <span>{adminNotification}</span>
              <button onClick={() => setAdminNotification('')}><X className="w-4 h-4" /></button>
            </div>
          )}

          {activeNav === 'Dashboard' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Active Tasks</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {tasks.filter((t) => t.status !== 'Completed' && t.status !== 'Submitted').length}
                    </p>
                    <p className="text-xs font-medium text-emerald-600 flex items-center gap-1">
                      <span>Real-time DB</span>
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                    <ListTodo className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Active Input Logged</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {formatShortTime(Object.values(taskActiveSeconds).reduce((a, b) => a + b, 0))}
                    </p>
                    <p className="text-xs font-medium text-blue-600 flex items-center gap-1">
                      <span>Inputs Only</span>
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <Clock className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Task Rate</p>
                    <p className="text-2xl font-bold text-slate-900">$25.00/hr</p>
                    <p className="text-xs font-medium text-slate-500">Python Project</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                    <Wallet className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Anti-Idle Guard</p>
                    <p className="text-2xl font-bold text-emerald-600">8s CUTOFF</p>
                    <p className="text-xs font-medium text-slate-500">Keyboard & Mouse</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500">
                    <ShieldCheck className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
                      <div>
                        <h2 className="text-lg font-bold text-slate-900">Task Center</h2>
                        <p className="text-xs text-slate-500">Start task to initiate active input counter</p>
                      </div>
                      <button
                        onClick={() => setActiveNav('My Tasks')}
                        className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 self-start sm:self-auto"
                      >
                        <span>View All Tasks</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex space-x-6 border-b border-slate-100 mt-4 text-sm font-medium text-slate-500">
                      {['Active', 'In Progress', 'Submitted', 'Completed'].map((tabKey) => {
                        const isActive = taskFilter === tabKey;
                        const count = tasks.filter((t) => {
                          if (tabKey === 'Active') return t.status !== 'Completed' && t.status !== 'Submitted';
                          return t.status === tabKey;
                        }).length;

                        return (
                          <button
                            key={tabKey}
                            onClick={() => setTaskFilter(tabKey)}
                            className={`pb-3 transition relative ${
                              isActive ? 'text-blue-600 font-semibold' : 'hover:text-slate-800'
                            }`}
                          >
                            {tabKey} ({count})
                            {isActive && (
                              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    <div className="divide-y divide-slate-100 mt-2">
                      {loadingTasks ? (
                        <div className="p-8 text-center text-slate-400 text-sm">
                          Loading tasks from Real-Time Database...
                        </div>
                      ) : filteredTasks.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 text-sm">
                          No tasks under "{taskFilter}". Switch to Admin view to assign tasks!
                        </div>
                      ) : (
                        filteredTasks.map((task) => {
                          const tId = task.firestoreId || task.id;
                          const isCurrentActive = activeTaskId === tId && isTracking;
                          const loggedSecs = taskActiveSeconds[tId] || task.activeSecondsLogged || 0;

                          return (
                            <div
                              key={tId}
                              className="py-4 hover:bg-slate-50/80 px-2 rounded-xl transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                            >
                              <div className="flex items-start space-x-4">
                                <div className="w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center font-bold text-xs bg-indigo-50 text-indigo-600 border border-indigo-200">
                                  {task.type || 'CODE'}
                                </div>
                                <div className="space-y-1">
                                  <h3
                                    onClick={() => setSelectedTask(task)}
                                    className="font-semibold text-slate-900 text-sm hover:text-blue-600 cursor-pointer"
                                  >
                                    {task.title}
                                  </h3>
                                  <p className="text-xs text-slate-500">
                                    Project: <span className="font-medium text-slate-700">{task.project}</span>
                                  </p>
                                  <div className="flex items-center gap-2 pt-1">
                                    <span className="text-[11px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded font-mono">
                                      ID: {task.id}
                                    </span>
                                    <span className="text-[11px] font-semibold text-emerald-600">
                                      {task.rate}
                                    </span>
                                    <span className="text-[11px] font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                                      Active Input Logged: {formatShortTime(loggedSecs)}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center justify-between md:justify-end gap-2 pt-2 md:pt-0 border-t md:border-0 border-slate-100">
                                <span
                                  className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                                    task.status === 'Submitted' || task.status === 'Completed'
                                      ? 'bg-emerald-100 text-emerald-700'
                                      : 'bg-blue-50 text-blue-600'
                                  }`}
                                >
                                  {task.status}
                                </span>

                                {task.status !== 'Submitted' && task.status !== 'Completed' && (
                                  <>
                                    {!isCurrentActive ? (
                                      <button
                                        onClick={() => handleStartTask(task)}
                                        className="text-xs px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold flex items-center gap-1 shadow-sm transition"
                                      >
                                        <Play className="w-3.5 h-3.5 fill-current" />
                                        <span>Start Task</span>
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => handleOpenSubmitModal(task)}
                                        className="text-xs px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold flex items-center gap-1 shadow-sm transition"
                                      >
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        <span>Submit</span>
                                      </button>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
                        <Activity className="w-5 h-5 text-blue-600" />
                        <span>Dual Anti-Idle Guard</span>
                      </h2>
                    </div>

                    <div className="space-y-3 text-xs leading-relaxed text-slate-600">
                      <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-amber-900 font-medium">
                        Anti-Jiggler Policy: Paid time only accumulates when BOTH keyboard typing AND mouse movement occur actively within the sliding 8-second window.
                      </div>

                      <div className="space-y-2 pt-1">
                        <div className="flex items-center justify-between">
                          <span>Keyboard Typing (keydown):</span>
                          <span className={`font-bold font-mono ${isKeyboardActive ? 'text-emerald-600' : 'text-slate-400'}`}>
                            {isKeyboardActive ? 'ACTIVE' : 'IDLE'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Mouse Movement (mousemove):</span>
                          <span className={`font-bold font-mono ${isMouseActive ? 'text-emerald-600' : 'text-slate-400'}`}>
                            {isMouseActive ? 'ACTIVE' : 'IDLE'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Dual Requirement Window:</span>
                          <span className="font-mono font-bold text-slate-800">8 Seconds</span>
                        </div>
                      </div>

                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center font-mono">
                        <span className="text-[11px] text-slate-500 block uppercase">Dual Validation State</span>
                        <span className={`text-sm font-bold ${isDualInputActive ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {isDualInputActive ? 'DUAL INPUT VALIDATED' : 'WAITING FOR BOTH KEYBOARD + MOUSE'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      {submittingTask && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 space-y-5">
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                  TASK SUBMISSION & DELIVERABLE
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">{submittingTask.title}</h3>
                <p className="text-xs text-slate-500">Project: {submittingTask.project}</p>
              </div>
              <button onClick={() => setSubmittingTask(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 grid grid-cols-2 gap-4">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-emerald-800 font-semibold block">
                  Exact Active Input Time Worked
                </span>
                <span className="text-2xl font-bold font-mono text-emerald-700">
                  {formatShortTime(
                    taskActiveSeconds[submittingTask.firestoreId || submittingTask.id] ||
                    submittingTask.activeSecondsLogged || 0
                  )}
                </span>
                <span className="text-[10px] text-emerald-600 block mt-0.5">
                  Verified by keyboard & mouse listeners
                </span>
              </div>

              <div>
                <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold block">
                  Idle Time Excluded (Unpaid)
                </span>
                <span className="text-xl font-bold font-mono text-slate-700">
                  {formatShortTime(
                    Math.max(
                      0,
                      (taskTotalElapsed[submittingTask.firestoreId || submittingTask.id] || 0) -
                      (taskActiveSeconds[submittingTask.firestoreId || submittingTask.id] || 0)
                    )
                  )}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Saved from idle inactivity
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
                Python Code / Task Deliverable *
              </label>
              <textarea
                rows={5}
                value={submissionCode}
                onChange={(e) => setSubmissionCode(e.target.value)}
                placeholder="e.g. print('Hello World')"
                className="w-full px-3 py-2 bg-slate-900 text-emerald-400 font-mono text-xs rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                Additional Work Notes
              </label>
              <input
                type="text"
                placeholder="e.g. Program executed and verified successfully."
                value={submissionNotes}
                onChange={(e) => setSubmissionNotes(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setSubmittingTask(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmTaskSubmission}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm & Submit Task</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
