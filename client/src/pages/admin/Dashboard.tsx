import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, BadgeIndianRupee, Clock, ShoppingBag, Wallet } from 'lucide-react';
import { api } from '../../lib/api';
import type { AdminStats } from '../../types';
import { inr, number, relativeTime } from '../../lib/format';
import { Card, Spinner, StatusBadge } from '../../components/ui';

export default function Dashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = await api.get<AdminStats>('/admin/stats');
        if (mounted) setStats(data);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    const id = window.setInterval(load, 20000);
    return () => {
      mounted = false;
      window.clearInterval(id);
    };
  }, []);

  if (loading || !stats) return <Spinner label="Loading dashboard…" />;

  const cards = [
    { label: "Today's orders", value: number(stats.todayOrders), sub: `${number(stats.totalOrders)} total`, icon: ShoppingBag, tone: 'text-yellow' },
    { label: "Today's revenue", value: inr(stats.todayRevenue), sub: `${inr(stats.revenue)} total`, icon: BadgeIndianRupee, tone: 'text-emerald-300' },
    { label: 'Active orders', value: number(stats.activeOrders), sub: `${number(stats.pendingOrders)} pending`, icon: Clock, tone: 'text-orange' },
    { label: 'Pending payments', value: number(stats.pendingPayments), sub: `${number(stats.customers)} customers`, icon: Wallet, tone: 'text-orange' },
  ];

  const maxRevenue = Math.max(1, ...stats.series.map((d) => d.revenue));

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-4xl text-cream">Dashboard</h1>
          <p className="mt-1 text-sm text-muted">Live view of orders, revenue and kitchen activity.</p>
        </div>
        <Link to="/admin/orders" className="inline-flex items-center gap-1 text-sm font-semibold text-orange hover:underline">
          Manage orders <ArrowUpRight size={15} />
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.label} className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.16em] text-smoke">{card.label}</div>
                <div className={`mt-2 font-display text-4xl ${card.tone}`}>{card.value}</div>
                <div className="mt-1 text-xs text-muted">{card.sub}</div>
              </div>
              <div className="rounded-2xl border border-line bg-neumo p-2.5 text-orange shadow-neumo-inset-sm"><card.icon size={18} /></div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-2xl text-cream">Last 7 days</h2>
            <div className="text-xs text-smoke">Revenue from paid orders</div>
          </div>
          <div className="flex h-56 items-end gap-2 sm:gap-3">
            {stats.series.map((day) => (
              <div key={day.date} className="flex flex-1 flex-col items-center gap-2">
                <div className="w-full rounded-2xl border border-line bg-neumo p-1 shadow-neumo-inset-sm" style={{ height: '100%' }}>
                  <div className="flex h-full items-end">
                    <div
                      className="w-full rounded-xl bg-gradient-to-t from-orange to-yellow"
                      style={{ height: `${Math.max(8, (day.revenue / maxRevenue) * 100)}%` }}
                      title={`${day.label}: ${inr(day.revenue)} · ${day.orders} orders`}
                    />
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">{day.label}</div>
                  <div className="text-[10px] text-smoke">{day.orders} orders</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <h2 className="mb-4 text-2xl text-cream">Popular right now</h2>
          <ul className="space-y-3">
            {stats.popularProducts.length ? stats.popularProducts.map((item, index) => (
              <li key={item._id} className="flex items-center gap-3 rounded-2xl border border-line bg-neumo/40 p-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-neumo text-xs font-bold text-yellow shadow-neumo-inset-sm">{index + 1}</span>
                {item.image ? <img src={item.image} alt={item._id} className="h-10 w-10 rounded-xl border border-line object-cover" /> : null}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-cream">{item._id}</div>
                  <div className="text-xs text-smoke">{number(item.quantity)} sold · {inr(item.revenue)}</div>
                </div>
              </li>
            )) : <p className="text-sm text-muted">No order data yet.</p>}
          </ul>
          <div className="mt-5 grid grid-cols-2 gap-3 border-t border-line pt-4 text-sm">
            <div className="rounded-2xl border border-line bg-neumo p-3 shadow-neumo-inset-sm"><div className="text-xs text-smoke">Avg order</div><div className="font-display text-2xl text-cream">{inr(stats.avgOrderValue)}</div></div>
            <div className="rounded-2xl border border-line bg-neumo p-3 shadow-neumo-inset-sm"><div className="text-xs text-smoke">Unread messages</div><div className="font-display text-2xl text-cream">{number(stats.unreadMessages)}</div></div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="text-2xl text-cream">Recent orders</h2>
            <Link to="/admin/orders" className="text-sm font-semibold text-orange hover:underline">View all</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-neumo/50 text-xs uppercase tracking-[0.14em] text-smoke">
                <tr>
                  <th className="px-5 py-3">Order</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Total</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Payment</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentOrders.map((order: any) => (
                  <tr key={order.id || order.orderNumber} className="border-t border-line">
                    <td className="px-5 py-3 font-semibold text-cream">{order.orderNumber}<div className="text-xs font-normal text-smoke">{relativeTime(order.createdAt)}</div></td>
                    <td className="px-5 py-3 text-muted">{order.customer?.name}<div className="text-xs text-smoke">{order.customer?.phone}</div></td>
                    <td className="px-5 py-3 font-semibold text-yellow">{inr(order.pricing?.total || 0)}</td>
                    <td className="px-5 py-3"><StatusBadge status={order.status} /></td>
                    <td className="px-5 py-3"><StatusBadge status={order.paymentStatus} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <h2 className="mb-4 text-2xl text-cream">Quick stats</h2>
          <div className="space-y-3 text-sm">
            {[
              { label: 'Completed orders', value: stats.completedOrders },
              { label: 'Cancelled orders', value: stats.cancelledOrders },
              { label: 'Products', value: `${stats.products} (${stats.unavailableProducts} unavailable)` },
              { label: 'Customers', value: stats.customers },
              { label: 'Pending UPI verifications', value: stats.pendingPayments },
              { label: 'Unread messages', value: stats.unreadMessages },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between rounded-2xl border border-line bg-neumo px-4 py-3 shadow-neumo-inset-sm">
                <span className="text-muted">{row.label}</span>
                <span className="font-semibold text-cream">{typeof row.value === 'number' ? number(row.value) : row.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
