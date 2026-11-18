import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, CreditCard, IndianRupee, MapPin, QrCode, Tag, Truck, Wallet } from 'lucide-react';
import { api, errorMessage } from '../lib/api';
import type { Order, PaymentSettings, Pricing, Quote } from '../types';
import { useStore } from '../context/StoreContext';
import { useToast } from '../context/ToastContext';
import { inr } from '../lib/format';
import { Button, Card, Input, SectionHeading, Textarea } from '../components/ui';
import PageAtmosphere from '../components/site/PageAtmosphere';

declare global {
  interface Window {
    Razorpay?: any;
  }
}

function loadRazorpayScript() {
  return new Promise<boolean>((resolve) => {
    if (window.Razorpay) return resolve(true);
    const existing = document.querySelector('script[data-razorpay="checkout"]') as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => resolve(true));
      existing.addEventListener('error', () => resolve(false));
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.dataset.razorpay = 'checkout';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function Checkout() {
  const { cart, cartSubtotal, settings, clearCart, rememberOrder } = useStore();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [fulfilmentType, setFulfilmentType] = useState<'delivery' | 'pickup'>('delivery');
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'razorpay' | 'cod' | 'counter'>('upi');
  const [customer, setCustomer] = useState({ name: '', phone: '', email: '' });
  const [address, setAddress] = useState({ line1: '', line2: '', city: 'New Delhi', pincode: '', landmark: '' });
  const [notes, setNotes] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCode, setAppliedCode] = useState('');
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [quoteError, setQuoteError] = useState('');
  const quoteSeq = useRef(0);
  const quoteInFlight = useRef(0);

  const paySettings = settings?.payment;

  useEffect(() => {
    if (fulfilmentType === 'pickup' && paymentMethod === 'cod') setPaymentMethod('counter');
    if (fulfilmentType === 'delivery' && paymentMethod === 'counter') setPaymentMethod(paySettings?.acceptCod ? 'cod' : 'upi');
  }, [fulfilmentType]);

  const cartPayload = useMemo(
    () =>
      cart.map((item) => ({
        kind: item.kind,
        productId: item.kind === 'product' ? item.productId || item.id : undefined,
        secretId: item.kind === 'secret' ? item.secretId || item.id : undefined,
        quantity: item.quantity,
        pieces: item.kind === 'bucket' ? item.pieces?.map((p) => ({ ingredientId: p.ingredientId, quantity: p.quantity })) : undefined,
      })),
    [cart],
  );

  const refreshQuote = async (code = appliedCode, fulfilment = fulfilmentType) => {
    if (!cart.length) {
      setQuote(null);
      setQuoteError('');
      setQuoting(false);
      quoteInFlight.current = 0;
      return;
    }
    const seq = ++quoteSeq.current;
    quoteInFlight.current += 1;
    try {
      setQuoting(true);
      setQuoteError('');
      const data = await api.post<Quote>('/quote', { items: cartPayload, couponCode: code || '', fulfilmentType: fulfilment });
      if (seq !== quoteSeq.current) return;
      setQuote(data);
    } catch (err) {
      if (seq !== quoteSeq.current) return;
      setQuote(null);
      setQuoteError(errorMessage(err));
    } finally {
      quoteInFlight.current = Math.max(0, quoteInFlight.current - 1);
      if (quoteInFlight.current === 0) setQuoting(false);
    }
  };

  useEffect(() => {
    refreshQuote();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartPayload.length, fulfilmentType, appliedCode, cartSubtotal]);

  const applyCoupon = async () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) return;
    setAppliedCode(code);
    setCouponCode(code);
  };

  const removeCoupon = () => {
    setAppliedCode('');
    setCouponCode('');
  };

  const pricing: Pricing = quote?.pricing || {
    subtotal: cartSubtotal,
    discount: 0,
    deliveryFee: fulfilmentType === 'delivery' ? (cartSubtotal >= (settings?.delivery.freeAbove || 799) ? 0 : settings?.delivery.fee || 49) : 0,
    taxRate: settings?.taxRate || 5,
    tax: 0,
    total: cartSubtotal,
  };
  if (!quote) {
    const taxable = Math.max(0, pricing.subtotal - pricing.discount + pricing.deliveryFee);
    pricing.tax = Math.round(taxable * (pricing.taxRate / 100) * 100) / 100;
    pricing.total = Math.round((taxable + pricing.tax) * 100) / 100;
  }

  const placeOrder = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!cart.length) return error('Your cart is empty.');
    if (!quote) return error(quoteError || 'Please wait for the final total to be calculated.');
    if (quote.minimumShortfall > 0 && fulfilmentType === 'delivery') {
      return error(`Add ${inr(quote.minimumShortfall)} more or switch to pickup.`);
    }
    try {
      setPlacing(true);
      const payload = {
        items: cartPayload,
        customer,
        fulfilmentType,
        address: fulfilmentType === 'delivery' ? address : undefined,
        paymentMethod,
        notes,
        couponCode: appliedCode || '',
      };
      const result = await api.post<{ order: Order; paymentSettings: PaymentSettings; message: string }>('/orders', payload);
      const order = result.order;

      if (paymentMethod === 'razorpay') {
        try {
          const rp = await api.post<any>('/payments/razorpay/create', { orderNumber: order.orderNumber, phone: customer.phone });
          const loaded = await loadRazorpayScript();
          if (!loaded || !window.Razorpay) throw new Error('Razorpay could not be loaded.');
          await new Promise<void>((resolve, reject) => {
            const rzp = new window.Razorpay({
              ...rp,
              theme: { color: '#FF6B00' },
              modal: { ondismiss: () => resolve() },
              handler: async (response: any) => {
                try {
                  await api.post('/payments/razorpay/verify', { ...response, orderNumber: order.orderNumber, phone: customer.phone });
                  success('Payment verified!');
                } catch (err) {
                  error(errorMessage(err));
                } finally {
                  resolve();
                }
              },
            });
            rzp.on('payment.failed', (resp: any) => reject(new Error(resp?.error?.description || 'Payment failed.')));
            rzp.open();
          });
        } catch (err) {
          error(errorMessage(err));
        }
      } else {
        success(result.message || 'Order placed!');
      }

      rememberOrder({ orderNumber: order.orderNumber, phone: customer.phone.replace(/\D/g, '').slice(-10), name: customer.name, placedAt: new Date().toISOString() });
      clearCart();
      navigate(`/order/${order.orderNumber}?phone=${encodeURIComponent(customer.phone.replace(/\D/g, '').slice(-10))}`);
    } catch (err) {
      error(errorMessage(err));
    } finally {
      setPlacing(false);
    }
  };

  if (!cart.length) {
    return (
      <div className="bg-ink">
        <PageAtmosphere image="/images/big-burger.jpg" align="right" intensity="soft" glow="mixed" className="border-b border-line">
          <div className="container-hh py-14 sm:py-18 lg:py-20 text-center">
            <SectionHeading eyebrow="Checkout" title="Your cart is" accent="empty" align="center" className="mx-auto" />
            <p className="mt-4 text-muted">Add something delicious from the menu, then come back to check out.</p>
            <Link to="/menu" className="mt-6 inline-flex"><Button size="lg">Explore the menu</Button></Link>
          </div>
        </PageAtmosphere>
      </div>
    );
  }

  return (
    <div className="bg-ink">
      <PageAtmosphere image="/images/cheese-burger.jpg" align="left" intensity="soft" glow="mixed" className="border-b border-line">
        <div className="container-hh py-14 sm:py-18 lg:py-20">
          <SectionHeading eyebrow="Checkout" title="Almost" accent="there" description="Final totals and coupon rules are confirmed by the server when you place the order." />
        </div>
      </PageAtmosphere>

      <section className="section-pad relative isolate overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -left-20 top-10 h-80 w-80 rounded-full bg-orange/10 blur-[120px]" />
          <div className="absolute right-0 bottom-0 h-80 w-80 rounded-full bg-yellow/10 blur-[120px]" />
        </div>
        <div className="container-hh">
          <form onSubmit={placeOrder} className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="mb-4 flex items-center gap-2 text-2xl text-cream"><MapPin size={20} className="text-orange" /> Fulfilment</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {([
                  { value: 'delivery', label: 'Delivery', icon: Truck, desc: `${settings?.delivery.etaMinutes || 30} min · ${inr(settings?.delivery.fee || 49)} fee` },
                  { value: 'pickup', label: 'Pickup', icon: Wallet, desc: `${settings?.pickup.etaMinutes || 15} min · no fee` },
                ] as const).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setFulfilmentType(opt.value)}
                    className={`rounded-2xl border p-4 text-left transition-all duration-200 ${fulfilmentType === opt.value ? 'border-orange/40 bg-neumo shadow-neumo-inset-sm' : 'border-line bg-card shadow-neumo-raised-sm hover:text-cream'}`}
                  >
                    <opt.icon size={18} className={fulfilmentType === opt.value ? 'text-orange' : 'text-muted'} />
                    <div className="mt-2 font-semibold text-cream">{opt.label}</div>
                    <div className="text-xs text-smoke">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="mb-4 text-2xl text-cream">Your details</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Full name" required value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} />
                <Input label="Mobile number" required value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} placeholder="10-digit number" />
              </div>
              <div className="mt-4">
                <Input label="Email (optional)" type="email" value={customer.email} onChange={(e) => setCustomer({ ...customer, email: e.target.value })} />
              </div>
            </Card>

            {fulfilmentType === 'delivery' ? (
              <Card className="p-6">
                <h3 className="mb-4 text-2xl text-cream">Delivery address</h3>
                <div className="space-y-4">
                  <Input label="Address line 1" required value={address.line1} onChange={(e) => setAddress({ ...address, line1: e.target.value })} placeholder="House / flat, street" />
                  <Input label="Address line 2" value={address.line2} onChange={(e) => setAddress({ ...address, line2: e.target.value })} placeholder="Area (optional)" />
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Input label="City" required value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} />
                    <Input label="Pincode" required value={address.pincode} onChange={(e) => setAddress({ ...address, pincode: e.target.value })} placeholder="6 digits" />
                    <Input label="Landmark" value={address.landmark} onChange={(e) => setAddress({ ...address, landmark: e.target.value })} />
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="p-6">
                <h3 className="mb-2 text-2xl text-cream">Pickup location</h3>
                <p className="text-sm text-muted">{settings?.address || 'Hungry Hut, Hauz Khas Village, New Delhi'}</p>
                <p className="mt-2 text-xs text-smoke">We’ll have it ready in about {settings?.pickup.etaMinutes || 15} minutes after confirmation.</p>
              </Card>
            )}

            <Card className="p-6">
              <h3 className="mb-4 flex items-center gap-2 text-2xl text-cream"><CreditCard size={20} className="text-orange" /> Payment</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { value: 'upi', label: 'UPI (QR / ID)', desc: 'Pay & submit UTR for verification', icon: QrCode, show: true },
                  { value: 'razorpay', label: 'Razorpay', desc: 'UPI / cards (if configured)', icon: IndianRupee, show: !!paySettings?.razorpayEnabled },
                  { value: fulfilmentType === 'pickup' ? 'counter' : 'cod', label: fulfilmentType === 'pickup' ? 'Pay at counter' : 'Cash on delivery', desc: 'Pay when you receive', icon: Wallet, show: !!paySettings?.acceptCod },
                ]
                  .filter((opt) => opt.show)
                  .map((opt: any) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setPaymentMethod(opt.value)}
                      className={`rounded-2xl border p-4 text-left transition-all duration-200 ${paymentMethod === opt.value ? 'border-orange/40 bg-neumo shadow-neumo-inset-sm' : 'border-line bg-card shadow-neumo-raised-sm'}`}
                    >
                      <opt.icon size={18} className={paymentMethod === opt.value ? 'text-orange' : 'text-muted'} />
                      <div className="mt-2 font-semibold text-cream">{opt.label}</div>
                      <div className="text-xs text-smoke">{opt.desc}</div>
                    </button>
                  ))}
              </div>
              {paymentMethod === 'upi' ? (
                <p className="mt-3 text-xs text-smoke">After placing the order you’ll see our UPI QR/ID to pay and a form to submit your UTR. Orders are marked paid only after manual verification.</p>
              ) : null}
            </Card>

            <Card className="p-6">
              <Textarea label="Order notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Extra spicy, no onions, ring the bell…" rows={3} />
            </Card>
          </div>

          <div className="space-y-5 lg:sticky lg:top-28 lg:self-start">
            <Card className="glass-panel p-6">
              <h3 className="mb-4 text-2xl text-cream">Order summary</h3>
              <ul className="space-y-3">
                {cart.map((item) => (
                  <li key={item.key} className="flex items-start justify-between gap-3 text-sm">
                    <div>
                      <div className="font-semibold text-cream">{item.quantity} × {item.name}</div>
                      <div className="text-xs text-smoke line-clamp-1">{item.description}</div>
                    </div>
                    <div className="font-semibold text-yellow">{inr(item.price * item.quantity)}</div>
                  </li>
                ))}
              </ul>

              <div className="mt-5 border-t border-line pt-4">
                <label className="field-label flex items-center gap-2"><Tag size={13} /> Coupon code</label>
                <div className="flex gap-2">
                  <input value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} placeholder="HUT10" className="field flex-1 uppercase" />
                  {appliedCode ? (
                    <Button type="button" variant="ghost" onClick={removeCoupon}>Remove</Button>
                  ) : (
                    <Button type="button" variant="outline" onClick={applyCoupon} disabled={quoting || !couponCode.trim()}>Apply</Button>
                  )}
                </div>
                {quote?.coupon ? (
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-emerald-300"><CheckCircle2 size={13} /> {quote.coupon.code} applied</p>
                ) : quoteError && appliedCode ? (
                  <p className="mt-2 text-xs text-orange">{quoteError}</p>
                ) : null}
              </div>

              <div className="mt-5 space-y-2 border-t border-line pt-4 text-sm">
                <div className="flex justify-between text-muted"><span>Subtotal</span><span>{inr(pricing.subtotal)}</span></div>
                {pricing.discount > 0 ? <div className="flex justify-between text-emerald-300"><span>Discount</span><span>-{inr(pricing.discount)}</span></div> : null}
                <div className="flex justify-between text-muted"><span>Delivery</span><span>{pricing.deliveryFee === 0 ? <span className="text-yellow">FREE</span> : inr(pricing.deliveryFee)}</span></div>
                <div className="flex justify-between text-muted"><span>Taxes ({pricing.taxRate}%)</span><span>{inr(pricing.tax)}</span></div>
                <div className="flex justify-between border-t border-line pt-2 text-lg font-bold text-cream"><span>Total</span><span className="text-yellow">{inr(pricing.total)}</span></div>
              </div>

              {quote?.minimumShortfall ? (
                <p className="mt-3 rounded-2xl border border-orange/30 bg-neumo px-3 py-2 text-xs text-orange shadow-neumo-inset-sm">
                  Add {inr(quote.minimumShortfall)} more for delivery, or switch to pickup.
                </p>
              ) : null}
              {quoting ? <p className="mt-2 text-xs text-smoke">Calculating final total…</p> : null}

              <Button type="submit" size="lg" className="mt-5 w-full" loading={placing} disabled={quoting || !!quoteError}>
                Place order · {inr(pricing.total)}
              </Button>
              <p className="mt-3 text-center text-[11px] text-smoke">By placing this order you agree to our kitchen doing its very best.</p>
            </Card>
          </div>
          </form>
        </div>
      </section>
    </div>
  );
}
