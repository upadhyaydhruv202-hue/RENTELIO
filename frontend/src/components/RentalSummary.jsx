import { formatDate, formatINR } from '../services/api';

export default function RentalSummary({
  productName,
  startDate,
  returnDate,
  days,
  rentalCost,
  securityDeposit,
  totalAmount,
}) {
  const rows = [
    { label: 'Product', value: productName },
    { label: 'Start Date', value: formatDate(startDate) },
    { label: 'Return Date', value: formatDate(returnDate) },
    { label: 'Duration', value: `${days} day${days === 1 ? '' : 's'}` },
    { label: 'Rental Cost', value: formatINR(rentalCost) },
    { label: 'Security Deposit', value: formatINR(securityDeposit) },
  ];

  return (
    <div className="rounded-2xl border border-ink-200/80 bg-white p-5 dark:border-ink-700 dark:bg-ink-900">
      <h3 className="font-display text-lg font-semibold">Rental Summary</h3>
      <ul className="mt-4 space-y-3">
        {rows.map((row) => (
          <li key={row.label} className="flex items-center justify-between gap-4 text-sm">
            <span className="text-ink-500">{row.label}</span>
            <span className="font-medium text-ink-900 dark:text-ink-100">{row.value}</span>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex items-center justify-between border-t border-ink-100 pt-4 dark:border-ink-800">
        <span className="font-semibold">Total Amount</span>
        <span className="font-display text-xl font-bold text-brand-700 dark:text-brand-300">
          {formatINR(totalAmount)}
        </span>
      </div>
    </div>
  );
}
