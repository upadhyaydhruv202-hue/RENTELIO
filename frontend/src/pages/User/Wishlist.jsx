import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import ProductCard from '../../components/ProductCard';
import { userApi } from '../../services/api';
import { invalidateLifecycle, POLL_MS, qk } from '../../lib/query';

export default function Wishlist() {  const queryClient = useQueryClient();

  const { data: items = [], isLoading, error } = useQuery({
    queryKey: qk.userWishlist,
    queryFn: userApi.getWishlist,
    refetchInterval: POLL_MS,
  });

  const remove = useMutation({
    mutationFn: userApi.removeFromWishlist,
    onSuccess: () => invalidateLifecycle(queryClient),
  });

  const products = items.map((i) => i.product || i).filter(Boolean);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">{'Wishlist'}</h1>
        <p className="text-sm text-ink-500">{'Saved gear for later'}</p>
      </div>

      {error && <p className="text-rose-600">{error.message}</p>}
      {isLoading ? (
        <p className="text-ink-500">{'Loading…'}</p>
      ) : products.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-ink-300 bg-white p-10 text-center text-ink-500">
          {'Wishlist is empty.'}{' '}
          <Link to="/user/browse" className="text-brand-700 hover:underline">
            {'Browse'}
          </Link>
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((p) => (
            <div key={p.id} className="relative">
              <ProductCard product={p} />
              <button
                type="button"
                onClick={() => remove.mutate(p.id)}
                className="absolute right-3 top-3 rounded-md bg-white/90 px-2 py-1 text-[11px] font-medium text-rose-600 shadow"
              >
                {'Remove'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
