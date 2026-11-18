import { useEffect, useState } from 'react';
import { api, errorMessage } from '../../lib/api';
import type { GalleryItem } from '../../types';
import { useToast } from '../../context/ToastContext';
import { Badge, Button, Input, Modal, Select } from '../../components/ui';
import { ActionButtons, ConfirmDialog, DataTable, ImageUpload, PageHeader, Td } from '../../components/admin/AdminBits';

const CATEGORIES = ['Food', 'Buckets', 'Burgers', 'Pizza', 'Interiors', 'Kitchen', 'Moments'];
const empty = { title: '', category: 'Food', image: '', alt: '', isActive: true, order: 0 };

export default function GalleryAdmin() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<GalleryItem | null>(null);
  const [form, setForm] = useState<any>(empty);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState<GalleryItem | null>(null);
  const { success, error } = useToast();
  const getId = (x: any) => x?.id || x?._id;
  const withId = (x: any) => (x ? { ...x, id: getId(x) } : x);

  const load = async () => {
    try {
      setLoading(true);
      setItems(((await api.get<GalleryItem[]>('/admin/gallery')) as any[]).map(withId));
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

  const startEdit = (item: GalleryItem) => {
    const normalized = withId(item) as GalleryItem;
    setEditing(normalized);
    setForm({
      title: normalized.title,
      category: normalized.category || 'Food',
      image: normalized.image || '',
      alt: normalized.alt || '',
      isActive: normalized.isActive !== false,
      order: normalized.order || 0,
    });
    setOpen(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      if (editing) await api.put(`/admin/gallery/${getId(editing)}`, form);
      else await api.post('/admin/gallery', form);
      success(editing ? 'Gallery item updated.' : 'Gallery item added.');
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
      await api.delete(`/admin/gallery/${getId(confirm)}`);
      success('Gallery item deleted.');
      setConfirm(null);
      load();
    } catch (err) {
      error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Gallery"
        description="Curate the photos shown in the Hungry Hut gallery."
        action={<Button onClick={startNew}>Add image</Button>}
      />
      {loading ? (
        <div className="py-20 text-center text-muted">Loading…</div>
      ) : (
        <DataTable head={['Image', 'Title', 'Category', 'Order', 'Status', 'Actions']}>
          {items.map((item) => (
            <tr key={getId(item)}>
              <Td>
                <img src={item.image} alt={item.alt || item.title} className="h-16 w-24 rounded-lg object-cover" />
              </Td>
              <Td>
                <div className="font-semibold text-cream">{item.title}</div>
                <div className="max-w-xs text-xs text-smoke line-clamp-1">{item.alt || '—'}</div>
              </Td>
              <Td>
                <Badge tone="yellow">{item.category}</Badge>
              </Td>
              <Td>{item.order ?? 0}</Td>
              <Td>
                <Badge tone={item.isActive === false ? 'muted' : 'green'}>
                  {item.isActive === false ? 'Hidden' : 'Visible'}
                </Badge>
              </Td>
              <Td>
                <ActionButtons onEdit={() => startEdit(item)} onDelete={() => setConfirm(item)} />
              </Td>
            </tr>
          ))}
          {!items.length ? (
            <tr>
              <td colSpan={6} className="px-5 py-10 text-center text-muted">
                No gallery images yet.
              </td>
            </tr>
          ) : null}
        </DataTable>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit gallery image' : 'Add gallery image'}>
        <form onSubmit={save} className="space-y-4">
          <ImageUpload label="Image" value={form.image} onChange={(url) => setForm({ ...form, image: url })} />
          <Input label="Title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Input
            label="Alt text"
            value={form.alt}
            onChange={(e) => setForm({ ...form, alt: e.target.value })}
            placeholder="Describe the image"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Category"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
            <Input
              label="Display order"
              type="number"
              value={form.order}
              onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
            />
          </div>
          <label className="inline-flex items-center gap-2 text-sm text-muted">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="accent-yellow"
            />{' '}
            Visible on site
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {editing ? 'Save changes' : 'Add image'}
            </Button>
          </div>
        </form>
      </Modal>
      <ConfirmDialog
        open={!!confirm}
        title="Delete image"
        message={`Delete "${confirm?.title}" from the gallery?`}
        onConfirm={remove}
        onClose={() => setConfirm(null)}
        loading={saving}
      />
    </div>
  );
}
