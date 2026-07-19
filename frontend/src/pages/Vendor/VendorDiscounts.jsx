import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Table, { StatusBadge } from '../../components/Table';
import { formatINR } from '../../services/api';
import { vendorApi } from '../../services/vendorApi';
import { POLL_MS } from '../../lib/query';

const DISCOUNT_TYPES = [
  'Student Discount',
  'Employee Discount',
  'Corporate Discount',
  'Festival Offers',
  'Weekend Offers',
  'Flash Sale',
  'Membership Discount',
];

const emptyForm = {
  name: '',
  discountType: DISCOUNT_TYPES[0],
  type: 'percent',
  value: '',
  description: '',
  active: true,
};

export default function VendorDiscounts() {  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');

  const { data: discounts = [], isLoading, error: loadError } = useQuery({
    queryKey: ['vendor', 'discounts'],
    queryFn: vendorApi.getDiscounts,
    refetchInterval: POLL_MS,
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['vendor', 'discounts'] });

  const createMutation = useMutation({
    mutationFn: () =>
      vendorApi.createDiscount({
        ...form,
        value: Number(form.value),
      }),
    onSuccess: () => {
      setShowForm(false);
      setForm(emptyForm);
      setError('');
      refresh();
    },
    onError: (err) => setError(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: vendorApi.deleteDiscount,
    onSuccess: refresh,
    onError: (err) => setError(err.message),
  });

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'discountType', label: 'Type' },
    {
      key: 'value',
      label: 'Value',
      render: (d) => (d.type === 'percent' ? `${d.value}%` : formatINR(d.value)),
    },
    { key: 'description', label: 'Description', render: (d) => d.description || '—' },
    {
      key: 'active',
      label: 'Status',
      render: (d) => <StatusBadge status={d.active ? 'Available' : 'Cancelled'} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (d) => (
        <button
          type="button"
          onClick={() => {
            if (window.confirm('Delete this discount?')) deleteMutation.mutate(d.id);
          }}
          className="rounded-lg border border-rose-200 px-2.5 py-1 text-xs text-rose-700 dark:border-rose-800"
        >
          Delete
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">{'Discounts'}</h1>
          <p className="text-sm text-ink-500">Promotional discount offers for your storefront</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="rounded-xl bg-brand-600 px-4 py-2 text-sm text-white hover:bg-brand-500"
        >
          Add Discount
        </button>
      </div>

      {(error || loadError) && <p className="text-sm text-rose-600">{error || loadError?.message}</p>}

      {showForm && (
        <form
          className="grid gap-4 rounded-2xl border border-ink-200/80 bg-white p-5 dark:border-ink-700 dark:bg-ink-900 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate();
          }}
        >
          <h2 className="sm:col-span-2 font-display text-lg font-semibold">New Discount</h2>
          <label className="text-sm font-medium">
            Name
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="mt-1.5 w-full rounded-xl border border-ink-200 px-3 py-2 dark:border-ink-700 dark:bg-ink-950"
            />
          </label>
          <label className="text-sm font-medium">
            Discount Type
            <select
              value={form.discountType}
              onChange={(e) => setForm({ ...form, discountType: e.target.value })}
              className="mt-1.5 w-full rounded-xl border border-ink-200 px-3 py-2 dark:border-ink-700 dark:bg-ink-950"
            >
              {DISCOUNT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium">
            Value Type
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="mt-1.5 w-full rounded-xl border border-ink-200 px-3 py-2 dark:border-ink-700 dark:bg-ink-950"
            >
              <option value="percent">Percent</option>
              <option value="flat">Flat amount</option>
            </select>
          </label>
          <label className="text-sm font-medium">
            Value
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={form.value}
              onChange={(e) => setForm({ ...form, value: e.target.value })}
              className="mt-1.5 w-full rounded-xl border border-ink-200 px-3 py-2 dark:border-ink-700 dark:bg-ink-950"
            />
          </label>
          <label className="sm:col-span-2 text-sm font-medium">
            Description
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="mt-1.5 w-full rounded-xl border border-ink-200 px-3 py-2 dark:border-ink-700 dark:bg-ink-950"
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
            />
            Active
          </label>
          <div className="flex gap-2 sm:col-span-2">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="rounded-xl bg-brand-600 px-4 py-2 text-sm text-white"
            >
              {createMutation.isPending ? 'Saving…' : 'Create'}
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

      {isLoading ? <p className="text-ink-500">Loading discounts…</p> : <Table columns={columns} rows={discounts} />}
    </div>
  );
}
