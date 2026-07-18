import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { formatINR, userApi } from '../../services/api';
import { POLL_MS, qk } from '../../lib/query';

export default function UserPayments() {
  const { data: rentals = [], isLoading, error } = useQuery({
    queryKey: qk.userRentals,
    queryFn: userApi.getRentals,
    refetchInterval: POLL_MS,
  });

  const totals = rentals.reduce(
    (acc, r) => {
      acc.rental += Number(r.amount) || 0;
      acc.deposit += Number(r.depositAmount) || 0;
      if (r.depositStatus === 'Refunded') acc.refunded += Number(r.depositAmount) || 0;
      if (r.depositStatus === 'Held') acc.held += Number(r.depositAmount) || 0;
      return acc;
    },
    { rental: 0, deposit: 0, refunded: 0, held: 0 }
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Payments & deposits</h1>
        <p className="text-sm text-ink-500">Updates when admin confirms returns / refunds</p>
      </div>

      {error && <p className="text-rose-600">{error.message}</p>}
      {isLoading ? (
        <p className="text-ink-500">Loading…</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Rental amount', value: totals.rental },
              { label: 'Security deposits', value: totals.deposit },
              { label: 'Total paid', value: totals.rental + totals.deposit },
              { label: 'Deposits held', value: totals.held },
            ].map((c) => (
              <div
                key={c.label}
                className="rounded-2xl border border-ink-200/80 bg-white p-5 dark:border-ink-700 dark:bg-ink-900"
              >
                <p className="text-sm text-ink-500">{c.label}</p>
                <p className="mt-1 font-display text-2xl font-semibold">{formatINR(c.value)}</p>
              </div>
            ))}
          </div>

          <div className="overflow-hidden rounded-2xl border border-ink-200/80 bg-white dark:border-ink-700 dark:bg-ink-900">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-ink-50 text-ink-500 dark:bg-ink-950">
                <tr>
                  <th className="px-4 py-3">Rental</th>
                  <th className="px-4 py-3">Rental amount</th>
                  <th className="px-4 py-3">Deposit</th>
                  <th className="px-4 py-3">Refund status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100 dark:divide-ink-800">
                {rentals.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-3">
                      <Link to={`/shop/rentals/${r.id}`} className="text-brand-700 hover:underline">
                        #{r.id} · {r.productName}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{formatINR(r.amount)}</td>
                    <td className="px-4 py-3">{formatINR(r.depositAmount)}</td>
                    <td className="px-4 py-3">{r.depositStatus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
