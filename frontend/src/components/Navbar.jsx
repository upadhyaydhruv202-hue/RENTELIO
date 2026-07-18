import { Link } from 'react-router-dom';
import RentelioLogo from './RentelioLogo';

export default function Navbar({ darkMode, onToggleTheme, onLogout, user }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-ink-200/80 bg-white/80 px-4 backdrop-blur-md dark:border-ink-800 dark:bg-ink-950/80 lg:px-6">
      <div className="flex items-center gap-3 lg:hidden">
        <Link to="/dashboard">
          <RentelioLogo size="sm" colorClass="text-brand-700 dark:text-brand-300" />
        </Link>
      </div>

      <div className="hidden lg:block">
        <p className="text-sm text-ink-500 dark:text-ink-400">
          Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
        </p>
        <p className="font-display text-base font-semibold text-ink-900 dark:text-white">
          Rental Operations
        </p>
      </div>

      <div className="flex items-center gap-2">
        {user?.role && (
          <span
            className={`hidden rounded-lg px-2.5 py-1 text-xs font-semibold uppercase tracking-wide sm:inline-flex ${
              user.role === 'admin'
                ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300'
                : 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300'
            }`}
          >
            {user.role}
          </span>
        )}
        <button
          type="button"
          onClick={onToggleTheme}
          className="rounded-xl border border-ink-200 px-3 py-2 text-sm text-ink-600 transition hover:bg-ink-50 dark:border-ink-700 dark:text-ink-300 dark:hover:bg-ink-800"
          aria-label="Toggle theme"
        >
          {darkMode ? 'Light' : 'Dark'}
        </button>
        <button
          type="button"
          onClick={onLogout}
          className="rounded-xl bg-ink-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-ink-800 dark:bg-brand-600 dark:hover:bg-brand-500"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
