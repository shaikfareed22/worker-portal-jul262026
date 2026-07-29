import React from 'react';
import { CheckCircle2 } from 'lucide-react';

export default function CompletedTasks({ tasks }) {
  const safeTasks = Array.isArray(tasks) ? tasks : [];
  const completed = safeTasks.filter((t) => t.status === 'Completed');
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6 shadow-sm">
      <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Completed ({completed.length})</h2>
      {completed.length === 0 ? <p className="text-sm text-slate-400">No completed tasks.</p> : (
        <div className="divide-y divide-slate-100 dark:divide-slate-700">{completed.map((task) => (
          <div key={task.id} className="py-4 flex items-center justify-between">
            <div className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-600" /><div><h3 className="font-semibold text-slate-900 dark:text-white text-sm">{task.title}</h3><p className="text-xs text-slate-500">{task.project} &middot; {task.loggedTime}</p></div></div>
            <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-emerald-100 text-emerald-700">Done</span>
          </div>
        ))}</div>
      )}
    </div>
  );
}
