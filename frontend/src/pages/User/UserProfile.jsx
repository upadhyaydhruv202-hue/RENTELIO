import { useEffect, useState } from 'react';
import OrderCard from '../../components/OrderCard';
import { userApi } from '../../services/api';

export default function UserProfile({ customer, onUpdate }) {
  const [form, setForm] = useState({
    name: customer?.name || '',
    phone: customer?.phone || '',
    address: customer?.address || '',
  });
  const [rentals, setRentals] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    userApi
      .getProfile()
      .then((p) => {
        setForm({ name: p.name || '', phone: p.phone || '', address: p.address || '' });
        onUpdate?.(p);
      })
      .catch((err) => setError(err.message));

    userApi.getRentals().then(setRentals).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const updated = await userApi.updateProfile(form);
      onUpdate?.(updated);
      setMessage('Profile updated');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
      <div>
        <h1 className="font-display text-2xl font-semibold">Your profile</h1>
        <p className="text-sm text-ink-500">Personal information and contact details</p>

        <form
          onSubmit={save}
          className="mt-5 space-y-4 rounded-2xl border border-ink-200/80 bg-white p-5 dark:border-ink-700 dark:bg-ink-900"
        >
          <label className="block text-sm font-medium">
            Full name
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="mt-1.5 w-full rounded-xl border border-ink-200 px-3 py-2 dark:border-ink-700 dark:bg-ink-950"
              required
            />
          </label>
          <label className="block text-sm font-medium">
            Email
            <input
              value={customer?.email || ''}
              disabled
              className="mt-1.5 w-full rounded-xl border border-ink-200 bg-ink-50 px-3 py-2 text-ink-500 dark:border-ink-700 dark:bg-ink-950"
            />
          </label>
          <label className="block text-sm font-medium">
            Phone
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="mt-1.5 w-full rounded-xl border border-ink-200 px-3 py-2 dark:border-ink-700 dark:bg-ink-950"
            />
          </label>
          <label className="block text-sm font-medium">
            Address
            <textarea
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              rows={3}
              className="mt-1.5 w-full rounded-xl border border-ink-200 px-3 py-2 dark:border-ink-700 dark:bg-ink-950"
            />
          </label>
          {message && <p className="text-sm text-brand-700">{message}</p>}
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      </div>

      <div>
        <h2 className="font-display text-xl font-semibold">Rental history</h2>
        <div className="mt-4 space-y-3">
          {rentals.length === 0 ? (
            <p className="text-sm text-ink-500">No rentals yet</p>
          ) : (
            rentals.slice(0, 6).map((r) => <OrderCard key={r.id} rental={r} />)
          )}
        </div>
      </div>
    </div>
  );
}
