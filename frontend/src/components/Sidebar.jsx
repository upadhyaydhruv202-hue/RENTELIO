import { NavLink } from 'react-router-dom';
import RentelioLogo from './RentelioLogo';

const allLinks = [
  { to: '/dashboard', label: 'Dashboard', roles: ['admin', 'user'] },
  { to: '/products', label: 'Products', roles: ['admin', 'user'] },
  { to: '/rentals', label: 'Rentals', roles: ['admin', 'user'] },
  { to: '/returns', label: 'Returns', roles: ['admin', 'user'] },
  { to: '/deposits', label: 'Deposits', roles: ['admin'] },
];

export default function Sidebar({ open, onClose, user }) {
  const role = user?.role || 'user';
  const links = allLinks.filter((link) => link.roles.includes(role));

  return (
    <>
      {open && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-ink-950/40 lg:hidden"
          onClick={onClose}
          aria-label="Close menu"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-ink-200/80 bg-white transition-transform dark:border-ink-800 dark:bg-ink-950
          lg:static lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="border-b border-ink-200/80 px-5 py-6 dark:border-ink-800">
          <RentelioLogo
            size="sm"
            showTagline
            colorClass="text-brand-700 dark:text-brand-300"
            taglineClass="!mt-1.5 !text-ink-500 dark:!text-ink-400 !tracking-normal"
          />
          <span
            className={`mt-3 inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
              role === 'admin'
                ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300'
                : 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300'
            }`}
          >
            {role}
          </span>
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-3">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={onClose}
              className={({ isActive }) =>
                `rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-ink-600 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-ink-200/80 p-4 text-xs text-ink-400 dark:border-ink-800">
          Prototype v1.0
        </div>
      </aside>
    </>
  );
}
