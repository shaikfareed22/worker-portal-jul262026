import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useAuth } from './hooks/useAuth';
import { useTaskManager } from './hooks/useTaskManager';
import { useTimeTracker } from './hooks/useTimeTracker';
import { useDarkMode } from './hooks/useDarkMode';
import { useNotification } from './hooks/useNotification';

import Layout from './components/layout/Layout';
import LoginPage from './components/auth/LoginPage';
import RegisterPage from './components/auth/RegisterPage';
import ErrorBoundary from './components/ui/ErrorBoundary';
import ConfirmDialog from './components/ui/ConfirmDialog';
import Notification from './components/ui/Notification';
import TaskSubmitModal from './components/tasks/TaskSubmitModal';
import TaskExecution from './components/tasks/TaskExecution';

import Dashboard from './pages/Dashboard';
import MyTasks from './pages/MyTasks';
import ActiveTasks from './pages/ActiveTasks';
import CompletedTasks from './pages/CompletedTasks';
import AdminPortal from './pages/AdminPortal';
import Workers from './pages/Workers';
import AuditLog from './pages/AuditLog';
import TimeTracker from './pages/TimeTracker';
import Earnings from './pages/Earnings';
import Payouts from './pages/Payouts';
import Invoices from './pages/Invoices';
import Profile from './pages/Profile';
import Support from './pages/Support';
import SettingsPage from './pages/Settings';

import { clearStorage } from './utils/storage';
import { formatSecondsToTime } from './utils/formatters';

function loadTimerState() {
  try {
    const raw = localStorage.getItem('corein_timer_state');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function loadExecState() {
  try {
    const raw = localStorage.getItem('corein_exec_task');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export default function App() {
  const { user, loading: authLoading, error: authError, login, register, logout, isAdmin, isWorker } = useAuth();
  const { tasks, loading: tasksLoading, createTask, updateStatus, startTask, submitTask, reviewTask, deleteTask } = useTaskManager();
  const { darkMode, toggle: toggleDark } = useDarkMode();
  const { notification, show: showNotif, clear: clearNotif } = useNotification();

  const savedExec = useRef(loadExecState());
  const savedTimer = useRef(loadTimerState());
  const restoredRef = useRef(false);

  const [authView, setAuthView] = useState('login');
  const [activeNav, setActiveNav] = useState('Dashboard');
  const [taskFilter, setTaskFilter] = useState('Active');
  const [searchQ, setSearchQ] = useState('');
  const [activeTaskId, setActiveTaskId] = useState(() => savedTimer.current?.isTracking ? savedTimer.current.activeTaskId : null);
  const [isTracking, setIsTracking] = useState(() => savedTimer.current?.isTracking || false);
  const [isPaused, setIsPaused] = useState(false);
  const [submittingTask, setSubmittingTask] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [executingTask, setExecutingTask] = useState(null);
  const [confirmDlg, setConfirmDlg] = useState({ isOpen: false, title: '', message: '', onConfirm: null, onCancel: null, variant: 'danger' });

  const { taskActiveSeconds, taskTotalElapsed, isKeyboardActive, isMouseActive, isDualInputActive } = useTimeTracker(activeTaskId, isTracking, isPaused);

  // Restore executing task after tasks load from Firestore
  useEffect(() => {
    if (restoredRef.current) return;
    if (tasksLoading) return;
    restoredRef.current = true;

    const saved = savedExec.current;
    const timer = savedTimer.current;
    if (saved && timer?.isTracking && tasks.length > 0) {
      const fresh = tasks.find((t) => t.id === saved.id);
      if (fresh) {
        setExecutingTask(fresh);
        setActiveTaskId(saved.id);
        setIsTracking(true);
      }
    } else if (saved && timer?.isTracking) {
      setExecutingTask(saved);
      setActiveTaskId(saved.id);
      setIsTracking(true);
    }
  }, [tasksLoading, tasks]);

  // Persist executing task to localStorage
  useEffect(() => {
    if (executingTask && isTracking) {
      localStorage.setItem('corein_exec_task', JSON.stringify(executingTask));
    } else if (!isTracking) {
      localStorage.removeItem('corein_exec_task');
    }
  }, [executingTask, isTracking]);

  React.useEffect(() => {
    const unauthorizedPages = ['Admin Portal', 'Workers', 'Audit Log'];
    if (unauthorizedPages.includes(activeNav) && !isAdmin) {
      setActiveNav('Dashboard');
    }
  }, [activeNav, isAdmin]);

  const safeTasks = Array.isArray(tasks) ? tasks : [];
  const myTasks = useMemo(() => isAdmin ? safeTasks : safeTasks.filter((t) => t.assignedTo === user?.id || !t.assignedTo), [safeTasks, isAdmin, user]);
  const pendingCount = useMemo(() => (Array.isArray(myTasks) ? myTasks : []).filter((t) => t.status !== 'Completed' && t.status !== 'Submitted').length, [myTasks]);
  const activeTask = useMemo(() => (Array.isArray(myTasks) ? myTasks : []).find((t) => t.id === activeTaskId), [myTasks, activeTaskId]);

  const handleStart = useCallback(async (task) => {
    if (activeTaskId && activeTaskId !== task.id) { showNotif('Complete current task first.'); return; }
    try {
      await startTask(task.id);
      setActiveTaskId(task.id);
      setIsTracking(true);
      setIsPaused(false);
      setExecutingTask(task);
    } catch (err) { showNotif('Failed to start task: ' + err.message); }
  }, [activeTaskId, showNotif, startTask]);

  const handlePause = useCallback(() => setIsPaused((p) => !p), []);

  const handleOpenSubmit = useCallback((task) => {
    setIsTracking(false);
    setSubmittingTask(task);
  }, []);

  const handleSubmitConfirm = useCallback(async (taskId, submission) => {
    try {
      await submitTask(taskId, submission);
      showNotif('Task submitted!');
      setSubmittingTask(null);
      setExecutingTask(null);
      if (activeTaskId === taskId) { setActiveTaskId(null); setIsTracking(false); }
      localStorage.removeItem('corein_exec_task');
      localStorage.removeItem('corein_timer_state');
    } catch (err) { showNotif('Submission failed: ' + err.message); }
  }, [submitTask, activeTaskId, showNotif]);

  const handleCreateTask = useCallback(async (taskData) => {
    try {
      await createTask(taskData);
      showNotif('Task created!');
    } catch (err) { showNotif('Failed to create task: ' + err.message); }
  }, [createTask, showNotif]);

  const handleReview = useCallback(async (taskId, status, comment) => {
    try {
      await reviewTask(taskId, { status, comment });
      showNotif(`Task ${status.toLowerCase()}.`);
    } catch (err) { showNotif('Review failed: ' + err.message); }
  }, [reviewTask, showNotif]);

  const handleDelete = useCallback((task) => {
    setConfirmDlg({
      isOpen: true, title: 'Delete Task', message: `Delete "${task.title}"?`, variant: 'danger',
      onConfirm: async () => {
        try { await deleteTask(task.id); showNotif('Deleted.'); } catch (err) { showNotif('Delete failed: ' + err.message); }
        setConfirmDlg((prev) => ({ ...prev, isOpen: false }));
      },
      onCancel: () => setConfirmDlg((prev) => ({ ...prev, isOpen: false })),
    });
  }, [deleteTask, showNotif]);

  const handleViewTask = useCallback((task) => {
    if (isAdmin) {
      setSelectedTask(task);
    } else {
      setExecutingTask(task);
      if (task.status === 'In Progress') {
        setActiveTaskId(task.id);
        setIsTracking(true);
      }
    }
  }, [isAdmin]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-600/30 animate-pulse"><span className="text-white font-bold text-lg">CORE</span></div>
          <p className="text-sm text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <ErrorBoundary>
        {authView === 'login'
          ? <LoginPage onLogin={login} onSwitch={() => setAuthView('register')} loading={authLoading} error={authError} />
          : <RegisterPage onRegister={register} onSwitch={() => setAuthView('login')} loading={authLoading} error={authError} />}
      </ErrorBoundary>
    );
  }

  const pageProps = { tasks: myTasks, user, isAdmin, darkMode, activeTaskId, isTracking, taskActiveSeconds, taskTotalElapsed, isKeyboardActive, isMouseActive, isDualInputActive, onStart: handleStart, onSubmit: handleOpenSubmit, onNavigate: setActiveNav };

  return (
    <ErrorBoundary>
      <Layout user={user} isAdmin={isAdmin} activeNav={activeNav} setActiveNav={setActiveNav} darkMode={darkMode} toggleDark={toggleDark} onLogout={logout} taskCount={pendingCount}>
        {isAdmin && activeTaskId && isTracking && (
          <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-xl border border-slate-800 flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${isDualInputActive ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'}`} />
              <div><span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Working On</span><h2 className="text-sm font-bold text-white">{activeTask?.title}</h2></div>
            </div>
            <span className="text-lg font-mono font-bold text-emerald-400">{formatSecondsToTime(taskActiveSeconds?.[activeTaskId] || 0)}</span>
          </div>
        )}

        <Notification message={notification} onClear={clearNotif} />

        {executingTask ? (
          <TaskExecution
            task={safeTasks.find((t) => t.id === executingTask.id) || executingTask}
            onStart={handleStart}
            onSubmit={handleSubmitConfirm}
            onBack={() => { setExecutingTask(null); }}
            onView={handleViewTask}
            activeTaskId={activeTaskId}
            isTracking={isTracking && activeTaskId === executingTask.id}
            taskActiveSeconds={taskActiveSeconds}
            darkMode={darkMode}
          />
        ) : (
          <>
            {activeNav === 'Dashboard' && <Dashboard {...pageProps} onView={handleViewTask} onNavigate={setActiveNav} activeTaskId={activeTaskId} searchQ={searchQ} setSearchQ={setSearchQ} taskFilter={taskFilter} setTaskFilter={setTaskFilter} />}
            {activeNav === 'My Tasks' && <MyTasks tasks={myTasks} isAdmin={isAdmin} onView={handleViewTask} onDelete={handleDelete} darkMode={darkMode} />}
            {activeNav === 'Active Tasks' && <ActiveTasks tasks={myTasks} taskActiveSeconds={taskActiveSeconds} onSubmit={handleOpenSubmit} />}
            {activeNav === 'Completed Tasks' && <CompletedTasks tasks={myTasks} />}
            {activeNav === 'Admin Portal' && isAdmin && <AdminPortal tasks={tasks} onCreateTask={handleCreateTask} onReview={handleReview} darkMode={darkMode} />}
            {activeNav === 'Workers' && isAdmin && <Workers darkMode={darkMode} />}
            {activeNav === 'Audit Log' && isAdmin && <AuditLog darkMode={darkMode} />}
            {activeNav === 'Time Tracker' && <TimeTracker tasks={myTasks} taskActiveSeconds={taskActiveSeconds} taskTotalElapsed={taskTotalElapsed} user={user} darkMode={darkMode} />}
            {activeNav === 'Earnings' && <Earnings tasks={myTasks} user={user} darkMode={darkMode} />}
            {activeNav === 'Payouts' && <Payouts tasks={myTasks} darkMode={darkMode} />}
            {activeNav === 'Invoices' && <Invoices tasks={myTasks} darkMode={darkMode} />}
            {activeNav === 'Profile' && <Profile user={user} tasks={myTasks} darkMode={darkMode} />}
            {activeNav === 'Support' && <Support darkMode={darkMode} onNotify={showNotif} />}
            {activeNav === 'Settings' && <SettingsPage darkMode={darkMode} toggleDark={toggleDark} onClearData={() => { clearStorage(); window.location.reload(); }} />}
          </>
        )}
      </Layout>

      {submittingTask && (
        <TaskSubmitModal task={submittingTask} taskActiveSeconds={taskActiveSeconds} taskTotalElapsed={taskTotalElapsed} onSubmit={handleSubmitConfirm} onClose={() => setSubmittingTask(null)} darkMode={darkMode} />
      )}

      {selectedTask && isAdmin && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedTask(null)}>
          <div className={`rounded-2xl max-w-2xl w-full p-6 shadow-2xl border max-h-[80vh] overflow-y-auto ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`} onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <div><span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">DETAILS</span><h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">{selectedTask.title}</h3><p className="text-xs text-slate-500">{selectedTask.id} &middot; {selectedTask.project}</p></div>
              <button onClick={() => setSelectedTask(null)} className="text-slate-400 hover:text-slate-600 text-xl">&times;</button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {[{ l: 'Status', v: selectedTask.status }, { l: 'Priority', v: selectedTask.priority }, { l: 'Rate', v: selectedTask.rate }, { l: 'Due', v: selectedTask.dueDate }].map((s, i) => (
                <div key={i} className="p-2 bg-slate-50 dark:bg-slate-700 rounded-xl"><p className="text-[10px] text-slate-500 uppercase">{s.l}</p><p className="text-xs font-bold text-slate-900 dark:text-white">{s.v}</p></div>
              ))}
            </div>
            <div className="mb-4"><p className="text-xs font-semibold text-slate-500 mb-1">Description</p><p className="text-sm text-slate-700 dark:text-slate-300">{selectedTask.description}</p></div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded-xl"><p className="text-[10px] text-slate-500 uppercase">Logged Time</p><p className="text-sm font-mono font-bold text-slate-900 dark:text-white">{selectedTask.loggedTime || '0h 00m'}</p></div>
              <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded-xl"><p className="text-[10px] text-slate-500 uppercase">Total Time Spent</p><p className="text-sm font-mono font-bold text-slate-900 dark:text-white">{selectedTask.timeSpent ? formatSecondsToTime(selectedTask.timeSpent) : 'N/A'}</p></div>
            </div>
            {selectedTask.submittedCode && <div className="mb-4"><p className="text-xs font-semibold text-slate-500 mb-1">Deliverable</p><pre className="p-3 bg-slate-900 text-emerald-400 font-mono text-xs rounded-xl overflow-x-auto">{selectedTask.submittedCode}</pre></div>}
            {selectedTask.submittedNotes && <div className="mb-4"><p className="text-xs font-semibold text-slate-500 mb-1">Notes</p><p className="text-sm text-slate-600 dark:text-slate-400">{selectedTask.submittedNotes}</p></div>}
            {selectedTask.reviewStatus && <div className={`p-3 rounded-xl mb-4 ${selectedTask.reviewStatus === 'Approved' ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}><p className="text-xs font-bold">{selectedTask.reviewStatus}</p>{selectedTask.reviewComment && <p className="text-xs text-slate-600 mt-1">{selectedTask.reviewComment}</p>}</div>}
            <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-700"><button onClick={() => setSelectedTask(null)} className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-white text-xs font-semibold rounded-xl">Close</button></div>
          </div>
        </div>
      )}

      <ConfirmDialog {...confirmDlg} />
    </ErrorBoundary>
  );
}
