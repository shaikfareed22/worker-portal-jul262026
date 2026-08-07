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
    <aside className={`fixed inset-y-0 left-0 z-40 w-64 flex flex-col transform transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} ${darkMode ? 'bg-[#0c1222]' : 'bg-[#0f172a]'}`}>
      <div className="p-5 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-3">
          <img src="/assets/corein-logo-white.svg" alt="COREIN" className="h-8 w-auto" />
        </div>
        <button onClick={() => setMobileOpen(false)} className="lg:hidden text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"><X className="w-5 h-5" /></button>
      </div>

      <div className="p-4 mx-3 mt-4 mb-2 rounded-xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-indigo-500/20">{user?.avatar || '?'}</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user?.name || 'Guest'}</p>
            <p className="text-[11px] text-indigo-400 font-medium capitalize">{user?.role || 'unknown'}</p>
          </div>
          <button onClick={onLogout} className="p-1.5 text-slate-400 hover:text-red-400 transition rounded-lg hover:bg-white/5" title="Sign out"><LogOut className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navSections.map((section, idx) => (
          <div key={idx}>
            <p className="px-3 text-[10px] font-bold text-slate-500 tracking-widest uppercase mb-2">{section.title}</p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeNav === item.name;
                return (
                  <button key={item.name} onClick={() => { setActiveNav(item.name); setMobileOpen(false); }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${isActive ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}>
                    <div className="flex items-center gap-3">
                      <Icon className={`w-[18px] h-[18px] ${isActive ? 'text-white' : 'text-slate-500'}`} />
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${item.badge === 'ADMIN' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : isActive ? 'bg-white/20 text-white' : 'bg-white/5 text-slate-500'}`}>{item.badge}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 mx-3 mb-3 rounded-xl bg-white/[0.03] border border-white/5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="flex items-center gap-1.5 text-slate-500"><Database className="w-3 h-3 text-emerald-400" /> System Status</span>
          <span className="text-emerald-400 font-mono font-medium">Online</span>
        </div>
      </div>
    </aside>
  );
}