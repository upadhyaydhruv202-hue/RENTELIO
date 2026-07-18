import { Link } from 'react-router-dom';
import ProductMedia from './ProductMedia';
import { formatINR, productDeposit } from '../services/api';

export default function ProductCard({ product }) {
  return (
    <Link
      to={`/user/products/${product.id}`}
      className="holo-card group flex flex-col overflow-hidden"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-white/40 dark:bg-ink-950/40">
        <ProductMedia
          src={product.image || product.imageUrl}
          alt={product.name}
          frameClassName="h-full w-full p-3"
          imgClassName="transition duration-500 group-hover:scale-[1.03]"
        />
        <span className="absolute left-3 top-3 rounded-md bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-brand-700 backdrop-blur dark:bg-ink-950/80 dark:text-brand-300">
          {product.category}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-display text-base font-semibold text-ink-900 line-clamp-1 dark:text-white">
          {product.name}
        </h3>
        <p className="mt-1 line-clamp-2 text-xs text-ink-500">
          {product.description || 'Premium rental gear'}
        </p>
        <div className="mt-auto flex items-end justify-between gap-3 pt-3">
          <div>
            <p className="text-xs text-ink-400">Per day</p>
            <p className="stat-glow font-display text-lg font-semibold text-brand-700 dark:text-brand-300">
              {formatINR(product.pricePerDay)}
            </p>
            <p className="mt-1 text-[11px] text-ink-400">
              Deposit {formatINR(productDeposit(product))}
            </p>
          </div>
          <span className="btn-living rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white">
            Rent Now
          </span>
        </div>
      </div>
    </Link>
  );
}
