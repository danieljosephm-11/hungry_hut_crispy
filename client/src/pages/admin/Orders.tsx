import { useEffect, useState } from 'react';
import { api, errorMessage } from '../../lib/api';
import type { Order } from '../../types';
import { useToast } from '../../context/ToastContext';
import { inr, dateTime, titleCase } from '../../lib/format';
import { Badge, Button, Card, Input, Modal, Select, StatusBadge, Textarea } from '../../components/ui';
import { DataTable, PageHeader, Td } from '../../components/admin/AdminBits';

const STATUSES = ['placed','confirmed','preparing','ready','out_for_delivery','completed','cancelled'];
const PAY_STATUSES = ['unpaid','pending','paid','failed','refunded'];

export default function OrdersAdmin() {
  const [items, setItems] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('all');
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState<any | null>(null);
  const [detail, setDetail] = useState<any | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const { success, error } = useToast();

  const load = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (status !== 'all') params.set('status', status);
      if (q.trim()) params.set('q', q.trim());
      params.set('limit', '100');
      const data = await api.get<{ items: Order[] }>(`/admin/orders?${params.toString()}`);
      setItems(data.items || []);
    } catch (err) { error(errorMessage(err)); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [status]);

  const getId = (o: any) => o?.id || o?._id;

  const openDetail = async (order: Order) => {
    setSelected({ ...order, id: getId(order) } as any);
    try {
      const data = await api.get<any>(`/admin/orders/${getId(order)}`);
      if (data?.order) data.order.id = getId(data.order);
      setDetail(data);
    } catch (err) { error(errorMessage(err)); }
  };

  const updateStatus = async (id: string, next: string) => {
    try {
      setBusy(true);
      await api.patch(`/admin/orders/${id}/status`, { status: next });
      success('Order status updated.');
      load();
      if (getId(detail?.order) === id || getId(selected) === id) openDetail({ id } as any);
    } catch (err) { error(errorMessage(err)); } finally { setBusy(false); }
  };

  const updatePayment = async (id: string, next: string) => {
    try {
      setBusy(true);
      await api.patch(`/admin/orders/${id}/payment`, { status: next, notes: note });
      success('Payment status updated.');
      setNote('');
      load();
      if (getId(detail?.order) === id || getId(selected) === id) openDetail({ id } as any);
    } catch (err) { error(errorMessage(err)); } finally { setBusy(false); }
  };

  const order = detail?.order ? { ...detail.order, id: getId(detail.order) } : selected;
  const payment = detail?.payment;

  return (
    <div>
      <PageHeader title="Orders" description="Track, update and fulfil every Hungry Hut order." />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search order #, name, phone…" className="max-w-sm" />
        <Button variant="outline" onClick={load}>Search</Button>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-48 py-2.5">
          <option value="all">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
        </Select>
      </div>

      {loading ? <div className="py-20 text-center text-muted">Loading…</div> : (
        <DataTable head={['Order', 'Customer', 'Items', 'Total', 'Status', 'Payment', 'Placed', 'Actions']}>
          {items.map((o: any) => (
            <tr key={o.id || o._id}>
              <Td className="font-semibold text-cream">{o.orderNumber}<div className="text-xs font-normal text-smoke">{titleCase(o.fulfilment?.type || '')}</div></Td>
              <Td><div className="text-cream">{o.customer?.name}</div><div className="text-xs text-smoke">{o.customer?.phone}</div></Td>
              <Td className="text-muted">{o.items?.length || 0}</Td>
              <Td className="font-semibold text-yellow">{inr(o.pricing?.total || 0)}</Td>
              <Td><StatusBadge status={o.status} /></Td>
              <Td><StatusBadge status={o.paymentStatus} /></Td>
              <Td className="text-xs text-smoke">{dateTime(o.createdAt)}</Td>
              <Td>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => openDetail(o)}>View</Button>
                </div>
              </Td>
            </tr>
          ))}
          {!items.length ? <tr><td colSpan={8} className="px-5 py-10 text-center text-muted">No orders found.</td></tr> : null}
        </DataTable>
      )}

      <Modal open={!!selected} onClose={() => { setSelected(null); setDetail(null); }} title={order ? `Order ${order.orderNumber}` : 'Order'} wide>
        {order ? (
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2"><StatusBadge status={order.status} /><StatusBadge status={order.paymentStatus} /><Badge tone="muted">{titleCase(order.paymentMethod)}</Badge></div>
              <Card className="p-4">
                <h4 className="mb-3 text-lg text-cream">Items</h4>
                <ul className="space-y-2 text-sm">
                  {(order.items || []).map((item: any, i: number) => (
                    <li key={i} className="flex justify-between gap-4 border-b border-line pb-2 last:border-0">
                      <span className="text-muted"><span className="text-cream">{item.quantity}×</span> {item.name}</span>
                      <span className="font-semibold text-yellow">{inr(item.lineTotal)}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 space-y-1 border-t border-line pt-3 text-sm">
                  <div className="flex justify-between text-muted"><span>Subtotal</span><span>{inr(order.pricing?.subtotal || 0)}</span></div>
                  <div className="flex justify-between text-muted"><span>Discount</span><span>-{inr(order.pricing?.discount || 0)}</span></div>
                  <div className="flex justify-between text-muted"><span>Delivery</span><span>{inr(order.pricing?.deliveryFee || 0)}</span></div>
                  <div className="flex justify-between text-muted"><span>Tax</span><span>{inr(order.pricing?.tax || 0)}</span></div>
                  <div className="flex justify-between font-bold text-cream"><span>Total</span><span className="text-yellow">{inr(order.pricing?.total || 0)}</span></div>
                </div>
              </Card>
              <Card className="p-4 text-sm text-muted">
                <div className="font-semibold text-cream">{order.customer?.name}</div>
                <div>{order.customer?.phone} {order.customer?.email ? `· ${order.customer.email}` : ''}</div>
                {order.fulfilment?.address?.line1 ? <div className="mt-2">{[order.fulfilment.address.line1, order.fulfilment.address.city, order.fulfilment.address.pincode].filter(Boolean).join(', ')}</div> : <div className="mt-2">Pickup</div>}
                {order.notes ? <div className="mt-2 text-yellow">Note: {order.notes}</div> : null}
              </Card>
              {order.timeline?.length ? (
                <Card className="p-4">
                  <h4 className="mb-2 text-lg text-cream">Timeline</h4>
                  <ul className="space-y-2 text-xs text-muted">{[...order.timeline].reverse().map((t: any, i: number) => <li key={i}><span className="font-semibold text-cream">{titleCase(t.status || '')}</span> — {t.note} <span className="text-smoke">({dateTime(t.at)})</span></li>)}</ul>
                </Card>
              ) : null}
            </div>
            <div className="space-y-4">
              <Card className="p-4">
                <h4 className="mb-3 text-lg text-cream">Update order status</h4>
                <div className="grid grid-cols-2 gap-2">
                  {STATUSES.map((s) => (
                    <button key={s} type="button" disabled={busy || order.status === s} onClick={() => updateStatus(getId(order), s)} className={`rounded-xl border px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] transition ${order.status === s ? 'border-yellow bg-yellow text-ink' : 'border-line bg-neumo/70 text-muted hover:text-cream disabled:opacity-40'}`}>{titleCase(s)}</button>
                  ))}
                </div>
              </Card>
              <Card className="p-4">
                <h4 className="mb-3 text-lg text-cream">Payment</h4>
                <div className="mb-3 text-sm text-muted space-y-1">
                  <div>Method: <span className="text-cream">{titleCase(order.paymentMethod)}</span></div>
                  <div>Status: <StatusBadge status={order.paymentStatus} /></div>
                  <div>UTR: <span className="text-cream break-all">{order.payment?.utr || payment?.utr || '—'}</span></div>
                  {(order.payment?.screenshotUrl || payment?.screenshotUrl) ? <a href={order.payment?.screenshotUrl || payment?.screenshotUrl} target="_blank" rel="noreferrer" className="text-yellow underline">View screenshot</a> : null}
                </div>
                <Textarea label="Verification note (optional)" value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
                <div className="mt-3 flex flex-wrap gap-2">
                  {PAY_STATUSES.map((s) => (
                    <Button key={s} size="sm" variant={s === 'paid' ? 'primary' : s === 'failed' || s === 'refunded' ? 'danger' : 'ghost'} disabled={busy} onClick={() => updatePayment(getId(order), s)}>{titleCase(s)}</Button>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        ) : <div className="py-10 text-center text-muted">Loading order…</div>}
      </Modal>
    </div>
  );
}
