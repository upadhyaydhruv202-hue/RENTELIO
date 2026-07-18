import { productImageSrc } from '../services/api';

/**
 * Full product image — never cropped.
 * Uses object-fit: contain, centered, aspect ratio preserved.
 */
export default function ProductMedia({
  src,
  alt = '',
  frameClassName = '',
  imgClassName = '',
}) {
  const resolved = productImageSrc(src);

  return (
    <div
      className={`flex items-center justify-center overflow-hidden bg-white dark:bg-ink-900 ${frameClassName}`}
    >
      {resolved ? (
        <img
          src={resolved}
          alt={alt}
          className={`max-h-full max-w-full object-contain object-center ${imgClassName}`}
          loading="lazy"
          decoding="async"
        />
      ) : (
        <span className="px-3 text-center text-xs text-ink-400">{alt || 'No image'}</span>
      )}
    </div>
  );
}
