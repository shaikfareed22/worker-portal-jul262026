import React, { useMemo } from 'react';
import { LayoutDashboard, ListTodo, Activity, CheckCircle2, Clock, DollarSign, Wallet, FileText, UserCheck, HelpCircle, Settings, ShieldCheck, Users, ClipboardList, LogOut, X, Database, Timer } from 'lucide-react';

export default function Sidebar({ user, isAdmin, activeNav, setActiveNav, mobileOpen, setMobileOpen, onLogout, darkMode, taskCount }) {
  const navSections = useMemo(() => {
    const sections = [
      { title: 'WORK', items: [
        { name: 'Dashboard', icon: LayoutDashboard },
        { name: 'My Tasks', icon: ListTodo, badge: `${taskCount}` },
        { name: 'Active Tasks', icon: Activity },
        { name: 'Completed Tasks', icon: CheckCircle2 },
      ]},
      { title: 'TIME & EARNINGS', items: [
        { name: 'Time Tracker', icon: Timer },
        { name: 'Earnings', icon: DollarSign },
        { name: 'Payouts', icon: Wallet },
        { name: 'Invoices', icon: FileText },
      ]},
      { title: 'ACCOUNT', items: [
        { name: 'Profile', icon: UserCheck },
        { name: 'Support', icon: HelpCircle },
        { name: 'Settings', icon: Settings },
      ]},
    ];
    if (isAdmin) {
      sections.splice(1, 0, {
        title: 'MANAGEMENT',
        items: [
          { name: 'Admin Portal', icon: ShieldCheck, badge: 'ADMIN' },
          { name: 'Workers', icon: Users },
          { name: 'Audit Log', icon: ClipboardList },
        ],
      });
    }
    return sections;
  }, [isAdmin, taskCount]);

  return (
    <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#0A1228] text-slate-300 flex flex-col transform transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="p-5 flex items-center justify-between border-b border-slate-800/60">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-600/30 font-bold text-xs">CORE</div>
          <div>
            <h1 className="font-bold text-white text-base tracking-wider uppercase">COREIN</h1>
            <p className="text-xs text-blue-400 font-medium">{isAdmin ? 'Admin Control' : 'Worker Portal'}</p>
          </div>
        </div>
        <button onClick={() => setMobileOpen(false)} className="lg:hidden text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
      </div>

      <div className="p-4 border-b border-slate-800/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold ring-2 ring-blue-500/30">{user?.avatar || '?'}</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user?.name || 'Guest'}</p>
            <p className="text-[11px] text-blue-400 font-medium capitalize">{user?.role || 'unknown'}</p>
          </div>
          <button onClick={onLogout} className="p-1.5 text-slate-400 hover:text-red-400 transition rounded-lg hover:bg-slate-800"><LogOut className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navSections.map((section, idx) => (
          <div key={idx}>
            <p className="px-3 text-[11px] font-semibold text-slate-400 tracking-wider uppercase mb-2">{section.title}</p>
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeNav === item.name;
                return (
                  <button key={item.name} onClick={() => { setActiveNav(item.name); setMobileOpen(false); }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-semibold' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'}`}>
                    <div className="flex items-center space-x-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${item.badge === 'ADMIN' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : isActive ? 'bg-blue-800 text-blue-100' : 'bg-slate-800 text-slate-400'}`}>{item.badge}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-slate-800/80 text-xs text-slate-400">
        <div className="flex items-center justify-between text-[11px]">
          <span className="flex items-center gap-1.5"><Database className="w-3 h-3 text-emerald-400" /> API Connected</span>
          <span className="text-emerald-400 font-mono">Online</span>
        </div>
      </div>
    </aside>
  );
}
