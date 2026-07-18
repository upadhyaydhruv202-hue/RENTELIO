export default function AdBanner({ ads = [] }) {
  if (!ads.length) return null;
  const ad = ads[0];
  return (
    <a
      href={ad.linkUrl || '/user/browse'}
      className="block overflow-hidden rounded-2xl bg-gradient-to-r from-ink-900 via-ink-800 to-brand-800 px-5 py-4 text-white shadow-sm transition hover:opacity-95"
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-brand-300">{ad.title}</p>
      <p className="mt-1 text-sm text-white/85">{ad.body}</p>
    </a>
  );
}
