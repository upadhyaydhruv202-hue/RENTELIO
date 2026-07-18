import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Table, { StatusBadge } from '../components/Table';
import { api } from '../services/api';
import { invalidateLifecycle, POLL_MS, qk } from '../lib/query';

export default function Deposits() {
  const queryClient = useQueryClient();

  const { data: deposits = [], isLoading, error } = useQuery({
    queryKey: qk.adminDeposits,
    queryFn: api.getDeposits,
    refetchInterval: POLL_MS,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }) => api.updateDeposit(id, status),
    onSuccess: async () => invalidateLifecycle(queryClient),
  });

  const columns = [
    { key: 'customerName', label: 'Customer' },
    { key: 'rentalId', label: 'Rental ID', render: (r) => `#${r.rentalId}` },
    {
      key: 'amount',
      label: 'Deposit Amount',
      render: (r) => `₹${Number(r.amount).toLocaleString('en-IN')}`,
    },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    {
      key: 'actions',
      label: 'Actions',
      render: (r) =>
        r.status === 'Held' ? (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => updateMutation.mutate({ id: r.id, status: 'Refunded' })}
              className="rounded-lg bg-brand-600 px-2.5 py-1 text-xs text-white hover:bg-brand-500"
            >
              Refund
            </button>
            <button
              type="button"
              onClick={() => updateMutation.mutate({ id: r.id, status: 'Forfeited' })}
              className="rounded-lg border border-ink-200 px-2.5 py-1 text-xs dark:border-ink-700"
            >
              Forfeit
            </button>
          </div>
        ) : (
          <span className="text-xs text-ink-400">—</span>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Security Deposits</h1>
        <p className="text-sm text-ink-500">Synced with customer bookings and returns</p>
      </div>

      {error && <p className="text-sm text-rose-600">{error.message}</p>}

      {isLoading ? (
        <p className="text-ink-500">Loading deposits…</p>
      ) : (
        <Table columns={columns} rows={deposits} emptyMessage="No deposits found" />
      )}
    </div>
  );
}
