import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Table, { StatusBadge } from '../components/Table';
import { api } from '../services/api';
import { invalidateLifecycle, POLL_MS, qk } from '../lib/query';

const emptyForm = {
  name: '',
  category: '',
  quantity: 1,
  pricePerDay: '',
  status: 'Available',
};

export default function Products({ user }) {
  const isAdmin = user?.role === 'admin';
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');

  const { data: products = [], isLoading, error: loadError } = useQuery({
    queryKey: qk.adminProducts,
    queryFn: api.getProducts,
    refetchInterval: POLL_MS,
  });

  const saveMutation = useMutation({
    mutationFn: async (payload) => {
      if (editingId) return api.updateProduct(editingId, payload);
      return api.createProduct(payload);
    },
    onSuccess: async () => {
      setShowForm(false);
      setForm(emptyForm);
      setEditingId(null);
      setError('');
      await invalidateLifecycle(queryClient);
    },
    onError: (err) => setError(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: api.deleteProduct,
    onSuccess: async () => invalidateLifecycle(queryClient),
    onError: (err) => setError(err.message),
  });

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (product) => {
    setEditingId(product.id);
    setForm({
      name: product.name,
      category: product.category,
      quantity: product.quantity,
      pricePerDay: product.pricePerDay,
      status: product.status,
    });
    setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate({
      ...form,
      quantity: Number(form.quantity),
      pricePerDay: Number(form.pricePerDay),
    });
  };

  const handleDelete = (id) => {
    if (!window.confirm('Delete this product?')) return;
    deleteMutation.mutate(id);
  };

  const columns = [
    { key: 'name', label: 'Product Name' },
    { key: 'category', label: 'Category' },
    { key: 'quantity', label: 'Quantity' },
    {
      key: 'pricePerDay',
      label: 'Price Per Day',
      render: (r) => `₹${Number(r.pricePerDay).toLocaleString('en-IN')}`,
    },
    { key: 'status', label: 'Availability', render: (r) => <StatusBadge status={r.status} /> },
    ...(isAdmin
      ? [
          {
            key: 'actions',
            label: 'Actions',
            render: (r) => (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => openEdit(r)}
                  className="rounded-lg border border-ink-200 px-2.5 py-1 text-xs hover:bg-ink-50 dark:border-ink-700 dark:hover:bg-ink-800"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(r.id)}
                  className="rounded-lg border border-rose-200 px-2.5 py-1 text-xs text-rose-700 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-300 dark:hover:bg-rose-950/40"
                >
                  Delete
                </button>
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Products</h1>
          <p className="text-sm text-ink-500">
            {isAdmin ? 'Manage your rental inventory' : 'Browse available rental inventory'}
          </p>
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={openCreate}
            className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500"
          >
            Add Product
          </button>
        )}
      </div>

      {error && <p className="text-sm text-rose-600">{error}</p>}
      {loadError && <p className="text-sm text-rose-600">{loadError.message}</p>}

      {isAdmin && showForm && (
        <form
          onSubmit={handleSubmit}
          className="grid gap-4 rounded-2xl border border-ink-200/80 bg-white p-5 dark:border-ink-700 dark:bg-ink-900 sm:grid-cols-2 lg:grid-cols-3"
        >
          <h2 className="sm:col-span-2 lg:col-span-3 font-display text-lg font-semibold">
            {editingId ? 'Edit Product' : 'New Product'}
          </h2>
          {[
            { key: 'name', label: 'Product Name', type: 'text' },
            { key: 'category', label: 'Category', type: 'text' },
            { key: 'quantity', label: 'Quantity', type: 'number' },
            { key: 'pricePerDay', label: 'Price Per Day', type: 'number' },
          ].map((field) => (
            <label key={field.key} className="text-sm font-medium text-ink-600 dark:text-ink-300">
              {field.label}
              <input
                type={field.type}
                required
                min={field.type === 'number' ? 0 : undefined}
                value={form[field.key]}
                onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-ink-200 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-brand-500/30 dark:border-ink-700 dark:bg-ink-950"
              />
            </label>
          ))}
          <label className="text-sm font-medium text-ink-600 dark:text-ink-300">
            Status
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="mt-1.5 w-full rounded-xl border border-ink-200 bg-white px-3 py-2 outline-none dark:border-ink-700 dark:bg-ink-950"
            >
              <option>Available</option>
              <option>Rented</option>
            </select>
          </label>
          <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-3">
            <button type="submit" className="rounded-xl bg-brand-600 px-4 py-2 text-sm text-white hover:bg-brand-500">
              {editingId ? 'Update' : 'Create'}
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

      {isLoading ? <p className="text-ink-500">Loading products…</p> : <Table columns={columns} rows={products} />}
    </div>
  );
}
