import { Outlet } from 'react-router-dom';
import PortalRoute from './PortalRoute';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import AmbientField from './AmbientField';
import PageReveal from './PageReveal';
import PortalSplash from './PortalSplash';
import { useState } from 'react';

/** Super Admin shell — admin role only */
export default function Layout({ darkMode, onToggleTheme, onLogout, user }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <PortalRoute portal="admin" admin={user}>
      <div className="living-shell flex min-h-screen text-ink-900 dark:text-ink-100">
        <PortalSplash portal="admin" label="Super Admin OS" />
        <AmbientField />
        <div className="living-content flex min-h-screen w-full">
          <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} user={user} />
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex items-center gap-2 px-4 py-2 lg:hidden">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="btn-living glass-panel rounded-xl px-3 py-1.5 text-sm"
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
              <PageReveal>
                <Outlet />
              </PageReveal>
            </main>
          </div>
        </div>
      </div>
    </PortalRoute>
  );
}
