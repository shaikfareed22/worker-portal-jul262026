import React, { useState } from 'react';
import { Bell, Menu, Moon, Sun } from 'lucide-react';

const ANNOUNCEMENTS = [
  { id: 1, title: 'New project: Medical QA Evaluation', desc: 'High priority project for medical domain experts.', time: '2h ago' },
  { id: 2, title: 'Maintenance Aug 1, 2:00 AM UTC', desc: 'Platform unavailable for 30 minutes.', time: '1d ago' },
];

export default function Header({ activeNav, darkMode, toggleDark, onMenuOpen, isAdmin }) {
  const [notifOpen, setNotifOpen] = useState(false);

  return (
    <header className={`sticky top-0 z-30 border-b px-4 lg:px-8 py-4 flex items-center justify-between ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
      <div className="flex items-center space-x-3">
        <button onClick={onMenuOpen} className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"><Menu className="w-6 h-6" /></button>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className={`text-xl lg:text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{activeNav}</h1>
            {isAdmin && <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold">ADMIN</span>}
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-3">
        <button onClick={toggleDark} className={`p-2 rounded-lg transition ${darkMode ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-100'}`}>
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
        <div className="relative">
          <button onClick={() => setNotifOpen(!notifOpen)} className={`relative p-2 rounded-full transition ${darkMode ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-100'}`}>
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">{ANNOUNCEMENTS.length}</span>
          </button>
          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50">
              <div className="px-4 py-2 border-b border-slate-100 flex justify-between items-center">
                <span className="font-semibold text-slate-800 text-sm">Notifications</span>
                <button onClick={() => setNotifOpen(false)} className="text-xs text-blue-600 hover:underline">Close</button>
              </div>
              <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                {ANNOUNCEMENTS.map((a) => (
                  <div key={a.id} className="p-3 hover:bg-slate-50 transition">
                    <p className="text-xs font-semibold text-slate-800">{a.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{a.desc}</p>
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
