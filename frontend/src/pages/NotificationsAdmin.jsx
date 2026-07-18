import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Table, { StatusBadge } from '../components/Table';
import PageHeader, { ActionBtn } from '../components/PageHeader';
import { api, formatDate } from '../services/api';
import { exportCsv } from '../lib/exportCsv';
import { invalidateLifecycle, POLL_MS, qk } from '../lib/query';

const empty = {
  title: '',
  body: '',
  audience: 'all',
  priority: 'Normal',
  channel: 'website',
  type: 'announcement',
};

export default function NotificationsAdmin() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(empty);

  const { data: rows = [], isLoading, error } = useQuery({
    queryKey: qk.adminNotifications,
    queryFn: api.getAdminNotifications,
    refetchInterval: POLL_MS,
  });

  const broadcast = useMutation({
    mutationFn: () => api.broadcastNotification(form),
    onSuccess: () => {
      setForm(empty);
      invalidateLifecycle(queryClient);
    },
  });

  const columns = [
    { key: 'title', label: 'Title' },
    { key: 'body', label: 'Message' },
    { key: 'audience', label: 'Audience' },
    {
      key: 'priority',
      label: 'Priority',
      render: (n) => <StatusBadge status={n.priority || 'Normal'} />,
    },
    { key: 'channel', label: 'Channel', render: (n) => n.channel || 'website' },
    {
      key: 'createdAt',
      label: 'Sent',
      render: (n) => formatDate(n.createdAt),
    },
    {
      key: 'engagement',
      label: 'Delivery',
      render: (n) => (n.read ? 'Opened' : 'Delivered'),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Global Notifications"
        subtitle="Platform announcements · emergency alerts · multi-channel delivery"
        actions={
          <ActionBtn tone="ghost" onClick={() => exportCsv('notifications', rows, columns)}>
            Export history
          </ActionBtn>
        }
      />

      <form
        className="space-y-3 rounded-2xl border border-ink-200 bg-white p-4 dark:border-ink-700 dark:bg-ink-900"
        onSubmit={(e) => {
          e.preventDefault();
          broadcast.mutate();
        }}
      >
        <input
          required
          placeholder="Notification title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="w-full rounded-xl border border-ink-200 px-3 py-2 text-sm dark:border-ink-700 dark:bg-ink-950"
        />
        <textarea
          required
          placeholder="Message"
          value={form.body}
          onChange={(e) => setForm({ ...form, body: e.target.value })}
          className="w-full rounded-xl border border-ink-200 px-3 py-2 text-sm dark:border-ink-700 dark:bg-ink-950"
          rows={3}
        />
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <select
            value={form.audience}
            onChange={(e) => setForm({ ...form, audience: e.target.value })}
            className="rounded-xl border border-ink-200 px-3 py-2 text-sm dark:border-ink-700 dark:bg-ink-950"
          >
            <option value="all">All Users</option>
            <option value="vendors">All Vendors</option>
            <option value="user">Specific / targeted</option>
          </select>
          <select
            value={form.priority}
            onChange={(e) => setForm({ ...form, priority: e.target.value })}
            className="rounded-xl border border-ink-200 px-3 py-2 text-sm dark:border-ink-700 dark:bg-ink-950"
          >
            <option value="Normal">Normal</option>
            <option value="Important">Important</option>
            <option value="Critical">Critical</option>
          </select>
          <select
            value={form.channel}
            onChange={(e) => setForm({ ...form, channel: e.target.value })}
            className="rounded-xl border border-ink-200 px-3 py-2 text-sm dark:border-ink-700 dark:bg-ink-950"
          >
            <option value="website">Website banner</option>
            <option value="email">Email</option>
            <option value="push">Push notification</option>
            <option value="sms">SMS</option>
          </select>
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            className="rounded-xl border border-ink-200 px-3 py-2 text-sm dark:border-ink-700 dark:bg-ink-950"
          >
            <option value="announcement">Feature / announcement</option>
            <option value="maintenance">Website maintenance</option>
            <option value="security">Security alert</option>
            <option value="policy">Policy update</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={broadcast.isPending}
          className="rounded-xl bg-brand-600 px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {broadcast.isPending ? 'Sending…' : 'Send notification'}
        </button>
        {broadcast.data?.message && (
          <p className="text-sm text-brand-700 dark:text-brand-300">
            {broadcast.data.message}
            {broadcast.data.engagementRate != null
              ? ` · Eng. rate demo ${broadcast.data.engagementRate}%`
              : ''}
          </p>
        )}
      </form>

      {error && <p className="text-rose-600">{error.message}</p>}
      {isLoading ? <p className="text-ink-500">Loading…</p> : <Table columns={columns} rows={rows} />}
    </div>
  );
}
