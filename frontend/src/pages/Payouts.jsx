import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import Table, { StatusBadge } from '../components/Table';
import PageHeader, { ActionBtn, FilterBar } from '../components/PageHeader';
import StatGrid from '../components/StatGrid';
import { api, formatINR, formatDate } from '../services/api';
import { exportCsv } from '../lib/exportCsv';
import { invalidateLifecycle, POLL_MS, qk } from '../lib/query';

export default function Payouts() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const params = useMemo(
    () => ({
      ...(search ? { search } : {}),
      ...(status ? { status } : {}),
    }),
    [search, status]
  );

  const { data: dash } = useQuery({
    queryKey: qk.adminSettlementDash,
    queryFn: api.getSettlementDashboard,
    refetchInterval: POLL_MS,
  });

  const { data: rows = [], isLoading, error } = useQuery({
    queryKey: [...qk.adminSettlements, params],
    queryFn: () => api.getSettlements(params),
    refetchInterval: POLL_MS,
  });

  const refresh = () => invalidateLifecycle(queryClient);

  const act = useMutation({
    mutationFn: ({ id, action }) => api.settlementAction(id, action),
    onSuccess: refresh,
  });

  const c = dash?.cards || {};

  const columns = [
    { key: 'settlementNo', label: 'Settlement ID' },
    {
      key: 'vendor',
      label: 'Vendor',
      render: (r) => r.vendor?.company || r.vendor?.name,
      export: (r) => r.vendor?.company || r.vendor?.name,
    },
    { key: 'vendorId', label: 'Vendor ID' },
    {
      key: 'rentalId',
      label: 'Rental Txn',
      render: (r) => r.rentalId || '—',
    },
    {
      key: 'rentalAmount',
      label: 'Rental Amount',
      render: (r) => formatINR(r.rentalAmount),
    },
    {
      key: 'commission',
      label: 'Commission',
      render: (r) => formatINR(r.commission),
    },
    {
      key: 'taxDeduction',
      label: 'Tax',
      render: (r) => formatINR(r.taxDeduction),
    },
    {
      key: 'vendorAmount',
      label: 'Vendor Amount',
      render: (r) => formatINR(r.vendorAmount),
    },
    {
      key: 'status',
      label: 'Status',
      render: (r) => <StatusBadge status={r.status} />,
    },
    {
      key: 'paidAt',
      label: 'Settlement Date',
      render: (r) => (r.paidAt ? formatDate(r.paidAt) : '—'),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (r) => (
        <div className="flex flex-wrap gap-1">
          {r.status === 'Pending' && (
            <ActionBtn tone="brand" onClick={() => act.mutate({ id: r.id, action: 'approve' })}>
              Approve
            </ActionBtn>
          )}
          {r.status !== 'On Hold' && r.status !== 'Completed' && (
            <ActionBtn tone="amber" onClick={() => act.mutate({ id: r.id, action: 'hold' })}>
              Hold
            </ActionBtn>
          )}
          {r.status === 'On Hold' && (
            <ActionBtn tone="sky" onClick={() => act.mutate({ id: r.id, action: 'release' })}>
              Release
            </ActionBtn>
          )}
          {['Pending', 'Processing', 'On Hold'].includes(r.status) && (
            <ActionBtn tone="brand" onClick={() => act.mutate({ id: r.id, action: 'complete' })}>
              Complete
            </ActionBtn>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payout Management"
        subtitle="Vendor settlements · commission · financial controls"
        actions={
          <ActionBtn
            tone="ghost"
            onClick={() =>
              exportCsv(
                'settlements-report',
                rows,
                columns.filter((col) => col.key !== 'actions')
              )
            }
          >
            Export report
          </ActionBtn>
        }
      />

      <StatGrid
        items={[
          { title: 'Total Vendor Earnings', value: formatINR(c.totalVendorEarnings), accent: 'brand' },
          { title: 'Pending Settlements', value: formatINR(c.pendingSettlements), accent: 'amber' },
          { title: 'Completed Payouts', value: formatINR(c.completedPayouts), accent: 'sky' },
          {
            title: 'Platform Commission',
            value: formatINR(c.platformCommission),
            subtitle: `${c.commissionPercent || 10}% default`,
            accent: 'violet',
          },
          { title: 'Failed Payments', value: c.failedPayments ?? 0, accent: 'rose' },
          { title: 'Refund Amount', value: formatINR(c.refundAmount), accent: 'slate' },
        ]}
        columns="sm:grid-cols-2 xl:grid-cols-3"
      />

      <div className="holo-card flex flex-wrap items-center justify-center gap-3 px-4 py-5 text-center text-sm">
        <span className="rounded-xl bg-brand-500/15 px-3 py-2 font-medium text-brand-800 dark:text-brand-300">
          Rental payment
        </span>
        <span className="text-brand-500 heartbeat">↓</span>
        <span className="rounded-xl bg-cyber-500/15 px-3 py-2 font-medium text-sky-800 dark:text-cyber-400">
          Platform commission
        </span>
        <span className="text-brand-500 heartbeat" style={{ animationDelay: '0.2s' }}>
          ↓
        </span>
        <span className="rounded-xl bg-amber-500/15 px-3 py-2 font-medium text-amber-800 dark:text-amber-300">
          Vendor settlement
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-ink-200/80 bg-white p-4 dark:border-ink-700 dark:bg-ink-900">
          <h2 className="mb-2 font-display text-base font-semibold">Vendor-wise earnings</h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dash?.vendorEarnings || []}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-ink-200 dark:stroke-ink-700" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="amount" fill="#8f79bc" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-2xl border border-ink-200/80 bg-white p-4 dark:border-ink-700 dark:bg-ink-900">
          <h2 className="mb-2 font-display text-base font-semibold">Category-wise commission</h2>
          <Table
            columns={[
              { key: 'category', label: 'Category' },
              { key: 'settlements', label: 'Settlements' },
              {
                key: 'commission',
                label: 'Commission',
                render: (r) => formatINR(r.commission),
              },
            ]}
            rows={dash?.categoryCommission || []}
          />
        </div>
      </div>

      <FilterBar
        search={search}
        onSearch={setSearch}
        filters={[
          {
            key: 'status',
            value: status,
            onChange: setStatus,
            options: [
              { value: '', label: 'All statuses' },
              { value: 'Pending', label: 'Pending' },
              { value: 'Processing', label: 'Processing' },
              { value: 'Completed', label: 'Completed' },
              { value: 'Failed', label: 'Failed' },
              { value: 'On Hold', label: 'On Hold' },
            ],
          },
        ]}
        onExport={() =>
          exportCsv(
            'settlements',
            rows,
            columns.filter((col) => col.key !== 'actions')
          )
        }
      />

      {error && <p className="text-rose-600">{error.message}</p>}
      {isLoading ? (
        <p className="text-ink-500">Loading settlements…</p>
      ) : (
        <Table columns={columns} rows={rows} />
      )}
    </div>
  );
}
