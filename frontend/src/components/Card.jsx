export default function Card({ title, value, subtitle, accent = 'brand' }) {
  const accents = {
    brand: 'from-brand-500/20 via-transparent to-cyber-500/10 border-brand-500/25 text-brand-700 dark:text-brand-300',
    slate: 'from-ink-400/15 to-transparent border-ink-300/40 text-ink-700 dark:text-ink-200',
    amber: 'from-amber-500/15 to-transparent border-amber-500/25 text-amber-700 dark:text-amber-300',
    rose: 'from-rose-500/15 to-transparent border-rose-500/25 text-rose-700 dark:text-rose-300',
    sky: 'from-sky-500/15 to-transparent border-sky-500/25 text-sky-700 dark:text-sky-300',
    violet: 'from-violet-500/15 to-transparent border-violet-500/25 text-violet-700 dark:text-violet-300',
  };

  return (
    <div className={`holo-card holo-border bg-gradient-to-br p-5 ${accents[accent] || accents.brand}`}>
      <p className="text-sm font-medium text-ink-500 dark:text-ink-400">{title}</p>
      <p className="stat-glow mt-2 font-display text-3xl font-semibold tracking-tight text-ink-900 dark:text-white">
        {value}
      </p>
      {subtitle && (
        <p className="mt-1 text-xs text-ink-400 dark:text-ink-500">{subtitle}</p>
      )}
    </div>
  );
}
