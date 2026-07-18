import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Card from '../components/Card';
import Table, { StatusBadge } from '../components/Table';
import { api, formatINR, formatDate } from '../services/api';
import { invalidateLifecycle, POLL_MS, qk } from '../lib/query';

export default function MoneyWorkflow() {
  const queryClient = useQueryClient();

  const { data: summary, isLoading: sumLoading } = useQuery({
    queryKey: [...qk.adminMoney, 'summary'],
    queryFn: api.getWalletSummary,
    refetchInterval: POLL_MS,
  });

  const { data: deposits = [], isLoading, error } = useQuery({
    queryKey: [...qk.adminMoney, 'deposits'],
    queryFn: () => api.getDepositHistory(),
    refetchInterval: POLL_MS,
  });

  const requestRefund = useMutation({
    mutationFn: api.requestRefund,
    onSuccess: () => invalidateLifecycle(queryClient),
  });

  const approveRefund = useMutation({
    mutationFn: api.approveRefund,
    onSuccess: () => invalidateLifecycle(queryClient),
  });

  const columns = [
    { key: 'id', label: 'Deposit', render: (d) => `#${d.id}` },
    {
      key: 'rental',
      label: 'Customer',
      render: (d) => d.rental?.customer?.name || d.rental?.customerName || '—',
    },
    {
      key: 'product',
      label: 'Product',
      render: (d) => d.rental?.product?.name || '—',
    },
    { key: 'amount', label: 'Amount', render: (d) => formatINR(d.amount) },
    { key: 'status', label: 'Status', render: (d) => <StatusBadge status={d.status} /> },
    {
      key: 'events',
      label: 'History',
      render: (d) => (
        <ul className="max-w-xs text-xs text-ink-500">
          {(d.events || []).slice(0, 3).map((e) => (
            <li key={e.id}>
              {e.type}: {formatINR(e.amount)} · {formatDate(e.createdAt)}
            </li>
          ))}
        </ul>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (d) => (
        <div className="flex flex-wrap gap-1">
          {d.status === 'Held' && (
            <button
              type="button"
              className="rounded-lg bg-amber-600 px-2 py-1 text-xs text-white"
              onClick={() => requestRefund.mutate(d.id)}
            >
              Request refund
            </button>
          )}
          {d.status === 'Pending Refund' && (
            <button
              type="button"
              className="rounded-lg bg-brand-600 px-2 py-1 text-xs text-white"
              onClick={() => approveRefund.mutate(d.id)}
            >
              Approve refund
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Money Workflow</h1>
        <p className="text-sm text-ink-500">Deposit wallets, refunds, and ledger history</p>
      </div>

      {sumLoading ? (
        <p className="text-ink-500">Loading summary…</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card title="Held" value={formatINR(summary?.held?.sum)} accent="amber" />
          <Card title="Pending Refund" value={formatINR(summary?.pendingRefund?.sum)} accent="violet" />
          <Card title="Refunded" value={formatINR(summary?.refunded?.sum)} accent="brand" />
          <Card title="Forfeited" value={formatINR(summary?.forfeited?.sum)} accent="rose" />
        </div>
      )}

      {error && <p className="text-rose-600">{error.message}</p>}
      {isLoading ? <p className="text-ink-500">Loading deposits…</p> : <Table columns={columns} rows={deposits} />}
    </div>
  );
}
