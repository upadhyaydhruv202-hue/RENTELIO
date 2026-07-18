import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { invalidateLifecycle, qk } from '../lib/query';

export default function Settings() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ orgName: '', lateFeePerDay: '', commissionPercent: '10' });
  const [message, setMessage] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: [...qk.adminPlatform, 'settings'],
    queryFn: api.getPlatformSettings,
  });

  useEffect(() => {
    if (data) {
      setForm({
        orgName: data.orgName || 'Rentelio',
        lateFeePerDay: String(data.lateFeePerDay ?? ''),
        commissionPercent: String(data.commissionPercent ?? 10),
      });
    }
  }, [data]);

  const save = useMutation({
    mutationFn: () =>
      api.updatePlatformSettings({
        orgName: form.orgName,
        lateFeePerDay: Number(form.lateFeePerDay) || 0,
        commissionPercent: Number(form.commissionPercent) || 10,
      }),
    onSuccess: () => {
      setMessage('Settings saved');
      invalidateLifecycle(queryClient);
    },
    onError: (e) => setMessage(e.message),
  });

  if (isLoading) return <p className="text-ink-500">Loading settings…</p>;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-ink-500">Organization and late-fee defaults</p>
      </div>

      {error && <p className="text-rose-600">{error.message}</p>}
      {message && <p className="text-sm text-brand-700">{message}</p>}

      <form
        className="space-y-4 rounded-2xl border border-ink-200 bg-white p-5 dark:border-ink-700 dark:bg-ink-900"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
      >
        <label className="block text-sm font-medium">
          Organization name
          <input
            value={form.orgName}
            onChange={(e) => setForm({ ...form, orgName: e.target.value })}
            className="mt-1.5 w-full rounded-xl border border-ink-200 px-3 py-2 dark:border-ink-700 dark:bg-ink-950"
          />
        </label>
        <label className="block text-sm font-medium">
          Late fee per day (₹)
          <input
            type="number"
            value={form.lateFeePerDay}
            onChange={(e) => setForm({ ...form, lateFeePerDay: e.target.value })}
            className="mt-1.5 w-full rounded-xl border border-ink-200 px-3 py-2 dark:border-ink-700 dark:bg-ink-950"
          />
        </label>
        <label className="block text-sm font-medium">
          Platform commission (%)
          <input
            type="number"
            value={form.commissionPercent}
            onChange={(e) => setForm({ ...form, commissionPercent: e.target.value })}
            className="mt-1.5 w-full rounded-xl border border-ink-200 px-3 py-2 dark:border-ink-700 dark:bg-ink-950"
          />
        </label>
        <button type="submit" className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white">
          Save settings
        </button>
      </form>
    </div>
  );
}
