import React from 'react';
import { Play, CheckCircle2, Eye } from 'lucide-react';
import { formatShortTime } from '../../utils/formatters';

export default function TaskCard({ task, activeTaskId, isTracking, onStart, onSubmit, onView, onDelete, darkMode, activeSeconds }) {
  const tId = task.id;
  const isCurrentActive = activeTaskId === tId && isTracking;
  const secs = activeSeconds || task.activeSecondsLogged || 0;

  return (
    <div className="py-4 hover:bg-slate-50/80 dark:hover:bg-slate-700/30 px-2 rounded-xl transition flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex items-start space-x-4">
        <div className="w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center font-bold text-xs bg-indigo-50 text-indigo-600 border border-indigo-200">{task.type}</div>
        <div className="space-y-1">
          <h3 onClick={() => onView(task)} className="font-semibold text-slate-900 dark:text-white text-sm hover:text-blue-600 cursor-pointer">{task.title}</h3>
          <p className="text-xs text-slate-500">Project: <span className="font-medium text-slate-700 dark:text-slate-300">{task.project}</span></p>
          <div className="flex items-center gap-2 pt-1 flex-wrap">
            <span className="text-[11px] text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded font-mono">{task.id}</span>
            <span className="text-[11px] font-semibold text-emerald-600">{task.rate}</span>
            <span className="text-[11px] font-mono text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">{formatShortTime(secs)}</span>
            <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${task.priority === 'High' ? 'bg-red-100 text-red-600' : task.priority === 'Medium' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'}`}>{task.priority}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between md:justify-end gap-2 pt-2 md:pt-0 border-t md:border-0 border-slate-100 dark:border-slate-700">
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${task.status === 'Submitted' || task.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : task.status === 'In Progress' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>{task.status}</span>
        {task.status !== 'Submitted' && task.status !== 'Completed' && (
          <>
            {!isCurrentActive ? (
              <button onClick={() => onStart(task)} className="text-xs px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold flex items-center gap-1 shadow-sm transition">
                <Play className="w-3.5 h-3.5 fill-current" /><span>Start</span>
              </button>
            ) : (
              <button onClick={() => onSubmit(task)} className="text-xs px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold flex items-center gap-1 shadow-sm transition">
                <CheckCircle2 className="w-3.5 h-3.5" /><span>Submit</span>
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
