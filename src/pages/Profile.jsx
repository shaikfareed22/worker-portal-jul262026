import React from 'react';
import { UserCheck } from 'lucide-react';
import { formatDate, calculateEarnings } from '../utils/formatters';

export default function Profile({ user, tasks, darkMode }) {
  const completed = tasks.filter((t) => t.status === 'Completed').length;
  const totalEarn = calculateEarnings(tasks.reduce((a, t) => a + (t.activeSecondsLogged || 0), 0), user?.rate || 25);

  return (
    <div className={`${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} rounded-2xl border p-6 shadow-sm max-w-2xl`}>
      <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><UserCheck className="w-5 h-5 text-blue-600" /> Profile</h2>
      <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100 dark:border-slate-700">
        <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl font-bold ring-4 ring-blue-500/20">{user?.avatar || '?'}</div>
        <div><h3 className="text-xl font-bold text-slate-900 dark:text-white">{user?.name}</h3><p className="text-sm text-slate-500 capitalize">{user?.role} &middot; ${user?.rate}/hr</p><p className="text-xs text-slate-400">{user?.email}</p></div>
      </div>
      <div className="grid grid-cols-2 gap-4 text-xs">
        {[{ l: 'User ID', v: user?.id }, { l: 'Role', v: user?.role }, { l: 'Rate', v: `$${user?.rate}/hr` }, { l: 'Joined', v: formatDate(user?.joinedAt) }, { l: 'Completed', v: completed }, { l: 'Earned', v: `$${totalEarn}` }].map((s, i) => (
          <div key={i} className="p-3 bg-slate-50 dark:bg-slate-700 rounded-xl"><p className="text-slate-500 mb-0.5">{s.l}</p><p className="font-medium text-slate-900 dark:text-white">{s.v}</p></div>
        ))}
      </div>
    </div>
  );
}
