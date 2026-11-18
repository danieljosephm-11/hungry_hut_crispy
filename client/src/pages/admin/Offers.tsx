import { useEffect, useState } from 'react';
import { api, errorMessage } from '../../lib/api';
import type { Coupon, Offer, Product } from '../../types';
import { useToast } from '../../context/ToastContext';
import { inr, dateTime, shortDate, titleCase } from '../../lib/format';
import { Badge, Button, Input, Modal, Select, Textarea } from '../../components/ui';
import { ActionButtons, ConfirmDialog, DataTable, ImageUpload, PageHeader, Td } from '../../components/admin/AdminBits';

const empty = {
  title: '',
  subtitle: '',
  description: '',
  badge: '',
  code: '',
  discountType: 'percent',
  discountValue: 10,
  minOrder: 0,
  maxDiscount: 0,
  appliesToProduct: '',
  startsAt: '',
  endsAt: '',
  isActive: true,
  isFeatured: false,
  theme: 'yellow',
  image: '',
  terms: '' as any,
  usageLimit: 0,
  order: 0,
};

function toLocalInput(value?: string | null) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function OffersAdmin() {
  const [items, setItems] = useState<Offer[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Offer | null>(null);
  const [form, setForm] = useState<any>(empty);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState<Offer | null>(null);
  const [busyCoupon, setBusyCoupon] = useState<string | null>(null);
  const { success, error } = useToast();
  const getId = (x: any) => x?.id || x?._id;
  const withId = (x: any) => (x ? { ...x, id: getId(x) } : x);

  const load = async () => {
    try {
      setLoading(true);
      const [offers, couponData, productData] = await Promise.all([
        api.get<Offer[]>('/admin/offers'),
        api.get<Coupon[]>('/admin/coupons'),
        api.get<Product[]>('/admin/products'),
      ]);
      setItems(((offers as any[]) || []).map(withId));
      setCoupons(((couponData as any[]) || []).map(withId));
      setProducts(((productData as any[]) || []).map(withId));
    } catch (err) {
      error(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const startNew = () => {
    setEditing(null);
    setForm({ ...empty });
    setOpen(true);
  };

  const startEdit = (item: Offer) => {
    const normalized = withId(item) as Offer;
    setEditing(normalized);
    const applies = normalized.appliesToProduct
      ? typeof normalized.appliesToProduct === 'object'
        ? getId(normalized.appliesToProduct)
        : normalized.appliesToProduct
      : '';
    setForm({
      title: normalized.title || '',
      subtitle: normalized.subtitle || '',
      description: normalized.description || '',
      badge: normalized.badge || '',
      code: normalized.code || '',
      discountType: normalized.discountType || 'percent',
      discountValue: normalized.discountValue ?? 0,
      minOrder: normalized.minOrder ?? 0,
      maxDiscount: normalized.maxDiscount ?? 0,
      appliesToProduct: applies || '',
      startsAt: toLocalInput(normalized.startsAt),
      endsAt: toLocalInput(normalized.endsAt),
      isActive: normalized.isActive !== false,
      isFeatured: !!normalized.isFeatured,
      theme: normalized.theme || 'yellow',
      image: normalized.image || '',
      terms: (normalized.terms || []).join('\n'),
      usageLimit: normalized.usageLimit ?? 0,
      order: normalized.order ?? 0,
    });
    setOpen(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload: any = {
        ...form,
        code: String(form.code || '').trim().toUpperCase(),
        appliesToProduct: form.appliesToProduct || null,
        startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
        endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
        terms: String(form.terms || '')
          .split('\n')
          .map((t: string) => t.trim())
          .filter(Boolean),
      };
      if (editing) await api.put(`/admin/offers/${getId(editing)}`, payload);
      else await api.post('/admin/offers', payload);
      success(editing ? 'Offer updated.' : 'Offer created.');
      setOpen(false);
      load();
    } catch (err) {
      error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!confirm) return;
    try {
      setSaving(true);
      await api.delete(`/admin/offers/${getId(confirm)}`);
      success('Offer deleted.');
      setConfirm(null);
      load();
    } catch (err) {
      error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const toggleCoupon = async (coupon: Coupon, patch: Partial<Coupon>) => {
    try {
      setBusyCoupon(getId(coupon));
      await api.patch(`/admin/coupons/${getId(coupon)}`, patch);
      success('Coupon updated.');
      load();
    } catch (err) {
      error(errorMessage(err));
    } finally {
      setBusyCoupon(null);
    }
  };

  const discountLabel = (offer: Offer) => {
    if (offer.discountType === 'percent') return `${offer.discountValue}% off`;
    if (offer.discountType === 'fixed') return `${inr(offer.discountValue || 0)} off`;
    if (offer.discountType === 'bogo') return 'BOGO';
    return 'Free delivery';
  };

  return (
    <div className="space-y-8">
      <div>
        <PageHeader
          title="Offers & Coupons"
          description="Create deals and coupon codes. Coupons are synced automatically when an offer has a code."
          action={<Button onClick={startNew}>Add offer</Button>}
        />
        {loading ? (
          <div className="py-20 text-center text-muted">Loading…</div>
        ) : (
          <DataTable head={['Offer', 'Code', 'Discount', 'Rules', 'Status', 'Actions']}>
            {items.map((item) => (
              <tr key={getId(item)}>
                <Td>
                  <div className="flex items-center gap-3">
                    {item.image ? <img src={item.image} alt="" className="h-14 w-14 rounded-xl object-cover" /> : <div className="h-14 w-14 rounded-xl bg-neumo/70" />}
                    <div>
                      <div className="font-semibold text-cream">{item.title}</div>
                      <div className="max-w-xs text-xs text-smoke line-clamp-1">{item.subtitle || item.description || '—'}</div>
                    </div>
                  </div>
                </Td>
                <Td>
                  {item.code ? <span className="font-mono text-sm font-bold text-yellow">{item.code}</span> : <span className="text-smoke">Auto</span>}
                </Td>
                <Td>
                  <div className="font-semibold text-cream">{discountLabel(item)}</div>
                  <div className="text-xs text-smoke">{titleCase(item.discountType)}</div>
                </Td>
                <Td className="text-xs text-muted">
                  <div>Min: {item.minOrder ? inr(item.minOrder) : '—'}</div>
                  <div>Ends: {item.endsAt ? shortDate(item.endsAt) : '—'}</div>
                </Td>
                <Td>
                  <div className="flex flex-wrap gap-1">
                    <Badge tone={item.isActive ? 'green' : 'muted'}>{item.isActive ? 'Active' : 'Inactive'}</Badge>
                    {item.isFeatured ? <Badge tone="yellow">Featured</Badge> : null}
                    <Badge tone={item.theme === 'red' ? 'red' : item.theme === 'orange' ? 'orange' : 'muted'}>{item.theme || 'yellow'}</Badge>
                  </div>
                </Td>
                <Td>
                  <ActionButtons onEdit={() => startEdit(item)} onDelete={() => setConfirm(item)} />
                </Td>
              </tr>
            ))}
            {!items.length ? (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-muted">
                  No offers yet.
                </td>
              </tr>
            ) : null}
          </DataTable>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-2xl text-cream">Coupon usage</h2>
        <p className="mb-4 text-sm text-muted">Coupons are generated from offers with a code. Toggle availability or adjust usage limits here.</p>
        {loading ? null : (
          <DataTable head={['Code', 'Linked offer', 'Usage', 'Validity', 'Status', 'Actions']}>
            {coupons.map((coupon) => (
              <tr key={getId(coupon)}>
                <Td className="font-mono font-bold text-yellow">{coupon.code}</Td>
                <Td className="text-muted">{(coupon.offer as any)?.title || '—'}</Td>
                <Td className="text-sm text-cream">
                  {coupon.usedCount || 0}
                  {coupon.usageLimit ? ` / ${coupon.usageLimit}` : ' / ∞'}
                </Td>
                <Td className="text-xs text-smoke">
                  <div>{coupon.startsAt ? `From ${shortDate(coupon.startsAt)}` : 'No start'}</div>
                  <div>{coupon.endsAt ? `Till ${shortDate(coupon.endsAt)}` : 'No expiry'}</div>
                </Td>
                <Td>
                  <Badge tone={coupon.isActive ? 'green' : 'muted'}>{coupon.isActive ? 'Active' : 'Inactive'}</Badge>
                </Td>
                <Td>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant={coupon.isActive ? 'ghost' : 'outline'}
                      loading={busyCoupon === getId(coupon)}
                      onClick={() => toggleCoupon(coupon, { isActive: !coupon.isActive })}
                    >
                      {coupon.isActive ? 'Disable' : 'Enable'}
                    </Button>
                  </div>
                </Td>
              </tr>
            ))}
            {!coupons.length ? (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-muted">
                  No coupons yet. Add a code to an offer to create one.
                </td>
              </tr>
            ) : null}
          </DataTable>
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit offer' : 'New offer'} wide>
        <form onSubmit={save} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <Input label="Badge" value={form.badge} onChange={(e) => setForm({ ...form, badge: e.target.value })} placeholder="e.g. HOT DEAL" />
          </div>
          <Input label="Subtitle" value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />
          <Textarea label="Description" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <ImageUpload label="Image" value={form.image} onChange={(url) => setForm({ ...form, image: url })} />
          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              label="Coupon code"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              placeholder="HUT10 (optional)"
            />
            <Select label="Discount type" value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value })}>
              <option value="percent">Percent off</option>
              <option value="fixed">Fixed amount off</option>
              <option value="bogo">Buy 1 Get 1</option>
              <option value="free_delivery">Free delivery</option>
            </Select>
            <Select label="Theme" value={form.theme} onChange={(e) => setForm({ ...form, theme: e.target.value })}>
              <option value="yellow">Yellow</option>
              <option value="orange">Orange</option>
              <option value="red">Red</option>
              <option value="cream">Cream</option>
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Input label="Discount value" type="number" min={0} value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: Number(e.target.value) })} hint={form.discountType === 'percent' ? 'Percentage (0-100)' : 'Amount in ₹ or BOGO qty logic'} />
            <Input label="Min order (₹)" type="number" min={0} value={form.minOrder} onChange={(e) => setForm({ ...form, minOrder: Number(e.target.value) })} />
            <Input label="Max discount (₹)" type="number" min={0} value={form.maxDiscount} onChange={(e) => setForm({ ...form, maxDiscount: Number(e.target.value) })} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Starts at" type="datetime-local" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} />
            <Input label="Ends at" type="datetime-local" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Select label="Applies to product (BOGO/target)" value={form.appliesToProduct} onChange={(e) => setForm({ ...form, appliesToProduct: e.target.value })}>
              <option value="">Any / not specific</option>
              {products.map((p) => (
                <option key={getId(p)} value={getId(p)}>
                  {p.name}
                </option>
              ))}
            </Select>
            <Input label="Usage limit" type="number" min={0} value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: Number(e.target.value) })} hint="0 = unlimited" />
            <Input label="Display order" type="number" value={form.order} onChange={(e) => setForm({ ...form, order: Number(e.target.value) })} />
          </div>
          <Textarea label="Terms (one per line)" rows={3} value={form.terms} onChange={(e) => setForm({ ...form, terms: e.target.value })} />
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="accent-yellow" /> Active
            </label>
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} className="accent-yellow" /> Featured
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {editing ? 'Save changes' : 'Create offer'}
            </Button>
          </div>
        </form>
      </Modal>
      <ConfirmDialog
        open={!!confirm}
        title="Delete offer"
        message={`Delete "${confirm?.title}"? Any synced coupon will also be removed.`}
        onConfirm={remove}
        onClose={() => setConfirm(null)}
        loading={saving}
      />
    </div>
  );
}
