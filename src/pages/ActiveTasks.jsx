import React from 'react';
import { formatShortTime } from '../utils/formatters';

export default function ActiveTasks({ tasks, taskActiveSeconds, onSubmit }) {
  const safeTasks = Array.isArray(tasks) ? tasks : [];
  const active = safeTasks.filter((t) => t.status === 'In Progress');
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6 shadow-sm">
      <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Active Tasks</h2>
      {active.length === 0 ? <p className="text-sm text-slate-400">No tasks in progress.</p> : (
        <div className="divide-y divide-slate-100 dark:divide-slate-700">{active.map((task) => (
          <div key={task.id} className="py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs">{task.type}</div>
              <div><h3 className="font-semibold text-slate-900 dark:text-white text-sm">{task.title}</h3><p className="text-xs text-slate-500">{task.project} &middot; {formatShortTime(taskActiveSeconds[task.id] || 0)} logged</p></div>
            </div>
            <button onClick={() => onSubmit(task)} className="text-xs px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-semibold">Submit</button>
          </div>
        ))}</div>
      )}
    </div>
  );
}
