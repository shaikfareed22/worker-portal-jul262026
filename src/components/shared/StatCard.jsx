import React from 'react';

export default function StatCard({ label, value, sub, icon: Icon, iconBg, iconColor, darkMode }) {
  return (
    <div className={`p-5 rounded-2xl border backdrop-blur-sm flex items-center justify-between animate-fade-in ${darkMode ? 'bg-white/[0.03] border-white/5' : 'bg-white border-slate-200/60 shadow-sm'}`}>
      <div className="space-y-1">
        <p className={`text-[11px] font-semibold uppercase tracking-wider ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>{label}</p>
        <p className={`text-2xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>{value}</p>
        {sub && <p className={`text-xs font-medium ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>{sub}</p>}
      </div>
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${iconBg || 'bg-indigo-500/10'} ${iconColor || 'text-indigo-500'}`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  );
}