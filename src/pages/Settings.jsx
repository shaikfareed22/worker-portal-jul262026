import React from 'react';
import { Settings as SettingsIcon, Moon, Sun } from 'lucide-react';

export default function SettingsPage({ darkMode, toggleDark, onClearData }) {
  return (
    <div className={`${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} rounded-2xl border p-6 shadow-sm max-w-2xl space-y-6`}>
      <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2"><SettingsIcon className="w-5 h-5 text-blue-600" /> Settings</h2>
      <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700 rounded-xl">
        <div><p className="text-sm font-semibold text-slate-900 dark:text-white">Dark Mode</p><p className="text-xs text-slate-500">Toggle theme</p></div>
        <button onClick={toggleDark} className={`w-12 h-6 rounded-full transition relative ${darkMode ? 'bg-blue-600' : 'bg-slate-300'}`}><span className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition shadow ${darkMode ? 'left-6' : 'left-0.5'}`} /></button>
      </div>
      <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-xl">
        <p className="text-sm font-semibold text-slate-900 dark:text-white mb-1">Storage</p>
        <p className="text-xs text-slate-500">All data stored server-side via API</p>
        <button onClick={onClearData} className="mt-2 text-xs px-3 py-1.5 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition">Clear Local Cache</button>
      </div>
      <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-xl"><p className="text-sm font-semibold text-slate-900 dark:text-white mb-1">COREIN Portal v2.0.0</p><p className="text-xs text-slate-400">React + Vite + Tailwind + Express API</p></div>
    </div>
  );
}
