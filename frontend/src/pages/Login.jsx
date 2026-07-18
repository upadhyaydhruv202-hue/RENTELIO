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
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      {/* Purple–black auth backdrop */}
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
            colorClass="text-white"
            taglineClass="!text-violet-200/80"
          />
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-white/10 bg-white/95 p-8 shadow-2xl shadow-violet-950/40 backdrop-blur-md dark:border-violet-500/20 dark:bg-ink-950/85"
        >
          <h2 className="font-display text-xl font-semibold text-ink-900 dark:text-white">
            Sign in
          </h2>
          <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
            Access your rental operations dashboard
          </p>

          {error && (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
              {error}
            </div>
          )}

          <label className="mt-6 block text-sm font-medium text-ink-600 dark:text-ink-300">
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-ink-900 outline-none ring-violet-500/30 transition focus:ring-2 dark:border-ink-700 dark:bg-ink-950 dark:text-white"
            />
          </label>

          <label className="mt-4 block text-sm font-medium text-ink-600 dark:text-ink-300">
            Password
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-ink-900 outline-none ring-violet-500/30 transition focus:ring-2 dark:border-ink-700 dark:bg-ink-950 dark:text-white"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-xl bg-violet-600 py-2.5 font-medium text-white transition hover:bg-violet-500 disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Login'}
          </button>

          <p className="mt-4 space-y-1 text-center text-xs text-ink-400">
            <span className="block">Admin: admin@rentelio.com / admin123</span>
            <span className="block">Staff: user@rentelio.com / user123</span>
          </p>
          <p className="mt-3 text-center text-xs">
            <a href="/shop/login" className="text-violet-600 hover:underline dark:text-violet-300">
              Customer store →
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}
