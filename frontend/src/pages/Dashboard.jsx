import { useQuery } from '@tanstack/react-query';
import Card from '../components/Card';
import Table, { StatusBadge } from '../components/Table';
import { api } from '../services/api';
import { POLL_MS, qk } from '../lib/query';

const formatCurrency = (n) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n || 0);

const formatDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN') : '—');

export default function Dashboard() {
  const { data, error, isLoading } = useQuery({
    queryKey: qk.adminDashboard,
    queryFn: api.getDashboard,
    refetchInterval: POLL_MS,
  });

  if (isLoading) return <p className="text-ink-500">Loading dashboard…</p>;
  if (error) return <p className="text-rose-600">{error.message}</p>;

  const { stats, statusChart, recentRentals } = data;
  const chartItems = [
    { label: 'New Requests', value: statusChart.Requested || 0, color: 'bg-violet-500' },
    { label: 'Active', value: statusChart.Active || 0, color: 'bg-sky-500' },
    { label: 'Return Pending', value: statusChart['Return Pending'] || 0, color: 'bg-amber-500' },
    { label: 'Completed', value: statusChart.Completed || 0, color: 'bg-brand-500' },
  ];
  const total = chartItems.reduce((s, i) => s + i.value, 0) || 1;

  const columns = [
    { key: 'id', label: 'Rental ID', render: (r) => `#${r.id}` },
    { key: 'customerName', label: 'Customer Name' },
    { key: 'productName', label: 'Product Name' },
    { key: 'startDate', label: 'Rental Date', render: (r) => formatDate(r.startDate) },
    { key: 'returnDate', label: 'Return Date', render: (r) => formatDate(r.returnDate) },
    {
      key: 'depositAmount',
      label: 'Deposit',
      render: (r) => (r.depositAmount != null ? formatCurrency(r.depositAmount) : '—'),
    },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink-900 dark:text-white">Dashboard</h1>
        <p className="text-sm text-ink-500">Live overview — syncs with customer bookings</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Card title="Total Products" value={stats.totalProducts} accent="slate" />
        <Card title="Available Products" value={stats.availableProducts} accent="brand" />
        <Card title="Active Rentals" value={stats.activeRentals} accent="sky" />
        <Card title="Pending Returns" value={stats.pendingReturns} accent="amber" />
        <Card title="Return Pending" value={stats.overdueRentals} accent="rose" />
        <Card title="Total Revenue" value={formatCurrency(stats.totalRevenue)} accent="brand" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-3">
          <h2 className="font-display text-lg font-semibold">Recent Rentals</h2>
          <Table columns={columns} rows={recentRentals} />
        </div>

        <div className="space-y-3">
          <h2 className="font-display text-lg font-semibold">Rental Status</h2>
          <div className="rounded-2xl border border-ink-200/80 bg-white p-5 dark:border-ink-700 dark:bg-ink-900">
            <div className="flex h-3 overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
              {chartItems.map((item) => (
                <div
                  key={item.label}
                  className={`${item.color} transition-all duration-700`}
                  style={{ width: `${(item.value / total) * 100}%` }}
                  title={`${item.label}: ${item.value}`}
                />
              ))}
            </div>
            <ul className="mt-5 space-y-3">
              {chartItems.map((item) => (
                <li key={item.label} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-ink-600 dark:text-ink-300">
                    <span className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
                    {item.label}
                  </span>
                  <span className="font-semibold text-ink-900 dark:text-white">{item.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
