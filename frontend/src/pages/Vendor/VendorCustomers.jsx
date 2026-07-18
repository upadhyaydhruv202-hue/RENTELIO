import { useQuery } from '@tanstack/react-query';
import Table from '../../components/Table';
import { formatINR, formatDate } from '../../services/api';
import { vendorApi } from '../../services/vendorApi';
import { POLL_MS } from '../../lib/query';
import { useLocale } from '../../context/LocaleContext';

export default function VendorCustomers() {
  const { t } = useLocale();
  const { data: customers = [], isLoading, error } = useQuery({
    queryKey: ['vendor', 'customers'],
    queryFn: vendorApi.getCustomers,
    refetchInterval: POLL_MS,
  });

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone', render: (c) => c.phone || '—' },
    { key: 'rentalCount', label: 'Rentals' },
    { key: 'spend', label: 'Total Spend', render: (c) => formatINR(c.spend) },
    {
      key: 'lastRentalAt',
      label: 'Last Rental',
      render: (c) => formatDate(c.lastRentalAt),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">{t('vCustomersTitle')}</h1>
        <p className="text-sm text-ink-500">Customers who rented your products</p>
      </div>

      {error && <p className="text-rose-600">{error.message}</p>}
      {isLoading ? (
        <p className="text-ink-500">Loading customers…</p>
      ) : (
        <Table columns={columns} rows={customers} emptyMessage="No customers yet" />
      )}
    </div>
  );
}
