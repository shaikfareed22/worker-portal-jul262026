import React, { useState } from 'react';
import { MessageSquare, Send } from 'lucide-react';

export default function Support({ darkMode, onNotify }) {
  const [form, setForm] = useState({ subject: '', message: '', priority: 'Medium' });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.subject || !form.message) { onNotify('Fill all fields.'); return; }
    onNotify('Support ticket submitted!');
    setForm({ subject: '', message: '', priority: 'Medium' });
  };

  return (
    <div className={`${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} rounded-2xl border p-6 shadow-sm max-w-2xl`}>
      <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><MessageSquare className="w-5 h-5 text-blue-600" /> Support Ticket</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div><label className="block text-xs font-semibold text-slate-700 mb-1">Subject *</label><input type="text" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-transparent" /></div>
        <div><label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label><select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl text-sm bg-transparent"><option>Low</option><option>Medium</option><option>High</option><option>Urgent</option></select></div>
        <div><label className="block text-xs font-semibold text-slate-700 mb-1">Message *</label><textarea rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-transparent" placeholder="Describe your issue..." /></div>
        <button type="submit" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-2"><Send className="w-4 h-4" /> Submit</button>
      </form>
    </div>
  );
}
