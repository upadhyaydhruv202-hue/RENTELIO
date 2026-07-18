import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RentelioLogo from '../components/RentelioLogo';
import { api } from '../services/api';

export default function Login({ onLogin }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api.login(email, password);
      onLogin(data.user, data.token);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-bloom relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <div className="pointer-events-none absolute inset-0 splash-bg" />
      <div className="pointer-events-none absolute inset-0">
        <div className="splash-orb splash-orb-a opacity-40" />
        <div className="splash-orb splash-orb-b opacity-30" />
      </div>

      <div className="relative w-full max-w-md login-enter">
        <div className="mb-8">
          <RentelioLogo
            size="lg"
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
          <h2 className="font-display text-xl font-semibold text-ink-950">Super Admin Sign in</h2>
          <p className="mt-1 text-sm text-ink-600">Platform-wide control for Rentelio</p>

          {error && (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </div>
          )}

          <label className="mt-6 block text-sm font-medium text-ink-800">
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-ink-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
          </label>

          <label className="mt-4 block text-sm font-medium text-ink-800">
            Password
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-ink-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="btn-living mt-6 w-full rounded-xl bg-brand-600 py-2.5 font-medium text-white disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Login'}
          </button>

          <p className="mt-4 space-y-1 text-center text-xs text-ink-500">
            <span className="block">Super Admin: admin@rentelio.com / admin123</span>
          </p>
          <p className="mt-3 flex justify-center gap-3 text-center text-xs">
            <a href="/user/login" className="font-medium text-brand-700 hover:underline">
              User login
            </a>
            <a href="/vendor/login" className="font-medium text-brand-700 hover:underline">
              Vendor login
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}
