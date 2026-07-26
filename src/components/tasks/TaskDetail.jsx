import React from 'react';
import { X, FileCode } from 'lucide-react';
import { formatShortTime, formatDate, formatDateTime } from '../../utils/formatters';

export default function TaskDetail({ task, darkMode, onClose }) {
  if (!task) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className={`rounded-2xl max-w-2xl w-full p-6 shadow-2xl border max-h-[80vh] overflow-y-auto ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`} onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-4">
          <div><span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">DETAILS</span><h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">{task.title}</h3><p className="text-xs text-slate-500">{task.id} &middot; {task.project}</p></div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {[{ l: 'Status', v: task.status }, { l: 'Priority', v: task.priority }, { l: 'Rate', v: task.rate }, { l: 'Due', v: task.dueDate }].map((s, i) => (
            <div key={i} className="p-2 bg-slate-50 dark:bg-slate-700 rounded-xl"><p className="text-[10px] text-slate-500 uppercase">{s.l}</p><p className="text-xs font-bold text-slate-900 dark:text-white">{s.v}</p></div>
          ))}
        </div>
        <div className="mb-4"><p className="text-xs font-semibold text-slate-500 mb-1">Description</p><p className="text-sm text-slate-700 dark:text-slate-300">{task.description}</p></div>
        <div className="mb-4"><p className="text-xs font-semibold text-slate-500 mb-1">Logged Time</p><p className="text-sm font-mono text-slate-900 dark:text-white">{task.loggedTime}</p></div>
        {task.submittedCode && <div className="mb-4"><p className="text-xs font-semibold text-slate-500 mb-1">Deliverable</p><pre className="p-3 bg-slate-900 text-emerald-400 font-mono text-xs rounded-xl overflow-x-auto">{task.submittedCode}</pre></div>}
        {task.submittedNotes && <div className="mb-4"><p className="text-xs font-semibold text-slate-500 mb-1">Notes</p><p className="text-sm text-slate-600 dark:text-slate-400">{task.submittedNotes}</p></div>}
        {task.submittedFiles?.length > 0 && <div className="mb-4"><p className="text-xs font-semibold text-slate-500 mb-1">Files</p><div className="flex flex-wrap gap-2">{task.submittedFiles.map((f, i) => <span key={i} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-lg flex items-center gap-1"><FileCode className="w-3 h-3" />{f}</span>)}</div></div>}
        {task.reviewStatus && <div className={`p-3 rounded-xl mb-4 ${task.reviewStatus === 'Approved' ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}><p className="text-xs font-bold">{task.reviewStatus}</p>{task.reviewComment && <p className="text-xs text-slate-600 mt-1">{task.reviewComment}</p>}</div>}
        <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-700"><button onClick={onClose} className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-white text-xs font-semibold rounded-xl">Close</button></div>
      </div>
    </div>
  );
}
