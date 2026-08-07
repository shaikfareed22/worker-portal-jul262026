import React, { useState, useEffect } from 'react';
import { Send, FileCode, X, Check, Clock, ListTodo, Images, ChevronLeft, ChevronRight } from 'lucide-react';
import TaskCreateForm from '../components/tasks/TaskCreateForm';
import { api } from '../utils/api';
import { formatShortTime, calculateEarnings } from '../utils/formatters';

export default function AdminPortal({ tasks, onCreateTask, onReview, darkMode }) {
  const [submissions, setSubmissions] = useState([]);
  const [rejectId, setRejectId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [screenshotTaskId, setScreenshotTaskId] = useState(null);
  const [screenshots, setScreenshots] = useState([]);
  const [screenshotsLoading, setScreenshotsLoading] = useState(false);
  const [screenshotIdx, setScreenshotIdx] = useState(0);
  const safeTasks = Array.isArray(tasks) ? tasks : [];

  useEffect(() => {
    setSubmissions(safeTasks.filter((t) => t.status === 'Submitted'));
  }, [safeTasks]);

  const loadScreenshots = async (taskId) => {
    setScreenshotTaskId(taskId);
    setScreenshotsLoading(true);
    setScreenshotIdx(0);
    const data = await api.getScreenshotsByTask(taskId);
    setScreenshots(data);
    setScreenshotsLoading(false);
  };

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
                <button onClick={() => loadScreenshots(task.id)} className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1"><Images className="w-3.5 h-3.5" /> Screenshots</button>
                <button onClick={() => onReview(task.id, 'Approved', '')} className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Approve</button>
                <button onClick={() => { setRejectId(task.id); setRejectReason(''); }} className="px-4 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-xl transition flex items-center gap-1"><X className="w-3.5 h-3.5" /> Reject</button>
              </div>
            </div>
            );
          })}</div>
        )}
      </div>

      {rejectId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setRejectId(null)}>
          <div className={`${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} rounded-2xl max-w-sm w-full p-6 shadow-2xl border`} onClick={(e) => e.stopPropagation()}>
            <h3 className={`text-lg font-bold mb-3 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Rejection Reason</h3>
            <input type="text" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Why is this rejected?" autoFocus className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 mb-4 ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'border-slate-200'}`} />
            <div className="flex justify-end gap-3">
              <button onClick={() => setRejectId(null)} className={`px-4 py-2 text-xs font-semibold rounded-xl ${darkMode ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}>Cancel</button>
              <button onClick={() => { onReview(rejectId, 'Rejected', rejectReason); setRejectId(null); }} className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-xl">Reject</button>
            </div>
          </div>
        </div>
      )}

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
      {/* Screenshot Viewer Modal */}
      {screenshotTaskId && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setScreenshotTaskId(null)}>
          <div className={`${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} rounded-2xl max-w-2xl w-full p-6 shadow-2xl border`} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-bold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}><Images className="w-5 h-5 text-indigo-600" /> Screenshots</h3>
              <button onClick={() => setScreenshotTaskId(null)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg"><X className="w-4 h-4" /></button>
            </div>
            {screenshotsLoading ? (
              <div className="py-12 text-center text-sm text-slate-400">Loading screenshots...</div>
            ) : screenshots.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-400">No screenshots captured yet for this task.</div>
            ) : (
              <div>
                <div className="relative rounded-xl overflow-hidden bg-black mb-3">
                  <img src={screenshots[screenshotIdx]?.url} alt={`Screenshot ${screenshotIdx + 1}`} className="w-full object-contain max-h-[60vh]" />
                  {screenshots.length > 1 && (
                    <>
                      <button onClick={() => setScreenshotIdx((i) => (i > 0 ? i - 1 : screenshots.length - 1))} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-full"><ChevronLeft className="w-4 h-4" /></button>
                      <button onClick={() => setScreenshotIdx((i) => (i < screenshots.length - 1 ? i + 1 : 0))} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-full"><ChevronRight className="w-4 h-4" /></button>
                    </>
                  )}
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>{screenshotIdx + 1} of {screenshots.length}</span>
                  <span>{screenshots[screenshotIdx]?.created_at ? new Date(screenshots[screenshotIdx].created_at).toLocaleString() : ''}</span>
                </div>
                {screenshots.length > 1 && (
                  <div className="flex gap-1.5 mt-3 overflow-x-auto pb-1">
                    {screenshots.map((s, i) => (
                      <button key={s.id} onClick={() => setScreenshotIdx(i)} className={`flex-shrink-0 w-14 h-10 rounded-lg overflow-hidden border-2 transition ${i === screenshotIdx ? 'border-indigo-500' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                        <img src={s.url} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
