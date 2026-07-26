import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout({ children, user, isAdmin, activeNav, setActiveNav, darkMode, toggleDark, onLogout, taskCount }) {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <div className={`min-h-screen text-slate-800 flex font-sans antialiased ${darkMode ? 'bg-slate-900 text-slate-200' : 'bg-[#F8FAFC]'}`}>
      <Sidebar user={user} isAdmin={isAdmin} activeNav={activeNav} setActiveNav={setActiveNav} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} onLogout={onLogout} darkMode={darkMode} taskCount={taskCount} />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header activeNav={activeNav} darkMode={darkMode} toggleDark={toggleDark} onMenuOpen={() => setMobileOpen(true)} isAdmin={isAdmin} />
        <main className="p-4 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}
