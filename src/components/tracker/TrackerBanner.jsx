import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { formatSecondsToTime } from '../../utils/formatters';

export default function TrackerBanner({ task, taskActiveSeconds, isKeyboardActive, isMouseActive, isDualInputActive, isPaused, onPause, onSubmit }) {
  if (!task) return null;

  return (
    <div className="bg-slate-900 text-white p-4 lg:p-5 rounded-2xl shadow-xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 sticky top-20 z-20">
      <div className="flex items-center space-x-3 w-full md:w-auto">
        <div className={`w-3 h-3 rounded-full ${isDualInputActive ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'}`} />
        <div>
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Working On</span>
          <h2 className="text-base font-bold text-white">{task.title}</h2>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-800/90 px-4 py-2.5 rounded-xl border border-slate-700">
        <div>
          <span className="text-[10px] text-slate-400 block font-semibold uppercase">Dual-Input Time</span>
          <span className="text-2xl font-mono font-bold text-emerald-400">{formatSecondsToTime(taskActiveSeconds?.[task.id] || 0)}</span>
        </div>
        <div className="border-t sm:border-t-0 sm:border-l border-slate-700 pt-2 sm:pt-0 sm:pl-4 text-xs font-semibold space-y-1">
          <div className="flex items-center gap-2 text-[11px]">
            <span className={`px-2 py-0.5 rounded font-mono ${isKeyboardActive ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'}`}>Kbd: {isKeyboardActive ? 'ON' : 'OFF'}</span>
            <span className={`px-2 py-0.5 rounded font-mono ${isMouseActive ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'}`}>Mouse: {isMouseActive ? 'ON' : 'OFF'}</span>
          </div>
          <div>{isDualInputActive ? <span className="text-emerald-400 text-xs font-bold">VALIDATED</span> : <span className="text-amber-400 text-xs font-bold">PAUSED</span>}</div>
        </div>
      </div>
      <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
        <button onClick={onPause} className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold border border-slate-700">{isPaused ? 'Resume' : 'Pause'}</button>
        <button onClick={() => onSubmit(task)} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /><span>Submit</span></button>
      </div>
    </div>
  );
}
