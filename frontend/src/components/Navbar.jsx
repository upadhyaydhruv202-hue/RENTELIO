import { Link } from 'react-router-dom';
import RentelioLogo from './RentelioLogo';
import { useLocale } from '../context/LocaleContext';

export default function Navbar({ darkMode, onToggleTheme, onLogout, user }) {
  const { locale, setLocale } = useLocale();

  return (
    <header className="sticky top-0 z-30 mx-3 mt-3 flex h-16 items-center justify-between rounded-2xl px-4 nav-glass lg:mx-4 lg:px-6">
      <div className="flex items-center gap-3 lg:hidden">
        <Link to="/admin/dashboard">
          <RentelioLogo size="sm" colorClass="text-brand-700 dark:text-brand-300" />
        </Link>
      </div>

      <div className="hidden lg:block">
        <p className="text-sm text-ink-500 dark:text-ink-400">
          Neural link active{user?.name ? ` · ${user.name.split(' ')[0]}` : ''}
        </p>
        <p className="font-display text-base font-semibold text-ink-900 dark:text-white">
          Super Admin Command
        </p>
      </div>

      <div className="flex items-center gap-2">
        <select
          value={locale}
          onChange={(e) => setLocale(e.target.value)}
          className="input-living rounded-xl px-2 py-2 text-xs"
          aria-label="Language"
        >
          <option value="en">EN</option>
          <option value="hi">HI</option>
          <option value="gu">GU</option>
        </select>
        {user?.role && (
          <span className="hidden rounded-lg bg-brand-500/15 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-brand-800 dark:text-brand-300 sm:inline-flex">
            {user.role}
          </span>
        )}
        <button
          type="button"
          onClick={onToggleTheme}
          className="btn-living rounded-xl border border-brand-500/20 px-3 py-2 text-sm text-ink-600 dark:text-ink-300"
          aria-label="Toggle theme"
        >
          {darkMode ? 'Light' : 'Dark'}
        </button>
        <button
          type="button"
          onClick={onLogout}
          className="btn-living rounded-xl bg-ink-900 px-3 py-2 text-sm font-medium text-white dark:bg-brand-600"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
