export default function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink-900 dark:text-white">{title}</h1>
        {subtitle && <p className="text-sm text-ink-600 dark:text-ink-400">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function FilterBar({ search, onSearch, filters = [], onExport, hideSearch = false }) {
  return (
    <div className="glass-panel flex flex-wrap items-center gap-2 rounded-2xl p-3">
      {!hideSearch && (
        <input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search…"
          className="input-living min-w-[180px] flex-1 rounded-xl px-3 py-2 text-sm"
        />
      )}
      {filters.map((f) => (
        <select
          key={f.key}
          value={f.value}
          onChange={(e) => f.onChange(e.target.value)}
          className="input-living rounded-xl px-3 py-2 text-sm"
        >
          {f.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ))}
      {onExport && (
        <button
          type="button"
          onClick={onExport}
          className="btn-living rounded-xl border border-brand-500/20 px-3 py-2 text-sm font-medium"
        >
          Export CSV
        </button>
      )}
    </div>
  );
}

export function ActionBtn({ children, tone = 'brand', onClick, disabled }) {
  const tones = {
    brand: 'bg-brand-600 text-white hover:bg-brand-700',
    sky: 'bg-sky-600 text-white hover:bg-sky-700',
    amber: 'bg-amber-600 text-white hover:bg-amber-700',
    rose: 'bg-rose-600 text-white hover:bg-rose-700',
    ink: 'bg-ink-700 text-white hover:bg-ink-800',
    ghost: 'border border-ink-200 text-ink-800 dark:border-ink-700 dark:text-ink-100 hover:bg-ink-50 dark:hover:bg-ink-800',
  };
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded px-2 py-1 text-xs font-medium disabled:opacity-50 ${tones[tone] || tones.brand}`}
    >
      {children}
    </button>
  );
}
