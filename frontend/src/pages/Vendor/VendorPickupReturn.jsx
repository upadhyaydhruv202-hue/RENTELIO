import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Table, { StatusBadge } from '../../components/Table';
import { formatDate } from '../../services/api';
import { vendorApi } from '../../services/vendorApi';
import { POLL_MS } from '../../lib/query';
import { useLocale } from '../../context/LocaleContext';

const STAGES = [
  'Pickup Scheduled',
  'Pickup Assigned',
  'Out For Pickup',
  'Picked Up',
  'Rental Active',
  'Return Scheduled',
  'Returned',
  'Inspection',
  'Completed',
];

const FILTERS = ['today', 'tomorrow', 'week', 'month'];

export default function VendorPickupReturn() {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('week');
  const [otpDrafts, setOtpDrafts] = useState({});
  const [msg, setMsg] = useState('');
  const [scanCode, setScanCode] = useState('');
  const [scanResult, setScanResult] = useState(null);

  const { data: rows = [], isLoading, error } = useQuery({
    queryKey: ['vendor', 'pickup', filter],
    queryFn: () => vendorApi.getSchedule({ filter }),
    refetchInterval: POLL_MS,
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['vendor', 'pickup'] });

  const genMutation = useMutation({
    mutationFn: vendorApi.generateOtps,
    onSuccess: refresh,
  });

  const verifyPickup = useMutation({
    mutationFn: ({ id, otp }) => vendorApi.verifyPickupOtp(id, otp),
    onSuccess: () => {
      setMsg('Pickup OTP verified');
      refresh();
    },
    onError: (e) => setMsg(e.message),
  });

  const verifyReturn = useMutation({
    mutationFn: ({ id, otp }) => vendorApi.verifyReturnOtp(id, { otp }),
    onSuccess: () => {
      setMsg('Return OTP verified');
      refresh();
    },
    onError: (e) => setMsg(e.message),
  });

  const advance = useMutation({
    mutationFn: ({ id, stage }) => vendorApi.advanceTracker(id, stage),
    onSuccess: refresh,
    onError: (e) => setMsg(e.message),
  });

  const scanMutation = useMutation({
    mutationFn: (code) => vendorApi.scan(code),
    onSuccess: (data) => {
      setScanResult(data);
      setMsg(data.message || 'Scan matched');
    },
    onError: (e) => {
      setScanResult(null);
      setMsg(e.message);
    },
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
        <div className="flex min-w-[240px] flex-col gap-2">
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
              <option value="">Advance stage…</option>
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
              OTPs — Pickup: {r.pickupOtp || '—'} · Return: {r.returnOtp || '—'}
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
          <h1 className="font-display text-2xl font-semibold">{t('vPickupTitle')}</h1>
          <p className="text-sm text-ink-500">Schedule, OTP verify, tracker stages & demo scan</p>
        </div>
        <div className="flex flex-wrap gap-1">
          {FILTERS.map((f) => (
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

      <div className="flex flex-wrap items-end gap-2 rounded-2xl border border-ink-200/80 bg-white p-4 dark:border-ink-700 dark:bg-ink-900">
        <label className="flex-1 text-sm font-medium text-ink-600 dark:text-ink-300">
          Demo scan (rental ID or code)
          <input
            value={scanCode}
            onChange={(e) => setScanCode(e.target.value)}
            placeholder="e.g. RENT-42 or 42"
            className="mt-1.5 w-full rounded-xl border border-ink-200 px-3 py-2 text-sm dark:border-ink-700 dark:bg-ink-950"
          />
        </label>
        <button
          type="button"
          disabled={!scanCode.trim() || scanMutation.isPending}
          onClick={() => scanMutation.mutate(scanCode.trim())}
          className="rounded-xl bg-brand-600 px-4 py-2 text-sm text-white hover:bg-brand-500 disabled:opacity-60"
        >
          Scan
        </button>
      </div>

      {scanResult?.checklist && (
        <div className="rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm dark:border-brand-800 dark:bg-brand-950/30">
          <p className="font-medium text-brand-800 dark:text-brand-200">Scan checklist</p>
          <ul className="mt-2 list-inside list-disc text-ink-600 dark:text-ink-300">
            {scanResult.checklist.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          {scanResult.rental && (
            <p className="mt-2 text-xs text-ink-500">
              Matched rental #{scanResult.rental.id} — {scanResult.rental.productName}
            </p>
          )}
        </div>
      )}

      {msg && <p className="text-sm text-brand-700 dark:text-brand-300">{msg}</p>}
      {error && <p className="text-rose-600">{error.message}</p>}
      {isLoading ? (
        <p className="text-ink-500">Loading schedule…</p>
      ) : (
        <Table columns={columns} rows={rows} />
      )}
    </div>
  );
}
