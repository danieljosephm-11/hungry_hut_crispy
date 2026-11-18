import { useEffect, useState } from 'react';
import { api, errorMessage } from '../../lib/api';
import type { Order } from '../../types';
import { useToast } from '../../context/ToastContext';
import { inr, dateTime, titleCase } from '../../lib/format';
import { Button, Select, StatusBadge } from '../../components/ui';
import { DataTable, PageHeader, Td } from '../../components/admin/AdminBits';

export default function PaymentsAdmin() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [busy, setBusy] = useState<string | null>(null);
  const { success, error } = useToast();
  const getId = (x: any) => x?.id || x?._id;

  const load = async () => {
    try {
      setLoading(true);
      const qs = filter !== 'all' ? `?status=${filter}` : '';
      const data = await api.get<any[]>(`/admin/payments${qs}`);
      setItems((data as any[]).map((p) => ({ ...p, id: getId(p) })));
    } catch (err) { error(errorMessage(err)); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [filter]);

  const mark = async (payment: any, status: string) => {
    if (!payment.order) return error('Missing order reference.');
    try {
      setBusy(getId(payment));
      await api.patch(`/admin/orders/${payment.order}/payment`, { status });
      success(`Payment marked ${status}.`);
      load();
    } catch (err) { error(errorMessage(err)); } finally { setBusy(null); }
  };

  return (
    <div>
      <PageHeader title="Payments" description="Review and verify UPI submissions, and track all payment transactions." action={
        <Select value={filter} onChange={(e) => setFilter(e.target.value)} className="w-44 py-2.5">
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="unpaid">Unpaid</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </Select>
      } />
      {loading ? <div className="py-20 text-center text-muted">Loading…</div> : (
        <DataTable head={['Order', 'Method', 'Amount', 'UTR / Ref', 'Status', 'Time', 'Actions']}>
          {items.map((p) => (
            <tr key={getId(p)}>
              <Td className="font-semibold text-cream">{p.orderNumber}</Td>
              <Td className="text-muted">{titleCase(p.method || '')}</Td>
              <Td className="font-semibold text-yellow">{inr(p.amount || 0)}</Td>
              <Td className="max-w-[180px] text-xs text-muted break-all">{p.utr || p.transactionRef || p.razorpayPaymentId || '—'}
                {p.screenshotUrl ? <a href={p.screenshotUrl} target="_blank" rel="noreferrer" className="ml-2 text-yellow underline">view</a> : null}
              </Td>
              <Td><StatusBadge status={p.status} /></Td>
              <Td className="text-xs text-smoke">{dateTime(p.updatedAt || p.createdAt)}</Td>
              <Td>
                <div className="flex flex-wrap gap-2">
                  {p.status !== 'paid' ? <Button size="sm" onClick={() => mark(p, 'paid')} loading={busy === getId(p)}>Verify</Button> : null}
                  {p.status === 'pending' ? <Button size="sm" variant="ghost" onClick={() => mark(p, 'failed')} loading={busy === getId(p)}>Reject</Button> : null}
                  {p.status === 'paid' ? <Button size="sm" variant="danger" onClick={() => mark(p, 'refunded')} loading={busy === getId(p)}>Refund</Button> : null}
                </div>
              </Td>
            </tr>
          ))}
          {!items.length ? <tr><td colSpan={7} className="px-5 py-10 text-center text-muted">No payments found.</td></tr> : null}
        </DataTable>
      )}
    </div>
  );
}
