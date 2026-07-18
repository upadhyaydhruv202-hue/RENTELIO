import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import RentelioLogo from '../../components/RentelioLogo';
import { vendorApi } from '../../services/vendorApi';
import { useLocale } from '../../context/LocaleContext';

export default function VendorLogin({ onLogin }) {
  const navigate = useNavigate();
  const { t, locale, setLocale } = useLocale();
  const [email, setEmail] = useState('vendor@rentelio.com');
  const [password, setPassword] = useState('vendor123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await vendorApi.login(email, password);
      onLogin(data.vendor, data.token);
      navigate('/vendor/dashboard');
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
      <div className="absolute right-4 top-4 z-20">
        <select
          value={locale}
          onChange={(e) => setLocale(e.target.value)}
          className="rounded-xl border border-white/20 bg-white/10 px-2 py-2 text-xs text-white backdrop-blur-md"
          aria-label={t('language')}
        >
          <option value="en" className="text-ink-900">
            EN
          </option>
          <option value="hi" className="text-ink-900">
            HI
          </option>
          <option value="gu" className="text-ink-900">
            GU
          </option>
        </select>
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
          onSubmit={submit}
          className="space-y-4 rounded-3xl border border-white/15 bg-white p-8 text-ink-900 shadow-2xl"
        >
          <div>
            <h1 className="font-display text-2xl font-bold text-ink-950">{t('vSignIn')}</h1>
            <p className="text-sm text-ink-600">{t('vendorWorkspace')}</p>
          </div>
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <label className="block text-sm font-medium text-ink-800">
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-ink-200 bg-white px-3 py-2 text-ink-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
          </label>
          <label className="block text-sm font-medium text-ink-800">
            Password
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-ink-200 bg-white px-3 py-2 text-ink-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="btn-living w-full rounded-xl bg-brand-600 py-2.5 font-semibold text-white hover:bg-brand-500 disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Sign in as Vendor'}
          </button>
          <p className="text-center text-xs text-ink-500">
            Demo: vendor@rentelio.com / vendor123 ·{' '}
            <Link to="/admin/login" className="font-medium text-brand-700 hover:underline">
              Super Admin
            </Link>{' '}
            ·{' '}
            <Link to="/user/login" className="font-medium text-brand-700 hover:underline">
              User
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
