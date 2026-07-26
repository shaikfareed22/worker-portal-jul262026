import React, { useMemo } from 'react';
import { Eye, Trash2 } from 'lucide-react';
import SearchBar from '../components/shared/SearchBar';

export default function MyTasks({ tasks, isAdmin, onView, onDelete, darkMode }) {
  return (
    <div className={`${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} rounded-2xl border p-6 shadow-sm`}>
      <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">All Tasks ({tasks.length})</h2>
      <div className="divide-y divide-slate-100 dark:divide-slate-700">
        {tasks.map((task) => (
          <div key={task.id} className="py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-[10px]">{task.type}</span>
              <div><p className="font-semibold text-slate-900 dark:text-white text-sm">{task.title}</p><p className="text-[11px] text-slate-400">{task.project}</p></div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${task.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : task.status === 'Submitted' ? 'bg-purple-100 text-purple-700' : task.status === 'In Progress' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>{task.status}</span>
              <button onClick={() => onView(task)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"><Eye className="w-3.5 h-3.5 text-slate-500" /></button>
              {!isAdmin && <button onClick={() => onDelete(task)} className="p-1.5 hover:bg-red-50 rounded-lg"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
