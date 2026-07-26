import React, { useState, useEffect } from 'react';
import { Users } from 'lucide-react';
import { api } from '../utils/api';

export default function Workers({ darkMode }) {
  const [workers, setWorkers] = useState([]);
  useEffect(() => { api.getWorkers().then(({ workers }) => setWorkers(workers)).catch(() => {}); }, []);

  return (
    <div className={`${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} rounded-2xl border p-6 shadow-sm`}>
      <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><Users className="w-5 h-5 text-blue-600" /> Workers</h2>
      <div className="space-y-3">{workers.map((w) => (
        <div key={w.id} className="p-4 bg-slate-50 dark:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-600 flex items-center justify-between">
          <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">{w.avatar}</div><div><p className="font-semibold text-slate-900 dark:text-white text-sm">{w.name}</p><p className="text-xs text-slate-500">{w.email} &middot; ${w.rate}/hr</p></div></div>
        </div>
      ))}</div>
    </div>
  );
}
