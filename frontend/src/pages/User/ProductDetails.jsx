import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import RentalSummary from '../../components/RentalSummary';
import ProductMedia from '../../components/ProductMedia';
import AdBanner from '../../components/AdBanner';
import { formatINR, productDeposit, userApi } from '../../services/api';
import { qk } from '../../lib/query';

function pushRecent(product) {
  try {
    const key = 'rentelio_recent_products';
    const prev = JSON.parse(localStorage.getItem(key) || '[]').filter((p) => p.id !== product.id);
    localStorage.setItem(key, JSON.stringify([product, ...prev].slice(0, 8)));
  } catch {
    /* ignore */
  }
}

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    userApi
      .getProduct(id)
      .then((p) => {
        setProduct(p);
        pushRecent(p);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const days = useMemo(() => {
    if (!startDate || !returnDate) return 0;
    const start = new Date(startDate);
    const end = new Date(returnDate);
    return Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
  }, [startDate, returnDate]);

  const rentalCost = product ? days * Number(product.pricePerDay) : 0;
  const deposit = productDeposit(product);
  const available = product && product.status === 'Available' && Number(product.quantity) > 0;

  const goCheckout = () => {
    if (!startDate || !returnDate) {
      setError('Please select rental dates');
      return;
    }
    if (new Date(returnDate) < new Date(startDate)) {
      setError('Return date must be on or after start date');
      return;
    }
    navigate('/user/checkout', {
      state: { productId: product.id, startDate, returnDate },
    });
  };

  if (loading) return <p className="text-ink-500">Loading product…</p>;
  if (!product) return <p className="text-rose-600">{error || 'Product not found'}</p>;

  return (
    <div className="space-y-6">
      <DetailsAds />
      <div className="grid gap-8 lg:grid-cols-2">
      <div className="overflow-hidden rounded-3xl border border-ink-200/80 bg-white dark:border-ink-700 dark:bg-ink-900">
        <ProductMedia
          src={product.image || product.imageUrl}
          alt={product.name}
          frameClassName="aspect-[4/3] w-full p-6"
        />
      </div>

      <div className="space-y-5">
        <div>
          <p className="text-sm font-medium text-brand-700">{product.category}</p>
          <h1 className="mt-1 font-display text-3xl font-bold">{product.name}</h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-600 dark:text-ink-300">
            {product.description || 'Premium rental equipment ready for your next project.'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white p-4 dark:bg-ink-900">
            <p className="text-xs text-ink-400">Rental price</p>
            <p className="font-display text-2xl font-semibold text-brand-700">
              {formatINR(product.pricePerDay)}
              <span className="text-sm font-normal text-ink-400">/day</span>
            </p>
          </div>
          <div className="rounded-2xl bg-white p-4 dark:bg-ink-900">
            <p className="text-xs text-ink-400">Security deposit</p>
            <p className="font-display text-2xl font-semibold">{formatINR(deposit)}</p>
          </div>
        </div>

        <p className="text-sm">
          Availability:{' '}
          <span className={available ? 'font-semibold text-brand-700' : 'font-semibold text-rose-600'}>
            {available ? 'Available' : product.status}
          </span>
        </p>

        <div className="rounded-2xl border border-ink-200/80 bg-white p-4 dark:border-ink-700 dark:bg-ink-900">
          <h3 className="font-display font-semibold">Rental terms</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-500">
            <li>Late returns incur charges of 1× daily rate per late day.</li>
            <li>Security deposit is refunded after successful return inspection.</li>
            <li>Equipment must be returned in the condition received.</li>
          </ul>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-medium">
            Start date
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-ink-200 px-3 py-2 dark:border-ink-700 dark:bg-ink-950"
            />
          </label>
          <label className="text-sm font-medium">
            Return date
            <input
              type="date"
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-ink-200 px-3 py-2 dark:border-ink-700 dark:bg-ink-950"
            />
          </label>
        </div>

        {days > 0 && (
          <RentalSummary
            productName={product.name}
            startDate={startDate}
            returnDate={returnDate}
            days={days}
            rentalCost={rentalCost}
            securityDeposit={deposit}
            totalAmount={rentalCost + deposit}
          />
        )}

        {error && <p className="text-sm text-rose-600">{error}</p>}

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={!available}
            onClick={goCheckout}
            className="rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-500 disabled:opacity-50"
          >
            Rent Now
          </button>
          <Link
            to="/user/browse"
            className="rounded-xl border border-ink-200 px-6 py-2.5 text-sm dark:border-ink-700"
          >
            Back to browse
          </Link>
        </div>
      </div>
      </div>
    </div>
  );
}

function DetailsAds() {
  const { data: ads = [] } = useQuery({
    queryKey: qk.ads('details'),
    queryFn: () => userApi.getAds('details'),
  });
  return <AdBanner ads={ads} />;
}
