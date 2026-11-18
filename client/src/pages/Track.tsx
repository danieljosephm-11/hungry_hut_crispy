import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Reveal } from '../components/Reveal';
import { Button, Card, Input, SectionHeading } from '../components/ui';
import { dateTime } from '../lib/format';
import PageAtmosphere from '../components/site/PageAtmosphere';

export default function Track() {
  const { orderNumber: paramOrder } = useParams();
  const navigate = useNavigate();
  const { recentOrders } = useStore();
  const [orderNumber, setOrderNumber] = useState(paramOrder || '');
  const [phone, setPhone] = useState('');

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!orderNumber.trim() || !phone.trim()) return;
    navigate(`/order/${orderNumber.trim().toUpperCase()}?phone=${encodeURIComponent(phone.trim())}`);
  };

  return (
    <div className="bg-ink">
      <PageAtmosphere image="/images/kitchen.jpg" align="right" intensity="soft" glow="mixed" className="border-b border-line">
        <div className="container-hh py-14 sm:py-18 lg:py-20 text-center">
          <Reveal>
            <SectionHeading
              eyebrow="Track order"
              title="Where’s my"
              accent="crunch?"
              description="Enter your order number and the mobile number you used at checkout to see live status and payment details."
              align="center"
              className="mx-auto"
            />
          </Reveal>
        </div>
      </PageAtmosphere>

      <section className="section-pad relative isolate overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -left-20 top-10 h-80 w-80 rounded-full bg-orange/10 blur-[120px]" />
          <div className="absolute right-0 bottom-0 h-72 w-72 rounded-full bg-yellow/10 blur-[120px]" />
        </div>
        <div className="container-hh max-w-3xl">
          <Reveal>
            <Card className="mx-auto max-w-xl p-6 sm:p-8">
              <form onSubmit={submit} className="space-y-4">
                <Input
                  label="Order number"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
                  placeholder="HH-12345"
                  required
                />
                <Input
                  label="Mobile number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="10-digit number used at checkout"
                  required
                />
                <Button type="submit" size="lg" className="w-full">
                  <Search size={16} /> Track order
                </Button>
              </form>
            </Card>
          </Reveal>

          {recentOrders.length ? (
            <Reveal delay={0.1} className="mt-10">
              <h3 className="mb-4 text-center text-2xl text-cream">Recent orders on this device</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {recentOrders.map((entry) => (
                  <Link
                    key={entry.orderNumber}
                    to={`/order/${entry.orderNumber}?phone=${encodeURIComponent(entry.phone)}`}
                    className="card-lift rounded-2xl border border-line bg-neumo/40 p-4"
                  >
                    <div className="font-display text-2xl text-yellow">{entry.orderNumber}</div>
                    <div className="mt-1 text-sm text-cream">{entry.name || 'Guest'}</div>
                    <div className="text-xs text-smoke">{entry.placedAt ? dateTime(entry.placedAt) : 'Tap to view status'}</div>
                  </Link>
                ))}
              </div>
            </Reveal>
          ) : null}
        </div>
      </section>
    </div>
  );
}
