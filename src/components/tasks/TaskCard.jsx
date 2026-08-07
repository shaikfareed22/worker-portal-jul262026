import React from 'react';
import { Play, CheckCircle2, Eye, Lock } from 'lucide-react';
import { formatShortTime } from '../../utils/formatters';

export default function TaskCard({ task, activeTaskId, isTracking, onStart, onSubmit, onView, darkMode, activeSeconds, isAdmin }) {
  const tId = task.id;
  const isCurrentActive = activeTaskId === tId && isTracking;
  const isLocked = !isAdmin && activeTaskId && activeTaskId !== tId && task.status === 'Not Started';
  const secs = activeSeconds || task.activeSecondsLogged || 0;

  const statusColors = {
    'Submitted': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    'Completed': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    'In Progress': 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
    'Not Started': `${darkMode ? 'bg-white/5 text-slate-500 border-white/10' : 'bg-slate-100 text-slate-500 border-slate-200'}`,
  };

  const priorityColors = {
    'High': 'bg-red-500/10 text-red-500 border-red-500/20',
    'Medium': 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    'Low': `${darkMode ? 'bg-white/5 text-slate-500 border-white/10' : 'bg-slate-100 text-slate-500 border-slate-200'}`,
  };

  return (
    <div className={`py-4 px-3 rounded-xl transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${darkMode ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50'}`}>
      <div className="flex items-start space-x-4">
        <div className="w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center font-bold text-xs bg-gradient-to-br from-indigo-500/10 to-purple-500/10 text-indigo-500 border border-indigo-500/20">{task.type}</div>
        <div className="space-y-1.5">
          <h3 onClick={isLocked ? undefined : () => onView(task)} className={`font-semibold text-sm transition ${isLocked ? 'text-slate-500 cursor-not-allowed' : darkMode ? 'text-white hover:text-indigo-400 cursor-pointer' : 'text-slate-900 hover:text-indigo-600 cursor-pointer'}`}>{task.title}</h3>
          <p className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Project: <span className={`font-medium ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{task.project}</span></p>
          <div className="flex items-center gap-2 pt-0.5 flex-wrap">
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md ${darkMode ? 'text-slate-500 bg-white/5' : 'text-slate-400 bg-slate-100'}`}>{task.id.slice(0, 8)}</span>
            <span className="text-[11px] font-semibold text-emerald-500">{task.rate}</span>
            {isAdmin && task.timeSpent > 0 && <span className="text-[11px] font-mono text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded-md">Total: {formatShortTime(task.timeSpent)}</span>}
            {!isAdmin && secs > 0 && <span className={`text-[11px] font-mono px-2 py-0.5 rounded-md ${darkMode ? 'text-slate-400 bg-white/5' : 'text-slate-500 bg-slate-100'}`}>{formatShortTime(secs)}</span>}
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${priorityColors[task.priority] || priorityColors['Low']}`}>{task.priority}</span>
          </div>
        </div>
      </div>
      <div className={`flex items-center justify-between md:justify-end gap-2 pt-2 md:pt-0 border-t md:border-0 ${darkMode ? 'border-white/5' : 'border-slate-100'}`}>
        <span className={`text-[11px] px-2.5 py-1 rounded-full font-semibold border ${statusColors[task.status] || statusColors['Not Started']}`}>{task.status}</span>
        {task.status !== 'Submitted' && task.status !== 'Completed' && (
          <>
            {isLocked ? (
              <span className={`text-xs px-3 py-2 rounded-xl font-semibold flex items-center gap-1 cursor-not-allowed ${darkMode ? 'bg-white/5 text-slate-600' : 'bg-slate-100 text-slate-400'}`}>
                <Lock className="w-3.5 h-3.5" /><span>Locked</span>
              </span>
            ) : !isCurrentActive ? (
              <button onClick={() => onView(task)} className="text-xs px-3 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl font-semibold flex items-center gap-1 shadow-md shadow-indigo-500/20 transition-all">
                <Eye className="w-3.5 h-3.5" /><span>View Task</span>
              </button>
            ) : (
              <button onClick={() => onSubmit(task)} className="text-xs px-3 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl font-semibold flex items-center gap-1 shadow-md shadow-emerald-500/20 transition-all">
                <CheckCircle2 className="w-3.5 h-3.5" /><span>Submit</span>
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}