import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Table, { StatusBadge } from '../components/Table';
import { api } from '../services/api';
import { invalidateLifecycle, POLL_MS, qk } from '../lib/query';

const formatDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN') : '—');

export default function Returns() {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const { data: returns = [], isLoading, error: loadError } = useQuery({
    queryKey: qk.adminReturns,
    queryFn: api.getPendingReturns,
    refetchInterval: POLL_MS,
  });

  const returnMutation = useMutation({
    mutationFn: ({ id }) => api.updateRental(id, { markReturned: true }),
    onSuccess: async (result, variables) => {
      const late = Number(result.lateCharge || 0);
      setMessage(
        late > 0
          ? `Rental #${variables.id} completed. Late charge: ₹${late.toLocaleString('en-IN')}. Product is Available again.`
          : `Rental #${variables.id} completed. Product restored to Available. Deposit refunded.`
      );
      setError('');
      await invalidateLifecycle(queryClient);
    },
    onError: (err) => setError(err.message),
  });

  const columns = [
    { key: 'id', label: 'Rental ID', render: (r) => `#${r.id}` },
    { key: 'customerName', label: 'Customer' },
    { key: 'productName', label: 'Product' },
    { key: 'returnDate', label: 'Expected Return Date', render: (r) => formatDate(r.returnDate) },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    {
      key: 'actions',
      label: 'Actions',
      render: (r) =>
        r.status !== 'Completed' ? (
          <button
            type="button"
            disabled={returnMutation.isPending}
            onClick={() => returnMutation.mutate({ id: r.id })}
            className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-500"
          >
            Confirm Return
          </button>
        ) : (
          '—'
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Return Tracking</h1>
        <p className="text-sm text-ink-500">
          Confirm return → product Available on shop · rental Completed · deposit Refunded
        </p>
      </div>

      {message && (
        <div className="rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-800 dark:border-brand-800 dark:bg-brand-950/30 dark:text-brand-300">
          {message}
        </div>
      )}
      {(error || loadError) && (
        <p className="text-sm text-rose-600">{error || loadError?.message}</p>
      )}

      {isLoading ? (
        <p className="text-ink-500">Loading returns…</p>
      ) : (
        <Table columns={columns} rows={returns} emptyMessage="No pending returns" />
      )}
    </div>
  );
}
