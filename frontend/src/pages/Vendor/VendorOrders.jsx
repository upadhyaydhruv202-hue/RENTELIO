import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Table, { StatusBadge } from '../../components/Table';
import { formatINR, formatDate } from '../../services/api';
import { vendorApi } from '../../services/vendorApi';
import { POLL_MS } from '../../lib/query';
import { useLocale } from '../../context/LocaleContext';

const STATUSES = ['Requested', 'Approved', 'Active', 'Return Pending', 'Overdue', 'Completed', 'Cancelled'];

export default function VendorOrders() {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const [msg, setMsg] = useState('');

  const { data: rentals = [], isLoading, error } = useQuery({
    queryKey: ['vendor', 'rentals'],
    queryFn: vendorApi.getRentals,
    refetchInterval: POLL_MS,
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }) => vendorApi.updateRentalStatus(id, status),
    onSuccess: () => {
      setMsg('Status updated');
      queryClient.invalidateQueries({ queryKey: ['vendor', 'rentals'] });
    },
    onError: (e) => setMsg(e.message),
  });

  const columns = [
    { key: 'id', label: 'Order', render: (r) => `#${r.id}` },
    { key: 'customerName', label: 'Customer' },
    { key: 'productName', label: 'Product' },
    { key: 'startDate', label: 'Start', render: (r) => formatDate(r.startDate) },
    { key: 'returnDate', label: 'Return', render: (r) => formatDate(r.returnDate) },
    { key: 'amount', label: 'Amount', render: (r) => formatINR(r.amount) },
    {
      key: 'depositAmount',
      label: 'Deposit',
      render: (r) => formatINR(r.depositAmount),
    },
    {
      key: 'status',
      label: 'Status',
      render: (r) => (
        <select
          value={r.status}
          onChange={(e) => updateStatus.mutate({ id: r.id, status: e.target.value })}
          className="rounded-lg border border-ink-200 bg-white px-2 py-1 text-xs dark:border-ink-700 dark:bg-ink-950"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      ),
    },
    {
      key: 'badge',
      label: 'Current',
      render: (r) => <StatusBadge status={r.status} />,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">{t('vOrdersTitle')}</h1>
        <p className="text-sm text-ink-500">Rental orders for your products</p>
      </div>

      {msg && <p className="text-sm text-brand-700">{msg}</p>}
      {error && <p className="text-rose-600">{error.message}</p>}
      {isLoading ? (
        <p className="text-ink-500">Loading orders…</p>
      ) : (
        <Table columns={columns} rows={rentals} emptyMessage="No orders yet" />
      )}
    </div>
  );
}
