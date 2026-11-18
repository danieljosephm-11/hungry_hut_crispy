import { useEffect, useState } from 'react';
import { api, errorMessage } from '../../lib/api';
import type { Category } from '../../types';
import { useToast } from '../../context/ToastContext';
import { Badge, Button, Input, Modal, Textarea } from '../../components/ui';
import { ActionButtons, ConfirmDialog, DataTable, ImageUpload, PageHeader, Td } from '../../components/admin/AdminBits';

const empty = { name: '', description: '', image: '', order: 0, isActive: true };

export default function CategoriesAdmin() {
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<any>(empty);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState<Category | null>(null);
  const { success, error } = useToast();
  const getId = (x: any) => x?.id || x?._id;
  const withId = (x: any) => (x ? { ...x, id: getId(x) } : x);

  const load = async () => {
    try {
      setLoading(true);
      setItems(((await api.get<Category[]>('/admin/categories')) as any[]).map(withId));
    } catch (err) {
      error(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const startNew = () => { setEditing(null); setForm({ ...empty }); setOpen(true); };
  const startEdit = (item: Category) => {
    const normalized = withId(item) as Category;
    setEditing(normalized);
    setForm({ name: normalized.name, description: normalized.description || '', image: normalized.image || '', order: normalized.order || 0, isActive: normalized.isActive !== false });
    setOpen(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      if (editing) await api.put(`/admin/categories/${getId(editing)}`, form);
      else await api.post('/admin/categories', form);
      success(editing ? 'Category updated.' : 'Category created.');
      setOpen(false);
      load();
    } catch (err) { error(errorMessage(err)); } finally { setSaving(false); }
  };

  const remove = async () => {
    if (!confirm) return;
    try {
      setSaving(true);
      await api.delete(`/admin/categories/${getId(confirm)}`);
      success('Category deleted.');
      setConfirm(null);
      load();
    } catch (err) { error(errorMessage(err)); } finally { setSaving(false); }
  };

  return (
    <div>
      <PageHeader title="Categories" description="Organise your menu into clear, appetising sections." action={<Button onClick={startNew}>Add category</Button>} />
      {loading ? <div className="py-20 text-center text-muted">Loading…</div> : (
        <DataTable head={['Category', 'Slug', 'Products', 'Order', 'Status', 'Actions']}>
          {items.map((item) => (
            <tr key={getId(item)}>
              <Td>
                <div className="flex items-center gap-3">
                  {item.image ? <img src={item.image} alt="" className="h-12 w-12 rounded-lg object-cover" /> : <div className="h-12 w-12 rounded-lg bg-neumo/70" />}
                  <div>
                    <div className="font-semibold text-cream">{item.name}</div>
                    <div className="max-w-xs text-xs text-smoke line-clamp-1">{item.description}</div>
                  </div>
                </div>
              </Td>
              <Td className="text-muted">{item.slug}</Td>
              <Td>{item.productCount ?? 0}</Td>
              <Td>{item.order ?? 0}</Td>
              <Td><Badge tone={item.isActive === false ? 'muted' : 'green'}>{item.isActive === false ? 'Hidden' : 'Active'}</Badge></Td>
              <Td><ActionButtons onEdit={() => startEdit(item)} onDelete={() => setConfirm(item)} /></Td>
            </tr>
          ))}
        </DataTable>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit category' : 'New category'}>
        <form onSubmit={save} className="space-y-4">
          <Input label="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Textarea label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
          <ImageUpload label="Image" value={form.image} onChange={(url) => setForm({ ...form, image: url })} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Order" type="number" value={form.order} onChange={(e) => setForm({ ...form, order: Number(e.target.value) })} />
            <label className="mt-6 inline-flex items-center gap-2 text-sm text-muted"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="accent-yellow" /> Active</label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>{editing ? 'Save changes' : 'Create category'}</Button>
          </div>
        </form>
      </Modal>
      <ConfirmDialog open={!!confirm} title="Delete category" message={`Delete "${confirm?.name}"? Categories with products cannot be deleted.`} onConfirm={remove} onClose={() => setConfirm(null)} loading={saving} />
    </div>
  );
}
