import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import ProductCard from '../../components/ProductCard';
import OrderCard from '../../components/OrderCard';
import { userApi } from '../../services/api';
import { POLL_MS, qk } from '../../lib/query';

export default function UserDashboard({ customer }) {
  const { data, error, isLoading } = useQuery({
    queryKey: qk.userDashboard,
    queryFn: userApi.getDashboard,
    refetchInterval: POLL_MS,
  });

  let recent = [];
  try {
    recent = JSON.parse(localStorage.getItem('rentelio_recent_products') || '[]');
  } catch {
    recent = [];
  }

  if (isLoading) return <p className="text-ink-500">Loading your store…</p>;
  if (error) return <p className="text-rose-600">{error.message}</p>;

  const cards = [
    { label: 'Active Rentals', value: data.stats.activeRentals },
    { label: 'Upcoming Returns', value: data.stats.upcomingReturns },
    { label: 'Completed Rentals', value: data.stats.completedRentals },
    { label: 'Pending Requests', value: data.stats.pendingRequests },
  ];

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-[#0f1218] via-[#1a1f27] to-brand-800 px-6 py-10 text-white">
        <p className="text-sm text-white/60">Welcome back</p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">
          {customer?.name?.split(' ')[0]}, ready to rent?
        </h1>
        <p className="mt-2 max-w-xl text-sm text-white/70">
          Live inventory from Rentelio — book available gear and track it in My Rentals.
        </p>
        <Link
          to="/shop/browse"
          className="mt-5 inline-flex rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-400"
        >
          Browse all products
        </Link>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-2xl border border-ink-200/80 bg-white p-5 dark:border-ink-700 dark:bg-ink-900"
          >
            <p className="text-sm text-ink-500">{c.label}</p>
            <p className="mt-1 font-display text-3xl font-semibold">{c.value}</p>
          </div>
        ))}
      </section>

      {data.categories?.length > 0 && (
        <section>
          <h2 className="font-display text-xl font-semibold">Shop by category</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {data.categories.map((cat) => (
              <Link
                key={cat}
                to={`/shop/browse?category=${encodeURIComponent(cat)}`}
                className="rounded-full border border-ink-200 bg-white px-4 py-2 text-sm hover:border-brand-400 hover:text-brand-700 dark:border-ink-700 dark:bg-ink-900"
              >
                {cat}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold">Recommended for you</h2>
          <Link to="/shop/browse" className="text-sm text-brand-700 hover:underline">
            See all
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {data.recommended.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {recent.length > 0 && (
        <section>
          <h2 className="font-display text-xl font-semibold">Recently viewed</h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {recent.slice(0, 4).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold">Active rentals</h2>
          <Link to="/shop/rentals" className="text-sm text-brand-700 hover:underline">
            Your orders
          </Link>
        </div>
        {data.activeRentals.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-ink-300 bg-white p-8 text-center text-sm text-ink-500">
            No active rentals yet. Find something to rent!
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {data.activeRentals.map((r) => (
              <OrderCard key={r.id} rental={r} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
