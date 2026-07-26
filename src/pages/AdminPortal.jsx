import React, { useState, useEffect } from 'react';
import { Send, FileCode, X, Check } from 'lucide-react';
import TaskCreateForm from '../components/tasks/TaskCreateForm';
import { api } from '../utils/api';
import { formatDateTime } from '../utils/formatters';

export default function AdminPortal({ tasks, onCreateTask, onReview, darkMode }) {
  const [submissions, setSubmissions] = useState([]);

  useEffect(() => {
    setSubmissions(tasks.filter((t) => t.status === 'Submitted'));
  }, [tasks]);

  return (
    <div className="space-y-6">
      <TaskCreateForm onSubmit={onCreateTask} darkMode={darkMode} />
      <div className={`${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} rounded-2xl border p-6 shadow-sm`}>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><Send className="w-5 h-5 text-purple-600" /> Submitted — Review</h2>
        {submissions.length === 0 ? <p className="text-sm text-slate-400">No submissions pending.</p> : (
          <div className="space-y-4">{submissions.map((task) => (
            <div key={task.id} className="p-4 bg-slate-50 dark:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-600">
              <div className="flex items-start justify-between mb-3"><div><h3 className="font-semibold text-slate-900 dark:text-white text-sm">{task.title}</h3><p className="text-xs text-slate-500">{task.id} &middot; {task.loggedTime} active</p></div><span className="text-xs px-2.5 py-1 rounded-full font-medium bg-purple-100 text-purple-700">Pending</span></div>
              {task.submittedCode && <pre className="p-3 bg-slate-900 text-emerald-400 font-mono text-xs rounded-xl overflow-x-auto mb-3">{task.submittedCode}</pre>}
              {task.submittedNotes && <p className="text-xs text-slate-600 dark:text-slate-400 mb-3"><strong>Notes:</strong> {task.submittedNotes}</p>}
              {task.submittedFiles?.length > 0 && <div className="flex flex-wrap gap-2 mb-3">{task.submittedFiles.map((f, i) => <span key={i} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-lg flex items-center gap-1"><FileCode className="w-3 h-3" />{f}</span>)}</div>}
              <div className="flex items-center gap-2">
                <button onClick={() => onReview(task.id, 'Approved', '')} className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Approve</button>
                <button onClick={() => { const c = prompt('Rejection reason:'); if (c !== null) onReview(task.id, 'Rejected', c); }} className="px-4 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-xl transition flex items-center gap-1"><X className="w-3.5 h-3.5" /> Reject</button>
              </div>
            </div>
          ))}</div>
        )}
      </div>
    </div>
  );
}
