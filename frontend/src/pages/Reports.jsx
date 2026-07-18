import { useQuery } from '@tanstack/react-query';
import Card from '../components/Card';
import Table from '../components/Table';
import PageHeader, { ActionBtn } from '../components/PageHeader';
import { api, formatINR } from '../services/api';
import { downloadText, exportCsv } from '../lib/exportCsv';
import { qk } from '../lib/query';

export default function Reports() {
  const { data, error, isLoading } = useQuery({
    queryKey: qk.adminReports,
    queryFn: api.getReports,
  });

  const { data: control } = useQuery({
    queryKey: [...qk.adminControlCenter, 'reports'],
    queryFn: api.getControlCenter,
  });

  if (isLoading) return <p className="text-ink-500">Loading reports…</p>;
  if (error) return <p className="text-rose-600">{error.message}</p>;

  const { revenueByStatus, categoryRevenue, depositSummary, topProducts, monthlyTrend } = data;

  const totalRevenue = revenueByStatus.reduce((s, r) => s + Number(r.revenue || 0), 0);
  const totalLate = revenueByStatus.reduce((s, r) => s + Number(r.lateFees || 0), 0);
  const held = depositSummary.find((d) => d.status === 'Held');

  const exportAll = (fmt) => {
    if (fmt === 'csv') {
      exportCsv('revenue-by-status', revenueByStatus, [
        { key: 'status', label: 'Status' },
        { key: 'count', label: 'Count' },
        { key: 'revenue', label: 'Revenue' },
        { key: 'lateFees', label: 'Late Fees' },
      ]);
      exportCsv('category-performance', categoryRevenue || [], [
        { key: 'category', label: 'Category' },
        { key: 'rentals', label: 'Rentals' },
        { key: 'revenue', label: 'Revenue' },
      ]);
      return;
    }
    if (fmt === 'excel') {
      // CSV is Excel-openable for demo purposes
      exportCsv('rentelio-financial-report.xls', revenueByStatus, [
        { key: 'status', label: 'Status' },
        { key: 'count', label: 'Count' },
        { key: 'revenue', label: 'Revenue' },
        { key: 'lateFees', label: 'Late Fees' },
      ]);
      return;
    }
    const pdfLike = [
      'Rentelio Analytics Report',
      `Generated: ${new Date().toISOString()}`,
      '',
      `Total Revenue: ${totalRevenue}`,
      `Late Fees: ${totalLate}`,
      `Deposits Held: ${held?.amount || 0}`,
      '',
      'Revenue by Status:',
      ...revenueByStatus.map((r) => `- ${r.status}: ${r.count} / ${r.revenue}`),
      '',
      'Top Products:',
      ...(topProducts || []).map((p) => `- ${p.name}: ${p.rentals} / ${p.revenue}`),
    ].join('\n');
    downloadText('rentelio-report.txt', pdfLike, 'text/plain');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports & Analytics"
        subtitle="User · vendor · financial · rental intelligence"
        actions={
          <>
            <ActionBtn tone="ghost" onClick={() => exportAll('csv')}>
              Export CSV
            </ActionBtn>
            <ActionBtn tone="ghost" onClick={() => exportAll('excel')}>
              Export Excel
            </ActionBtn>
            <ActionBtn tone="ghost" onClick={() => exportAll('pdf')}>
              Export PDF
            </ActionBtn>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card title="Total Revenue" value={formatINR(totalRevenue)} accent="brand" />
        <Card title="Late Fees" value={formatINR(totalLate)} accent="rose" />
        <Card title="Deposits Held" value={formatINR(held?.amount || 0)} accent="amber" />
        <Card title="Active Categories" value={categoryRevenue?.length || 0} accent="sky" />
        <Card title="Registered Users" value={control?.cards?.totalUsers ?? '—'} accent="sky" />
        <Card title="Verified Vendors" value={control?.cards?.verifiedVendors ?? '—'} accent="violet" />
        <Card
          title="Platform Commission"
          value={formatINR(control?.cards?.platformCommission || 0)}
          accent="brand"
        />
        <Card title="Booking Conversion" value={`${control?.conversionRate ?? 0}%`} accent="amber" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <h2 className="font-display text-lg font-semibold">Financial — revenue by status</h2>
          <Table
            columns={[
              { key: 'status', label: 'Status' },
              { key: 'count', label: 'Count' },
              { key: 'revenue', label: 'Revenue', render: (r) => formatINR(r.revenue) },
              { key: 'lateFees', label: 'Late Fees', render: (r) => formatINR(r.lateFees) },
            ]}
            rows={revenueByStatus}
          />
        </div>

        <div className="space-y-3">
          <h2 className="font-display text-lg font-semibold">Rental — category performance</h2>
          <Table
            columns={[
              { key: 'category', label: 'Category' },
              { key: 'rentals', label: 'Rentals' },
              { key: 'revenue', label: 'Revenue', render: (r) => formatINR(r.revenue) },
            ]}
            rows={categoryRevenue || []}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <h2 className="font-display text-lg font-semibold">Most rented products</h2>
          <Table
            columns={[
              { key: 'name', label: 'Product' },
              { key: 'category', label: 'Category' },
              { key: 'rentals', label: 'Rentals' },
              { key: 'revenue', label: 'Revenue', render: (r) => formatINR(r.revenue) },
            ]}
            rows={topProducts || []}
          />
        </div>

        <div className="space-y-3">
          <h2 className="font-display text-lg font-semibold">Location analytics</h2>
          <Table
            columns={[
              { key: 'location', label: 'Location' },
              { key: 'count', label: 'Vendors' },
            ]}
            rows={control?.charts?.locations || []}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <h2 className="font-display text-lg font-semibold">Top vendors</h2>
          <Table
            columns={[
              { key: 'name', label: 'Vendor' },
              { key: 'rentals', label: 'Rentals' },
              { key: 'revenue', label: 'Revenue', render: (r) => formatINR(r.revenue) },
            ]}
            rows={control?.charts?.topVendors || []}
          />
        </div>
        <div className="space-y-3">
          <h2 className="font-display text-lg font-semibold">Monthly trend</h2>
          <div className="rounded-2xl border border-ink-200/80 bg-white p-5 dark:border-ink-700 dark:bg-ink-900">
            <ul className="space-y-3">
              {(monthlyTrend || []).map((m) => (
                <li key={m.month} className="flex items-center justify-between text-sm">
                  <span className="text-ink-600 dark:text-ink-300">{m.month}</span>
                  <span className="font-medium">
                    {m.rentals} rentals · {formatINR(m.revenue)}
                  </span>
                </li>
              ))}
              {!monthlyTrend?.length && (
                <li className="text-sm text-ink-500">No trend data yet</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
