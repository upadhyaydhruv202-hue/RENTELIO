import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import RentelioLogo from './RentelioLogo';
import SearchBar from './SearchBar';

export default function UserNavbar({ customer, onLogout, darkMode, onToggleTheme }) {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  const links = [
    { to: '/user/dashboard', label: 'Home', end: true },
    { to: '/user/browse', label: 'Browse' },
    { to: '/user/cart', label: 'Cart' },
    { to: '/user/wishlist', label: 'Wishlist' },
    { to: '/user/wallet', label: 'Wallet' },
    { to: '/user/notifications', label: 'Notifications' },
    { to: '/user/compare', label: 'Compare' },
    { to: '/user/rentals', label: 'My Rentals' },
    { to: '/user/profile', label: 'Profile' },
  ];

  return (
    <header className="sticky top-0 z-40 mx-3 mt-3 rounded-2xl nav-glass text-ink-900 shadow-lg dark:text-white lg:mx-6">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3 lg:px-6">
        <Link to="/user/dashboard" className="shrink-0">
          <RentelioLogo size="sm" spin colorClass="text-brand-700 dark:text-brand-300" />
        </Link>

        <div className="order-3 w-full md:order-none md:mx-4 md:flex-1 md:max-w-xl">
          <SearchBar
            value={q}
            onChange={setQ}
            onSubmit={(value) => {
              navigate(`/user/browse?search=${encodeURIComponent(value || '')}`);
              setMenuOpen(false);
            }}
            placeholder="Search cameras, drones, laptops…"
          />
        </div>

        <nav className="ml-auto hidden items-center gap-1 xl:flex">
          {links.slice(0, 6).map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `nav-link-living rounded-lg px-2.5 py-1.5 text-sm transition ${
                  isActive
                    ? 'is-active'
                    : 'text-ink-600 hover:bg-brand-500/10 dark:text-ink-300'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleTheme}
            className="btn-living rounded-lg border border-brand-500/20 px-3 py-1.5 text-sm"
            aria-label="Toggle theme"
          >
            {darkMode ? 'Light' : 'Dark'}
          </button>
          <span className="hidden text-sm text-ink-500 dark:text-ink-400 sm:inline">
            {`Hi, ${customer?.name?.split(' ')[0] || 'Guest'}`}
          </span>
          <button
            type="button"
            onClick={onLogout}
            className="btn-living rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white"
          >
            Logout
          </button>
          <button
            type="button"
            className="btn-living rounded-lg border border-brand-500/20 px-3 py-1.5 text-sm xl:hidden"
            onClick={() => setMenuOpen((v) => !v)}
          >
            Menu
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="mobile-dock border-t border-brand-500/10 px-4 py-2 xl:hidden">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              onClick={() => setMenuOpen(false)}
              className="block rounded-lg px-3 py-2 text-sm text-ink-600 hover:bg-brand-500/10 dark:text-ink-300"
            >
              {link.label}
            </NavLink>
          ))}
        </div>
      )}
    </header>
  );
}
