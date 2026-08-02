import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Play, CheckCircle2, Upload, FileCode, Clock, Loader2, Lock, AlertTriangle } from 'lucide-react';
import { formatShortTime, formatDateTime } from '../../utils/formatters';

function loadDeliverable(taskId) {
  try {
    const raw = localStorage.getItem(`corein_deliverable_${taskId}`);
    return raw || '';
  } catch { return ''; }
}

function saveDeliverable(taskId, code) {
  try {
    if (code) localStorage.setItem(`corein_deliverable_${taskId}`, code);
    else localStorage.removeItem(`corein_deliverable_${taskId}`);
  } catch {}
}

function clearDeliverable(taskId) {
  try { localStorage.removeItem(`corein_deliverable_${taskId}`); } catch {}
}

export default function TaskExecution({ task, onStart, onSubmit, onBack, onView, activeTaskId, isTracking, taskActiveSeconds, darkMode }) {
  const [code, setCode] = useState(() => task ? loadDeliverable(task.id) : '');
  const [notes, setNotes] = useState(task?.submittedNotes || '');
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const codeRef = useRef(null);

  const preventCopyPaste = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }, []);

  const preventKeyShortcuts = useCallback((e) => {
    if ((e.ctrlKey || e.metaKey) && ['c', 'v', 'x', 'a'].includes(e.key.toLowerCase())) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }, []);

  useEffect(() => {
    if (task) {
      const saved = loadDeliverable(task.id);
      if (saved) setCode(saved);
      else setCode(task.submittedCode || '');
    }
  }, [task?.id]);

  useEffect(() => {
    if (task) saveDeliverable(task.id, code);
  }, [code, task?.id]);

  if (!task) return null;

  const isActive = task.status === 'In Progress';
  const isSubmitted = task.status === 'Submitted' || task.status === 'Completed';
  const activeSecs = taskActiveSeconds?.[task.id] || task.activeSecondsLogged || 0;

  const handleStart = async () => {
    await onStart(task);
  };

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
      clearDeliverable(task.id);
    } catch {}
    setSubmitting(false);
  };

  const handleFileUpload = (e) => {
    setFiles((prev) => [...prev, ...Array.from(e.target.files || [])]);
  };

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-600 transition">
        <ArrowLeft className="w-4 h-4" /> Back to Tasks
      </button>

      <div className={`${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} rounded-2xl border p-6 shadow-sm`}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{task.type}</span>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${isActive ? 'bg-blue-100 text-blue-700' : isSubmitted ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{task.status}</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{task.title}</h2>
            <p className="text-xs text-slate-500 mt-1">{task.id} &middot; {task.project} &middot; Due {task.dueDate}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">Rate</p>
            <p className="text-lg font-bold text-emerald-600">{task.rate}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {[{ l: 'Priority', v: task.priority }, { l: 'Due', v: task.dueDate }, { l: 'Created', v: task.createdAt?.split('T')[0] || 'N/A' }, { l: 'Active Time', v: formatShortTime(activeSecs) }].map((s, i) => (
            <div key={i} className="p-3 bg-slate-50 dark:bg-slate-700 rounded-xl">
              <p className="text-[10px] text-slate-500 uppercase">{s.l}</p>
              <p className="text-xs font-bold text-slate-900 dark:text-white">{s.v}</p>
            </div>
          ))}
        </div>

        {task.description && (
          <div className="mb-4 p-4 bg-slate-50 dark:bg-slate-700 rounded-xl">
            <p className="text-xs font-semibold text-slate-500 mb-1">Description</p>
            <p className="text-sm text-slate-700 dark:text-slate-300">{task.description}</p>
          </div>
        )}
      </div>

      {task.status === 'Not Started' && (
        activeTaskId && activeTaskId !== task.id ? (
          <div className={`${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} rounded-2xl border p-8 shadow-sm text-center`}>
            <Lock className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Task Locked</h3>
            <p className="text-sm text-slate-500 mb-2">You already have an active task running.</p>
            <p className="text-xs text-slate-400 mb-6">Complete or submit your current task before starting a new one.</p>
            <button onClick={onBack} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-600/30 transition flex items-center gap-2 mx-auto">
              <ArrowLeft className="w-4 h-4" /> Back to Tasks
            </button>
          </div>
        ) : (
          <div className={`${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} rounded-2xl border p-8 shadow-sm text-center`}>
            <Clock className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Ready to Start?</h3>
            <p className="text-sm text-slate-500 mb-6">Click the button below to start working on this task. Time tracking will begin automatically.</p>
            <button onClick={handleStart} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-600/30 transition flex items-center gap-2 mx-auto">
              <Play className="w-5 h-5 fill-current" /> Start Task
            </button>
          </div>
        )
      )}

      {isActive && (
        <div className={`${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} rounded-2xl border p-6 shadow-sm space-y-5`}>
          <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
            <div>
              <p className="text-xs font-bold text-blue-800 dark:text-blue-300">Tracking in progress</p>
              <p className="text-xs text-blue-600 dark:text-blue-400">Active time: <span className="font-mono font-bold">{formatShortTime(activeSecs)}</span></p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-white uppercase mb-2">Deliverable *</label>
            <textarea ref={codeRef} data-deliverable="true" rows={8} value={code} onChange={(e) => setCode(e.target.value)} onPaste={preventCopyPaste} onCut={preventCopyPaste} onCopy={preventCopyPaste} onKeyDown={preventKeyShortcuts} onContextMenu={preventCopyPaste} placeholder="Type your deliverable here (copy/paste is disabled)..." className="w-full px-4 py-3 bg-slate-900 text-emerald-400 font-mono text-sm rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-white uppercase mb-2">Attach Files</label>
            <label className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl cursor-pointer hover:border-blue-400 transition">
              <Upload className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-500">Upload files</span>
              <input type="file" multiple className="hidden" onChange={handleFileUpload} />
            </label>
            {files.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {files.map((f, i) => (
                  <span key={i} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-lg flex items-center gap-1">
                    <FileCode className="w-3 h-3" />{f}
                    <button onClick={() => setFiles((p) => p.filter((_, j) => j !== i))} className="text-blue-400 hover:text-blue-600 ml-1">&times;</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-white uppercase mb-2">Notes</label>
            <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes about your submission..." className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-transparent" />
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-700">
            <button onClick={handleSubmit} disabled={submitting || !code.trim()} className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl shadow-lg shadow-emerald-600/30 transition flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" /> {submitting ? 'Submitting...' : 'Submit Task'}
            </button>
          </div>
        </div>
      )}

      {isSubmitted && (
        <div className={`${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} rounded-2xl border p-6 shadow-sm`}>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Submission</h3>
          {task.submittedAt && <p className="text-xs text-slate-500 mb-3">Submitted: {formatDateTime(task.submittedAt)}</p>}
          <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl mb-4">
            <p className="text-[10px] text-emerald-700 dark:text-emerald-400 uppercase font-semibold mb-1">Your Active Time</p>
            <p className="text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-400">{formatShortTime(task.activeSecondsLogged || 0)}</p>
          </div>
          {task.submittedCode && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-slate-500 mb-1">Deliverable</p>
              <pre className="p-4 bg-slate-900 text-emerald-400 font-mono text-xs rounded-xl overflow-x-auto">{task.submittedCode}</pre>
            </div>
          )}
          {task.submittedNotes && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-slate-500 mb-1">Notes</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">{task.submittedNotes}</p>
            </div>
          )}
          {task.reviewStatus && (
            <div className={`p-4 rounded-xl ${task.reviewStatus === 'Approved' ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
              <p className="text-sm font-bold">{task.reviewStatus}</p>
              {task.reviewComment && <p className="text-xs text-slate-600 mt-1">{task.reviewComment}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
