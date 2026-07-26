import React from 'react';
import { X } from 'lucide-react';

export default function Notification({ message, onClear }) {
  if (!message) return null;
  return (
    <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm font-medium flex items-center justify-between">
      <span>{message}</span>
      <button onClick={onClear}><X className="w-4 h-4" /></button>
    </div>
  );
}
