import { useEffect, useState } from 'react';
import { Activity, Clock, Flame, RefreshCw } from 'lucide-react';
import type { Crispy } from '../../types';
import { api } from '../../lib/api';
import { relativeTime } from '../../lib/format';

export default function CrispyMeter({
  initial,
  compact = false,
  poll = true,
}: {
  initial?: Crispy | null;
  compact?: boolean;
  poll?: boolean;
}) {
  const [data, setData] = useState<Crispy | null>(initial || null);
  const [loading, setLoading] = useState(!initial);

  const load = async () => {
    try {
      const next = await api.get<Crispy>('/crispy-meter');
      setData(next);
    } catch {
      // keep last data
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!initial) load();
  }, []);

  useEffect(() => {
    if (!poll) return;
    const id = window.setInterval(load, 15000);
    return () => window.clearInterval(id);
  }, [poll]);

  if (loading || !data) {
    return (
      <div className="rounded-3xl border border-line bg-card p-6 shadow-neumo-raised-sm">
        <div className="h-6 w-40 animate-pulse rounded bg-neumo" />
        <div className="mt-4 h-24 animate-pulse rounded-2xl bg-neumo" />
      </div>
    );
  }

  const toneColor =
    data.tone === 'ready'
      ? 'text-emerald-300'
      : data.tone === 'warming'
      ? 'text-yellow'
      : data.tone === 'busy'
      ? 'text-orange'
      : 'text-orange';

  const gauge = Math.min(100, data.load);

  return (
    <div className={`relative overflow-hidden rounded-3xl border border-line bg-card p-5 shadow-neumo-raised-sm sm:p-6 ${compact ? '' : ''}`}>
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-orange/10 blur-2xl" />
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="eyebrow">
            <Activity size={12} /> Live Crispy Meter
          </div>
          <h3 className={`mt-3 font-display text-3xl sm:text-4xl ${toneColor}`}>{data.status}</h3>
          <p className="mt-1 text-xs text-smoke">Calculated from real kitchen orders · updated {relativeTime(data.updatedAt)}</p>
        </div>
        <button
          type="button"
          onClick={load}
          className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-line bg-neumo text-muted shadow-neumo-raised-sm transition hover:text-orange active:shadow-neumo-inset-sm"
          aria-label="Refresh crispy meter"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.14em] text-muted">
          <span>Kitchen load</span>
          <span className={toneColor}>{gauge}%</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-neumo shadow-neumo-inset-sm">
          <div
            className="h-full rounded-full bg-gradient-to-r from-yellow via-orange to-orange transition-all duration-700"
            style={{ width: `${gauge}%` }}
          />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        {[
          { label: 'In queue', value: data.queue, icon: Flame },
          { label: 'Avg wait', value: `${data.avgWait}m`, icon: Clock },
          { label: 'Active', value: data.activeOrders, icon: Activity },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-line bg-neumo p-3 text-center shadow-neumo-inset-sm">
            <item.icon size={15} className="mx-auto mb-1 text-orange" />
            <div className="font-display text-2xl text-cream">{item.value}</div>
            <div className="text-[10px] uppercase tracking-[0.16em] text-smoke">{item.label}</div>
          </div>
        ))}
      </div>

      {!compact && data.orders.length > 0 ? (
        <div className="mt-5 space-y-2">
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">In the kitchen now</div>
          <div className="flex flex-wrap gap-2">
            {data.orders.map((order) => (
              <span
                key={order.orderNumber}
                className="rounded-full border border-line bg-neumo px-3 py-1 text-[11px] text-muted"
              >
                <span className="font-semibold text-cream">{order.orderNumber}</span> · {order.status.replace('_', ' ')}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
