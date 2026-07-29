import React, { useState, useEffect } from 'react';
import { Send, FileCode, X, Check, Clock, ListTodo } from 'lucide-react';
import TaskCreateForm from '../components/tasks/TaskCreateForm';
import { api } from '../utils/api';
import { formatDateTime, formatShortTime, calculateEarnings } from '../utils/formatters';

export default function AdminPortal({ tasks, onCreateTask, onReview, darkMode }) {
  const [submissions, setSubmissions] = useState([]);
  const safeTasks = Array.isArray(tasks) ? tasks : [];

  useEffect(() => {
    setSubmissions(safeTasks.filter((t) => t.status === 'Submitted'));
  }, [safeTasks]);

  return (
    <div className="space-y-6">
      <TaskCreateForm onSubmit={onCreateTask} darkMode={darkMode} />
      <div className={`${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} rounded-2xl border p-6 shadow-sm`}>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><Send className="w-5 h-5 text-purple-600" /> Submitted — Review</h2>
        {submissions.length === 0 ? <p className="text-sm text-slate-400">No submissions pending.</p> : (
          <div className="space-y-4">{submissions.map((task) => {
            const eff = task.timeSpent > 0 ? Math.round((task.activeSecondsLogged / task.timeSpent) * 100) : 0;
            return (
            <div key={task.id} className="p-4 bg-slate-50 dark:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-600">
              <div className="flex items-start justify-between mb-3"><div><h3 className="font-semibold text-slate-900 dark:text-white text-sm">{task.title}</h3><p className="text-xs text-slate-500">{task.id}</p></div><span className="text-xs px-2.5 py-1 rounded-full font-medium bg-purple-100 text-purple-700">Pending</span></div>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-center">
                  <p className="text-[10px] text-emerald-700 dark:text-emerald-400 uppercase font-semibold">Active</p>
                  <p className="text-sm font-bold font-mono text-emerald-700 dark:text-emerald-400">{formatShortTime(task.activeSecondsLogged || 0)}</p>
                </div>
                <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg text-center">
                  <p className="text-[10px] text-red-700 dark:text-red-400 uppercase font-semibold">Idle</p>
                  <p className="text-sm font-bold font-mono text-red-700 dark:text-red-400">{formatShortTime(task.idleTime || 0)}</p>
                </div>
                <div className="p-2 bg-slate-100 dark:bg-slate-600 rounded-lg text-center">
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Total</p>
                  <p className="text-sm font-bold font-mono text-slate-700 dark:text-white">{formatShortTime(task.timeSpent || 0)}</p>
                </div>
              </div>
              {task.timeSpent > 0 && <div className="mb-3"><div className="flex items-center justify-between text-[11px] mb-1"><span className="text-slate-500">Efficiency</span><span className={`font-bold ${eff >= 80 ? 'text-emerald-600' : eff >= 50 ? 'text-amber-600' : 'text-red-600'}`}>{eff}%</span></div><div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-1.5"><div className={`h-1.5 rounded-full ${eff >= 80 ? 'bg-emerald-500' : eff >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${eff}%` }} /></div></div>}
              {task.submittedCode && <pre className="p-3 bg-slate-900 text-emerald-400 font-mono text-xs rounded-xl overflow-x-auto mb-3">{task.submittedCode}</pre>}
              {task.submittedNotes && <p className="text-xs text-slate-600 dark:text-slate-400 mb-3"><strong>Notes:</strong> {task.submittedNotes}</p>}
              {task.submittedFiles?.length > 0 && <div className="flex flex-wrap gap-2 mb-3">{task.submittedFiles.map((f, i) => <span key={i} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-lg flex items-center gap-1"><FileCode className="w-3 h-3" />{f}</span>)}</div>}
              <div className="flex items-center gap-2">
                <button onClick={() => onReview(task.id, 'Approved', '')} className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Approve</button>
                <button onClick={() => { const c = prompt('Rejection reason:'); if (c !== null) onReview(task.id, 'Rejected', c); }} className="px-4 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-xl transition flex items-center gap-1"><X className="w-3.5 h-3.5" /> Reject</button>
              </div>
            </div>
            );
          })}</div>
        )}
      </div>

      <div className={`${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} rounded-2xl border p-6 shadow-sm`}>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><ListTodo className="w-5 h-5 text-blue-600" /> All Tasks — Time Overview</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr className="border-b border-slate-200 dark:border-slate-700">
              <th className="text-left py-2 font-semibold text-slate-500">Task</th>
              <th className="text-left py-2 font-semibold text-slate-500">Status</th>
              <th className="text-left py-2 font-semibold text-emerald-600">Active</th>
              <th className="text-left py-2 font-semibold text-red-600">Idle</th>
              <th className="text-left py-2 font-semibold text-slate-500">Total</th>
              <th className="text-left py-2 font-semibold text-purple-600">Eff%</th>
              <th className="text-left py-2 font-semibold text-slate-500">Earnings</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {safeTasks.map((task) => {
                const active = task.activeSecondsLogged || 0;
                const idle = task.idleTime || 0;
                const total = task.timeSpent || 0;
                const eff = total > 0 ? Math.round((active / total) * 100) : 0;
                return (
                <tr key={task.id}>
                  <td className="py-2 font-medium text-slate-900 dark:text-white">{task.title}</td>
                  <td className="py-2"><span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${task.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : task.status === 'Submitted' ? 'bg-purple-100 text-purple-700' : task.status === 'In Progress' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>{task.status}</span></td>
                  <td className="py-2 font-mono text-emerald-600">{formatShortTime(active)}</td>
                  <td className="py-2 font-mono text-red-500">{formatShortTime(idle)}</td>
                  <td className="py-2 font-mono text-slate-500">{total > 0 ? formatShortTime(total) : 'N/A'}</td>
                  <td className="py-2"><span className={`font-bold ${eff >= 80 ? 'text-emerald-600' : eff >= 50 ? 'text-amber-600' : 'text-red-600'}`}>{total > 0 ? `${eff}%` : 'N/A'}</span></td>
                  <td className="py-2 font-semibold text-slate-900 dark:text-white">${calculateEarnings(active, task.rateNum || 25)}</td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
