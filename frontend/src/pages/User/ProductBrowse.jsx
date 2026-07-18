import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import ProductCard from '../../components/ProductCard';
import SearchBar from '../../components/SearchBar';
import { userApi } from '../../services/api';
import { POLL_MS, qk } from '../../lib/query';

export default function ProductBrowse() {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get('search') || '');
  const [category, setCategory] = useState(params.get('category') || '');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const filters = useMemo(
    () => ({
      search: params.get('search') || search,
      category: params.get('category') || category,
      minPrice,
      maxPrice,
    }),
    [params, search, category, minPrice, maxPrice]
  );

  const { data, isLoading, error } = useQuery({
    queryKey: qk.userProducts(filters),
    queryFn: () => userApi.getProducts(filters),
    refetchInterval: POLL_MS,
  });

  const products = data?.products || [];
  const categories = data?.categories || [];

  const applyFilters = () => {
    const next = new URLSearchParams();
    if (search) next.set('search', search);
    if (category) next.set('category', category);
    setParams(next);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Browse rentals</h1>
        <p className="text-sm text-ink-500">Only Available products — updates live with admin inventory</p>
      </div>

      <div className="grid gap-4 rounded-2xl border border-ink-200/80 bg-white p-4 dark:border-ink-700 dark:bg-ink-900 lg:grid-cols-[1fr_auto]">
        <SearchBar value={search} onChange={setSearch} onSubmit={applyFilters} />
        <div className="flex flex-wrap gap-2">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-xl border border-ink-200 px-3 py-2 text-sm dark:border-ink-700 dark:bg-ink-950"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Min ₹"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="w-24 rounded-xl border border-ink-200 px-3 py-2 text-sm dark:border-ink-700 dark:bg-ink-950"
          />
          <input
            type="number"
            placeholder="Max ₹"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="w-24 rounded-xl border border-ink-200 px-3 py-2 text-sm dark:border-ink-700 dark:bg-ink-950"
          />
          <button
            type="button"
            onClick={applyFilters}
            className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500"
          >
            Apply
          </button>
        </div>
      </div>

      {error && <p className="text-rose-600">{error.message}</p>}
      {isLoading ? (
        <p className="text-ink-500">Loading products…</p>
      ) : products.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-ink-300 bg-white p-10 text-center text-ink-500">
          No products match your filters
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
