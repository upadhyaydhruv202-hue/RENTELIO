import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import RentelioLogo from './RentelioLogo';
import SearchBar from './SearchBar';

const links = [
  { to: '/shop', label: 'Home', end: true },
  { to: '/shop/browse', label: 'Browse' },
  { to: '/shop/rentals', label: 'My Rentals' },
  { to: '/shop/payments', label: 'Payments' },
  { to: '/shop/profile', label: 'Profile' },
];

export default function UserNavbar({ customer, onLogout }) {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-ink-200/80 bg-[#0f1218] text-white shadow-md">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3 lg:px-6">
        <Link to="/shop" className="shrink-0">
          <RentelioLogo size="sm" colorClass="text-white" />
        </Link>

        <div className="order-3 w-full md:order-none md:mx-4 md:flex-1 md:max-w-xl">
          <SearchBar
            value={q}
            onChange={setQ}
            onSubmit={(value) => {
              navigate(`/shop/browse?search=${encodeURIComponent(value || '')}`);
              setMenuOpen(false);
            }}
            placeholder="Search cameras, drones, laptops…"
          />
        </div>

        <nav className="ml-auto hidden items-center gap-1 lg:flex">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `rounded-lg px-3 py-1.5 text-sm transition ${
                  isActive ? 'bg-white/15 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <span className="hidden text-sm text-white/70 sm:inline">
            Hi, {customer?.name?.split(' ')[0] || 'Guest'}
          </span>
          <button
            type="button"
            onClick={onLogout}
            className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium hover:bg-brand-500"
          >
            Logout
          </button>
          <button
            type="button"
            className="rounded-lg border border-white/20 px-3 py-1.5 text-sm lg:hidden"
            onClick={() => setMenuOpen((v) => !v)}
          >
            Menu
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-white/10 px-4 py-2 lg:hidden">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              onClick={() => setMenuOpen(false)}
              className="block rounded-lg px-3 py-2 text-sm text-white/80 hover:bg-white/10"
            >
              {link.label}
            </NavLink>
          ))}
        </div>
      )}
    </header>
  );
}
