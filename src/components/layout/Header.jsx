import React, { useState } from 'react';
import { Bell, Menu, Moon, Sun } from 'lucide-react';

const ANNOUNCEMENTS = [
  { id: 1, title: 'New project: Medical QA Evaluation', desc: 'High priority project for medical domain experts.', time: '2h ago' },
  { id: 2, title: 'Maintenance Aug 1, 2:00 AM UTC', desc: 'Platform unavailable for 30 minutes.', time: '1d ago' },
];

export default function Header({ activeNav, darkMode, toggleDark, onMenuOpen, isAdmin }) {
  const [notifOpen, setNotifOpen] = useState(false);

  return (
    <header className={`sticky top-0 z-30 backdrop-blur-xl border-b px-4 lg:px-8 py-4 flex items-center justify-between ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white/80 border-slate-200/60'}`}>
      <div className="flex items-center space-x-3">
        <button onClick={onMenuOpen} className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"><Menu className="w-5 h-5" /></button>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className={`text-xl lg:text-2xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>{activeNav}</h1>
            {isAdmin && <span className="text-[10px] bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">Admin</span>}
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <button onClick={toggleDark} className={`p-2.5 rounded-xl transition ${darkMode ? 'text-slate-300 hover:bg-white/5' : 'text-slate-500 hover:bg-slate-100'}`}>
          {darkMode ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
        </button>
        <div className="relative">
          <button onClick={() => setNotifOpen(!notifOpen)} className={`relative p-2.5 rounded-xl transition ${darkMode ? 'text-slate-300 hover:bg-white/5' : 'text-slate-500 hover:bg-slate-100'}`}>
            <Bell className="w-[18px] h-[18px]" />
            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900">{ANNOUNCEMENTS.length}</span>
          </button>
          {notifOpen && (
            <div className={`absolute right-0 mt-2 w-80 rounded-2xl shadow-2xl border py-2 z-50 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
              <div className={`px-4 py-2.5 border-b flex justify-between items-center ${darkMode ? 'border-slate-700' : 'border-slate-100'}`}>
                <span className={`font-semibold text-sm ${darkMode ? 'text-white' : 'text-slate-800'}`}>Notifications</span>
                <button onClick={() => setNotifOpen(false)} className="text-xs text-indigo-500 hover:text-indigo-600 font-medium">Close</button>
              </div>
              <div className={`divide-y max-h-64 overflow-y-auto ${darkMode ? 'divide-slate-700' : 'divide-slate-100'}`}>
                {ANNOUNCEMENTS.map((a) => (
                  <div key={a.id} className={`p-3 transition ${darkMode ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}>
                    <p className={`text-xs font-semibold ${darkMode ? 'text-white' : 'text-slate-800'}`}>{a.title}</p>
                    <p className={`text-xs mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{a.desc}</p>
                    <span className="text-[10px] text-slate-400 mt-1 block">{a.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}