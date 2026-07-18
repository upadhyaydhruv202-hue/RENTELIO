import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import RentalSummary from '../../components/RentalSummary';
import { userApi } from '../../services/api';
import { invalidateLifecycle, qk } from '../../lib/query';

export default function Checkout() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState('');
  const [done, setDone] = useState(null);

  const productId = state?.productId;
  const startDate = state?.startDate;
  const returnDate = state?.returnDate;

  const { data: product } = useQuery({
    queryKey: qk.userProduct(productId),
    queryFn: () => userApi.getProduct(productId),
    enabled: Boolean(productId),
  });

  const bookMutation = useMutation({
    mutationFn: () => userApi.createRental({ productId, startDate, returnDate }),
    onSuccess: async (result) => {
      setDone(result);
      await invalidateLifecycle(queryClient);
    },
    onError: (err) => setError(err.message),
  });

  const days = useMemo(() => {
    if (!startDate || !returnDate) return 0;
    return Math.max(
      1,
      Math.ceil((new Date(returnDate) - new Date(startDate)) / (1000 * 60 * 60 * 24))
    );
  }, [startDate, returnDate]);

  useEffect(() => {
    setError('');
  }, [productId]);

  if (!productId || !startDate || !returnDate) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center">
        <p className="text-ink-500">No rental selection found.</p>
        <Link to="/shop/browse" className="mt-4 inline-block text-brand-700 hover:underline">
          Browse products
        </Link>
      </div>
    );
  }

  const rentalCost = product ? days * Number(product.pricePerDay) : 0;
  const deposit = product
    ? Number(product.securityDeposit) || Number(product.pricePerDay) * 2
    : 0;

  if (done) {
    return (
      <div className="mx-auto max-w-lg space-y-4 rounded-3xl border border-brand-200 bg-white p-8 text-center dark:border-brand-800 dark:bg-ink-900">
        <p className="text-sm font-medium text-brand-700">Booking confirmed</p>
        <h1 className="font-display text-2xl font-bold">You&apos;re all set!</h1>
        <p className="text-sm text-ink-500">
          Rental #{done.rental.id} for {done.summary.productName} is now in admin Rentals as a new
          request / active rental. The product is no longer listed as available.
        </p>
        <RentalSummary
          productName={done.summary.productName}
          startDate={done.summary.startDate}
          returnDate={done.summary.returnDate}
          days={done.summary.days}
          rentalCost={done.summary.rentalCost}
          securityDeposit={done.summary.securityDeposit}
          totalAmount={done.summary.totalAmount}
        />
        <div className="flex justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate(`/shop/rentals/${done.rental.id}`)}
            className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm text-white"
          >
            View rental
          </button>
          <button
            type="button"
            onClick={() => navigate('/shop')}
            className="rounded-xl border border-ink-200 px-5 py-2.5 text-sm dark:border-ink-700"
          >
            Back home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-ink-400">Checkout</p>
        <h1 className="font-display text-2xl font-semibold">Review & confirm</h1>
      </div>

      <ol className="flex flex-wrap gap-2 text-xs text-ink-500">
        {['Select Product', 'Choose Duration', 'Review Summary', 'Confirm Booking'].map((step, i) => (
          <li
            key={step}
            className={`rounded-full px-3 py-1 ${
              i === 2 || i === 3 ? 'bg-brand-600 text-white' : 'bg-ink-200 dark:bg-ink-800'
            }`}
          >
            {step}
          </li>
        ))}
      </ol>

      {!product ? (
        <p className="text-ink-500">Loading…</p>
      ) : (
        <>
          <div className="flex gap-4 rounded-2xl border border-ink-200/80 bg-white p-4 dark:border-ink-700 dark:bg-ink-900">
            <img src={product.imageUrl} alt="" className="h-24 w-24 rounded-xl object-cover" />
            <div>
              <h2 className="font-display text-lg font-semibold">{product.name}</h2>
              <p className="text-sm text-ink-500">{product.category}</p>
            </div>
          </div>

          <RentalSummary
            productName={product.name}
            startDate={startDate}
            returnDate={returnDate}
            days={days}
            rentalCost={rentalCost}
            securityDeposit={deposit}
            totalAmount={rentalCost + deposit}
          />

          {error && <p className="text-sm text-rose-600">{error}</p>}

          <button
            type="button"
            disabled={bookMutation.isPending}
            onClick={() => bookMutation.mutate()}
            className="w-full rounded-xl bg-brand-600 py-3 font-semibold text-white hover:bg-brand-500 disabled:opacity-60"
          >
            {bookMutation.isPending ? 'Confirming…' : 'Confirm Booking'}
          </button>
        </>
      )}
    </div>
  );
}
