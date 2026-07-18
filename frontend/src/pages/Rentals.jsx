import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Table, { StatusBadge } from '../components/Table';
import { api } from '../services/api';
import { invalidateLifecycle, POLL_MS, qk } from '../lib/query';

const formatDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN') : '—');
const formatINR = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

export default function Rentals() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    customerName: '',
    productId: '',
    startDate: '',
    returnDate: '',
    depositAmount: '',
  });

  const rentalsQuery = useQuery({
    queryKey: qk.adminRentals,
    queryFn: api.getRentals,
    refetchInterval: POLL_MS,
  });

  const productsQuery = useQuery({
    queryKey: qk.adminProducts,
    queryFn: api.getProducts,
    refetchInterval: POLL_MS,
  });

  const createMutation = useMutation({
    mutationFn: api.createRental,
    onSuccess: async () => {
      setShowForm(false);
      setForm({ customerName: '', productId: '', startDate: '', returnDate: '', depositAmount: '' });
      setError('');
      await invalidateLifecycle(queryClient);
    },
    onError: (err) => setError(err.message),
  });

  const rentals = rentalsQuery.data || [];
  const products = productsQuery.data || [];

  const availableProducts = useMemo(
    () => products.filter((p) => p.status === 'Available' && Number(p.quantity) > 0),
    [products]
  );

  const selectedProduct = products.find((p) => String(p.id) === String(form.productId));

  const estimatedAmount = useMemo(() => {
    if (!selectedProduct || !form.startDate || !form.returnDate) return 0;
    const start = new Date(form.startDate);
    const end = new Date(form.returnDate);
    const days = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
    return days * Number(selectedProduct.pricePerDay);
  }, [selectedProduct, form.startDate, form.returnDate]);

  const columns = [
    { key: 'id', label: 'Rental ID', render: (r) => `#${r.id}` },
    { key: 'customerName', label: 'Customer Name' },
    { key: 'productName', label: 'Product' },
    { key: 'startDate', label: 'Start Date', render: (r) => formatDate(r.startDate) },
    { key: 'returnDate', label: 'Return Date', render: (r) => formatDate(r.returnDate) },
    { key: 'amount', label: 'Amount', render: (r) => formatINR(r.amount) },
    {
      key: 'depositAmount',
      label: 'Security Deposit',
      render: (r) => formatINR(r.depositAmount),
    },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate({
      customerName: form.customerName,
      productId: Number(form.productId),
      startDate: form.startDate,
      returnDate: form.returnDate,
      depositAmount: form.depositAmount ? Number(form.depositAmount) : undefined,
    });
  };

  const loading = rentalsQuery.isLoading || productsQuery.isLoading;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Rentals</h1>
          <p className="text-sm text-ink-500">
            Shared lifecycle — customer bookings appear here automatically
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500"
        >
          New Rental
        </button>
      </div>

      {(error || rentalsQuery.error) && (
        <p className="text-sm text-rose-600">{error || rentalsQuery.error?.message}</p>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="grid gap-4 rounded-2xl border border-ink-200/80 bg-white p-5 dark:border-ink-700 dark:bg-ink-900 sm:grid-cols-2"
        >
          <h2 className="sm:col-span-2 font-display text-lg font-semibold">Create Rental</h2>
          <label className="text-sm font-medium text-ink-600 dark:text-ink-300">
            Customer Name
            <input
              required
              value={form.customerName}
              onChange={(e) => setForm({ ...form, customerName: e.target.value })}
              className="mt-1.5 w-full rounded-xl border border-ink-200 px-3 py-2 dark:border-ink-700 dark:bg-ink-950"
            />
          </label>
          <label className="text-sm font-medium text-ink-600 dark:text-ink-300">
            Product
            <select
              required
              value={form.productId}
              onChange={(e) => setForm({ ...form, productId: e.target.value })}
              className="mt-1.5 w-full rounded-xl border border-ink-200 px-3 py-2 dark:border-ink-700 dark:bg-ink-950"
            >
              <option value="">Select product</option>
              {availableProducts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — ₹{Number(p.pricePerDay).toLocaleString('en-IN')}/day
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium text-ink-600 dark:text-ink-300">
            Start Date
            <input
              type="date"
              required
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              className="mt-1.5 w-full rounded-xl border border-ink-200 px-3 py-2 dark:border-ink-700 dark:bg-ink-950"
            />
          </label>
          <label className="text-sm font-medium text-ink-600 dark:text-ink-300">
            Return Date
            <input
              type="date"
              required
              value={form.returnDate}
              onChange={(e) => setForm({ ...form, returnDate: e.target.value })}
              className="mt-1.5 w-full rounded-xl border border-ink-200 px-3 py-2 dark:border-ink-700 dark:bg-ink-950"
            />
          </label>
          <label className="text-sm font-medium text-ink-600 dark:text-ink-300">
            Deposit Amount (optional)
            <input
              type="number"
              min="0"
              value={form.depositAmount}
              onChange={(e) => setForm({ ...form, depositAmount: e.target.value })}
              className="mt-1.5 w-full rounded-xl border border-ink-200 px-3 py-2 dark:border-ink-700 dark:bg-ink-950"
            />
          </label>
          <div className="flex items-end">
            <div className="w-full rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 dark:border-brand-800 dark:bg-brand-950/30">
              <p className="text-xs text-ink-500">Estimated Total</p>
              <p className="font-display text-xl font-semibold text-brand-700 dark:text-brand-300">
                ₹{estimatedAmount.toLocaleString('en-IN')}
              </p>
            </div>
          </div>
          <div className="flex gap-2 sm:col-span-2">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="rounded-xl bg-brand-600 px-4 py-2 text-sm text-white hover:bg-brand-500"
            >
              {createMutation.isPending ? 'Saving…' : 'Create Rental'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-xl border border-ink-200 px-4 py-2 text-sm dark:border-ink-700"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-ink-500">Loading rentals…</p>
      ) : (
        <Table columns={columns} rows={rentals} />
      )}
    </div>
  );
}
