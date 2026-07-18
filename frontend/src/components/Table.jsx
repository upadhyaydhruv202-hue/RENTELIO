export default function Table({ columns, rows, emptyMessage = 'No records found' }) {
  return (
    <div className="data-grid">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-ink-50/90 text-ink-500 dark:bg-ink-950/80 dark:text-ink-400">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className="whitespace-nowrap px-4 py-3 font-medium tracking-wide">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100/80 dark:divide-ink-800/80">
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-10 text-center text-ink-400 dark:text-ink-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row, idx) => (
                <tr key={row.id ?? idx}>
                  {columns.map((col) => (
                    <td key={col.key} className="whitespace-nowrap px-4 py-3 text-ink-700 dark:text-ink-200">
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function StatusBadge({ status }) {
  const styles = {
    Available: 'bg-brand-100 text-brand-800 dark:bg-brand-900/40 dark:text-brand-300',
    Rented: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300',
    Requested: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300',
    Approved: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300',
    Active: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300',
    'Return Pending': 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
    Completed: 'bg-brand-100 text-brand-800 dark:bg-brand-900/40 dark:text-brand-300',
    Cancelled: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300',
    Overdue: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
    Held: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
    Refunded: 'bg-brand-100 text-brand-800 dark:bg-brand-900/40 dark:text-brand-300',
    Forfeited: 'bg-ink-200 text-ink-700 dark:bg-ink-700 dark:text-ink-200',
    Pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
    Processing: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300',
    Failed: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300',
    'On Hold': 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
    Verified: 'bg-brand-100 text-brand-800 dark:bg-brand-900/40 dark:text-brand-300',
    'Pending Review': 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
    Suspicious: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
    'Fraud Detected': 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300',
    Blacklisted: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300',
    Suspended: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
    Banned: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300',
    Normal: 'bg-ink-100 text-ink-700 dark:bg-ink-800 dark:text-ink-200',
    Important: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
    Critical: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300',
  };

  const labels = {
    Requested: 'New Rental Request',
    Active: 'Active Rental',
    Overdue: 'Return Pending',
  };

  return (
    <span
      className={`inline-flex rounded-md px-2.5 py-1 text-xs font-medium shadow-[0_0_12px_rgba(45,212,191,0.08)] ${
        styles[status] || 'bg-ink-100 text-ink-700 dark:bg-ink-800 dark:text-ink-200'
      }`}
    >
      {labels[status] || status}
    </span>
  );
}
