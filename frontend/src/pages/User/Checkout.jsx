import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import RentalSummary from '../../components/RentalSummary';
import ProductMedia from '../../components/ProductMedia';
import { formatINR, productDeposit, userApi } from '../../services/api';
import { invalidateLifecycle, qk } from '../../lib/query';

export default function Checkout() {  const { state } = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState('');
  const [done, setDone] = useState(null);
  const [fulfillment, setFulfillment] = useState('pickup');
  const [shippingAddress, setShippingAddress] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [coupon, setCoupon] = useState(null);
  const [couponMsg, setCouponMsg] = useState('');

  const productId = state?.productId;
  const startDate = state?.startDate;
  const returnDate = state?.returnDate;

  const { data: product } = useQuery({
    queryKey: qk.userProduct(productId),
    queryFn: () => userApi.getProduct(productId),
    enabled: Boolean(productId),
  });

  const bookMutation = useMutation({
    mutationFn: () =>
      userApi.createRental({
        productId,
        startDate,
        returnDate,
        fulfillment,
        shippingAddress: fulfillment === 'delivery' ? shippingAddress : '',
      }),
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
        <p className="text-ink-500">{'No rental selection found.'}</p>
        <Link to="/user/browse" className="mt-4 inline-block text-brand-700 hover:underline">
          {'Browse products'}
        </Link>
      </div>
    );
  }

  const rentalCost = product ? days * Number(product.pricePerDay) : 0;
  const deposit = productDeposit(product);
  let discount = 0;
  if (coupon) {
    discount =
      coupon.type === 'percent'
        ? Math.round((rentalCost * Number(coupon.value)) / 100)
        : Number(coupon.value);
  }
  const discountedRental = Math.max(0, rentalCost - discount);

  const applyCoupon = async () => {
    setCouponMsg('');
    try {
      const res = await userApi.validateCoupon(couponCode, rentalCost);
      if (res.valid) {
        setCoupon(res.coupon);
        setCouponMsg(`Applied: ${res.coupon.label || res.coupon.code}`);
      }
    } catch (err) {
      setCoupon(null);
      setCouponMsg(err.message);
    }
  };

  const steps = ['Select Product', 'Choose Duration', 'Review Summary', 'Confirm Booking'];

  if (done) {
    return (
      <div className="mx-auto max-w-lg space-y-4 rounded-3xl border border-brand-200 bg-white p-8 text-center dark:border-brand-800 dark:bg-ink-900">
        <p className="text-sm font-medium text-brand-700">{'Booking confirmed'}</p>
        <h1 className="font-display text-2xl font-bold">{"You're all set!"}</h1>
        <p className="text-sm text-ink-500">
          {`Rental #${done.rental.id} for ${done.summary.productName} is now in admin Rentals as a new request / active rental. The product is no longer listed as available.`}
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
            onClick={() => navigate(`/user/rentals/${done.rental.id}`)}
            className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm text-white"
          >
            {'View rental'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/user')}
            className="rounded-xl border border-ink-200 px-5 py-2.5 text-sm dark:border-ink-700"
          >
            {'Back home'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-ink-400">{'Checkout'}</p>
        <h1 className="font-display text-2xl font-semibold">{'Review & confirm'}</h1>
      </div>

      <ol className="flex flex-wrap gap-2 text-xs text-ink-500">
        {steps.map((step, i) => (
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
        <p className="text-ink-500">{'Loading…'}</p>
      ) : (
        <>
          <div className="flex gap-4 rounded-2xl border border-ink-200/80 bg-white p-4 dark:border-ink-700 dark:bg-ink-900">
            <ProductMedia
              src={product.image || product.imageUrl}
              alt={product.name}
              frameClassName="h-24 w-24 shrink-0 rounded-xl border border-ink-100 p-1.5 dark:border-ink-800"
            />
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
            rentalCost={discountedRental}
            securityDeposit={deposit}
            totalAmount={discountedRental + deposit}
          />

          <div className="rounded-2xl border border-ink-200/80 bg-white p-5 dark:border-ink-700 dark:bg-ink-900">
            <h3 className="font-display text-base font-semibold">{'Coupon'}</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              <input
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="e.g. WEEKEND15"
                className="flex-1 rounded-xl border border-ink-200 px-3 py-2 text-sm dark:border-ink-700 dark:bg-ink-950"
              />
              <button
                type="button"
                onClick={applyCoupon}
                className="rounded-xl bg-ink-900 px-4 py-2 text-sm text-white dark:bg-brand-600"
              >
                {'Apply'}
              </button>
            </div>
            {couponMsg && <p className="mt-2 text-xs text-ink-500">{couponMsg}</p>}
            {discount > 0 && (
              <p className="mt-2 text-sm text-brand-700">
                {`Discount −${formatINR(discount)}`}
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-ink-200/80 bg-white p-5 dark:border-ink-700 dark:bg-ink-900">
            <h3 className="font-display text-base font-semibold">{'Fulfillment'}</h3>
            <div className="mt-3 flex flex-wrap gap-3">
              {[
                { id: 'pickup', label: 'Collect from store' },
                { id: 'delivery', label: 'Home delivery' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setFulfillment(opt.id)}
                  className={`rounded-xl px-4 py-2 text-sm font-medium ${
                    fulfillment === opt.id
                      ? 'bg-brand-600 text-white'
                      : 'border border-ink-200 dark:border-ink-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {fulfillment === 'delivery' && (
              <label className="mt-4 block text-sm font-medium">
                {'Shipping address'}
                <textarea
                  required
                  rows={2}
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-ink-200 px-3 py-2 dark:border-ink-700 dark:bg-ink-950"
                  placeholder={'Enter delivery address'}
                />
              </label>
            )}
          </div>

          {error && <p className="text-sm text-rose-600">{error}</p>}

          <button
            type="button"
            disabled={
              bookMutation.isPending ||
              (fulfillment === 'delivery' && !shippingAddress.trim())
            }
            onClick={() => bookMutation.mutate()}
            className="w-full rounded-xl bg-brand-600 py-3 font-semibold text-white hover:bg-brand-500 disabled:opacity-60"
          >
            {bookMutation.isPending ? 'Confirming…' : 'Confirm Booking & Pay Deposit'}
          </button>
        </>
      )}
    </div>
  );
}
