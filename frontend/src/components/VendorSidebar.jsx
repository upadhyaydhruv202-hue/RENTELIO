import { NavLink } from 'react-router-dom';
import RentelioLogo from './RentelioLogo';

const links = [
  { to: '/vendor/dashboard', label: 'Dashboard', end: true },
  { to: '/vendor/inventory', label: 'Inventory Management' },
  { to: '/vendor/pickup-return', label: 'Pickup & Return' },
  { to: '/vendor/money', label: 'Money Workflow' },
  { to: '/vendor/orders', label: 'Rental Orders' },
  { to: '/vendor/customers', label: 'Customers' },
  { to: '/vendor/discounts', label: 'Discounts & Offers' },
  { to: '/vendor/coupons', label: 'Coupons' },
  { to: '/vendor/reports', label: 'Reports' },
  { to: '/vendor/notifications', label: 'Notifications' },
  { to: '/vendor/profile', label: 'Profile' },
];

export default function VendorSidebar({ open, onClose, vendor }) {
  return (
    <>
      {open && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-ink-950/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-label="Menu"
        />
      )}
      <aside
        className={`fixed inset-y-3 left-3 z-50 flex w-[15.5rem] flex-col rounded-3xl nav-glass transition-transform lg:static lg:my-3 lg:ml-3 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-[120%]'
        }`}
      >
        <div className="border-b border-brand-500/10 px-5 py-6">
          <RentelioLogo
            size="sm"
            showTagline
            spin
            colorClass="text-brand-700 dark:text-brand-300"
            taglineClass="!mt-1.5 !text-ink-500 dark:!text-ink-400 !tracking-normal"
          />
          <p className="mt-3 text-sm font-semibold text-ink-800 dark:text-ink-100">
            {vendor?.company || 'Seller Portal'}
          </p>
          <span className="mt-1 inline-flex rounded-md bg-brand-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand-800 dark:text-brand-300">
            Vendor Node
          </span>
        </div>
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              onClick={onClose}
              className={({ isActive }) =>
                `nav-link-living rounded-xl px-3 py-2.5 text-sm font-medium ${
                  isActive
                    ? 'is-active'
                    : 'text-ink-600 hover:bg-brand-500/10 dark:text-ink-300 dark:hover:bg-brand-500/10'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-brand-500/10 p-4 text-xs text-ink-400">
          Seller Central · Living UI
        </div>
      </aside>
    </>
  );
}
