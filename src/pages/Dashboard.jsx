import React, { useMemo } from 'react';
import { ListTodo, Clock, Wallet } from 'lucide-react';
import StatCard from '../components/shared/StatCard';
import SearchBar from '../components/shared/SearchBar';
import TaskCard from '../components/tasks/TaskCard';
import { formatShortTime } from '../utils/formatters';

export default function Dashboard({ tasks, user, isAdmin, activeTaskId, isTracking, taskActiveSeconds, isKeyboardActive, isMouseActive, isDualInputActive, onStart, onSubmit, onView, onNavigate, darkMode, searchQ, setSearchQ, taskFilter, setTaskFilter }) {
  const safeTasks = Array.isArray(tasks) ? tasks : [];
  const pending = safeTasks.filter((t) => t.status !== 'Completed' && t.status !== 'Submitted').length;
  const totalActSecs = Object.values(taskActiveSeconds || {}).reduce((a, b) => a + b, 0);
  const totalEarn = ((totalActSecs / 3600) * (user?.rate || 25)).toFixed(2);

  const filteredTasks = useMemo(() => {
    let r = safeTasks;
    if (searchQ) { const q = searchQ.toLowerCase(); r = r.filter((t) => t.title.toLowerCase().includes(q) || t.project.toLowerCase().includes(q)); }
    if (taskFilter === 'Active') return r.filter((t) => t.status !== 'Completed' && t.status !== 'Submitted');
    if (taskFilter === 'In Progress') return r.filter((t) => t.status === 'In Progress');
    if (taskFilter === 'Submitted') return r.filter((t) => t.status === 'Submitted');
    if (taskFilter === 'Completed') return r.filter((t) => t.status === 'Completed');
    return r;
  }, [safeTasks, taskFilter, searchQ]);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Active Tasks" value={pending} icon={ListTodo} iconBg="bg-indigo-500/10" iconColor="text-indigo-500" darkMode={darkMode} />
        <StatCard label="Active Input" value={formatShortTime(totalActSecs)} icon={Clock} iconBg="bg-emerald-500/10" iconColor="text-emerald-500" darkMode={darkMode} />
        <StatCard label="Earnings" value={`$${totalEarn}`} icon={Wallet} iconBg="bg-purple-500/10" iconColor="text-purple-500" darkMode={darkMode} />
      </div>

      <div className="mt-6">
        <div className={`${darkMode ? 'bg-white/[0.03] border-white/5' : 'bg-white border-slate-200/60'} rounded-2xl border p-6 backdrop-blur-sm`}>
          <div className={`flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b gap-3 ${darkMode ? 'border-white/5' : 'border-slate-100'}`}>
            <div>
              <h2 className={`text-lg font-bold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>Task Center</h2>
              <p className={`text-xs mt-0.5 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>{isAdmin ? 'Manage and monitor tasks' : 'Click a task to start working'}</p>
            </div>
            <div className="flex items-center gap-2">
              <SearchBar value={searchQ} onChange={setSearchQ} />
              <button onClick={() => onNavigate('My Tasks')} className="text-sm font-semibold text-indigo-500 hover:text-indigo-400 flex items-center gap-1 transition">
                <span>View All</span>
              </button>
            </div>
          </div>
          <div className={`flex space-x-6 border-b mt-4 text-sm font-medium overflow-x-auto ${darkMode ? 'border-white/5 text-slate-500' : 'border-slate-100 text-slate-400'}`}>
            {['Active', 'In Progress', 'Submitted', 'Completed'].map((k) => {
              const is = taskFilter === k;
              const cnt = safeTasks.filter((t) => k === 'Active' ? t.status !== 'Completed' && t.status !== 'Submitted' : t.status === k).length;
              return (
                <button key={k} onClick={() => setTaskFilter(k)} className={`pb-3 transition relative whitespace-nowrap ${is ? 'text-indigo-500 font-semibold' : darkMode ? 'hover:text-slate-300' : 'hover:text-slate-700'}`}>
                  {k} ({cnt})
                  {is && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" />}
                </button>
              );
            })}
          </div>
          <div className={`divide-y mt-2 ${darkMode ? 'divide-white/5' : 'divide-slate-100'}`}>
            {filteredTasks.length === 0 ? (
              <div className={`p-8 text-center text-sm ${darkMode ? 'text-slate-600' : 'text-slate-400'}`}>No tasks found.</div>
            ) : filteredTasks.map((task) => (
              <TaskCard key={task.id} task={task} activeTaskId={activeTaskId} isTracking={isTracking} onStart={onStart} onSubmit={onSubmit} onView={onView} darkMode={darkMode} activeSeconds={taskActiveSeconds[task.id]} isAdmin={isAdmin} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}