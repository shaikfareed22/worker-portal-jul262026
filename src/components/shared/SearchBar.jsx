import React from 'react';
import { Search } from 'lucide-react';

export default function SearchBar({ value, onChange, placeholder = 'Search...' }) {
  return (
    <div className="relative">
      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-9 pr-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-transparent w-40"
      />
    </div>
  );
}
