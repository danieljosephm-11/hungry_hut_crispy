import { useState } from 'react';
import { Clock, Mail, MapPin, Phone, Send } from 'lucide-react';
import { api, errorMessage } from '../lib/api';
import { useStore } from '../context/StoreContext';
import { useToast } from '../context/ToastContext';
import { Reveal } from '../components/Reveal';
import { Button, Card, Input, SectionHeading, Select, Textarea } from '../components/ui';
import PageAtmosphere from '../components/site/PageAtmosphere';

export default function Contact() {
  const { settings } = useStore();
  const { success, error } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: 'General enquiry', message: '' });

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setLoading(true);
      await api.post('/contact', form);
      success('Message sent. We’ll get back to you shortly.');
      setForm({ name: '', email: '', phone: '', subject: 'General enquiry', message: '' });
    } catch (err) {
      error(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const mapQuery = encodeURIComponent(settings?.mapQuery || settings?.address || 'Hungry Hut Hauz Khas New Delhi');
  const mapSrc = `https://www.google.com/maps?q=${mapQuery}&output=embed`;

  return (
    <div className="bg-ink">
      <PageAtmosphere image="/images/dining.jpg" align="right" intensity="medium" glow="mixed" className="border-b border-line">
        <div className="container-hh py-14 sm:py-18 lg:py-20">
          <Reveal>
            <SectionHeading
              eyebrow="Contact"
              title="Say hello."
              accent="We’re listening."
              description="Catering, allergies, feedback, a missing napkin — drop us a message or swing by the Hut."
            />
          </Reveal>
        </div>
      </PageAtmosphere>

      <section className="section-pad relative isolate overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -left-20 top-10 h-80 w-80 rounded-full bg-orange/10 blur-[120px]" />
          <div className="absolute right-0 bottom-0 h-80 w-80 rounded-full bg-yellow/10 blur-[120px]" />
        </div>
        <div className="container-hh">
          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-5">
            <Reveal>
              <Card className="p-6">
                <h3 className="text-2xl text-cream">Find us</h3>
                <ul className="mt-5 space-y-4 text-sm text-muted">
                  <li className="flex gap-3">
                    <MapPin size={18} className="mt-0.5 shrink-0 text-yellow" />
                    <span>{settings?.address || 'Shop 12, Hauz Khas Village, New Delhi 110016'}</span>
                  </li>
                  <li className="flex gap-3">
                    <Phone size={18} className="mt-0.5 shrink-0 text-yellow" />
                    <a href={`tel:${settings?.phone || ''}`} className="hover:text-yellow">{settings?.phone || '+91 98100 12345'}</a>
                  </li>
                  <li className="flex gap-3">
                    <Mail size={18} className="mt-0.5 shrink-0 text-yellow" />
                    <a href={`mailto:${settings?.email || ''}`} className="hover:text-yellow">{settings?.email || 'hello@hungryhut.in'}</a>
                  </li>
                </ul>
              </Card>
            </Reveal>
            <Reveal delay={0.05}>
              <Card className="p-6">
                <h3 className="mb-4 flex items-center gap-2 text-2xl text-cream"><Clock size={20} className="text-yellow" /> Hours</h3>
                <ul className="space-y-2 text-sm text-muted">
                  {(settings?.openingHours || [
                    { day: 'Mon – Thu', hours: '11:00 – 23:00' },
                    { day: 'Fri – Sat', hours: '11:00 – 01:00' },
                    { day: 'Sunday', hours: '11:00 – 23:00' },
                  ]).map((row) => (
                    <li key={row.day} className="flex items-center justify-between gap-4 border-b border-line pb-2 last:border-0 last:pb-0">
                      <span className="text-cream">{row.day}</span>
                      <span>{row.hours}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="overflow-hidden rounded-3xl border border-line">
                <iframe
                  title="Hungry Hut location"
                  src={mapSrc}
                  className="h-72 w-full grayscale-[20%]"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </Reveal>
          </div>

          <Reveal delay={0.05}>
            <Card className="p-6 sm:p-8">
              <h3 className="text-3xl text-cream">Send a message</h3>
              <p className="mt-2 text-sm text-muted">We usually reply within a few hours during opening time.</p>
              <form onSubmit={submit} className="mt-6 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input label="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="10-digit mobile" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  <Select label="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}>
                    <option>General enquiry</option>
                    <option>Catering / party order</option>
                    <option>Feedback</option>
                    <option>Allergy question</option>
                    <option>Careers</option>
                  </Select>
                </div>
                <Textarea
                  label="Message"
                  required
                  rows={5}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Tell us what’s on your mind…"
                />
                <Button type="submit" size="lg" className="w-full sm:w-auto" loading={loading}>
                  <Send size={16} /> Send message
                </Button>
              </form>
            </Card>
          </Reveal>
          </div>
        </div>
      </section>
    </div>
  );
}
