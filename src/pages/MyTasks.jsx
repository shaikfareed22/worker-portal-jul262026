import React from 'react';
import { Eye, Trash2, Lock } from 'lucide-react';

export default function MyTasks({ tasks, isAdmin, onView, onDelete, darkMode, activeTaskId }) {
  const safeTasks = Array.isArray(tasks) ? tasks : [];
  return (
    <div className={`${darkMode ? 'bg-white/[0.03] border-white/5' : 'bg-white border-slate-200/60'} rounded-2xl border p-6 backdrop-blur-sm`}>
      <h2 className={`text-lg font-bold tracking-tight mb-4 ${darkMode ? 'text-white' : 'text-slate-900'}`}>All Tasks ({safeTasks.length})</h2>
      <div className={`divide-y ${darkMode ? 'divide-white/5' : 'divide-slate-100'}`}>
        {safeTasks.map((task) => {
          const isLocked = !isAdmin && activeTaskId && activeTaskId !== task.id && task.status === 'Not Started';
          return (
            <div key={task.id} className={`py-3 flex items-center justify-between ${darkMode ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50'} px-2 rounded-lg transition`}>
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500/10 to-purple-500/10 text-indigo-500 flex items-center justify-center font-bold text-[10px] border border-indigo-500/20">{task.type}</span>
                <div>
                  <p className={`font-semibold text-sm ${isLocked ? 'text-slate-500' : darkMode ? 'text-white' : 'text-slate-900'}`}>{task.title}</p>
                  <p className={`text-[11px] ${darkMode ? 'text-slate-600' : 'text-slate-400'}`}>{task.project}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[11px] px-2.5 py-1 rounded-full font-semibold ${task.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-500' : task.status === 'Submitted' ? 'bg-indigo-500/10 text-indigo-500' : task.status === 'In Progress' ? 'bg-blue-500/10 text-blue-500' : darkMode ? 'bg-white/5 text-slate-500' : 'bg-slate-100 text-slate-500'}`}>{task.status}</span>
                {isLocked ? (
                  <span className={`p-1.5 rounded-lg ${darkMode ? 'text-slate-600' : 'text-slate-300'} cursor-not-allowed`}><Lock className="w-3.5 h-3.5" /></span>
                ) : (
                  <button onClick={() => onView(task)} className={`p-1.5 rounded-lg transition ${darkMode ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}><Eye className="w-3.5 h-3.5" /></button>
                )}
                {isAdmin && <button onClick={() => onDelete(task)} className="p-1.5 hover:bg-red-500/10 rounded-lg transition text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}