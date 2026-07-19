import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { vendorApi } from '../../services/vendorApi';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const LEGEND = [
  { key: 'booked', label: 'Booked', className: 'marker-booked' },
  { key: 'pickup', label: 'Pick up', className: 'marker-pickup' },
  { key: 'latePickup', label: 'Late Pick up', className: 'marker-late-pickup' },
  { key: 'lateDelivery', label: 'Late Delivery', className: 'marker-late-delivery' },
];

const LIST_COLORS = [
  'text-emerald-500',
  'text-amber-500',
  'text-violet-400',
  'text-rose-400',
  'text-sky-400',
  'text-brand-400',
];

const STATUSES = ['Requested', 'Approved', 'Active', 'Return Pending', 'Overdue', 'Completed', 'Cancelled'];

function toDateKey(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function startOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function parseKey(key) {
  const [y, m, day] = key.split('-').map(Number);
  return new Date(y, m - 1, day);
}

function availabilityLabel(rental) {
  if (rental.status === 'Completed' || rental.status === 'Cancelled') return 'Available';
  if (['Requested', 'Approved', 'Active', 'Return Pending', 'Overdue'].includes(rental.status)) {
    return 'Booked';
  }
  return rental.status || 'Available';
}

function markersForRental(rental, dayKey, todayKey) {
  const markers = new Set();
  const start = toDateKey(rental.scheduledPickup || rental.startDate);
  const end = toDateKey(rental.scheduledReturn || rental.returnDate);
  const pickupDone = rental.pickupStatus === 'Completed' || Boolean(rental.pickupAt);
  const returnDone = rental.returnStatus === 'Completed' || Boolean(rental.returnedAt);
  const cancelled = rental.status === 'Cancelled' || rental.status === 'Completed';

  if (cancelled) return markers;

  if (start && end && dayKey >= start && dayKey <= end) {
    markers.add('booked');
  }

  if (start === dayKey && !pickupDone) {
    markers.add('pickup');
    if (dayKey < todayKey) markers.add('latePickup');
  }

  if (
    end === dayKey &&
    !returnDone &&
    (rental.fulfillment === 'delivery' || rental.status === 'Overdue' || rental.status === 'Return Pending')
  ) {
    if (dayKey < todayKey || rental.status === 'Overdue') {
      markers.add('lateDelivery');
    }
  }

  if (rental.status === 'Overdue' && end && dayKey >= end) {
    markers.add('lateDelivery');
  }

  return markers;
}

function buildMonthCells(year, month) {
  const first = new Date(year, month, 1);
  const startPad = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];

  for (let i = 0; i < startPad; i += 1) {
    cells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(year, month, day));
  }
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }
  return cells;
}

function orderCode(id) {
  return `S${String(id).padStart(4, '0')}`;
}

export default function VendorRentalScheduler({ rentals = [], isLoading, error }) {
  const queryClient = useQueryClient();
  const today = startOfDay(new Date());
  const todayKey = toDateKey(today);

  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedKey, setSelectedKey] = useState(todayKey);
  const [editingId, setEditingId] = useState(null);
  const [msg, setMsg] = useState('');

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const cells = useMemo(() => buildMonthCells(year, month), [year, month]);

  const monthOptions = useMemo(() => {
    const opts = [];
    const base = new Date(today.getFullYear(), today.getMonth() - 6, 1);
    for (let i = 0; i < 18; i += 1) {
      const d = new Date(base.getFullYear(), base.getMonth() + i, 1);
      opts.push({
        value: `${d.getFullYear()}-${d.getMonth()}`,
        label: `${MONTHS[d.getMonth()]} ${d.getFullYear()}`,
      });
    }
    return opts;
  }, [today]);

  const dayMap = useMemo(() => {
    const map = new Map();
    rentals.forEach((rental) => {
      const start = toDateKey(rental.scheduledPickup || rental.startDate);
      const end = toDateKey(rental.scheduledReturn || rental.returnDate);
      if (!start && !end) return;

      const from = start || end;
      const to = end || start;
      let cursorKey = from;
      while (cursorKey <= to) {
        if (!map.has(cursorKey)) map.set(cursorKey, []);
        const markers = markersForRental(rental, cursorKey, todayKey);
        map.get(cursorKey).push({ rental, markers });
        const next = parseKey(cursorKey);
        next.setDate(next.getDate() + 1);
        cursorKey = toDateKey(next);
      }
    });
    return map;
  }, [rentals, todayKey]);

  const selectedEntries = dayMap.get(selectedKey) || [];

  const updateStatus = useMutation({
    mutationFn: ({ id, status }) => vendorApi.updateRentalStatus(id, status),
    onSuccess: () => {
      setMsg('Order status updated');
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ['vendor', 'rentals'] });
    },
    onError: (e) => setMsg(e.message),
  });

  const shiftMonth = (delta) => {
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold text-ink-900 dark:text-white">
            Rental Scheduler
          </h2>
          <p className="text-sm text-ink-500">Monthly view of booked pickups and returns</p>
        </div>
        <button
          type="button"
          className="rounded-xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-600"
          onClick={() => {
            setMsg('New bookings are created when customers checkout. Select a day to review or edit existing orders.');
            setSelectedKey(todayKey);
            setCursor(new Date(today.getFullYear(), today.getMonth(), 1));
          }}
        >
          New
        </button>
      </div>

      {msg && <p className="text-sm text-brand-700 dark:text-brand-300">{msg}</p>}
      {error && <p className="text-sm text-rose-600">{error.message}</p>}

      <div className="grid gap-4 xl:grid-cols-[11rem_minmax(0,1fr)_minmax(16rem,22rem)]">
        {/* Legend */}
        <aside className="glass-panel rounded-2xl p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-500">Legend</p>
          <ul className="space-y-3">
            {LEGEND.map((item) => (
              <li key={item.key} className="flex items-center gap-3 text-sm text-ink-700 dark:text-ink-200">
                <span className={`scheduler-marker ${item.className}`} aria-hidden />
                {item.label}
              </li>
            ))}
          </ul>
        </aside>

        {/* Calendar */}
        <section className="glass-panel rounded-2xl p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Previous month"
                className="rounded-lg border border-ink-200 px-2 py-1 text-sm dark:border-ink-700"
                onClick={() => shiftMonth(-1)}
              >
                ‹
              </button>
              <select
                className="input-living rounded-xl px-3 py-2 text-sm font-medium"
                value={`${year}-${month}`}
                onChange={(e) => {
                  const [y, m] = e.target.value.split('-').map(Number);
                  setCursor(new Date(y, m, 1));
                }}
                aria-label="Month"
              >
                {monthOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                aria-label="Next month"
                className="rounded-lg border border-ink-200 px-2 py-1 text-sm dark:border-ink-700"
                onClick={() => shiftMonth(1)}
              >
                ›
              </button>
            </div>
            <button
              type="button"
              className="text-xs font-medium text-brand-700 dark:text-brand-300"
              onClick={() => {
                setCursor(new Date(today.getFullYear(), today.getMonth(), 1));
                setSelectedKey(todayKey);
              }}
            >
              Today
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-ink-500">
            {WEEKDAYS.map((d, i) => (
              <div key={`${d}-${i}`} className="py-2">
                {d}
              </div>
            ))}
          </div>

          {isLoading ? (
            <p className="py-10 text-center text-sm text-ink-500">Loading schedule…</p>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {cells.map((date, idx) => {
                if (!date) {
                  return <div key={`empty-${idx}`} className="min-h-[4.25rem] rounded-xl" />;
                }
                const key = toDateKey(date);
                const entries = dayMap.get(key) || [];
                const markerKeys = new Set();
                entries.forEach((e) => e.markers.forEach((m) => markerKeys.add(m)));
                const isSelected = key === selectedKey;
                const isToday = key === todayKey;

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedKey(key)}
                    className={`flex min-h-[4.25rem] flex-col items-center rounded-xl border px-1 py-2 transition ${
                      isSelected
                        ? 'border-rose-500 bg-ink-100/80 dark:border-rose-400 dark:bg-ink-800/80'
                        : isToday
                          ? 'border-ink-300 bg-ink-50 dark:border-ink-600 dark:bg-ink-900/60'
                          : 'border-transparent hover:bg-ink-50 dark:hover:bg-ink-900/40'
                    }`}
                  >
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-lg text-sm font-medium ${
                        isToday && !isSelected
                          ? 'bg-ink-200 text-ink-900 dark:bg-ink-700 dark:text-white'
                          : 'text-ink-800 dark:text-ink-100'
                      }`}
                    >
                      {date.getDate()}
                    </span>
                    <div className="mt-1 flex min-h-[0.65rem] flex-wrap items-center justify-center gap-0.5">
                      {LEGEND.filter((l) => markerKeys.has(l.key)).map((l) => (
                        <span key={l.key} className={`scheduler-marker ${l.className}`} />
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Day order list */}
        <aside className="glass-panel flex flex-col rounded-2xl p-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-ink-500">
            {selectedKey
              ? parseKey(selectedKey).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })
              : 'Orders'}
          </p>
          <p className="mb-4 text-sm text-ink-600 dark:text-ink-300">
            {selectedEntries.length} order{selectedEntries.length === 1 ? '' : 's'}
          </p>

          <ul className="flex-1 space-y-3 overflow-y-auto">
            {selectedEntries.length === 0 && (
              <li className="text-sm text-ink-500">No rentals on this day.</li>
            )}
            {selectedEntries.map(({ rental }, index) => {
              const avail = availabilityLabel(rental);
              const units = rental.quantity || 1;
              return (
                <li
                  key={rental.id}
                  className="rounded-xl border border-ink-200/70 bg-white/40 p-3 dark:border-ink-700 dark:bg-ink-950/40"
                >
                  <div className="flex items-start gap-2">
                    <p className={`flex-1 text-sm font-medium leading-snug ${LIST_COLORS[index % LIST_COLORS.length]}`}>
                      {orderCode(rental.id)}: {rental.productName || 'Item'},{' '}
                      {rental.customerName || 'Customer'}, {units} Unit
                      {units === 1 ? '' : 's'} ({avail})
                    </p>
                    <button
                      type="button"
                      aria-label={`Edit order ${rental.id}`}
                      className="shrink-0 rounded-lg p-1.5 text-ink-500 hover:bg-ink-100 hover:text-ink-800 dark:hover:bg-ink-800 dark:hover:text-ink-100"
                      onClick={() => setEditingId(editingId === rental.id ? null : rental.id)}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                        <path
                          d="M4 20h4l10.5-10.5a1.5 1.5 0 0 0-2.12-2.12L5.88 17.88 4 20Z"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinejoin="round"
                        />
                        <path d="M13.5 6.5l4 4" stroke="currentColor" strokeWidth="1.6" />
                      </svg>
                    </button>
                  </div>
                  {editingId === rental.id && (
                    <div className="mt-2 flex items-center gap-2">
                      <select
                        className="input-living flex-1 rounded-lg px-2 py-1.5 text-xs"
                        defaultValue={rental.status}
                        onChange={(e) => {
                          if (e.target.value !== rental.status) {
                            updateStatus.mutate({ id: rental.id, status: e.target.value });
                          }
                        }}
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          <p className="mt-4 text-[11px] leading-relaxed text-ink-400">
            Status in brackets shows product availability for that order.
          </p>
        </aside>
      </div>

      <style>{`
        .scheduler-marker {
          display: inline-block;
          width: 0.55rem;
          height: 0.55rem;
          border-radius: 9999px;
          flex-shrink: 0;
        }
        .marker-booked {
          border: 2px solid #f59e0b;
          background: transparent;
        }
        .marker-pickup {
          background: #f43f5e;
          border: 2px solid #f43f5e;
        }
        .marker-late-pickup {
          border: 2px solid #f43f5e;
          background: transparent;
        }
        .marker-late-delivery {
          border: 2px solid #f97316;
          background: radial-gradient(circle, #f43f5e 35%, transparent 40%);
        }
      `}</style>
    </div>
  );
}
