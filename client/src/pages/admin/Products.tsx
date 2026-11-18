import { useEffect, useState } from 'react';
import { api, errorMessage } from '../../lib/api';
import type { Category, Product } from '../../types';
import { useToast } from '../../context/ToastContext';
import { inr } from '../../lib/format';
import { Badge, Button, Input, Modal, Select, Textarea } from '../../components/ui';
import { ActionButtons, ConfirmDialog, DataTable, ImageUpload, PageHeader, Td } from '../../components/admin/AdminBits';

const empty = {
  name: '', description: '', longDescription: '', price: 0, compareAtPrice: 0, image: '', category: '',
  foodType: 'nonveg', isAvailable: true, isBestseller: false, isPopular: false, isSpicy: false, isNew: false,
  calories: 0, prepTime: 12, rating: 4.8, ratingCount: 0, tags: '' as any, order: 0,
};

export default function ProductsAdmin() {
  const [items, setItems] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<any>(empty);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState<Product | null>(null);
  const [filter, setFilter] = useState('');
  const { success, error } = useToast();

  const getId = (x: any) => x?.id || x?._id;
  const withId = (x: any) => (x ? { ...x, id: getId(x) } : x);

  const load = async () => {
    try {
      setLoading(true);
      const [p, c] = await Promise.all([api.get<Product[]>('/admin/products'), api.get<Category[]>('/admin/categories')]);
      setItems((p as any[]).map(withId));
      setCategories((c as any[]).map(withId));
    } catch (err) { error(errorMessage(err)); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const startNew = () => { setEditing(null); setForm({ ...empty, category: getId(categories[0]) || '' }); setOpen(true); };
  const startEdit = (item: Product) => {
    const normalized = withId(item) as Product;
    setEditing(normalized);
    setForm({
      name: normalized.name, description: normalized.description || '', longDescription: normalized.longDescription || '',
      price: normalized.price, compareAtPrice: normalized.compareAtPrice || 0, image: normalized.image || '',
      category: typeof normalized.category === 'object' ? getId(normalized.category) : normalized.category || '',
      foodType: normalized.foodType || 'nonveg', isAvailable: normalized.isAvailable !== false,
      isBestseller: !!normalized.isBestseller, isPopular: !!normalized.isPopular, isSpicy: !!normalized.isSpicy, isNew: !!normalized.isNew,
      calories: normalized.calories || 0, prepTime: normalized.prepTime || 12, rating: normalized.rating || 4.8, ratingCount: normalized.ratingCount || 0,
      tags: (normalized.tags || []).join(', '), order: normalized.order || 0,
    });
    setOpen(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = { ...form, tags: String(form.tags || '').split(',').map((t: string) => t.trim()).filter(Boolean) };
      if (editing) await api.put(`/admin/products/${getId(editing)}`, payload);
      else await api.post('/admin/products', payload);
      success(editing ? 'Product updated.' : 'Product created.');
      setOpen(false);
      load();
    } catch (err) { error(errorMessage(err)); } finally { setSaving(false); }
  };

  const remove = async () => {
    if (!confirm) return;
    try { setSaving(true); await api.delete(`/admin/products/${getId(confirm)}`); success('Product deleted.'); setConfirm(null); load(); }
    catch (err) { error(errorMessage(err)); } finally { setSaving(false); }
  };

  const filtered = items.filter((p) => !filter || p.name.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div>
      <PageHeader title="Products" description="Manage the full Hungry Hut menu — prices, images, availability and tags." action={<Button onClick={startNew}>Add product</Button>} />
      <div className="mb-4"><Input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Search products…" className="max-w-sm" /></div>
      {loading ? <div className="py-20 text-center text-muted">Loading…</div> : (
        <DataTable head={['Product', 'Category', 'Price', 'Flags', 'Status', 'Actions']}>
          {filtered.map((item) => (
            <tr key={getId(item)}>
              <Td>
                <div className="flex items-center gap-3">
                  <img src={item.image} alt="" className="h-14 w-14 rounded-xl object-cover bg-neumo/70" />
                  <div>
                    <div className="font-semibold text-cream">{item.name}</div>
                    <div className="max-w-xs text-xs text-smoke line-clamp-1">{item.description}</div>
                    <div className="mt-0.5 text-[10px] uppercase tracking-[0.14em] text-smoke">{item.foodType}</div>
                  </div>
                </div>
              </Td>
              <Td className="text-muted">{(item.category as any)?.name || '—'}</Td>
              <Td><div className="font-semibold text-yellow">{inr(item.price)}</div>{item.compareAtPrice ? <div className="text-xs text-smoke line-through">{inr(item.compareAtPrice)}</div> : null}</Td>
              <Td><div className="flex flex-wrap gap-1">{item.isBestseller ? <Badge tone="yellow">Best</Badge> : null}{item.isPopular ? <Badge tone="orange">Popular</Badge> : null}{item.isNew ? <Badge tone="muted">New</Badge> : null}{item.isSpicy ? <Badge tone="red">Spicy</Badge> : null}</div></Td>
              <Td><Badge tone={item.isAvailable ? 'green' : 'red'}>{item.isAvailable ? 'Available' : 'Unavailable'}</Badge></Td>
              <Td><ActionButtons onEdit={() => startEdit(item)} onDelete={() => setConfirm(item)} /></Td>
            </tr>
          ))}
        </DataTable>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit product' : 'New product'} wide>
        <form onSubmit={save} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Select label="Category" required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              <option value="">Select category</option>
              {categories.map((c) => <option key={getId(c)} value={getId(c)}>{c.name}</option>)}
            </Select>
          </div>
          <Textarea label="Short description" required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
          <Textarea label="Long description" value={form.longDescription} onChange={(e) => setForm({ ...form, longDescription: e.target.value })} rows={3} />
          <ImageUpload label="Product image" value={form.image} onChange={(url) => setForm({ ...form, image: url })} />
          <div className="grid gap-4 sm:grid-cols-3">
            <Input label="Price (₹)" type="number" min={0} required value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
            <Input label="Compare-at (₹)" type="number" min={0} value={form.compareAtPrice} onChange={(e) => setForm({ ...form, compareAtPrice: Number(e.target.value) })} />
            <Select label="Type" value={form.foodType} onChange={(e) => setForm({ ...form, foodType: e.target.value })}>
              <option value="nonveg">Non-veg</option><option value="veg">Veg</option><option value="egg">Egg</option>
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-4">
            <Input label="Calories" type="number" min={0} value={form.calories} onChange={(e) => setForm({ ...form, calories: Number(e.target.value) })} />
            <Input label="Prep (min)" type="number" min={1} value={form.prepTime} onChange={(e) => setForm({ ...form, prepTime: Number(e.target.value) })} />
            <Input label="Rating" type="number" step="0.1" min={0} max={5} value={form.rating} onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })} />
            <Input label="Order" type="number" value={form.order} onChange={(e) => setForm({ ...form, order: Number(e.target.value) })} />
          </div>
          <Input label="Tags (comma separated)" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="spicy, bucket, bestseller" />
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
            {[['isAvailable','Available'],['isBestseller','Bestseller'],['isPopular','Popular'],['isSpicy','Spicy'],['isNew','New']].map(([key,label]) => (
              <label key={key} className="inline-flex items-center gap-2"><input type="checkbox" checked={!!form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.checked })} className="accent-yellow" /> {label}</label>
            ))}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>{editing ? 'Save changes' : 'Create product'}</Button>
          </div>
        </form>
      </Modal>
      <ConfirmDialog open={!!confirm} title="Delete product" message={`Delete "${confirm?.name}"? This cannot be undone.`} onConfirm={remove} onClose={() => setConfirm(null)} loading={saving} />
    </div>
  );
}
