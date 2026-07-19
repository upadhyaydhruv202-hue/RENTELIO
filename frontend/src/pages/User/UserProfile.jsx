import { useEffect, useState } from 'react';
import OrderCard from '../../components/OrderCard';
import { userApi } from '../../services/api';

export default function UserProfile({ customer, onUpdate }) {
  const [form, setForm] = useState({
    name: customer?.name || '',
    phone: customer?.phone || '',
    address: customer?.address || '',
    profileImage: customer?.profileImage || '',
    idDocumentUrl: customer?.idDocumentUrl || '',
    password: '',
  });
  const [rentals, setRentals] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    userApi
      .getProfile()
      .then((p) => {
        setForm({
          name: p.name || '',
          phone: p.phone || '',
          address: p.address || '',
          profileImage: p.profileImage || '',
          idDocumentUrl: p.idDocumentUrl || '',
          password: '',
        });
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
      const payload = { ...form };
      if (!payload.password) delete payload.password;
      const updated = await userApi.updateProfile(payload);
      onUpdate?.(updated);
      setMessage('Profile updated');
      setForm((f) => ({ ...f, password: '' }));
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink-900 dark:text-white">Profile</h1>
        <p className="text-sm text-ink-600 dark:text-ink-400">Address, identity & password</p>

        <form
          onSubmit={save}
          className="mt-5 space-y-4 rounded-2xl border border-ink-200/80 bg-white p-5 text-ink-900 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-100"
        >
          <label className="block text-sm font-medium text-ink-800 dark:text-ink-200">
            Full name
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="mt-1.5 w-full rounded-xl border border-ink-200 bg-white px-3 py-2 text-ink-900 dark:border-ink-700 dark:bg-ink-950 dark:text-white"
              required
            />
          </label>
          <label className="block text-sm font-medium text-ink-800 dark:text-ink-200">
            Email
            <input
              value={customer?.email || ''}
              disabled
              className="mt-1.5 w-full rounded-xl border border-ink-200 bg-ink-50 px-3 py-2 text-ink-500 dark:border-ink-700 dark:bg-ink-950 dark:text-ink-400"
            />
          </label>
          <label className="block text-sm font-medium text-ink-800 dark:text-ink-200">
            Phone
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="mt-1.5 w-full rounded-xl border border-ink-200 bg-white px-3 py-2 text-ink-900 dark:border-ink-700 dark:bg-ink-950 dark:text-white"
            />
          </label>
          <label className="block text-sm font-medium text-ink-800 dark:text-ink-200">
            Address
            <textarea
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              rows={3}
              className="mt-1.5 w-full rounded-xl border border-ink-200 px-3 py-2 dark:border-ink-700 dark:bg-ink-950"
            />
          </label>
          <label className="block text-sm font-medium">
            ID document URL
            <input
              value={form.idDocumentUrl}
              onChange={(e) => setForm({ ...form, idDocumentUrl: e.target.value })}
              placeholder="https://… or /uploads/…"
              className="mt-1.5 w-full rounded-xl border border-ink-200 px-3 py-2 dark:border-ink-700 dark:bg-ink-950"
            />
          </label>
          <label className="block text-sm font-medium">
            New password (optional)
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              minLength={6}
              className="mt-1.5 w-full rounded-xl border border-ink-200 px-3 py-2 dark:border-ink-700 dark:bg-ink-950"
            />
          </label>
          <label className="block text-sm font-medium">
            Profile image URL
            <input
              value={form.profileImage}
              onChange={(e) => setForm({ ...form, profileImage: e.target.value })}
              placeholder="https://…"
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
