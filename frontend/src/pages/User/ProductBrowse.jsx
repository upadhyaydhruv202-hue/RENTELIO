import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import ProductCard from '../../components/ProductCard';
import SearchBar from '../../components/SearchBar';
import AdBanner from '../../components/AdBanner';
import { userApi } from '../../services/api';
import { invalidateLifecycle, POLL_MS, qk } from '../../lib/query';
import { getCompareIds, toggleCompareId } from './Compare';

export default function ProductBrowse() {  const queryClient = useQueryClient();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get('search') || '');
  const [category, setCategory] = useState(params.get('category') || '');
  const [brand, setBrand] = useState(params.get('brand') || '');
  const [sort, setSort] = useState(params.get('sort') || '');
  const [minPrice, setMinPrice] = useState(params.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(params.get('maxPrice') || '');
  const [availableOnly, setAvailableOnly] = useState(true);
  const [compareIds, setCompareIds] = useState(getCompareIds);

  const filters = useMemo(
    () => ({
      search: params.get('search') || search,
      category: params.get('category') || category,
      brand: params.get('brand') || brand,
      sort: params.get('sort') || sort,
      minPrice,
      maxPrice,
      available: availableOnly ? undefined : 'false',
    }),
    [params, search, category, brand, sort, minPrice, maxPrice, availableOnly]
  );

  const { data, isLoading, error } = useQuery({
    queryKey: qk.userProducts(filters),
    queryFn: () => userApi.getProducts(filters),
    refetchInterval: POLL_MS,
  });

  const { data: ads = [] } = useQuery({
    queryKey: qk.ads('browse'),
    queryFn: () => userApi.getAds('browse'),
  });

  const wishlist = useMutation({
    mutationFn: userApi.addToWishlist,
    onSuccess: () => invalidateLifecycle(queryClient),
  });

  const cart = useMutation({
    mutationFn: (productId) => userApi.addToCart(productId),
    onSuccess: () => invalidateLifecycle(queryClient),
  });

  const products = data?.products || [];
  const categories = data?.categories || [];
  const brands = data?.brands || [];

  const applyFilters = () => {
    const next = new URLSearchParams();
    if (search) next.set('search', search);
    if (category) next.set('category', category);
    if (brand) next.set('brand', brand);
    if (sort) next.set('sort', sort);
    if (minPrice) next.set('minPrice', minPrice);
    if (maxPrice) next.set('maxPrice', maxPrice);
    setParams(next);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">{'Browse'}</h1>
        <p className="text-sm text-ink-500">{'Filter by category, brand, price & availability'}</p>
      </div>

      <AdBanner ads={ads} />

      <div className="grid gap-4 rounded-2xl border border-ink-200/80 bg-white p-4 dark:border-ink-700 dark:bg-ink-900 lg:grid-cols-[1fr_auto]">
        <SearchBar
          value={search}
          onChange={setSearch}
          onSubmit={applyFilters}
          placeholder={'Search cameras, drones, laptops…'}
        />
        <div className="flex flex-wrap gap-2">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-xl border border-ink-200 px-3 py-2 text-sm dark:border-ink-700 dark:bg-ink-950"
          >
            <option value="">{'All categories'}</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            className="rounded-xl border border-ink-200 px-3 py-2 text-sm dark:border-ink-700 dark:bg-ink-950"
          >
            <option value="">{'All brands'}</option>
            {brands.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="rounded-xl border border-ink-200 px-3 py-2 text-sm dark:border-ink-700 dark:bg-ink-950"
          >
            <option value="">{'Sort'}</option>
            <option value="price_asc">{'Price ↑'}</option>
            <option value="price_desc">{'Price ↓'}</option>
            <option value="name">{'Name'}</option>
          </select>
          <input
            type="number"
            placeholder={'Min ₹'}
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="w-24 rounded-xl border border-ink-200 px-3 py-2 text-sm dark:border-ink-700 dark:bg-ink-950"
          />
          <input
            type="number"
            placeholder={'Max ₹'}
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="w-24 rounded-xl border border-ink-200 px-3 py-2 text-sm dark:border-ink-700 dark:bg-ink-950"
          />
          <label className="flex items-center gap-2 rounded-xl border border-ink-200 px-3 py-2 text-sm dark:border-ink-700">
            <input
              type="checkbox"
              checked={availableOnly}
              onChange={(e) => setAvailableOnly(e.target.checked)}
            />
            {'In stock'}
          </label>
          <button
            type="button"
            onClick={applyFilters}
            className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500"
          >
            {'Apply'}
          </button>
        </div>
      </div>

      {error && <p className="text-rose-600">{error.message}</p>}
      {isLoading ? (
        <p className="text-ink-500">{'Loading products…'}</p>
      ) : products.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-ink-300 bg-white p-10 text-center text-ink-500">
          {'No products match your filters'}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((p) => (
            <div key={p.id} className="space-y-2">
              <ProductCard product={p} />
              <div className="flex flex-wrap gap-1 px-1">
                <button
                  type="button"
                  className="rounded-lg bg-ink-100 px-2 py-1 text-[11px] dark:bg-ink-800"
                  onClick={() => cart.mutate(p.id)}
                >
                  {'Add to cart'}
                </button>
                <button
                  type="button"
                  className="rounded-lg bg-ink-100 px-2 py-1 text-[11px] dark:bg-ink-800"
                  onClick={() => wishlist.mutate(p.id)}
                >
                  {'Wishlist'}
                </button>
                <button
                  type="button"
                  className={`rounded-lg px-2 py-1 text-[11px] ${
                    compareIds.includes(Number(p.id))
                      ? 'bg-brand-600 text-white'
                      : 'bg-ink-100 dark:bg-ink-800'
                  }`}
                  onClick={() => setCompareIds(toggleCompareId(p.id))}
                >
                  {'Compare'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
