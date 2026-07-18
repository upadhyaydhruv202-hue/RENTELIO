import { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function Layout({ darkMode, onToggleTheme, onLogout, user }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-ink-50 text-ink-900 dark:bg-ink-950 dark:text-ink-100">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} user={user} />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2 border-b border-ink-200/80 bg-white/80 px-4 py-2 backdrop-blur lg:hidden dark:border-ink-800 dark:bg-ink-950/80">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg border border-ink-200 px-3 py-1.5 text-sm dark:border-ink-700"
          >
            Menu
          </button>
        </div>
        <Navbar
          darkMode={darkMode}
          onToggleTheme={onToggleTheme}
          onLogout={onLogout}
          user={user}
        />
        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
