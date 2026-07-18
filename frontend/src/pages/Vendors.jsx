import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Table, { StatusBadge } from '../components/Table';
import PageHeader, { ActionBtn, FilterBar } from '../components/PageHeader';
import StatGrid from '../components/StatGrid';
import { api, formatINR, formatDate } from '../services/api';
import { exportCsv } from '../lib/exportCsv';
import { invalidateLifecycle, POLL_MS, qk } from '../lib/query';

export default function Vendors() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [kycStatus, setKycStatus] = useState('');
  const [selected, setSelected] = useState(null);
  const [kycResult, setKycResult] = useState(null);

  const params = useMemo(
    () => ({
      ...(search ? { search } : {}),
      ...(status ? { status } : {}),
      ...(kycStatus ? { kycStatus } : {}),
    }),
    [search, status, kycStatus]
  );

  const { data: vendors = [], isLoading, error } = useQuery({
    queryKey: [...qk.adminVendors, params],
    queryFn: () => api.getSuperAdminVendors(params),
    refetchInterval: POLL_MS,
  });

  const refresh = () => invalidateLifecycle(queryClient);

  const kycScan = useMutation({
    mutationFn: (id) => api.runVendorKyc(id),
    onSuccess: (res) => {
      setKycResult(res.evaluation);
      setSelected(res.vendor);
      refresh();
    },
  });

  const decision = useMutation({
    mutationFn: ({ id, decision: d }) => api.vendorKycDecision(id, d),
    onSuccess: (v) => {
      setSelected(v);
      refresh();
    },
  });

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'company', label: 'Business' },
    { key: 'ownerName', label: 'Owner', render: (v) => v.ownerName || v.name },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'location', label: 'Location', render: (v) => v.location || '—' },
    {
      key: 'createdAt',
      label: 'Registered',
      render: (v) => formatDate(v.createdAt),
      export: (v) => v.createdAt,
    },
    {
      key: 'kycStatus',
      label: 'KYC',
      render: (v) => <StatusBadge status={v.kycStatus || 'Pending Review'} />,
    },
    { key: 'itemsCount', label: 'Items' },
    {
      key: 'paidOut',
      label: 'Earnings',
      render: (v) => formatINR((v.paidOut || 0) + (v.pendingPayout || 0)),
    },
    { key: 'rating', label: 'Rating', render: (v) => v.rating ?? '—' },
    {
      key: 'fraudScore',
      label: 'Risk',
      render: (v) => (
        <span className={v.fraudScore >= 60 ? 'font-semibold text-rose-600' : ''}>{v.fraudScore}</span>
      ),
    },
    {
      key: 'status',
      label: 'Account',
      render: (v) => <StatusBadge status={v.status} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (v) => (
        <div className="flex flex-wrap gap-1">
          <ActionBtn
            tone="ghost"
            onClick={() => {
              setSelected(v);
              setKycResult(null);
            }}
          >
            View
          </ActionBtn>
          <ActionBtn tone="sky" onClick={() => kycScan.mutate(v.id)}>
            AI KYC
          </ActionBtn>
          <ActionBtn tone="brand" onClick={() => decision.mutate({ id: v.id, decision: 'approve' })}>
            Approve
          </ActionBtn>
          <ActionBtn tone="amber" onClick={() => decision.mutate({ id: v.id, decision: 'reject' })}>
            Reject
          </ActionBtn>
          <ActionBtn
            tone="amber"
            onClick={() => api.updateVendor(v.id, { status: 'Suspended' }).then(refresh)}
          >
            Suspend
          </ActionBtn>
          <ActionBtn
            tone="rose"
            onClick={() => decision.mutate({ id: v.id, decision: 'blacklist' })}
          >
            Blacklist
          </ActionBtn>
          <ActionBtn tone="rose" onClick={() => api.deleteVendor(v.id).then(refresh)}>
            Remove
          </ActionBtn>
        </div>
      ),
    },
  ];

  const exportCols = columns.filter((c) => c.key !== 'actions');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vendor Management"
        subtitle="KYC workflow · risk scoring · account controls"
      />

      <StatGrid
        items={[
          { title: 'Total Vendors', value: vendors.length, accent: 'brand' },
          {
            title: 'Pending KYC',
            value: vendors.filter((v) => String(v.kycStatus).includes('Pending')).length,
            accent: 'amber',
          },
          {
            title: 'High Risk',
            value: vendors.filter((v) => v.fraudScore >= 60).length,
            accent: 'rose',
          },
          {
            title: 'Verified',
            value: vendors.filter((v) => v.verified).length,
            accent: 'sky',
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
              { value: 'Pending', label: 'Pending' },
              { value: 'Approved', label: 'Approved' },
              { value: 'Suspended', label: 'Suspended' },
              { value: 'Blacklisted', label: 'Blacklisted' },
            ],
          },
          {
            key: 'kyc',
            value: kycStatus,
            onChange: setKycStatus,
            options: [
              { value: '', label: 'All KYC' },
              { value: 'Verified', label: 'Verified' },
              { value: 'Pending Review', label: 'Pending Review' },
              { value: 'Suspicious', label: 'Suspicious' },
              { value: 'Fraud Detected', label: 'Fraud Detected' },
              { value: 'Blacklisted', label: 'Blacklisted' },
            ],
          },
        ]}
        onExport={() => exportCsv('vendors', vendors, exportCols)}
      />

      {error && <p className="text-rose-600">{error.message}</p>}
      {isLoading ? (
        <p className="text-ink-500">Loading vendors…</p>
      ) : (
        <Table columns={columns} rows={vendors} />
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-ink-200 bg-white p-6 shadow-xl dark:border-ink-700 dark:bg-ink-900">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-semibold">
                  {selected.company || selected.name}
                </h2>
                <p className="text-sm text-ink-500">
                  Vendor #{selected.id} · {selected.email}
                </p>
              </div>
              <button
                type="button"
                className="text-sm text-ink-500"
                onClick={() => {
                  setSelected(null);
                  setKycResult(null);
                }}
              >
                Close
              </button>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 text-sm">
              <Info label="Owner" value={selected.ownerName || selected.name} />
              <Info label="Phone" value={selected.phone} />
              <Info label="Location" value={selected.location || '—'} />
              <Info label="KYC Status" value={selected.kycStatus} />
              <Info label="Fraud Score" value={selected.fraudScore} />
              <Info label="Complaints" value={selected.complaintsCount ?? 0} />
              <Info label="Failed KYC attempts" value={selected.failedKycAttempts ?? 0} />
              <Info label="Notes" value={selected.kycNotes || '—'} />
            </div>

            <h3 className="mt-5 font-display text-base font-semibold">Documents</h3>
            <div className="relative mt-2 overflow-hidden rounded-xl border border-brand-500/20 bg-ink-950/5 p-3 dark:bg-ink-950/40">
              <div className="scan-beam" aria-hidden="true" />
              <ul className="relative z-[1] space-y-1 text-sm text-ink-600 dark:text-ink-300">
                <li>Aadhaar: {selected.aadhaarUrl || 'Missing'}</li>
                <li>PAN: {selected.panUrl || 'Missing'}</li>
                <li>License: {selected.licenseUrl || 'Missing'}</li>
                <li>Business cert: {selected.businessCertUrl || 'Missing'}</li>
                <li>GST: {selected.gstUrl || 'Optional / Missing'}</li>
              </ul>
              <p className="relative z-[1] mt-2 text-[11px] uppercase tracking-wider text-brand-600 dark:text-brand-300">
                AI Verification System · scanning lattice
              </p>
            </div>

            {kycResult && (
              <div
                className={`mt-4 rounded-xl border p-4 text-sm ${
                  kycResult.kycStatus === 'Fraud Detected' || kycResult.kycStatus === 'Suspicious'
                    ? 'border-rose-500/40 bg-rose-500/10 threat-pulse'
                    : 'border-brand-500/30 bg-brand-500/10'
                }`}
              >
                <p className="font-semibold">AI verification result: {kycResult.kycStatus}</p>
                <p className="mt-1 text-ink-600 dark:text-ink-300">{kycResult.summary}</p>
                <p className="mt-1">Avg authenticity: {kycResult.averageAuthenticity}%</p>
                <ul className="mt-2 space-y-1">
                  {(kycResult.documents || []).map((d) => (
                    <li key={d.key}>
                      {d.label}: {d.authenticity} ({d.score})
                      {d.issues?.length ? ` — ${d.issues.join(', ')}` : ''}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-5 flex flex-wrap gap-2">
              <ActionBtn tone="sky" onClick={() => kycScan.mutate(selected.id)}>
                Run AI KYC
              </ActionBtn>
              <ActionBtn
                tone="brand"
                onClick={() => decision.mutate({ id: selected.id, decision: 'approve' })}
              >
                Approve verification
              </ActionBtn>
              <ActionBtn
                tone="amber"
                onClick={() => decision.mutate({ id: selected.id, decision: 'request_docs' })}
              >
                Request documents
              </ActionBtn>
              <ActionBtn
                tone="rose"
                onClick={() => decision.mutate({ id: selected.id, decision: 'fraud' })}
              >
                Mark fraudulent
              </ActionBtn>
              <ActionBtn
                tone="ink"
                onClick={() => decision.mutate({ id: selected.id, decision: 'blacklist' })}
              >
                Blacklist
              </ActionBtn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-xl border border-ink-100 px-3 py-2 dark:border-ink-800">
      <p className="text-xs text-ink-400">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
