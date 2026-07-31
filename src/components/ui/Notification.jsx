import React from 'react';
import { X, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function Notification({ message, onClear, type }) {
  if (!message) return null;
  const isError = type === 'error' || message.toLowerCase().includes('fail') || message.toLowerCase().includes('error');
  return (
    <div className={`p-4 rounded-xl text-sm font-medium flex items-center justify-between ${
      isError
        ? 'bg-red-50 border border-red-200 text-red-800'
        : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
    }`}>
      <span className="flex items-center gap-2">
        {isError ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
        {message}
      </span>
      <button onClick={onClear} className="ml-4 shrink-0"><X className="w-4 h-4" /></button>
    </div>
  );
}
