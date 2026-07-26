import React, { useState, useCallback, useMemo } from 'react';
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
import TrackerBanner from './components/tracker/TrackerBanner';
import TaskSubmitModal from './components/tasks/TaskSubmitModal';
import TaskDetail from './components/tasks/TaskDetail';

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

export default function App() {
  const { user, loading: authLoading, error: authError, login, register, logout, isAdmin, isWorker } = useAuth();
  const { tasks, loading: tasksLoading, createTask, updateStatus, submitTask, reviewTask, deleteTask } = useTaskManager();
  const { darkMode, toggle: toggleDark } = useDarkMode();
  const { notification, show: showNotif, clear: clearNotif } = useNotification();

  const [authView, setAuthView] = useState('login');
  const [activeNav, setActiveNav] = useState('Dashboard');
  const [taskFilter, setTaskFilter] = useState('Active');
  const [searchQ, setSearchQ] = useState('');
  const [activeTaskId, setActiveTaskId] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [submittingTask, setSubmittingTask] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [confirmDlg, setConfirmDlg] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {}, variant: 'danger' });

  const { taskActiveSeconds, setTaskActiveSeconds, taskTotalElapsed, setTaskTotalElapsed, isKeyboardActive, isMouseActive, isDualInputActive } = useTimeTracker(activeTaskId, isTracking, isPaused);

  const myTasks = useMemo(() => isAdmin ? tasks : tasks.filter((t) => t.assignedTo === user?.id || t.createdBy === user?.id), [tasks, isAdmin, user]);
  const pendingCount = useMemo(() => myTasks.filter((t) => t.status !== 'Completed' && t.status !== 'Submitted').length, [myTasks]);
  const activeTask = useMemo(() => myTasks.find((t) => t.id === activeTaskId), [myTasks, activeTaskId]);

  const handleStart = useCallback((task) => {
    if (activeTaskId && activeTaskId !== task.id) { showNotif('Complete current task first.'); return; }
    setActiveTaskId(task.id);
    setIsTracking(true);
    setIsPaused(false);
    updateStatus(task.id, 'In Progress').catch(() => {});
  }, [activeTaskId, showNotif, updateStatus]);

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
      if (activeTaskId === taskId) { setActiveTaskId(null); setIsTracking(false); }
    } catch (err) { showNotif('Submission failed: ' + err.message); }
  }, [submitTask, activeTaskId, showNotif]);

  const handleCreateTask = useCallback(async (taskData) => {
    await createTask(taskData);
    showNotif('Task created!');
  }, [createTask, showNotif]);

  const handleReview = useCallback(async (taskId, status, comment) => {
    await reviewTask(taskId, { status, comment });
    showNotif(`Task ${status.toLowerCase()}.`);
  }, [reviewTask, showNotif]);

  const handleDelete = useCallback((task) => {
    setConfirmDlg({
      isOpen: true, title: 'Delete Task', message: `Delete "${task.title}"?`, variant: 'danger',
      onConfirm: async () => { await deleteTask(task.id); showNotif('Deleted.'); setConfirmDlg({ isOpen: false }); },
      onCancel: () => setConfirmDlg({ isOpen: false }),
    });
  }, [deleteTask, showNotif]);

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
        {activeTaskId && isTracking && (
          <TrackerBanner task={activeTask} taskActiveSeconds={taskActiveSeconds} isKeyboardActive={isKeyboardActive} isMouseActive={isMouseActive} isDualInputActive={isDualInputActive} isPaused={isPaused} onPause={handlePause} onSubmit={handleOpenSubmit} />
        )}

        <Notification message={notification} onClear={clearNotif} />

        {activeNav === 'Dashboard' && <Dashboard {...pageProps} onView={setSelectedTask} onNavigate={setActiveNav} searchQ={searchQ} setSearchQ={setSearchQ} taskFilter={taskFilter} setTaskFilter={setTaskFilter} />}
        {activeNav === 'My Tasks' && <MyTasks tasks={myTasks} isAdmin={isAdmin} onView={setSelectedTask} onDelete={handleDelete} darkMode={darkMode} />}
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
      </Layout>

      {submittingTask && (
        <TaskSubmitModal task={submittingTask} taskActiveSeconds={taskActiveSeconds} taskTotalElapsed={taskTotalElapsed} onSubmit={handleSubmitConfirm} onClose={() => setSubmittingTask(null)} />
      )}

      {selectedTask && <TaskDetail task={selectedTask} darkMode={darkMode} onClose={() => setSelectedTask(null)} />}

      <ConfirmDialog {...confirmDlg} />
    </ErrorBoundary>
  );
}
