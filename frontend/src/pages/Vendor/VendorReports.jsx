import { useQuery } from '@tanstack/react-query';
import Card from '../../components/Card';
import Table from '../../components/Table';
import { formatINR } from '../../services/api';
import { vendorApi } from '../../services/vendorApi';
import { POLL_MS } from '../../lib/query';
import { useLocale } from '../../context/LocaleContext';

export default function VendorReports() {
  const { t } = useLocale();
  const { data, error, isLoading } = useQuery({
    queryKey: ['vendor', 'reports'],
    queryFn: vendorApi.getReports,
    refetchInterval: POLL_MS,
  });

  if (isLoading) return <p className="text-ink-500">Loading reports…</p>;
  if (error) return <p className="text-rose-600">{error.message}</p>;

  const { topProducts = [], topCustomers = [] } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">{t('vReportsTitle')}</h1>
        <p className="text-sm text-ink-500">Performance metrics for your storefront</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card title="Total Revenue" value={formatINR(data.revenue)} accent="brand" />
        <Card title="Profit (est.)" value={formatINR(data.profit)} accent="sky" />
        <Card title="Active Rentals" value={data.activeRentals} accent="violet" />
        <Card title="Completed Rentals" value={data.completedRentals} accent="brand" />
        <Card title="Late Returns" value={data.lateReturns} accent="amber" />
        <Card title="Penalty Collection" value={formatINR(data.penaltyCollection)} accent="rose" />
        <Card title="Under Maintenance" value={data.maintenanceCount} accent="rose" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <h2 className="font-display text-lg font-semibold">Top Products</h2>
          <Table
            columns={[
              { key: 'name', label: 'Product' },
              { key: 'rentals', label: 'Rentals' },
              { key: 'revenue', label: 'Revenue', render: (r) => formatINR(r.revenue) },
            ]}
            rows={topProducts}
            emptyMessage="No product data yet"
          />
        </div>

        <div className="space-y-3">
          <h2 className="font-display text-lg font-semibold">Top Customers</h2>
          <Table
            columns={[
              { key: 'name', label: 'Customer' },
              { key: 'rentals', label: 'Rentals' },
              { key: 'spend', label: 'Spend', render: (r) => formatINR(r.spend) },
            ]}
            rows={topCustomers}
            emptyMessage="No customer data yet"
          />
        </div>
      </div>
    </div>
  );
}
