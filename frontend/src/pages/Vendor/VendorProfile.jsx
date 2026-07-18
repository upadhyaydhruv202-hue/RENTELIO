import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { vendorApi } from '../../services/vendorApi';
import { useLocale } from '../../context/LocaleContext';

export default function VendorProfile({ vendor, onUpdate }) {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    company: vendor?.company || '',
    phone: vendor?.phone || '',
    address: vendor?.address || '',
    lateFeeMode: vendor?.lateFeeMode || 'daily',
    lateFeeAmount: vendor?.lateFeeAmount ?? '',
    gracePeriodHours: vendor?.gracePeriodHours ?? '',
    maxLateFeePercent: vendor?.maxLateFeePercent ?? '',
    password: '',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const { data: profile } = useQuery({
    queryKey: ['vendor', 'profile'],
    queryFn: vendorApi.getProfile,
    enabled: !vendor,
  });

  const activeVendor = vendor || profile;

  useEffect(() => {
    if (activeVendor) {
      setForm((f) => ({
        ...f,
        company: activeVendor.company || '',
        phone: activeVendor.phone || '',
        address: activeVendor.address || '',
        lateFeeMode: activeVendor.lateFeeMode || 'daily',
        lateFeeAmount: activeVendor.lateFeeAmount ?? '',
        gracePeriodHours: activeVendor.gracePeriodHours ?? '',
        maxLateFeePercent: activeVendor.maxLateFeePercent ?? '',
        password: '',
      }));
    }
  }, [activeVendor]);

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        company: form.company,
        phone: form.phone,
        address: form.address,
        lateFeeMode: form.lateFeeMode,
        lateFeeAmount: form.lateFeeAmount !== '' ? Number(form.lateFeeAmount) : undefined,
        gracePeriodHours: form.gracePeriodHours !== '' ? Number(form.gracePeriodHours) : undefined,
        maxLateFeePercent: form.maxLateFeePercent !== '' ? Number(form.maxLateFeePercent) : undefined,
      };
      if (form.password) payload.password = form.password;
      return vendorApi.updateProfile(payload);
    },
    onSuccess: (updated) => {
      setMessage('Profile updated');
      setError('');
      setForm((f) => ({ ...f, password: '' }));
      onUpdate?.(updated);
      queryClient.invalidateQueries({ queryKey: ['vendor', 'profile'] });
    },
    onError: (err) => {
      setError(err.message);
      setMessage('');
    },
  });

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">{t('vProfileTitle')}</h1>
        <p className="text-sm text-ink-500">{t('vProfileSub')}</p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          saveMutation.mutate();
        }}
        className="space-y-4 rounded-2xl border border-ink-200/80 bg-white p-5 dark:border-ink-700 dark:bg-ink-900"
      >
        <label className="block text-sm font-medium text-ink-600 dark:text-ink-300">
          Company
          <input
            value={form.company}
            onChange={(e) => setForm({ ...form, company: e.target.value })}
            className="mt-1.5 w-full rounded-xl border border-ink-200 px-3 py-2 dark:border-ink-700 dark:bg-ink-950"
          />
        </label>

        <label className="block text-sm font-medium text-ink-600 dark:text-ink-300">
          Email
          <input
            value={activeVendor?.email || ''}
            disabled
            className="mt-1.5 w-full rounded-xl border border-ink-200 bg-ink-50 px-3 py-2 text-ink-500 dark:border-ink-700 dark:bg-ink-950"
          />
        </label>

        <label className="block text-sm font-medium text-ink-600 dark:text-ink-300">
          Phone
          <input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="mt-1.5 w-full rounded-xl border border-ink-200 px-3 py-2 dark:border-ink-700 dark:bg-ink-950"
          />
        </label>

        <label className="block text-sm font-medium text-ink-600 dark:text-ink-300">
          Address
          <textarea
            rows={3}
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className="mt-1.5 w-full rounded-xl border border-ink-200 px-3 py-2 dark:border-ink-700 dark:bg-ink-950"
          />
        </label>

        <div className="rounded-xl border border-ink-200/80 p-4 dark:border-ink-700">
          <h2 className="font-display text-base font-semibold">Late fee settings</h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-ink-600 dark:text-ink-300">
              Mode
              <select
                value={form.lateFeeMode}
                onChange={(e) => setForm({ ...form, lateFeeMode: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-ink-200 px-3 py-2 dark:border-ink-700 dark:bg-ink-950"
              >
                <option value="daily">Daily</option>
                <option value="flat">Flat</option>
                <option value="percent">Percent</option>
              </select>
            </label>
            <label className="text-sm font-medium text-ink-600 dark:text-ink-300">
              Amount
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.lateFeeAmount}
                onChange={(e) => setForm({ ...form, lateFeeAmount: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-ink-200 px-3 py-2 dark:border-ink-700 dark:bg-ink-950"
              />
            </label>
            <label className="text-sm font-medium text-ink-600 dark:text-ink-300">
              Grace period (hours)
              <input
                type="number"
                min="0"
                value={form.gracePeriodHours}
                onChange={(e) => setForm({ ...form, gracePeriodHours: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-ink-200 px-3 py-2 dark:border-ink-700 dark:bg-ink-950"
              />
            </label>
            <label className="text-sm font-medium text-ink-600 dark:text-ink-300">
              Max late fee (%)
              <input
                type="number"
                min="0"
                max="100"
                value={form.maxLateFeePercent}
                onChange={(e) => setForm({ ...form, maxLateFeePercent: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-ink-200 px-3 py-2 dark:border-ink-700 dark:bg-ink-950"
              />
            </label>
          </div>
        </div>

        <label className="block text-sm font-medium text-ink-600 dark:text-ink-300">
          New password (optional)
          <input
            type="password"
            minLength={6}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="Leave blank to keep current"
            className="mt-1.5 w-full rounded-xl border border-ink-200 px-3 py-2 dark:border-ink-700 dark:bg-ink-950"
          />
        </label>

        {message && <p className="text-sm text-brand-700">{message}</p>}
        {error && <p className="text-sm text-rose-600">{error}</p>}

        <button
          type="submit"
          disabled={saveMutation.isPending}
          className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500 disabled:opacity-60"
        >
          {saveMutation.isPending ? 'Saving…' : 'Save Profile'}
        </button>
      </form>
    </div>
  );
}
