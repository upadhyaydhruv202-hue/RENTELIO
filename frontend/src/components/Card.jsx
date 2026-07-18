export default function Card({ title, value, subtitle, accent = 'brand' }) {
  const accents = {
    brand: 'from-brand-500/15 to-transparent border-brand-500/20 text-brand-700 dark:text-brand-300',
    slate: 'from-ink-400/15 to-transparent border-ink-300/40 text-ink-700 dark:text-ink-200',
    amber: 'from-amber-500/15 to-transparent border-amber-500/20 text-amber-700 dark:text-amber-300',
    rose: 'from-rose-500/15 to-transparent border-rose-500/20 text-rose-700 dark:text-rose-300',
    sky: 'from-sky-500/15 to-transparent border-sky-500/20 text-sky-700 dark:text-sky-300',
  };

  return (
    <div
      className={`rounded-2xl border bg-gradient-to-br p-5 shadow-sm backdrop-blur-sm
        bg-white/80 dark:bg-ink-900/80 ${accents[accent] || accents.brand}`}
    >
      <p className="text-sm font-medium text-ink-500 dark:text-ink-400">{title}</p>
      <p className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink-900 dark:text-white">
        {value}
      </p>
      {subtitle && (
        <p className="mt-1 text-xs text-ink-400 dark:text-ink-500">{subtitle}</p>
      )}
    </div>
  );
}
