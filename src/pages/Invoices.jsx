import React from 'react';
import { FileText, Download } from 'lucide-react';
import { calculateEarnings, formatDate } from '../utils/formatters';

export default function Invoices({ tasks, darkMode }) {
  const relevant = tasks.filter((t) => t.status === 'Completed' || t.status === 'Submitted');
  return (
    <div className={`${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} rounded-2xl border p-6 shadow-sm`}>
      <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><FileText className="w-5 h-5 text-blue-600" /> Invoices</h2>
      {relevant.length === 0 ? <p className="text-sm text-slate-400">No invoices.</p> : (
        <div className="space-y-3">{relevant.map((task, i) => (
          <div key={task.id} className="p-4 bg-slate-50 dark:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-600 flex items-center justify-between">
            <div className="flex items-center gap-3"><FileText className="w-5 h-5 text-blue-600" /><div><p className="font-semibold text-slate-900 dark:text-white text-sm">INV-{String(i + 1).padStart(4, '0')}</p><p className="text-xs text-slate-500">{task.title} &middot; {formatDate(task.submittedAt || task.createdAt)}</p></div></div>
            <p className="font-bold text-slate-900 dark:text-white text-sm">${calculateEarnings(task.activeSecondsLogged || 0, task.rateNum || 25)}</p>
          </div>
        ))}</div>
      )}
    </div>
  );
}
