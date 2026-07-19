import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDate } from '../../services/api';
import { vendorApi } from '../../services/vendorApi';
import { POLL_MS } from '../../lib/query';

export default function VendorNotifications() {  const queryClient = useQueryClient();

  const { data: rows = [], isLoading, error } = useQuery({
    queryKey: ['vendor', 'notifications'],
    queryFn: vendorApi.getNotifications,
    refetchInterval: POLL_MS,
  });

  const markRead = useMutation({
    mutationFn: vendorApi.markNotificationRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vendor', 'notifications'] }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">{'Notifications'}</h1>
        <p className="text-sm text-ink-500">Alerts for your seller account</p>
      </div>

      {error && <p className="text-rose-600">{error.message}</p>}
      {isLoading ? (
        <p className="text-ink-500">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-ink-500">No notifications</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((n) => (
            <li
              key={n.id}
              className={`rounded-2xl border px-4 py-3 ${
                n.read
                  ? 'border-ink-200 bg-white dark:border-ink-700 dark:bg-ink-900'
                  : 'border-brand-200 bg-brand-50 dark:border-brand-800 dark:bg-brand-950/30'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{n.title}</p>
                  <p className="mt-1 text-sm text-ink-600 dark:text-ink-300">{n.body}</p>
                  <p className="mt-1 text-xs text-ink-400">
                    {n.type} · {formatDate(n.createdAt)}
                  </p>
                </div>
                {!n.read && (
                  <button
                    type="button"
                    onClick={() => markRead.mutate(n.id)}
                    className="text-xs font-medium text-brand-700 hover:underline dark:text-brand-300"
                  >
                    Mark read
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
