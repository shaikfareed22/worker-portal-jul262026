import React from 'react';
import { formatSecondsToTime, calculateEarnings } from '../utils/formatters';

export default function TimeTracker({ tasks, taskActiveSeconds, taskTotalElapsed, user, darkMode }) {
  const totalAct = Object.values(taskActiveSeconds).reduce((a, b) => a + b, 0);
  const totalElapsed = Object.values(taskTotalElapsed).reduce((a, b) => a + b, 0);
  const eff = totalElapsed > 0 ? Math.round((totalAct / totalElapsed) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[{ l: 'Total Active', v: formatSecondsToTime(totalAct), c: 'text-emerald-600', sub: 'Dual-input verified' }, { l: 'Total Elapsed', v: formatSecondsToTime(totalElapsed), c: 'text-blue-600', sub: 'Including idle' }, { l: 'Efficiency', v: `${eff}%`, c: 'text-purple-600', sub: 'Active/Total' }].map((s, i) => (
          <div key={i} className={`${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} p-5 rounded-2xl border shadow-sm`}>
            <p className="text-xs font-medium text-slate-500 uppercase">{s.l}</p><p className={`text-3xl font-bold ${s.c} font-mono mt-1`}>{s.v}</p><p className="text-xs text-slate-500 mt-1">{s.sub}</p>
          </div>
        ))}
      </div>
      <div className={`${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} rounded-2xl border p-6 shadow-sm`}>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Per-Task Breakdown</h2>
        <div className="overflow-x-auto"><table className="w-full text-xs"><thead><tr className="border-b border-slate-200 dark:border-slate-700"><th className="text-left py-2 font-semibold text-slate-500">Task</th><th className="text-left py-2 font-semibold text-slate-500">Active</th><th className="text-left py-2 font-semibold text-slate-500">Elapsed</th><th className="text-left py-2 font-semibold text-slate-500">Eff%</th><th className="text-left py-2 font-semibold text-slate-500">Earned</th></tr></thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">{tasks.filter((t) => (taskActiveSeconds[t.id] || 0) > 0 || (taskTotalElapsed[t.id] || 0) > 0).map((task) => {
            const a = taskActiveSeconds[task.id] || 0; const e = taskTotalElapsed[task.id] || 0; const ef = e > 0 ? Math.round((a / e) * 100) : 0;
            return <tr key={task.id}><td className="py-2 font-medium text-slate-900 dark:text-white">{task.title}</td><td className="py-2 font-mono text-emerald-600">{formatSecondsToTime(a)}</td><td className="py-2 font-mono text-slate-500">{formatSecondsToTime(e)}</td><td className="py-2"><span className={`font-bold ${ef >= 80 ? 'text-emerald-600' : ef >= 50 ? 'text-amber-600' : 'text-red-600'}`}>{ef}%</span></td><td className="py-2 font-semibold text-slate-900 dark:text-white">${calculateEarnings(a, task.rateNum || user?.rate || 25)}</td></tr>;
          })}</tbody></table></div>
      </div>
    </div>
  );
}
