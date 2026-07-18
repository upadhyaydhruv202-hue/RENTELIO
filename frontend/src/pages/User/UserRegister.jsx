import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import RentelioLogo from '../../components/RentelioLogo';
import { userApi } from '../../services/api';

export default function UserRegister({ onLogin }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    address: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await userApi.register(form);
      onLogin(data.customer, data.token);
      navigate('/user/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-bloom relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute inset-0 splash-bg" />
      <div className="pointer-events-none absolute inset-0">
        <div className="splash-orb splash-orb-a opacity-40" />
        <div className="splash-orb splash-orb-b opacity-30" />
      </div>
      <div className="relative w-full max-w-lg login-enter">
        <div className="mb-6">
          <RentelioLogo
            size="md"
            centered
            showTagline
            spin
            colorClass="text-white"
            taglineClass="!text-brand-300"
          />
        </div>
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-white/15 bg-white p-8 text-ink-900 shadow-2xl"
        >
          <h2 className="font-display text-xl font-semibold text-ink-950">Create your account</h2>
          <p className="mt-1 text-sm text-ink-600">Start renting in a few clicks</p>
          {error && <p className="mt-4 text-sm text-rose-600">{error}</p>}
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {[
              { key: 'name', label: 'Full name', type: 'text', required: true },
              { key: 'email', label: 'Email', type: 'email', required: true },
              { key: 'password', label: 'Password', type: 'password', required: true },
              { key: 'phone', label: 'Phone', type: 'tel', required: false },
            ].map((f) => (
              <label key={f.key} className="block text-sm font-medium text-ink-800">
                {f.label}
                <input
                  type={f.type}
                  required={f.required}
                  value={form[f.key]}
                  onChange={set(f.key)}
                  className="mt-1.5 w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-ink-900 placeholder:text-ink-400 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                />
              </label>
            ))}
            <label className="block text-sm font-medium text-ink-800 sm:col-span-2">
              Address
              <textarea
                value={form.address}
                onChange={set('address')}
                rows={2}
                className="mt-1.5 w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-ink-900 placeholder:text-ink-400 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-living mt-6 w-full rounded-xl bg-brand-600 py-2.5 font-medium text-white hover:bg-brand-500"
          >
            {loading ? 'Creating…' : 'Register'}
          </button>
          <p className="mt-4 text-center text-sm text-ink-600">
            Already have an account?{' '}
            <Link to="/user/login" className="font-medium text-brand-700 hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
