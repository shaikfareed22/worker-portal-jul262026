import React from 'react';
import { CreditCard } from 'lucide-react';
import { calculateEarnings } from '../utils/formatters';

export default function Payouts({ tasks, darkMode }) {
  const completed = tasks.filter((t) => t.status === 'Completed');
  return (
    <div className={`${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} rounded-2xl border p-6 shadow-sm`}>
      <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><CreditCard className="w-5 h-5 text-blue-600" /> Payouts</h2>
      {completed.length === 0 ? <p className="text-sm text-slate-400">No payouts yet.</p> : (
        <div className="space-y-3">{completed.map((task) => (
          <div key={task.id} className="p-4 bg-slate-50 dark:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-600 flex items-center justify-between">
            <div><p className="font-semibold text-slate-900 dark:text-white text-sm">{task.title}</p><p className="text-xs text-slate-500">{task.loggedTime} &middot; {task.rate}</p></div>
            <div className="text-right"><p className="font-bold text-emerald-600 text-sm">${calculateEarnings(task.activeSecondsLogged || 0, task.rateNum || 25)}</p><p className="text-[11px] text-emerald-500">Paid</p></div>
          </div>
        ))}</div>
      )}
    </div>
  );
}
