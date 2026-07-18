import { Link } from 'react-router-dom';
import ProductMedia from './ProductMedia';
import { formatDate, formatINR } from '../services/api';

const statusStyles = {
  Requested: 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300',
  Approved: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300',
  Active: 'bg-brand-100 text-brand-800 dark:bg-brand-900/40 dark:text-brand-300',
  'Return Pending': 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  Completed: 'bg-ink-100 text-ink-700 dark:bg-ink-800 dark:text-ink-200',
  Cancelled: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300',
};

const statusLabels = {
  Requested: 'New Rental Request',
  Active: 'Active Rental',
};

export default function OrderCard({ rental }) {
  return (
    <Link
      to={`/user/rentals/${rental.id}`}
      className="flex gap-4 rounded-2xl border border-ink-200/80 bg-white p-4 transition hover:border-brand-300 hover:shadow-sm dark:border-ink-700 dark:bg-ink-900"
    >
      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-ink-100 bg-white dark:border-ink-800 dark:bg-ink-900">
        <ProductMedia
          src={rental.image || rental.imageUrl}
          alt={rental.productName || ''}
          frameClassName="h-full w-full p-1"
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-xs text-ink-400">Rental #{rental.id}</p>
            <h3 className="font-display font-semibold text-ink-900 dark:text-white">
              {rental.productName}
            </h3>
          </div>
          <span
            className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${
              statusStyles[rental.status] || statusStyles.Active
            }`}
          >
            {statusLabels[rental.status] || rental.status}
          </span>
        </div>
        <p className="mt-1 text-xs text-ink-500">
          {formatDate(rental.startDate)} → {formatDate(rental.returnDate)}
        </p>
        <p className="mt-1 text-sm font-semibold text-brand-700 dark:text-brand-300">
          {formatINR(rental.amount)}
        </p>
      </div>
    </Link>
  );
}
