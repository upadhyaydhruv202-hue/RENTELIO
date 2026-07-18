import { NavLink } from 'react-router-dom';
import RentelioLogo from './RentelioLogo';
import { useLocale } from '../context/LocaleContext';

const links = [
  { to: '/vendor/dashboard', key: 'vDashboard', end: true },
  { to: '/vendor/inventory', key: 'vInventory' },
  { to: '/vendor/pickup-return', key: 'vPickupReturn' },
  { to: '/vendor/money', key: 'vMoney' },
  { to: '/vendor/orders', key: 'vOrders' },
  { to: '/vendor/customers', key: 'vCustomers' },
  { to: '/vendor/discounts', key: 'vDiscounts' },
  { to: '/vendor/coupons', key: 'vCoupons' },
  { to: '/vendor/reports', key: 'vReports' },
  { to: '/vendor/notifications', key: 'vNotifications' },
  { to: '/vendor/profile', key: 'vProfile' },
];

export default function VendorSidebar({ open, onClose, vendor }) {
  const { t } = useLocale();

  return (
    <>
      {open && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-ink-950/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-label={t('menu')}
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
            {vendor?.company || t('sellerPortal')}
          </p>
          <span className="mt-1 inline-flex rounded-md bg-brand-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand-800 dark:text-brand-300">
            {t('vendorNode')}
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
              {t(link.key)}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-brand-500/10 p-4 text-xs text-ink-400">
          {t('sellerCentral')}
        </div>
      </aside>
    </>
  );
}
