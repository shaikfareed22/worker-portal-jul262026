import React from 'react';
import { calculateEarnings } from '../utils/formatters';

export default function Earnings({ tasks, user, darkMode }) {
  const totalAct = tasks.reduce((acc, t) => acc + (t.activeSecondsLogged || 0), 0);
  const totalEarn = calculateEarnings(totalAct, user?.rate || 25);
  const pending = tasks.filter((t) => t.status === 'Submitted').reduce((acc, t) => acc + parseFloat(calculateEarnings(t.activeSecondsLogged || 0, t.rateNum || 25)), 0).toFixed(2);
  const completed = tasks.filter((t) => t.status === 'Completed').length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[{ l: 'Total Earned', v: `$${totalEarn}`, c: 'text-emerald-600' }, { l: 'Pending', v: `$${pending}`, c: 'text-amber-600' }, { l: 'Completed', v: completed, c: 'text-blue-600' }].map((s, i) => (
          <div key={i} className={`${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} p-5 rounded-2xl border shadow-sm`}><p className="text-xs font-medium text-slate-500 uppercase">{s.l}</p><p className={`text-3xl font-bold ${s.c} mt-1`}>{s.v}</p></div>
        ))}
      </div>
      <div className={`${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} rounded-2xl border p-6 shadow-sm`}>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Earnings History</h2>
        <div className="overflow-x-auto"><table className="w-full text-xs"><thead><tr className="border-b border-slate-200 dark:border-slate-700"><th className="text-left py-2 font-semibold text-slate-500">Task</th><th className="text-left py-2 font-semibold text-slate-500">Rate</th><th className="text-left py-2 font-semibold text-slate-500">Time</th><th className="text-left py-2 font-semibold text-slate-500">Amount</th><th className="text-left py-2 font-semibold text-slate-500">Status</th></tr></thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">{tasks.filter((t) => (t.activeSecondsLogged || 0) > 0).map((task) => (
            <tr key={task.id}><td className="py-2 font-medium text-slate-900 dark:text-white">{task.title}</td><td className="py-2 text-slate-500">{task.rate}</td><td className="py-2 font-mono text-slate-600 dark:text-slate-400">{task.loggedTime}</td><td className="py-2 font-bold text-slate-900 dark:text-white">${calculateEarnings(task.activeSecondsLogged || 0, task.rateNum || 25)}</td><td className="py-2"><span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${task.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : task.status === 'Submitted' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>{task.status === 'Completed' ? 'Paid' : task.status === 'Submitted' ? 'Pending' : 'In Progress'}</span></td></tr>
          ))}</tbody></table></div>
      </div>
    </div>
  );
}
