import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Table, { StatusBadge } from '../components/Table';
import PageHeader, { ActionBtn, FilterBar } from '../components/PageHeader';
import StatGrid from '../components/StatGrid';
import AiPulseBar from '../components/AiPulseBar';
import { api, formatDate } from '../services/api';
import { exportCsv } from '../lib/exportCsv';
import { invalidateLifecycle, POLL_MS, qk } from '../lib/query';

export default function FraudCenter() {
  const queryClient = useQueryClient();
  const [resolved, setResolved] = useState('false');
  const [fraudType, setFraudType] = useState('');

  const { data: overview } = useQuery({
    queryKey: qk.adminFraudOverview,
    queryFn: api.getFraudOverview,
    refetchInterval: POLL_MS,
  });

  const params = {
    ...(resolved ? { resolved } : {}),
    ...(fraudType ? { fraudType } : {}),
  };

  const { data: alerts = [], isLoading, error } = useQuery({
    queryKey: [...qk.adminFraud, params],
    queryFn: () => api.getFraudAlerts(params),
    refetchInterval: POLL_MS,
  });

  const refresh = () => invalidateLifecycle(queryClient);

  const scan = useMutation({
    mutationFn: api.scanFraud,
    onSuccess: refresh,
  });

  const act = useMutation({
    mutationFn: ({ id, action }) =>
      action === 'resolve' ? api.resolveFraud(id, 'Marked resolved') : api.fraudAction(id, action),
    onSuccess: refresh,
  });

  const cards = overview?.cards || {};

  const columns = [
    { key: 'id', label: 'Case ID' },
    {
      key: 'title',
      label: 'Case',
      render: (a) => a.title,
    },
    { key: 'fraudType', label: 'Fraud Type' },
    {
      key: 'entityType',
      label: 'Entity',
      render: (a) => `${a.entityType || '—'} ${a.entityId ? `#${a.entityId}` : ''}`,
    },
    {
      key: 'riskScore',
      label: 'Risk',
      render: (a) => (
        <span className={a.riskScore >= 70 ? 'font-semibold text-rose-600' : ''}>{a.riskScore}</span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Detected',
      render: (a) => formatDate(a.createdAt),
    },
    {
      key: 'resolved',
      label: 'Status',
      render: (a) => <StatusBadge status={a.resolved ? 'Completed' : 'Active'} />,
    },
    {
      key: 'actionTaken',
      label: 'Action Taken',
      render: (a) => a.actionTaken || '—',
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (a) => (
        <div className="flex flex-wrap gap-1">
          <ActionBtn tone="sky" onClick={() => act.mutate({ id: a.id, action: 'investigate' })}>
            Investigate
          </ActionBtn>
          <ActionBtn tone="amber" onClick={() => act.mutate({ id: a.id, action: 'suspend' })}>
            Suspend
          </ActionBtn>
          <ActionBtn tone="rose" onClick={() => act.mutate({ id: a.id, action: 'blacklist' })}>
            Blacklist
          </ActionBtn>
          {!a.resolved && (
            <ActionBtn tone="brand" onClick={() => act.mutate({ id: a.id, action: 'resolve' })}>
              Resolve
            </ActionBtn>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fraud Detection Center"
        subtitle="AI-assisted monitoring · vendor · user · transaction risk"
        actions={
          <ActionBtn tone="rose" onClick={() => scan.mutate()} disabled={scan.isPending}>
            {scan.isPending ? 'Scanning…' : 'Run AI fraud scan'}
          </ActionBtn>
        }
      />

      <AiPulseBar
        tone="alert"
        title="Security lattice online"
        body={`${cards.activeCases ?? 0} active cases · ${cards.highRiskAccounts ?? 0} high-risk accounts in observation.`}
      />

      <StatGrid
        items={[
          { title: 'Total Fraud Attempts', value: cards.totalAttempts ?? '—', accent: 'rose' },
          { title: 'Active Cases', value: cards.activeCases ?? '—', accent: 'amber' },
          { title: 'Resolved Cases', value: cards.resolvedCases ?? '—', accent: 'brand' },
          { title: 'High Risk Accounts', value: cards.highRiskAccounts ?? '—', accent: 'violet' },
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {[
          {
            title: 'Vendor Fraud',
            items: ['Fake documents', 'Fake business identity', 'Fake listings', 'Duplicate accounts'],
          },
          {
            title: 'User Fraud',
            items: ['Fake profiles', 'Payment fraud', 'Multiple accounts', 'Suspicious booking patterns'],
          },
          {
            title: 'Transaction Fraud',
            items: ['Unusual transactions', 'Chargeback attempts', 'Abnormal payment behavior'],
          },
        ].map((cat) => (
          <div
            key={cat.title}
            className="rounded-2xl border border-ink-200/80 bg-white p-4 dark:border-ink-700 dark:bg-ink-900"
          >
            <h2 className="font-display text-base font-semibold">{cat.title}</h2>
            <ul className="mt-2 space-y-1 text-sm text-ink-500">
              {cat.items.map((i) => (
                <li key={i}>· {i}</li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-ink-400">
              Cases:{' '}
              {(overview?.categories || []).find((c) => cat.items.includes(c.type))?.count ||
                (overview?.categories || [])
                  .filter((c) => cat.items.some((i) => i.toLowerCase().includes(String(c.type).toLowerCase()) || String(c.type).toLowerCase().includes(i.toLowerCase().split(' ')[0])))
                  .reduce((s, c) => s + c.count, 0) || 0}
            </p>
          </div>
        ))}
      </div>

      <FilterBar
        hideSearch
        search=""
        onSearch={() => {}}
        filters={[
          {
            key: 'resolved',
            value: resolved,
            onChange: setResolved,
            options: [
              { value: '', label: 'All cases' },
              { value: 'false', label: 'Open' },
              { value: 'true', label: 'Resolved' },
            ],
          },
          {
            key: 'type',
            value: fraudType,
            onChange: setFraudType,
            options: [
              { value: '', label: 'All types' },
              { value: 'Fake documents', label: 'Fake documents' },
              { value: 'Suspicious booking patterns', label: 'Suspicious bookings' },
              { value: 'Multiple accounts', label: 'Multiple accounts' },
              { value: 'Unusual transactions', label: 'Unusual transactions' },
              { value: 'Fake business identity', label: 'Fake business identity' },
            ],
          },
        ]}
        onExport={() =>
          exportCsv(
            'fraud-cases',
            alerts,
            columns.filter((c) => c.key !== 'actions')
          )
        }
      />

      {error && <p className="text-rose-600">{error.message}</p>}
      {scan.data && (
        <p className="text-sm text-brand-700 dark:text-brand-300">
          Scan complete — {scan.data.created} new alert(s) created.
        </p>
      )}
      {isLoading ? (
        <p className="text-ink-500">Loading cases…</p>
      ) : (
        <Table columns={columns} rows={alerts} />
      )}
    </div>
  );
}
