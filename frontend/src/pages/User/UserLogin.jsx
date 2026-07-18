import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import RentelioLogo from '../../components/RentelioLogo';
import { userApi } from '../../services/api';

export default function UserLogin({ onLogin }) {
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
      const data = await userApi.login(email, password);
      onLogin(data.customer, data.token);
      navigate('/shop');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4">
      <div className="pointer-events-none absolute inset-0 splash-bg" />
      <div className="relative w-full max-w-md">
        <div className="mb-8">
          <RentelioLogo size="lg" centered showTagline colorClass="text-white" />
        </div>
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-white/10 bg-white p-8 shadow-2xl"
        >
          <h2 className="font-display text-xl font-semibold">Customer Sign in</h2>
          <p className="mt-1 text-sm text-ink-500">Browse and rent gear in minutes</p>
          {error && <p className="mt-4 text-sm text-rose-600">{error}</p>}
          <label className="mt-5 block text-sm font-medium">
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-ink-200 px-3 py-2.5"
            />
          </label>
          <label className="mt-4 block text-sm font-medium">
            Password
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-ink-200 px-3 py-2.5"
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-xl bg-brand-600 py-2.5 font-medium text-white hover:bg-brand-500 disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
          <p className="mt-4 text-center text-sm text-ink-500">
            New here?{' '}
            <Link to="/shop/register" className="font-medium text-brand-700 hover:underline">
              Create account
            </Link>
          </p>
          <p className="mt-3 text-center text-xs text-ink-400">
            Demo: customer@rentelio.com / customer123
          </p>
          <p className="mt-2 text-center text-xs">
            <Link to="/login" className="text-ink-400 hover:underline">
              Staff / Admin login →
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
