export default function SearchBar({ value, onChange, onSubmit, placeholder = 'Search rentals…' }) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.(value);
      }}
      className="relative w-full"
    >
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-ink-200 bg-white py-2.5 pl-4 pr-24 text-sm text-ink-900 outline-none ring-brand-500/20 focus:ring-2 dark:border-ink-700 dark:bg-ink-950 dark:text-white"
      />
      <button
        type="submit"
        className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-500"
      >
        Search
      </button>
    </form>
  );
}
