import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import RentalSummary from '../../components/RentalSummary';
import { StatusBadge } from '../../components/Table';
import { formatDate, formatINR, userApi } from '../../services/api';
import { invalidateLifecycle, POLL_MS, qk } from '../../lib/query';

export default function RentalDetails() {
  const { id } = useParams();
  const queryClient = useQueryClient();

  const { data: rental, error, isLoading } = useQuery({
    queryKey: qk.userRental(id),
    queryFn: () => userApi.getRental(id),
    refetchInterval: POLL_MS,
  });

  const cancelMutation = useMutation({
    mutationFn: () => userApi.cancelRental(id),
    onSuccess: async () => invalidateLifecycle(queryClient),
  });

  if (isLoading) return <p className="text-ink-500">Loading rental…</p>;
  if (!rental) return <p className="text-rose-600">{error?.message || 'Not found'}</p>;

  const days = Math.max(
    1,
    Math.ceil(
      (new Date(rental.returnDate) - new Date(rental.startDate)) / (1000 * 60 * 60 * 24)
    )
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs text-ink-400">Rental #{rental.id}</p>
          <h1 className="font-display text-2xl font-semibold">{rental.productName}</h1>
          <div className="mt-2">
            <StatusBadge status={rental.status} />
          </div>
        </div>
        <Link to="/shop/rentals" className="text-sm text-brand-700 hover:underline">
          ← All orders
        </Link>
      </div>

      {(error || cancelMutation.error) && (
        <p className="text-sm text-rose-600">
          {error?.message || cancelMutation.error?.message}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-ink-200/80 bg-white p-5 dark:border-ink-700 dark:bg-ink-900">
          <h2 className="font-display font-semibold">Return tracking</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li className="flex justify-between">
              <span className="text-ink-500">Expected return</span>
              <span>{formatDate(rental.returnDate)}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-ink-500">Remaining days</span>
              <span>
                {rental.remainingDays >= 0
                  ? `${rental.remainingDays} day(s)`
                  : `${Math.abs(rental.remainingDays)} day(s) late`}
              </span>
            </li>
            <li className="flex justify-between">
              <span className="text-ink-500">Late charges</span>
              <span className={rental.lateCharge > 0 ? 'text-rose-600' : ''}>
                {formatINR(rental.lateCharge)}
              </span>
            </li>
            <li className="flex justify-between">
              <span className="text-ink-500">Return status</span>
              <StatusBadge status={rental.status} />
            </li>
          </ul>
        </div>

        <div className="rounded-2xl border border-ink-200/80 bg-white p-5 dark:border-ink-700 dark:bg-ink-900">
          <h2 className="font-display font-semibold">Payment & deposit</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li className="flex justify-between">
              <span className="text-ink-500">Rental amount</span>
              <span>{formatINR(rental.amount)}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-ink-500">Security deposit</span>
              <span>{formatINR(rental.depositAmount)}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-ink-500">Total paid</span>
              <span className="font-semibold">{formatINR(rental.totalPaid)}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-ink-500">Refund status</span>
              <span>{rental.depositStatus}</span>
            </li>
          </ul>
        </div>
      </div>

      <RentalSummary
        productName={rental.productName}
        startDate={rental.startDate}
        returnDate={rental.returnDate}
        days={days}
        rentalCost={Number(rental.amount)}
        securityDeposit={Number(rental.depositAmount)}
        totalAmount={Number(rental.amount) + Number(rental.depositAmount)}
      />

      {['Requested', 'Approved'].includes(rental.status) && (
        <button
          type="button"
          disabled={cancelMutation.isPending}
          onClick={() => cancelMutation.mutate()}
          className="rounded-xl border border-rose-200 px-4 py-2 text-sm text-rose-700 hover:bg-rose-50"
        >
          Cancel request
        </button>
      )}
    </div>
  );
}
