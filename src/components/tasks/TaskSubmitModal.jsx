import React, { useState } from 'react';
import { X, CheckCircle2, Upload, FileCode, AlertCircle } from 'lucide-react';
import { formatShortTime } from '../../utils/formatters';
import { validateFileUpload } from '../../utils/validators';

export default function TaskSubmitModal({ task, taskActiveSeconds, taskTotalElapsed, onSubmit, onClose, darkMode }) {
  const [code, setCode] = useState(task?.submittedCode || '');
  const [notes, setNotes] = useState(task?.submittedNotes || '');
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [fileError, setFileError] = useState('');

  if (!task) return null;
  const activeSecs = taskActiveSeconds?.[task.id] || 0;
  const totalSecs = taskTotalElapsed?.[task.id] || 0;

  const handleSubmit = async () => {
    if (!code.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit(task.id, {
        submittedCode: code,
        submittedNotes: notes,
        submittedFiles: files.map((f) => f.name),
        activeSecondsLogged: activeSecs,
        loggedTime: formatShortTime(activeSecs),
      });
    } catch {}
    setSubmitting(false);
  };

  const handleFileUpload = (e) => {
    setFileError('');
    const newFiles = Array.from(e.target.files || []);
    const valid = [];
    for (const f of newFiles) {
      const err = validateFileUpload(f);
      if (err) { setFileError(err); return; }
      valid.push(f);
    }
    setFiles((prev) => [...prev, ...valid]);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} rounded-2xl max-w-xl w-full p-6 shadow-2xl border space-y-5`}>
        <div className={`flex justify-between items-start border-b pb-4 ${darkMode ? 'border-slate-700' : 'border-slate-100'}`}>
          <div>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">SUBMISSION</span>
            <h3 className={`text-lg font-bold mt-1 ${darkMode ? 'text-white' : 'text-slate-900'}`}>{task.title}</h3>
          </div>
          <button onClick={onClose} className={`${darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-slate-600'}`}><X className="w-5 h-5" /></button>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 grid grid-cols-2 gap-4">
          <div><span className="text-[11px] uppercase tracking-wider text-emerald-800 font-semibold block">Active Time</span><span className="text-2xl font-bold font-mono text-emerald-700">{formatShortTime(activeSecs)}</span></div>
          <div><span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold block">Idle (Unpaid)</span><span className="text-xl font-bold font-mono text-slate-700">{formatShortTime(Math.max(0, totalSecs - activeSecs))}</span></div>
        </div>
        <div><label className="block text-xs font-bold text-slate-800 uppercase mb-1">Deliverable *</label><textarea rows={5} value={code} onChange={(e) => setCode(e.target.value)} placeholder="Paste code..." className="w-full px-3 py-2 bg-slate-900 text-emerald-400 font-mono text-xs rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>
        <div><label className="block text-xs font-bold text-slate-800 uppercase mb-1">Attach Files</label>
          <label className={`flex items-center gap-2 px-4 py-3 border-2 border-dashed rounded-xl cursor-pointer transition ${darkMode ? 'border-slate-600 hover:border-blue-500' : 'border-slate-300 hover:border-blue-400'}`}><Upload className="w-4 h-4 text-slate-400" /><span className="text-xs text-slate-500">Upload files (max 10MB, code/text only)</span><input type="file" multiple className="hidden" onChange={handleFileUpload} /></label>
          {fileError && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{fileError}</p>}
          {files.length > 0 && <div className="flex flex-wrap gap-2 mt-2">{files.map((f, i) => <span key={i} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-lg flex items-center gap-1"><FileCode className="w-3 h-3" />{f}<button onClick={() => setFiles((p) => p.filter((_, j) => j !== i))} className="text-blue-400"><X className="w-3 h-3" /></button></span>)}</div>}
        </div>
        <div><label className="block text-xs font-semibold text-slate-700 mb-1">Notes</label><input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes..." className={`w-full px-3 py-2 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'border-slate-200'}`} /></div>
        <div className={`flex items-center justify-end space-x-3 pt-3 border-t ${darkMode ? 'border-slate-700' : 'border-slate-100'}`}>
          <button onClick={onClose} className={`px-4 py-2 text-xs font-semibold rounded-xl ${darkMode ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}>Cancel</button>
          <button onClick={handleSubmit} disabled={submitting || !code.trim()} className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /><span>{submitting ? 'Submitting...' : 'Submit'}</span></button>
        </div>
      </div>
    </div>
  );
}
