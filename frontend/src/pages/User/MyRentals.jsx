import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import OrderCard from '../../components/OrderCard';
import { StatusBadge } from '../../components/Table';
import { formatDate, formatINR, userApi } from '../../services/api';
import { POLL_MS, qk } from '../../lib/query';

export default function MyRentals() {  const [tab, setTab] = useState('all');

  const tabs = [
    { key: 'all', label: 'All' },
    { key: 'Active', label: 'Current' },
    { key: 'Requested', label: 'Pending' },
    { key: 'Completed', label: 'Past' },
  ];

  const { data: rentals = [], isLoading, error } = useQuery({
    queryKey: qk.userRentals,
    queryFn: userApi.getRentals,
    refetchInterval: POLL_MS,
  });

  const filtered = useMemo(() => {
    if (tab === 'all') return rentals;
    if (tab === 'Active') {
      return rentals.filter((r) => r.status === 'Active' || r.status === 'Return Pending');
    }
    return rentals.filter((r) => r.status === tab);
  }, [rentals, tab]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">{'Your Orders'}</h1>
        <p className="text-sm text-ink-500">{'Synced with admin rental management'}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            className={`rounded-full px-4 py-1.5 text-sm ${
              tab === item.key
                ? 'bg-brand-600 text-white'
                : 'bg-white text-ink-600 dark:bg-ink-900 dark:text-ink-300'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {error && <p className="text-rose-600">{error.message}</p>}
      {isLoading ? (
        <p className="text-ink-500">{'Loading orders…'}</p>
      ) : filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-ink-300 bg-white p-10 text-center text-ink-500">
          {'No rentals in this category'}
        </p>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-2xl border border-ink-200/80 bg-white md:block dark:border-ink-700 dark:bg-ink-900">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-ink-50 text-ink-500 dark:bg-ink-950">
                <tr>
                  <th className="px-4 py-3 font-medium">{'Rental ID'}</th>
                  <th className="px-4 py-3 font-medium">{'Product'}</th>
                  <th className="px-4 py-3 font-medium">{'Rental Date'}</th>
                  <th className="px-4 py-3 font-medium">{'Return Date'}</th>
                  <th className="px-4 py-3 font-medium">{'Amount'}</th>
                  <th className="px-4 py-3 font-medium">{'Status'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100 dark:divide-ink-800">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-ink-50/80 dark:hover:bg-ink-800/40">
                    <td className="px-4 py-3">
                      <Link to={`/user/rentals/${r.id}`} className="text-brand-700 hover:underline">
                        #{r.id}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{r.productName}</td>
                    <td className="px-4 py-3">{formatDate(r.startDate)}</td>
                    <td className="px-4 py-3">{formatDate(r.returnDate)}</td>
                    <td className="px-4 py-3">{formatINR(r.amount)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={r.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid gap-3 md:hidden">
            {filtered.map((r) => (
              <OrderCard key={r.id} rental={r} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
