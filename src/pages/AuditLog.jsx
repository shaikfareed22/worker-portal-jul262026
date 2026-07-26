import React, { useState, useEffect } from 'react';
import { ClipboardList } from 'lucide-react';
import { api } from '../utils/api';
import { formatDateTime } from '../utils/formatters';

export default function AuditLog({ darkMode }) {
  const [log, setLog] = useState([]);
  useEffect(() => { api.getAuditLog().then(({ auditLog }) => setLog(auditLog)).catch(() => {}); }, []);

  const icons = { task_created: 'Plus', task_started: 'Play', task_submitted: 'Send', task_completed: 'Check', task_deleted: 'Trash', task_reviewed: 'Edit', login: 'Login', task_updated: 'Update' };

  return (
    <div className={`${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} rounded-2xl border p-6 shadow-sm`}>
      <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2"><ClipboardList className="w-5 h-5 text-blue-600" /> Audit Log</h2><span className="text-xs text-slate-400">{log.length} entries</span></div>
      <div className="max-h-[500px] overflow-y-auto">
        {log.length === 0 ? <p className="text-sm text-slate-400">No entries.</p> : log.map((e) => (
          <div key={e.id} className="flex items-start gap-3 py-3 border-b border-slate-100 dark:border-slate-700 last:border-0">
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-600 flex items-center justify-center flex-shrink-0 text-xs font-bold text-slate-600 dark:text-white">{icons[e.action]?.[0] || '?'}</div>
            <div className="flex-1 min-w-0"><p className="text-xs font-medium text-slate-800 dark:text-white">{e.message}</p><p className="text-[11px] text-slate-400 mt-0.5">{e.userId} &middot; {formatDateTime(e.timestamp)}</p></div>
          </div>
        ))}
      </div>
    </div>
  );
}
