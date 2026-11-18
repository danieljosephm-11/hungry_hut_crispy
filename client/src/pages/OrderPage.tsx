import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Clock, Copy, ExternalLink, MapPin, Phone, QrCode, Receipt, Upload } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { api, errorMessage } from '../lib/api';
import type { Order, PaymentSettings } from '../types';
import { useStore } from '../context/StoreContext';
import { useToast } from '../context/ToastContext';
import { dateTime, inr, titleCase } from '../lib/format';
import { Badge, Button, Card, Input, SectionHeading, Spinner, StatusBadge } from '../components/ui';
import PageAtmosphere from '../components/site/PageAtmosphere';

const FLOW = ['placed', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'completed'];

export default function OrderPage() {
  const { orderNumber = '' } = useParams();
  const [searchParams] = useSearchParams();
  const { recentOrders } = useStore();
  const { success, error } = useToast();

  const known = recentOrders.find((o) => o.orderNumber === orderNumber);
  const [phone, setPhone] = useState(searchParams.get('phone') || known?.phone || '');
  const [order, setOrder] = useState<Order | null>(null);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [utr, setUtr] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = async (p = phone) => {
    if (!orderNumber || !p) return;
    try {
      setLoading(true);
      const data = await api.get<{ order: Order; paymentSettings: PaymentSettings }>(`/orders/${orderNumber}?phone=${encodeURIComponent(p)}`);
      setOrder(data.order);
      setPaymentSettings(data.paymentSettings);
      setLoaded(true);
    } catch (err) {
      error(errorMessage(err));
      setLoaded(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (phone && orderNumber) load(phone);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderNumber]);

  useEffect(() => {
    if (!order || ['completed', 'cancelled'].includes(order.status)) return;
    const id = window.setInterval(() => load(phone), 12000);
    return () => window.clearInterval(id);
  }, [order?.status, phone]);

  const currentStep = useMemo(() => {
    if (!order) return 0;
    if (order.status === 'cancelled') return -1;
    const idx = FLOW.indexOf(order.status);
    return idx >= 0 ? idx : 0;
  }, [order]);

  const upiUri = useMemo(() => {
    if (!paymentSettings || !order) return '';
    const params = new URLSearchParams({
      pa: paymentSettings.upiId || '',
      pn: paymentSettings.payeeName || paymentSettings.restaurantName || 'Hungry Hut',
      am: String(order.pricing.total),
      cu: 'INR',
      tn: `Hungry Hut ${order.orderNumber}`,
    });
    return `upi://pay?${params.toString()}`;
  }, [paymentSettings, order]);

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      success(`${label} copied`);
    } catch {
      success(text);
    }
  };

  const uploadAndSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!order) return;
    if (!utr.trim()) return error('Enter the UPI reference / UTR number.');
    try {
      setSubmitting(true);
      let url = screenshotUrl;
      if (screenshot) {
        const form = new FormData();
        form.append('phone', phone);
        form.append('screenshot', screenshot);
        const uploaded = await api.post<{ url: string }>(`/orders/${order.orderNumber}/payment-proof`, form);
        url = uploaded.url;
        setScreenshotUrl(url);
      }
      const result = await api.post<{ message: string; order: Order }>(`/orders/${order.orderNumber}/payment`, {
        phone,
        utr: utr.trim(),
        screenshotUrl: url || '',
      });
      setOrder(result.order);
      success(result.message);
      setUtr('');
      setScreenshot(null);
    } catch (err) {
      error(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (!orderNumber) return null;

  return (
    <div className="bg-ink">
      <PageAtmosphere image="/images/fries.jpg" align="left" intensity="soft" glow="mixed" className="border-b border-line">
        <div className="container-hh py-14 sm:py-18 lg:py-20">
          <SectionHeading eyebrow="Order" title={`#${orderNumber}`} accent="status" />
        </div>
      </PageAtmosphere>
      <section className="section-pad relative isolate overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -left-20 top-10 h-80 w-80 rounded-full bg-orange/10 blur-[120px]" />
          <div className="absolute right-0 bottom-0 h-72 w-72 rounded-full bg-yellow/10 blur-[120px]" />
        </div>
        <div className="container-hh max-w-5xl">

        {!loaded && !order ? (
          <Card className="p-6 sm:p-8">
            <h3 className="text-2xl text-cream">Find your order</h3>
            <p className="mt-2 text-sm text-muted">Enter the mobile number you used at checkout to view this order.</p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                load(phone);
              }}
              className="mt-5 flex flex-col gap-3 sm:flex-row"
            >
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="10-digit mobile number" required className="flex-1" />
              <Button type="submit" loading={loading}>View order</Button>
            </form>
          </Card>
        ) : loading && !order ? (
          <Spinner label="Fetching your order…" />
        ) : !order ? (
          <Card className="p-8 text-center">
            <h3 className="text-2xl text-cream">Order not found</h3>
            <p className="mt-2 text-sm text-muted">Check the order number and mobile number, then try again.</p>
            <div className="mt-5">
              <Link to="/track"><Button variant="outline">Track another order</Button></Link>
            </div>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-6">
              <Card className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-3xl text-cream">{order.orderNumber}</h3>
                      <StatusBadge status={order.status} />
                      <StatusBadge status={order.paymentStatus} />
                    </div>
                    <p className="mt-1 text-sm text-muted">Placed {dateTime(order.createdAt)} · {titleCase(order.fulfilment.type)}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => copy(order.orderNumber, 'Order number')}>
                    <Copy size={14} /> Copy
                  </Button>
                </div>

                {order.status !== 'cancelled' ? (
                  <div className="mt-6">
                    <div className="relative flex justify-between">
                      {FLOW.map((step, index) => {
                        const done = index <= currentStep;
                        const active = index === currentStep;
                        return (
                          <div key={step} className="flex flex-1 flex-col items-center text-center">
                            <div className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border text-xs font-bold ${done ? 'border-yellow bg-yellow text-ink' : 'border-white/15 bg-neumo/70 text-smoke'} ${active ? 'ring-4 ring-yellow/20' : ''}`}>
                              {done ? <CheckCircle2 size={14} /> : index + 1}
                            </div>
                            <div className={`mt-2 text-[10px] font-bold uppercase tracking-[0.12em] ${done ? 'text-yellow' : 'text-smoke'}`}>{step.replace(/_/g, ' ')}</div>
                            {index < FLOW.length - 1 ? (
                              <div className={`absolute top-4 h-0.5 ${done && index < currentStep ? 'bg-yellow' : 'bg-neumo'}`} style={{ left: `${(index / (FLOW.length - 1)) * 100 + 8}%`, width: `${100 / (FLOW.length - 1) - 16}%` }} />
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="mt-5 rounded-2xl border border-red/30 bg-red/10 p-4 text-sm text-red">This order has been cancelled.</div>
                )}
              </Card>

              <Card className="p-6">
                <h3 className="mb-4 flex items-center gap-2 text-2xl text-cream"><Receipt size={20} className="text-yellow" /> Items</h3>
                <ul className="space-y-3">
                  {order.items.map((item, index) => (
                    <li key={index} className="flex items-start justify-between gap-4 border-b border-line pb-3 last:border-0 last:pb-0">
                      <div className="flex gap-3">
                        {item.image ? <img src={item.image} alt={item.name} className="h-14 w-14 rounded-xl object-cover" /> : null}
                        <div>
                          <div className="font-semibold text-cream">{item.quantity} × {item.name}</div>
                          {item.description ? <div className="text-xs text-smoke">{item.description}</div> : null}
                        </div>
                      </div>
                      <div className="font-semibold text-yellow">{inr(item.lineTotal)}</div>
                    </li>
                  ))}
                </ul>
                <div className="mt-5 space-y-2 border-t border-line pt-4 text-sm">
                  <div className="flex justify-between text-muted"><span>Subtotal</span><span>{inr(order.pricing.subtotal)}</span></div>
                  {order.pricing.discount > 0 ? <div className="flex justify-between text-emerald-300"><span>Discount {order.couponCode ? `(${order.couponCode})` : ''}</span><span>-{inr(order.pricing.discount)}</span></div> : null}
                  <div className="flex justify-between text-muted"><span>Delivery</span><span>{order.pricing.deliveryFee === 0 ? 'FREE' : inr(order.pricing.deliveryFee)}</span></div>
                  <div className="flex justify-between text-muted"><span>Taxes</span><span>{inr(order.pricing.tax)}</span></div>
                  <div className="flex justify-between border-t border-line pt-2 text-lg font-bold text-cream"><span>Total</span><span className="text-yellow">{inr(order.pricing.total)}</span></div>
                </div>
              </Card>

              {order.timeline?.length ? (
                <Card className="p-6">
                  <h3 className="mb-4 flex items-center gap-2 text-2xl text-cream"><Clock size={20} className="text-yellow" /> Timeline</h3>
                  <ul className="space-y-3">
                    {[...order.timeline].reverse().map((event, index) => (
                      <li key={index} className="flex gap-3 text-sm">
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-yellow" />
                        <div>
                          <div className="font-semibold text-cream">{titleCase(event.status || '')}</div>
                          {event.note ? <div className="text-muted">{event.note}</div> : null}
                          <div className="text-xs text-smoke">{dateTime(event.at)}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </Card>
              ) : null}
            </div>

            <div className="space-y-6">
              <Card className="p-6">
                <h3 className="mb-4 text-2xl text-cream">Customer & fulfilment</h3>
                <div className="space-y-3 text-sm text-muted">
                  <div><span className="text-cream">{order.customer.name}</span><br /><span className="inline-flex items-center gap-1"><Phone size={13} /> {order.customer.phone}</span></div>
                  {order.fulfilment.type === 'delivery' && order.fulfilment.address?.line1 ? (
                    <div className="flex gap-2"><MapPin size={15} className="mt-0.5 shrink-0 text-yellow" /><span>{[order.fulfilment.address.line1, order.fulfilment.address.line2, order.fulfilment.address.city, order.fulfilment.address.pincode].filter(Boolean).join(', ')}</span></div>
                  ) : (
                    <div className="flex gap-2"><MapPin size={15} className="mt-0.5 shrink-0 text-yellow" /><span>Pickup at Hungry Hut</span></div>
                  )}
                  <div>Payment: <span className="text-cream">{titleCase(order.paymentMethod)}</span></div>
                </div>
              </Card>

              {order.paymentMethod === 'upi' && order.paymentStatus !== 'paid' ? (
                <Card className="p-6">
                  <h3 className="mb-2 flex items-center gap-2 text-2xl text-cream"><QrCode size={20} className="text-yellow" /> Pay via UPI</h3>
                  <p className="text-sm text-muted">{paymentSettings?.instructions}</p>
                  <div className="mt-4 flex flex-col items-center gap-4 rounded-2xl border border-line bg-white p-4 sm:flex-row sm:items-start">
                    <div className="rounded-xl bg-white p-2">
                      {upiUri ? <QRCodeSVG value={upiUri} size={160} includeMargin /> : <div className="h-[160px] w-[160px] bg-gray-100" />}
                    </div>
                    <div className="flex-1 text-sm text-ink">
                      <div className="font-bold">Scan & pay {inr(order.pricing.total)}</div>
                      <div className="mt-1 break-all text-xs">UPI ID: <span className="font-semibold">{paymentSettings?.upiId}</span></div>
                      <div className="text-xs">Payee: {paymentSettings?.payeeName}</div>
                      <button type="button" onClick={() => copy(paymentSettings?.upiId || '', 'UPI ID')} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-orange hover:underline"><Copy size={12} /> Copy UPI ID</button>
                      {upiUri ? <a href={upiUri} className="mt-2 ml-3 inline-flex items-center gap-1 text-xs font-semibold text-orange hover:underline"><ExternalLink size={12} /> Open UPI app</a> : null}
                    </div>
                  </div>

                  {order.paymentStatus === 'pending' ? (
                    <div className="mt-4 rounded-2xl border border-yellow/30 bg-yellow/10 p-4 text-sm text-yellow">
                      Payment submitted (UTR: {order.payment?.utr || '—'}). It will be marked paid after the restaurant verifies it. You don’t need to resubmit unless asked.
                    </div>
                  ) : (
                    <form onSubmit={uploadAndSubmit} className="mt-5 space-y-4">
                      <Input label="UPI Reference / UTR" required value={utr} onChange={(e) => setUtr(e.target.value)} placeholder="12-digit UTR from your app" />
                      <div>
                        <label className="field-label flex items-center gap-2"><Upload size={13} /> Payment screenshot (optional)</label>
                        <input type="file" accept="image/*" onChange={(e) => setScreenshot(e.target.files?.[0] || null)} className="block w-full text-sm text-muted file:mr-3 file:rounded-full file:border-0 file:bg-yellow/10 file:px-4 file:py-2 file:text-xs file:font-bold file:uppercase file:tracking-[0.14em] file:text-yellow hover:file:bg-yellow/20" />
                        {screenshot ? <p className="mt-1 text-xs text-smoke">Selected: {screenshot.name}</p> : null}
                      </div>
                      <Button type="submit" className="w-full" loading={submitting}>I’ve paid — submit for verification</Button>
                      <p className="text-center text-[11px] text-smoke">Submitting does not mark the order paid. A team member verifies every payment.</p>
                    </form>
                  )}
                </Card>
              ) : order.paymentStatus === 'paid' ? (
                <Card className="p-6">
                  <div className="flex items-center gap-3 text-emerald-300">
                    <CheckCircle2 size={22} />
                    <div>
                      <div className="font-semibold">Payment verified</div>
                      <div className="text-xs text-muted">{order.payment?.verifiedAt ? `Verified ${dateTime(order.payment.verifiedAt)}` : 'Confirmed by the restaurant'}</div>
                    </div>
                  </div>
                </Card>
              ) : null}

              <div className="flex gap-2">
                <Link to="/menu" className="flex-1"><Button variant="outline" className="w-full">Order more</Button></Link>
                <Link to="/track" className="flex-1"><Button variant="ghost" className="w-full">Track page</Button></Link>
              </div>
            </div>
          </div>
        )}
        </div>
      </section>
    </div>
  );
}
