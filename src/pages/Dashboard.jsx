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
        <StatCard label="Active Tasks" value={pending} icon={ListTodo} iconBg="bg-blue-50" iconColor="text-blue-600" darkMode={darkMode} />
        <StatCard label="Active Input" value={formatShortTime(totalActSecs)} icon={Clock} iconBg="bg-emerald-50" iconColor="text-emerald-600" darkMode={darkMode} />
        <StatCard label="Earnings" value={`$${totalEarn}`} icon={Wallet} iconBg="bg-purple-50" iconColor="text-purple-600" darkMode={darkMode} />
      </div>

      <div className="mt-6">
        <div className={`${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} rounded-2xl border p-6 shadow-sm`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700 gap-3">
            <div><h2 className="text-lg font-bold text-slate-900 dark:text-white">Task Center</h2><p className="text-xs text-slate-500">{isAdmin ? 'Manage and monitor tasks' : 'Click a task to start working'}</p></div>
            <div className="flex items-center gap-2">
              <SearchBar value={searchQ} onChange={setSearchQ} />
              <button onClick={() => onNavigate('My Tasks')} className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"><span>View All</span></button>
            </div>
          </div>
          <div className="flex space-x-6 border-b border-slate-100 dark:border-slate-700 mt-4 text-sm font-medium text-slate-500 overflow-x-auto">
            {['Active', 'In Progress', 'Submitted', 'Completed'].map((k) => {
              const is = taskFilter === k;
              const cnt = tasks.filter((t) => k === 'Active' ? t.status !== 'Completed' && t.status !== 'Submitted' : t.status === k).length;
              return <button key={k} onClick={() => setTaskFilter(k)} className={`pb-3 transition relative whitespace-nowrap ${is ? 'text-blue-600 font-semibold' : 'hover:text-slate-800'}`}>{k} ({cnt}){is && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />}</button>;
            })}
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-700 mt-2">
            {filteredTasks.length === 0 ? <div className="p-8 text-center text-slate-400 text-sm">No tasks found.</div> : filteredTasks.map((task) => (
              <TaskCard key={task.id} task={task} activeTaskId={activeTaskId} isTracking={isTracking} onStart={onStart} onSubmit={onSubmit} onView={onView} darkMode={darkMode} activeSeconds={taskActiveSeconds[task.id]} isAdmin={isAdmin} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
