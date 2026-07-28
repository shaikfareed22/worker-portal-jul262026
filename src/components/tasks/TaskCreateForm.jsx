import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { TASK_TYPES, PRIORITIES, RATES } from '../../config/constants';
import { api } from '../../utils/api';

export default function TaskCreateForm({ onSubmit, darkMode }) {
  const [form, setForm] = useState({ title: '', project: '', type: 'CODE', priority: 'Medium', rate: '$25/hr', rateNum: 25, dueDate: '', description: '', assignedTo: '' });
  const [submitting, setSubmitting] = useState(false);
  const [workers, setWorkers] = useState([]);

  useEffect(() => {
    api.getWorkers().then(({ workers }) => setWorkers(workers)).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.project) return;
    setSubmitting(true);
    try { await onSubmit(form); setForm({ title: '', project: '', type: 'CODE', priority: 'Medium', rate: '$25/hr', rateNum: 25, dueDate: '', description: '', assignedTo: '' }); } catch {}
    setSubmitting(false);
  };

  return (
    <div className={`${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} rounded-2xl border p-6 shadow-sm max-w-2xl`}>
      <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><Plus className="w-5 h-5 text-blue-600" /> Create Task</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className="block text-xs font-semibold text-slate-700 mb-1">Title *</label><input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-transparent" /></div>
          <div><label className="block text-xs font-semibold text-slate-700 mb-1">Project *</label><input type="text" value={form.project} onChange={(e) => setForm({ ...form, project: e.target.value })} required className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-transparent" /></div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div><label className="block text-xs font-semibold text-slate-700 mb-1">Type</label><select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl text-sm bg-transparent">{TASK_TYPES.map((t) => <option key={t}>{t}</option>)}</select></div>
          <div><label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label><select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl text-sm bg-transparent">{PRIORITIES.map((p) => <option key={p}>{p}</option>)}</select></div>
          <div><label className="block text-xs font-semibold text-slate-700 mb-1">Rate</label><select value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value, rateNum: parseInt(e.target.value.replace('$', '')) })} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl text-sm bg-transparent">{RATES.map((r) => <option key={r}>{r}</option>)}</select></div>
          <div><label className="block text-xs font-semibold text-slate-700 mb-1">Due Date</label><input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl text-sm bg-transparent" /></div>
        </div>
        <div><label className="block text-xs font-semibold text-slate-700 mb-1">Assign To</label><select value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl text-sm bg-transparent"><option value="">Unassigned (All workers can see)</option>{workers.map((w) => <option key={w.id} value={w.id}>{w.name} ({w.email})</option>)}</select></div>
        <div><label className="block text-xs font-semibold text-slate-700 mb-1">Description</label><textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-transparent" placeholder="Task description..." /></div>
        <button type="submit" disabled={submitting} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-2"><Plus className="w-4 h-4" /> {submitting ? 'Creating...' : 'Create Task'}</button>
      </form>
    </div>
  );
}
