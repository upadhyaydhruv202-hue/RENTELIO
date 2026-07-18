import { useQuery } from '@tanstack/react-query';
import { formatINR, formatDate, userApi } from '../../services/api';
import { POLL_MS, qk } from '../../lib/query';
import { useLocale } from '../../context/LocaleContext';

export default function Wallet() {
  const { t } = useLocale();

  const { data, isLoading, error } = useQuery({
    queryKey: qk.userWallet,
    queryFn: userApi.getWallet,
    refetchInterval: POLL_MS,
  });

  if (isLoading) return <p className="text-ink-500">Loading wallet…</p>;
  if (error) return <p className="text-rose-600">{error.message}</p>;

  const txns = data?.transactions || data?.txns || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">{t('wallet')}</h1>
        <p className="text-sm text-ink-500">Balance, credits, refunds & payment ledger</p>
      </div>

      <div className="rounded-3xl bg-gradient-to-br from-ink-900 to-brand-800 p-6 text-white">
        <p className="text-sm text-white/60">Available balance</p>
        <p className="mt-1 font-display text-4xl font-bold">{formatINR(data?.balance)}</p>
      </div>

      <div>
        <h2 className="font-display text-lg font-semibold">Transaction history</h2>
        {txns.length === 0 ? (
          <p className="mt-3 text-sm text-ink-500">No transactions yet</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {txns.map((txn) => (
              <li
                key={txn.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-ink-200 bg-white px-4 py-3 text-sm dark:border-ink-700 dark:bg-ink-900"
              >
                <div>
                  <p className="font-medium capitalize">{txn.type}</p>
                  <p className="text-xs text-ink-400">
                    {txn.note || '—'} · {formatDate(txn.createdAt)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-ink-800 dark:text-ink-100">
                    {formatINR(txn.amount)}
                  </p>
                  <p className="text-xs text-ink-400">Bal {formatINR(txn.balanceAfter)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
