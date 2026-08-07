import React from 'react';

export default function StatCard({ label, value, sub, icon: Icon, iconBg, iconColor, darkMode }) {
  return (
    <div className={`${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} p-5 rounded-2xl border shadow-sm flex items-center justify-between`}>
      <div className="space-y-1">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
        <p className={`text-2xl font-bold ${iconColor || 'text-slate-900 dark:text-white'}`}>{value}</p>
        {sub && <p className="text-xs font-medium text-slate-500">{sub}</p>}
      </div>
      <div className={`w-12 h-12 rounded-xl ${iconBg || 'bg-blue-50'} flex items-center justify-center ${iconColor || 'text-blue-600'}`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  );
}
