import { Link } from 'react-router-dom';
import { formatINR } from '../services/api';

export default function ProductCard({ product }) {
  const img =
    product.imageUrl ||
    'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&q=80';

  return (
    <Link
      to={`/shop/products/${product.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-ink-200/80 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-ink-700 dark:bg-ink-900"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-ink-100 dark:bg-ink-800">
        <img
          src={img}
          alt={product.name}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <span className="absolute left-3 top-3 rounded-md bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-brand-700 backdrop-blur dark:bg-ink-950/80 dark:text-brand-300">
          {product.category}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-display text-base font-semibold text-ink-900 line-clamp-1 dark:text-white">
          {product.name}
        </h3>
        <p className="mt-1 line-clamp-2 text-xs text-ink-500">{product.description || 'Premium rental gear'}</p>
        <div className="mt-auto flex items-end justify-between pt-3">
          <div>
            <p className="text-xs text-ink-400">Per day</p>
            <p className="font-display text-lg font-semibold text-brand-700 dark:text-brand-300">
              {formatINR(product.pricePerDay)}
            </p>
          </div>
          <span className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white transition group-hover:bg-brand-500">
            Rent Now
          </span>
        </div>
      </div>
    </Link>
  );
}
