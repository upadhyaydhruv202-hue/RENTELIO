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
      navigate('/user/dashboard');
    } catch (err) {
      setError(err.message);
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
          <h2 className="font-display text-xl font-semibold text-ink-950">User Sign in</h2>
          <p className="mt-1 text-sm text-ink-600">Rent products from marketplace vendors</p>
          {error && <p className="mt-4 text-sm text-rose-600">{error}</p>}
          <label className="mt-5 block text-sm font-medium text-ink-800">
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
            className="btn-living mt-6 w-full rounded-xl bg-brand-600 py-2.5 font-medium text-white hover:bg-brand-500 disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
          <p className="mt-4 text-center text-sm text-ink-600">
            New here?{' '}
            <Link to="/user/register" className="font-medium text-brand-700 hover:underline">
              Create account
            </Link>
          </p>
          <p className="mt-3 text-center text-xs text-ink-500">
            Demo: customer@rentelio.com / customer123
          </p>
          <p className="mt-2 flex justify-center gap-3 text-center text-xs">
            <Link to="/vendor/login" className="text-brand-700 hover:underline">
              Vendor
            </Link>
            <Link to="/admin/login" className="text-brand-700 hover:underline">
              Super Admin
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
