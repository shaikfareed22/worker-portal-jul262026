import React from 'react';
import { Search } from 'lucide-react';

export default function SearchBar({ value, onChange, placeholder = 'Search...' }) {
  return (
    <div className="relative">
      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-9 pr-3 py-2 border border-slate-200 dark:border-white/10 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 bg-transparent w-40 transition"
      />
    </div>
  );
}