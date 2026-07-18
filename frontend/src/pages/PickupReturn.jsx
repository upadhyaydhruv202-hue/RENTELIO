import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Table, { StatusBadge } from '../components/Table';
import { api, formatDate } from '../services/api';
import { invalidateLifecycle, POLL_MS, qk } from '../lib/query';

const STAGES = [
  'Pickup Assigned',
  'Driver En Route',
  'Picked Up',
  'Delivered',
  'Returned',
  'Inspection Completed',
];

export default function PickupReturn() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('week');
  const [otpDrafts, setOtpDrafts] = useState({});
  const [msg, setMsg] = useState('');

  const { data: rows = [], isLoading, error } = useQuery({
    queryKey: qk.adminPickup(filter),
    queryFn: () => api.getPickupSchedule({ filter }),
    refetchInterval: POLL_MS,
  });

  const refresh = () => invalidateLifecycle(queryClient);

  const genMutation = useMutation({
    mutationFn: api.generateOtps,
    onSuccess: refresh,
  });

  const verifyPickup = useMutation({
    mutationFn: ({ id, otp }) => api.verifyPickupOtp(id, otp),
    onSuccess: () => {
      setMsg('Pickup OTP verified');
      refresh();
    },
    onError: (e) => setMsg(e.message),
  });

  const verifyReturn = useMutation({
    mutationFn: ({ id, otp }) => api.verifyReturnOtp(id, otp),
    onSuccess: () => {
      setMsg('Return OTP verified');
      refresh();
    },
    onError: (e) => setMsg(e.message),
  });

  const advance = useMutation({
    mutationFn: ({ id, stage }) => api.advanceTracker(id, stage),
    onSuccess: refresh,
    onError: (e) => setMsg(e.message),
  });

  const columns = [
    { key: 'id', label: 'ID', render: (r) => `#${r.id}` },
    { key: 'customerName', label: 'Customer' },
    { key: 'productName', label: 'Product' },
    {
      key: 'scheduledPickup',
      label: 'Pickup',
      render: (r) => formatDate(r.scheduledPickup || r.startDate),
    },
    {
      key: 'scheduledReturn',
      label: 'Return',
      render: (r) => formatDate(r.scheduledReturn || r.returnDate),
    },
    {
      key: 'trackerStage',
      label: 'Tracker',
      render: (r) => <StatusBadge status={r.trackerStage || '—'} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (r) => (
        <div className="flex min-w-[220px] flex-col gap-2">
          <div className="flex flex-wrap gap-1">
            <button
              type="button"
              className="rounded-lg bg-ink-100 px-2 py-1 text-xs dark:bg-ink-800"
              onClick={() => genMutation.mutate(r.id)}
            >
              Gen OTP
            </button>
            <select
              className="rounded-lg border border-ink-200 px-1 py-1 text-xs dark:border-ink-700 dark:bg-ink-950"
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) advance.mutate({ id: r.id, stage: e.target.value });
              }}
            >
              <option value="">Advance…</option>
              {STAGES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-1">
            <input
              className="w-20 rounded border border-ink-200 px-1 text-xs dark:border-ink-700 dark:bg-ink-950"
              placeholder="OTP"
              value={otpDrafts[r.id] || ''}
              onChange={(e) => setOtpDrafts((d) => ({ ...d, [r.id]: e.target.value }))}
            />
            <button
              type="button"
              className="rounded bg-sky-600 px-2 text-xs text-white"
              onClick={() => verifyPickup.mutate({ id: r.id, otp: otpDrafts[r.id] })}
            >
              Pickup
            </button>
            <button
              type="button"
              className="rounded bg-brand-600 px-2 text-xs text-white"
              onClick={() => verifyReturn.mutate({ id: r.id, otp: otpDrafts[r.id] })}
            >
              Return
            </button>
          </div>
          {(r.pickupOtp || r.returnOtp) && (
            <p className="text-[10px] text-ink-400">
              Demo OTPs: {r.pickupOtp || '—'} / {r.returnOtp || '—'}
            </p>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Pickup & Return</h1>
          <p className="text-sm text-ink-500">Schedule, OTP verify, and tracker stages</p>
        </div>
        <div className="flex gap-1">
          {['today', 'tomorrow', 'week'].map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-1.5 text-sm capitalize ${
                filter === f ? 'bg-brand-600 text-white' : 'bg-ink-100 dark:bg-ink-800'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {msg && <p className="text-sm text-brand-700">{msg}</p>}
      {error && <p className="text-rose-600">{error.message}</p>}
      {isLoading ? (
        <p className="text-ink-500">Loading schedule…</p>
      ) : (
        <Table columns={columns} rows={rows} />
      )}
    </div>
  );
}
