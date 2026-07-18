import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Table, { StatusBadge } from '../components/Table';
import PageHeader, { ActionBtn, FilterBar } from '../components/PageHeader';
import StatGrid from '../components/StatGrid';
import { api, formatINR, formatDate } from '../services/api';
import { exportCsv } from '../lib/exportCsv';
import { invalidateLifecycle, POLL_MS, qk } from '../lib/query';

export default function UsersAdmin() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [selected, setSelected] = useState(null);

  const params = useMemo(
    () => ({
      ...(search ? { search } : {}),
      ...(status ? { status } : {}),
    }),
    [search, status]
  );

  const { data: users = [], isLoading, error } = useQuery({
    queryKey: [...qk.adminUsers, params],
    queryFn: () => api.getSuperAdminUsers(params),
    refetchInterval: POLL_MS,
  });

  const refresh = () => invalidateLifecycle(queryClient);

  const setStatusMut = useMutation({
    mutationFn: ({ id, status: s }) => api.setCustomerStatus(id, s),
    onSuccess: refresh,
  });

  const verify = useMutation({
    mutationFn: api.verifyCustomerIdentity,
    onSuccess: refresh,
  });

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Full Name' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    {
      key: 'createdAt',
      label: 'Registered',
      render: (u) => formatDate(u.createdAt),
      export: (u) => u.createdAt,
    },
    { key: 'totalRentals', label: 'Rentals' },
    {
      key: 'spendingAmount',
      label: 'Spending',
      render: (u) => formatINR(u.spendingAmount),
    },
    { key: 'rating', label: 'Rating' },
    { key: 'complaintsCount', label: 'Complaints' },
    {
      key: 'verified',
      label: 'Verification',
      render: (u) => (u.verified ? 'Verified' : 'Unverified'),
    },
    {
      key: 'status',
      label: 'Account',
      render: (u) => <StatusBadge status={u.status || 'Active'} />,
    },
    {
      key: 'fraudScore',
      label: 'Fraud',
      render: (u) => (
        <span className={u.fraudScore >= 60 ? 'font-semibold text-rose-600' : ''}>{u.fraudScore}</span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (u) => (
        <div className="flex flex-wrap gap-1">
          <ActionBtn tone="ghost" onClick={() => setSelected(u)}>
            Profile
          </ActionBtn>
          {!u.verified && (
            <ActionBtn tone="sky" onClick={() => verify.mutate(u.id)}>
              Approve
            </ActionBtn>
          )}
          <ActionBtn
            tone="amber"
            onClick={() => setStatusMut.mutate({ id: u.id, status: 'Suspended' })}
          >
            Suspend
          </ActionBtn>
          <ActionBtn
            tone="rose"
            onClick={() => setStatusMut.mutate({ id: u.id, status: 'Banned' })}
          >
            Blacklist
          </ActionBtn>
          {u.status !== 'Active' && (
            <ActionBtn
              tone="brand"
              onClick={() => setStatusMut.mutate({ id: u.id, status: 'Active' })}
            >
              Activate
            </ActionBtn>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        subtitle="Identity verification · behaviour risk · account controls"
      />

      <StatGrid
        items={[
          { title: 'Total Users', value: users.length, accent: 'sky' },
          {
            title: 'Verified',
            value: users.filter((u) => u.verified).length,
            accent: 'brand',
          },
          {
            title: 'High Risk',
            value: users.filter((u) => u.fraudScore >= 60).length,
            accent: 'rose',
          },
          {
            title: 'Suspended / Banned',
            value: users.filter((u) => ['Suspended', 'Banned'].includes(u.status)).length,
            accent: 'amber',
          },
        ]}
      />

      <FilterBar
        search={search}
        onSearch={setSearch}
        filters={[
          {
            key: 'status',
            value: status,
            onChange: setStatus,
            options: [
              { value: '', label: 'All statuses' },
              { value: 'Active', label: 'Active' },
              { value: 'Suspended', label: 'Suspended' },
              { value: 'Banned', label: 'Banned' },
            ],
          },
        ]}
        onExport={() =>
          exportCsv(
            'users',
            users,
            columns.filter((c) => c.key !== 'actions')
          )
        }
      />

      {error && <p className="text-rose-600">{error.message}</p>}
      {isLoading ? (
        <p className="text-ink-500">Loading users…</p>
      ) : (
        <Table columns={columns} rows={users} />
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/50 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-ink-200 bg-white p-6 dark:border-ink-700 dark:bg-ink-900">
            <div className="flex justify-between">
              <h2 className="font-display text-xl font-semibold">{selected.name}</h2>
              <button type="button" className="text-sm text-ink-500" onClick={() => setSelected(null)}>
                Close
              </button>
            </div>
            <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
              <Row k="Email" v={selected.email} />
              <Row k="Phone" v={selected.phone} />
              <Row k="Total rentals" v={selected.totalRentals} />
              <Row k="Spending" v={formatINR(selected.spendingAmount)} />
              <Row k="Wallet" v={formatINR(selected.walletBalance)} />
              <Row k="Fraud score" v={selected.fraudScore} />
              <Row k="Complaints" v={selected.complaintsCount} />
              <Row k="ID document" v={selected.idDocumentUrl || 'Not uploaded'} />
            </dl>
            <div className="mt-4 rounded-xl bg-ink-50 p-3 text-sm dark:bg-ink-950">
              <p className="font-medium">Behaviour signals (demo)</p>
              <ul className="mt-1 list-disc pl-5 text-ink-500">
                <li>Rental frequency: {selected.totalRentals} bookings</li>
                <li>Payment behaviour: wallet balance tracked</li>
                <li>Risk band: {selected.fraudScore >= 60 ? 'Elevated' : 'Normal'}</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ k, v }) {
  return (
    <div>
      <dt className="text-xs text-ink-400">{k}</dt>
      <dd className="font-medium">{v}</dd>
    </div>
  );
}
