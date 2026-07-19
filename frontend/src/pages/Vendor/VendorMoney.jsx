import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Card from '../../components/Card';
import Table, { StatusBadge } from '../../components/Table';
import { formatINR, formatDate } from '../../services/api';
import { vendorApi } from '../../services/vendorApi';
import { POLL_MS } from '../../lib/query';

export default function VendorMoney() {  const queryClient = useQueryClient();
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({ rentalId: '', type: 'rental', amount: '', details: '' });
  const [msg, setMsg] = useState('');

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['vendor', 'money'] });

  const { data: summary, isLoading: sumLoading } = useQuery({
    queryKey: ['vendor', 'money', 'summary'],
    queryFn: vendorApi.getMoneySummary,
    refetchInterval: POLL_MS,
  });

  const { data: deposits = [], isLoading, error } = useQuery({
    queryKey: ['vendor', 'money', 'deposits'],
    queryFn: vendorApi.getDeposits,
    refetchInterval: POLL_MS,
  });

  const { data: invoices = [], isLoading: invLoading } = useQuery({
    queryKey: ['vendor', 'money', 'invoices'],
    queryFn: vendorApi.getInvoices,
    refetchInterval: POLL_MS,
  });

  const requestRefund = useMutation({
    mutationFn: vendorApi.requestRefund,
    onSuccess: refresh,
  });

  const approveRefund = useMutation({
    mutationFn: vendorApi.approveRefund,
    onSuccess: refresh,
  });

  const createInvoice = useMutation({
    mutationFn: () =>
      vendorApi.createInvoice({
        rentalId: invoiceForm.rentalId ? Number(invoiceForm.rentalId) : undefined,
        type: invoiceForm.type,
        amount: Number(invoiceForm.amount),
        details: invoiceForm.details,
      }),
    onSuccess: () => {
      setShowInvoiceForm(false);
      setInvoiceForm({ rentalId: '', type: 'rental', amount: '', details: '' });
      setMsg('Invoice created');
      refresh();
    },
    onError: (e) => setMsg(e.message),
  });

  const depositColumns = [
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

  const invoiceColumns = [
    { key: 'invoiceNo', label: 'Invoice #' },
    { key: 'type', label: 'Type' },
    { key: 'amount', label: 'Amount', render: (r) => formatINR(r.amount) },
    { key: 'rentalId', label: 'Rental', render: (r) => (r.rentalId ? `#${r.rentalId}` : '—') },
    {
      key: 'createdAt',
      label: 'Created',
      render: (r) => formatDate(r.createdAt),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">{'Money & Deposits'}</h1>
        <p className="text-sm text-ink-500">Deposit wallet, refunds, and invoices</p>
      </div>

      {summary?.calcPreview && (
        <div className="rounded-xl border border-ink-200/80 bg-ink-50 px-4 py-3 text-sm text-ink-600 dark:border-ink-700 dark:bg-ink-950 dark:text-ink-300">
          <span className="font-medium">Deposit formula:</span> {summary.calcPreview.formula}
          {' · '}
          Example (₹1,000/day): {formatINR(summary.calcPreview.example)}
        </div>
      )}

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

      {msg && <p className="text-sm text-brand-700">{msg}</p>}
      {error && <p className="text-rose-600">{error.message}</p>}

      <div className="space-y-3">
        <h2 className="font-display text-lg font-semibold">Deposits</h2>
        {isLoading ? <p className="text-ink-500">Loading deposits…</p> : <Table columns={depositColumns} rows={deposits} />}
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold">Invoices</h2>
          <button
            type="button"
            onClick={() => setShowInvoiceForm((v) => !v)}
            className="rounded-xl bg-brand-600 px-4 py-2 text-sm text-white hover:bg-brand-500"
          >
            {showInvoiceForm ? 'Cancel' : 'Create Invoice'}
          </button>
        </div>

        {showInvoiceForm && (
          <form
            className="grid gap-3 rounded-2xl border border-ink-200/80 bg-white p-4 dark:border-ink-700 dark:bg-ink-900 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              createInvoice.mutate();
            }}
          >
            <label className="text-sm font-medium">
              Rental ID (optional)
              <input
                value={invoiceForm.rentalId}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, rentalId: e.target.value })}
                className="mt-1 w-full rounded-xl border border-ink-200 px-3 py-2 dark:border-ink-700 dark:bg-ink-950"
              />
            </label>
            <label className="text-sm font-medium">
              Type
              <select
                value={invoiceForm.type}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, type: e.target.value })}
                className="mt-1 w-full rounded-xl border border-ink-200 px-3 py-2 dark:border-ink-700 dark:bg-ink-950"
              >
                <option value="rental">Rental</option>
                <option value="deposit_refund">Deposit Refund</option>
                <option value="penalty">Penalty</option>
              </select>
            </label>
            <label className="text-sm font-medium">
              Amount
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={invoiceForm.amount}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, amount: e.target.value })}
                className="mt-1 w-full rounded-xl border border-ink-200 px-3 py-2 dark:border-ink-700 dark:bg-ink-950"
              />
            </label>
            <label className="text-sm font-medium sm:col-span-2">
              Details
              <input
                value={invoiceForm.details}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, details: e.target.value })}
                className="mt-1 w-full rounded-xl border border-ink-200 px-3 py-2 dark:border-ink-700 dark:bg-ink-950"
              />
            </label>
            <button
              type="submit"
              disabled={createInvoice.isPending}
              className="rounded-xl bg-brand-600 px-4 py-2 text-sm text-white sm:col-span-2"
            >
              {createInvoice.isPending ? 'Creating…' : 'Save Invoice'}
            </button>
          </form>
        )}

        {invLoading ? (
          <p className="text-ink-500">Loading invoices…</p>
        ) : (
          <Table columns={invoiceColumns} rows={invoices} emptyMessage="No invoices yet" />
        )}
      </div>
    </div>
  );
}
