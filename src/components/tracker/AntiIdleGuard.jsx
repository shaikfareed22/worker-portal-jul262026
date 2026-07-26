import React from 'react';
import { Activity } from 'lucide-react';

export default function AntiIdleGuard({ isKeyboardActive, isMouseActive, isDualInputActive, darkMode }) {
  return (
    <div className={`${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} rounded-2xl border p-6 shadow-sm space-y-4`}>
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
        <h2 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2"><Activity className="w-5 h-5 text-blue-600" /><span>Anti-Idle Guard</span></h2>
      </div>
      <div className="space-y-3 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 rounded-xl text-amber-900 dark:text-amber-300 font-medium">
          Anti-Jiggler: Paid time requires BOTH keyboard AND mouse within 8s. Tab switch = auto-pause.
        </div>
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between"><span>Keyboard:</span><span className={`font-bold font-mono ${isKeyboardActive ? 'text-emerald-600' : 'text-slate-400'}`}>{isKeyboardActive ? 'ACTIVE' : 'IDLE'}</span></div>
          <div className="flex items-center justify-between"><span>Mouse:</span><span className={`font-bold font-mono ${isMouseActive ? 'text-emerald-600' : 'text-slate-400'}`}>{isMouseActive ? 'ACTIVE' : 'IDLE'}</span></div>
          <div className="flex items-center justify-between"><span>Window:</span><span className="font-mono font-bold text-slate-800 dark:text-white">8 Seconds</span></div>
        </div>
        <div className="bg-slate-50 dark:bg-slate-700 p-3 rounded-xl border border-slate-200 dark:border-slate-600 text-center font-mono">
          <span className="text-[11px] text-slate-500 block uppercase">Validation</span>
          <span className={`text-sm font-bold ${isDualInputActive ? 'text-emerald-600' : 'text-amber-600'}`}>{isDualInputActive ? 'DUAL INPUT VALIDATED' : 'WAITING FOR BOTH INPUTS'}</span>
        </div>
      </div>
    </div>
  );
}
