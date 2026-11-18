import { useEffect, useMemo, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, ExternalLink, Mail, Plus, Save, Trash2 } from 'lucide-react';
import { api, errorMessage } from '../../lib/api';
import type { ContactMessage, Settings } from '../../types';
import { useToast } from '../../context/ToastContext';
import { dateTime } from '../../lib/format';
import { Badge, Button, Card, Input, Modal, Select, Spinner, Textarea } from '../../components/ui';
import { ImageUpload, PageHeader } from '../../components/admin/AdminBits';

type Tab = 'general' | 'story' | 'operations' | 'payment' | 'faqs' | 'qr' | 'messages';

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'general', label: 'General & Hours' },
  { id: 'story', label: 'Story & Hero' },
  { id: 'operations', label: 'Operations' },
  { id: 'payment', label: 'Payment & Secret' },
  { id: 'faqs', label: 'FAQs' },
  { id: 'qr', label: 'QR Codes' },
  { id: 'messages', label: 'Messages' },
];

const defaultSettings: any = {
  name: '',
  tagline: '',
  secondaryTagline: '',
  logoUrl: '',
  phone: '',
  email: '',
  address: '',
  mapQuery: '',
  announcement: '',
  openingHours: [],
  social: { instagram: '', facebook: '', x: '', youtube: '', whatsapp: '' },
  delivery: { enabled: true, fee: 0, freeAbove: 0, minOrder: 0, etaMinutes: 30, radiusKm: 0 },
  pickup: { enabled: true, etaMinutes: 15 },
  taxRate: 5,
  avgPrepMinutes: 12,
  kitchenCapacity: 10,
  payment: { upiId: '', payeeName: '', qrImageUrl: '', instructions: '', acceptCod: true },
  secretMenu: { isEnabled: true, hint: '', passphrase: '' },
  story: { heading: '', body: '', image: '', image2: '', establishedYear: 2016 },
  stats: { happyCustomers: '', ordersServed: '', rating: '' },
  hero: { eyebrow: '', image: '', liveNote: '' },
  faqs: [],
};

function mergeSettings(base: any, incoming: any) {
  const out = { ...base, ...(incoming || {}) };
  for (const key of ['social', 'delivery', 'pickup', 'payment', 'secretMenu', 'story', 'stats', 'hero']) {
    out[key] = { ...(base[key] || {}), ...((incoming && incoming[key]) || {}) };
  }
  out.openingHours = Array.isArray(incoming?.openingHours) ? incoming.openingHours : base.openingHours || [];
  out.faqs = Array.isArray(incoming?.faqs) ? incoming.faqs : base.faqs || [];
  return out;
}

export default function SettingsAdmin() {
  const { success, error } = useToast();
  const [tab, setTab] = useState<Tab>('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>(defaultSettings);
  const [qr, setQr] = useState<any>(null);
  const [qrBusy, setQrBusy] = useState<string | null>(null);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const [settings, qrData] = await Promise.all([
        api.get<Settings>('/admin/settings'),
        api.get<any>('/admin/qr'),
      ]);
      setForm(mergeSettings(defaultSettings, settings));
      setQr(qrData);
    } catch (err) {
      error(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const getId = (x: any) => x?.id || x?._id;

  const loadMessages = async () => {
    try {
      setLoadingMessages(true);
      const data = await api.get<ContactMessage[]>('/admin/messages');
      setMessages((data as any[]).map((m) => ({ ...m, id: getId(m) })));
    } catch (err) {
      error(errorMessage(err));
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (tab === 'messages') loadMessages();
  }, [tab]);

  const update = (path: string, value: any) => {
    setForm((current: any) => {
      const next = structuredClone ? structuredClone(current) : JSON.parse(JSON.stringify(current));
      const parts = path.split('.');
      let target = next;
      for (let i = 0; i < parts.length - 1; i += 1) target = target[parts[i]];
      target[parts[parts.length - 1]] = value;
      return next;
    });
  };

  const saveSettings = async (section?: string) => {
    try {
      setSaving(true);
      // Send the full form merged by server per-section logic; safe and keeps UI simple.
      const payload = {
        ...form,
        delivery: { ...form.delivery },
        pickup: { ...form.pickup },
        payment: { ...form.payment },
        secretMenu: { ...form.secretMenu },
        story: { ...form.story },
        stats: { ...form.stats },
        hero: { ...form.hero },
        social: { ...form.social },
        openingHours: form.openingHours || [],
        faqs: form.faqs || [],
      };
      const res = await api.put<{ message: string; settings: Settings }>('/admin/settings', payload);
      setForm(mergeSettings(defaultSettings, res.settings));
      success(res.message || 'Settings saved.');
      // Refresh QR derived values (UPI URI/menu URL may change)
      try {
        setQr(await api.get<any>('/admin/qr'));
      } catch {}
    } catch (err) {
      error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const saveQr = async (type: 'menu' | 'payment') => {
    if (!qr?.[type]) return;
    try {
      setQrBusy(type);
      const payload = {
        label: qr[type].label || '',
        url: qr[type].url || '',
        imageUrl: qr[type].imageUrl || '',
        isActive: qr[type].isActive !== false,
        notes: qr[type].notes || '',
      };
      const updated = await api.put(`/admin/qr/${type}`, payload);
      setQr((current: any) => ({ ...current, [type]: updated }));
      success(`${type === 'menu' ? 'Menu' : 'Payment'} QR updated.`);
      if (type === 'payment' && payload.imageUrl) update('payment.qrImageUrl', payload.imageUrl);
    } catch (err) {
      error(errorMessage(err));
    } finally {
      setQrBusy(null);
    }
  };

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      success(`${label} copied.`);
    } catch {
      success(text);
    }
  };

  const toggleRead = async (msg: ContactMessage) => {
    try {
      const id = getId(msg);
      const updated = await api.patch<ContactMessage>(`/admin/messages/${id}`, { isRead: !msg.isRead });
      const normalized = { ...(updated as any), id: getId(updated) || id } as ContactMessage;
      setMessages((items) => items.map((item) => (getId(item) === id ? normalized : item)));
      if (getId(selectedMessage) === id) setSelectedMessage(normalized);
    } catch (err) {
      error(errorMessage(err));
    }
  };

  const deleteMessage = async (msg: ContactMessage) => {
    try {
      const id = getId(msg);
      await api.delete(`/admin/messages/${id}`);
      setMessages((items) => items.filter((item) => getId(item) !== id));
      if (getId(selectedMessage) === id) setSelectedMessage(null);
      success('Message deleted.');
    } catch (err) {
      error(errorMessage(err));
    }
  };

  if (loading) return <Spinner label="Loading settings…" />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Restaurant profile, operations, payments, content, QR codes and messages."
        action={
          tab !== 'qr' && tab !== 'messages' ? (
            <Button onClick={() => saveSettings()} loading={saving}>
              <Save size={15} /> Save settings
            </Button>
          ) : null
        }
      />

      <div className="scroll-fade no-scrollbar flex gap-2 overflow-x-auto pb-1">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`whitespace-nowrap rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] transition ${
              tab === item.id ? 'border-yellow bg-yellow text-ink' : 'border-line bg-neumo/40 text-muted hover:text-cream'
            }`}
          >
            {item.label}
            {item.id === 'messages' ? ` (${messages.filter((m) => !m.isRead).length || ''}${messages.length ? messages.filter((m) => !m.isRead).length : ''})` : ''}
          </button>
        ))}
      </div>

      {tab === 'general' ? (
        <div className="grid gap-6 xl:grid-cols-2">
          <Card className="space-y-4 p-6">
            <h2 className="text-2xl text-cream">Restaurant profile</h2>
            <Input label="Restaurant name" value={form.name} onChange={(e) => update('name', e.target.value)} />
            <Input label="Tagline" value={form.tagline} onChange={(e) => update('tagline', e.target.value)} />
            <Input label="Secondary tagline" value={form.secondaryTagline || ''} onChange={(e) => update('secondaryTagline', e.target.value)} />
            <Input label="Announcement banner" value={form.announcement || ''} onChange={(e) => update('announcement', e.target.value)} />
            <ImageUpload label="Logo URL / image" value={form.logoUrl || ''} onChange={(url) => update('logoUrl', url)} />
          </Card>
          <Card className="space-y-4 p-6">
            <h2 className="text-2xl text-cream">Contact & location</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Phone" value={form.phone} onChange={(e) => update('phone', e.target.value)} />
              <Input label="Email" value={form.email} onChange={(e) => update('email', e.target.value)} />
            </div>
            <Textarea label="Address" rows={3} value={form.address} onChange={(e) => update('address', e.target.value)} />
            <Input label="Map search query" value={form.mapQuery || ''} onChange={(e) => update('mapQuery', e.target.value)} placeholder="Used for map embed" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Instagram URL" value={form.social?.instagram || ''} onChange={(e) => update('social.instagram', e.target.value)} />
              <Input label="Facebook URL" value={form.social?.facebook || ''} onChange={(e) => update('social.facebook', e.target.value)} />
              <Input label="X (Twitter) URL" value={form.social?.x || ''} onChange={(e) => update('social.x', e.target.value)} />
              <Input label="YouTube URL" value={form.social?.youtube || ''} onChange={(e) => update('social.youtube', e.target.value)} />
            </div>
            <Input label="WhatsApp link" value={form.social?.whatsapp || ''} onChange={(e) => update('social.whatsapp', e.target.value)} placeholder="https://wa.me/..." />
          </Card>
          <Card className="space-y-4 p-6 xl:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl text-cream">Opening hours</h2>
              <Button
                size="sm"
                variant="outline"
                onClick={() => update('openingHours', [...(form.openingHours || []), { day: '', hours: '' }])}
              >
                <Plus size={14} /> Add row
              </Button>
            </div>
            <div className="space-y-3">
              {(form.openingHours || []).map((row: any, index: number) => (
                <div key={index} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                  <Input label={index === 0 ? 'Day(s)' : undefined} value={row.day || ''} onChange={(e) => {
                    const next = [...form.openingHours]; next[index] = { ...next[index], day: e.target.value }; update('openingHours', next);
                  }} placeholder="Mon – Thu" />
                  <Input label={index === 0 ? 'Hours' : undefined} value={row.hours || ''} onChange={(e) => {
                    const next = [...form.openingHours]; next[index] = { ...next[index], hours: e.target.value }; update('openingHours', next);
                  }} placeholder="11:00 – 23:00" />
                  <Button type="button" variant="ghost" className="mb-0.5" onClick={() => update('openingHours', form.openingHours.filter((_: any, i: number) => i !== index))}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              ))}
              {!form.openingHours?.length ? <p className="text-sm text-muted">No hours set. Add rows to display opening times on the site.</p> : null}
            </div>
          </Card>
        </div>
      ) : null}

      {tab === 'story' ? (
        <div className="grid gap-6 xl:grid-cols-2">
          <Card className="space-y-4 p-6">
            <h2 className="text-2xl text-cream">Hero & homepage</h2>
            <Input label="Hero eyebrow" value={form.hero?.eyebrow || ''} onChange={(e) => update('hero.eyebrow', e.target.value)} />
            <Input label="Hero live note" value={form.hero?.liveNote || ''} onChange={(e) => update('hero.liveNote', e.target.value)} />
            <ImageUpload label="Hero image" value={form.hero?.image || ''} onChange={(url) => update('hero.image', url)} />
            <h3 className="pt-2 text-lg text-cream">Homepage stats</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <Input label="Happy customers" value={form.stats?.happyCustomers || ''} onChange={(e) => update('stats.happyCustomers', e.target.value)} placeholder="48K+" />
              <Input label="Orders served" value={form.stats?.ordersServed || ''} onChange={(e) => update('stats.ordersServed', e.target.value)} placeholder="1.2M+" />
              <Input label="Rating" value={form.stats?.rating || ''} onChange={(e) => update('stats.rating', e.target.value)} placeholder="4.9" />
            </div>
          </Card>
          <Card className="space-y-4 p-6">
            <h2 className="text-2xl text-cream">Our story</h2>
            <Input label="Story heading" value={form.story?.heading || ''} onChange={(e) => update('story.heading', e.target.value)} />
            <Textarea label="Story body" rows={6} value={form.story?.body || ''} onChange={(e) => update('story.body', e.target.value)} />
            <Input label="Established year" type="number" value={form.story?.establishedYear || 2016} onChange={(e) => update('story.establishedYear', Number(e.target.value))} />
            <ImageUpload label="Story image 1" value={form.story?.image || ''} onChange={(url) => update('story.image', url)} />
            <ImageUpload label="Story image 2" value={form.story?.image2 || ''} onChange={(url) => update('story.image2', url)} />
          </Card>
        </div>
      ) : null}

      {tab === 'operations' ? (
        <div className="grid gap-6 xl:grid-cols-2">
          <Card className="space-y-4 p-6">
            <h2 className="text-2xl text-cream">Delivery</h2>
            <label className="inline-flex items-center gap-2 text-sm text-cream">
              <input type="checkbox" checked={form.delivery?.enabled !== false} onChange={(e) => update('delivery.enabled', e.target.checked)} className="accent-yellow" /> Delivery enabled
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Delivery fee (₹)" type="number" min={0} value={form.delivery?.fee ?? 0} onChange={(e) => update('delivery.fee', Number(e.target.value))} />
              <Input label="Free delivery above (₹)" type="number" min={0} value={form.delivery?.freeAbove ?? 0} onChange={(e) => update('delivery.freeAbove', Number(e.target.value))} />
              <Input label="Minimum order for delivery (₹)" type="number" min={0} value={form.delivery?.minOrder ?? 0} onChange={(e) => update('delivery.minOrder', Number(e.target.value))} />
              <Input label="ETA (minutes)" type="number" min={1} value={form.delivery?.etaMinutes ?? 30} onChange={(e) => update('delivery.etaMinutes', Number(e.target.value))} />
              <Input label="Radius (km)" type="number" min={0} value={form.delivery?.radiusKm ?? 0} onChange={(e) => update('delivery.radiusKm', Number(e.target.value))} />
            </div>
          </Card>
          <Card className="space-y-4 p-6">
            <h2 className="text-2xl text-cream">Pickup & kitchen</h2>
            <label className="inline-flex items-center gap-2 text-sm text-cream">
              <input type="checkbox" checked={form.pickup?.enabled !== false} onChange={(e) => update('pickup.enabled', e.target.checked)} className="accent-yellow" /> Pickup enabled
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Pickup ETA (minutes)" type="number" min={1} value={form.pickup?.etaMinutes ?? 15} onChange={(e) => update('pickup.etaMinutes', Number(e.target.value))} />
              <Input label="Tax rate (%)" type="number" min={0} max={28} step="0.1" value={form.taxRate ?? 5} onChange={(e) => update('taxRate', Number(e.target.value))} />
              <Input label="Avg prep minutes" type="number" min={1} value={form.avgPrepMinutes ?? 12} onChange={(e) => update('avgPrepMinutes', Number(e.target.value))} />
              <Input label="Kitchen capacity" type="number" min={1} value={form.kitchenCapacity ?? 10} onChange={(e) => update('kitchenCapacity', Number(e.target.value))} />
            </div>
            <p className="text-xs text-smoke">Kitchen capacity and average prep time power the Live Crispy Meter and wait estimates.</p>
          </Card>
        </div>
      ) : null}

      {tab === 'payment' ? (
        <div className="grid gap-6 xl:grid-cols-2">
          <Card className="space-y-4 p-6">
            <h2 className="text-2xl text-cream">UPI & payment options</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="UPI ID" value={form.payment?.upiId || ''} onChange={(e) => update('payment.upiId', e.target.value)} placeholder="name@bank" />
              <Input label="Payee name" value={form.payment?.payeeName || ''} onChange={(e) => update('payment.payeeName', e.target.value)} />
            </div>
            <ImageUpload label="Payment QR image (optional)" value={form.payment?.qrImageUrl || ''} onChange={(url) => update('payment.qrImageUrl', url)} />
            <Textarea label="Payment instructions" rows={3} value={form.payment?.instructions || ''} onChange={(e) => update('payment.instructions', e.target.value)} />
            <label className="inline-flex items-center gap-2 text-sm text-cream">
              <input type="checkbox" checked={form.payment?.acceptCod !== false} onChange={(e) => update('payment.acceptCod', e.target.checked)} className="accent-yellow" /> Accept cash on delivery / pay at counter
            </label>
            <p className="text-xs text-smoke">Razorpay is enabled automatically when <code>RAZORPAY_KEY_ID</code> and <code>RAZORPAY_KEY_SECRET</code> are configured on the server.</p>
          </Card>
          <Card className="space-y-4 p-6">
            <h2 className="text-2xl text-cream">Secret menu access</h2>
            <label className="inline-flex items-center gap-2 text-sm text-cream">
              <input type="checkbox" checked={form.secretMenu?.isEnabled !== false} onChange={(e) => update('secretMenu.isEnabled', e.target.checked)} className="accent-yellow" /> Secret menu enabled
            </label>
            <Input label="Hint" value={form.secretMenu?.hint || ''} onChange={(e) => update('secretMenu.hint', e.target.value)} placeholder="Shown on the locked screen" />
            <Input label="Passphrase" value={form.secretMenu?.passphrase || ''} onChange={(e) => update('secretMenu.passphrase', e.target.value)} placeholder="Server-checked unlock word" />
            <p className="text-xs text-smoke">The passphrase is stored securely in settings and checked by the server; it is not exposed to public API responses.</p>
          </Card>
        </div>
      ) : null}

      {tab === 'faqs' ? (
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-2xl text-cream">Frequently asked questions</h2>
              <p className="text-sm text-muted">Shown on the home page highlights and the FAQ page.</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => update('faqs', [...(form.faqs || []), { question: '', answer: '' }])}>
              <Plus size={14} /> Add FAQ
            </Button>
          </div>
          <div className="space-y-4">
            {(form.faqs || []).map((faq: any, index: number) => (
              <div key={index} className="rounded-2xl border border-line bg-neumo/40 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-[0.16em] text-smoke">FAQ {index + 1}</span>
                  <Button type="button" variant="ghost" size="sm" onClick={() => update('faqs', form.faqs.filter((_: any, i: number) => i !== index))}>
                    <Trash2 size={14} /> Remove
                  </Button>
                </div>
                <div className="space-y-3">
                  <Input label="Question" value={faq.question || ''} onChange={(e) => { const next = [...form.faqs]; next[index] = { ...next[index], question: e.target.value }; update('faqs', next); }} />
                  <Textarea label="Answer" rows={3} value={faq.answer || ''} onChange={(e) => { const next = [...form.faqs]; next[index] = { ...next[index], answer: e.target.value }; update('faqs', next); }} />
                </div>
              </div>
            ))}
            {!form.faqs?.length ? <p className="text-sm text-muted">No FAQs yet. Add common questions to help guests.</p> : null}
          </div>
        </Card>
      ) : null}

      {tab === 'qr' ? (
        <div className="grid gap-6 xl:grid-cols-2">
          {(['menu', 'payment'] as const).map((type) => {
            const config = qr?.[type] || {};
            const value = type === 'menu' ? (config.url || qr?.menuUrl || '') : (config.url || qr?.upiUri || '');
            return (
              <Card key={type} className="space-y-4 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl text-cream">{type === 'menu' ? 'Menu QR' : 'Payment QR'}</h2>
                    <p className="text-sm text-muted">{type === 'menu' ? 'Links guests to your digital menu.' : 'Encodes a UPI payment URI for quick scanning.'}</p>
                  </div>
                  <Badge tone={config.isActive === false ? 'muted' : 'green'}>{config.isActive === false ? 'Inactive' : 'Active'}</Badge>
                </div>
                <div className="flex flex-col items-center gap-4 rounded-2xl border border-line bg-white p-4 sm:flex-row sm:items-start">
                  <div className="rounded-xl bg-white p-2">
                    {value ? <QRCodeSVG value={value} size={168} includeMargin /> : <div className="h-[168px] w-[168px] bg-gray-100" />}
                  </div>
                  <div className="min-w-0 flex-1 text-sm text-ink">
                    <div className="font-bold break-all">{config.label || (type === 'menu' ? 'Menu QR' : 'Payment QR')}</div>
                    <div className="mt-1 break-all text-xs text-gray-600">{value || '—'}</div>
                    <div className="mt-2 flex flex-wrap gap-3">
                      {value ? <button type="button" onClick={() => copy(value, 'QR value')} className="inline-flex items-center gap-1 text-xs font-semibold text-orange hover:underline"><Copy size={12} /> Copy</button> : null}
                      {type === 'menu' && value ? <a href={value} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-orange hover:underline"><ExternalLink size={12} /> Open</a> : null}
                    </div>
                  </div>
                </div>
                <Input label="Label" value={config.label || ''} onChange={(e) => setQr((c: any) => ({ ...c, [type]: { ...c[type], label: e.target.value } }))} />
                <Input label={type === 'menu' ? 'Menu URL' : 'UPI URI / payment URL'} value={config.url || ''} onChange={(e) => setQr((c: any) => ({ ...c, [type]: { ...c[type], url: e.target.value } }))} placeholder={type === 'menu' ? qr?.menuUrl : qr?.upiUri} />
                <ImageUpload label="Custom QR image (optional)" value={config.imageUrl || ''} onChange={(url) => setQr((c: any) => ({ ...c, [type]: { ...c[type], imageUrl: url } }))} />
                <Input label="Notes" value={config.notes || ''} onChange={(e) => setQr((c: any) => ({ ...c, [type]: { ...c[type], notes: e.target.value } }))} />
                <label className="inline-flex items-center gap-2 text-sm text-muted">
                  <input type="checkbox" checked={config.isActive !== false} onChange={(e) => setQr((c: any) => ({ ...c, [type]: { ...c[type], isActive: e.target.checked } }))} className="accent-yellow" /> Active
                </label>
                <div className="flex justify-end">
                  <Button onClick={() => saveQr(type)} loading={qrBusy === type}>Save {type} QR</Button>
                </div>
              </Card>
            );
          })}
        </div>
      ) : null}

      {tab === 'messages' ? (
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="text-2xl text-cream">Contact messages</h2>
              <Button size="sm" variant="ghost" onClick={loadMessages}>Refresh</Button>
            </div>
            {loadingMessages ? <div className="py-16 text-center text-muted">Loading…</div> : messages.length ? (
              <ul className="divide-y divide-line">
                {messages.map((msg) => (
                  <li key={getId(msg)}>
                    <button type="button" onClick={() => setSelectedMessage(msg)} className={`w-full px-5 py-4 text-left transition hover:bg-neumo/40 ${getId(selectedMessage) === getId(msg) ? 'bg-neumo/50' : ''}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`font-semibold ${msg.isRead ? 'text-muted' : 'text-cream'}`}>{msg.name}</span>
                            {!msg.isRead ? <span className="h-2 w-2 rounded-full bg-yellow" /> : null}
                          </div>
                          <div className="text-xs text-smoke">{msg.subject || 'General enquiry'} · {dateTime(msg.createdAt)}</div>
                          <div className="mt-1 line-clamp-2 text-sm text-muted">{msg.message}</div>
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            ) : <div className="py-16 text-center text-muted">No messages yet.</div>}
          </Card>
          <Card className="p-6">
            {selectedMessage ? (
              <div>
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2"><h3 className="text-2xl text-cream">{selectedMessage.name}</h3><Badge tone={selectedMessage.isRead ? 'muted' : 'yellow'}>{selectedMessage.isRead ? 'Read' : 'New'}</Badge></div>
                    <div className="mt-1 text-sm text-smoke">{selectedMessage.subject || 'General enquiry'} · {dateTime(selectedMessage.createdAt)}</div>
                  </div>
                </div>
                <div className="mb-4 space-y-1 text-sm text-muted">
                  {selectedMessage.email ? <div className="flex items-center gap-2"><Mail size={14} className="text-yellow" /> <a href={`mailto:${selectedMessage.email}`} className="hover:text-yellow">{selectedMessage.email}</a></div> : null}
                  {selectedMessage.phone ? <div>Phone: <a href={`tel:${selectedMessage.phone}`} className="text-cream hover:text-yellow">{selectedMessage.phone}</a></div> : null}
                </div>
                <div className="rounded-2xl border border-line bg-neumo/40 p-4 text-sm leading-relaxed text-muted whitespace-pre-wrap">{selectedMessage.message}</div>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => toggleRead(selectedMessage)}>Mark as {selectedMessage.isRead ? 'unread' : 'read'}</Button>
                  <Button variant="danger" onClick={() => deleteMessage(selectedMessage)}><Trash2 size={14} /> Delete</Button>
                  {selectedMessage.email ? <a href={`mailto:${selectedMessage.email}?subject=Re: ${encodeURIComponent(selectedMessage.subject || 'Hungry Hut enquiry')}`}><Button variant="ghost"><Mail size={14} /> Reply</Button></a> : null}
                </div>
              </div>
            ) : (
              <div className="flex h-full min-h-[240px] items-center justify-center text-center text-muted">
                <div><Mail size={28} className="mx-auto mb-3 text-yellow/50" /><p>Select a message to read it.</p></div>
              </div>
            )}
          </Card>
        </div>
      ) : null}
    </div>
  );
}
