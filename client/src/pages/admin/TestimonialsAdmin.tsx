import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { api, errorMessage } from '../../lib/api';
import type { Testimonial } from '../../types';
import { useToast } from '../../context/ToastContext';
import { Badge, Button, Input, Modal, Select, Textarea } from '../../components/ui';
import { ActionButtons, ConfirmDialog, DataTable, ImageUpload, PageHeader, Td } from '../../components/admin/AdminBits';

const empty = {
  name: '',
  location: '',
  avatar: '',
  rating: 5,
  review: '',
  isApproved: true,
  isFeatured: false,
  order: 0,
};

export default function TestimonialsAdmin() {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [form, setForm] = useState<any>(empty);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState<Testimonial | null>(null);
  const { success, error } = useToast();
  const getId = (x: any) => x?.id || x?._id;
  const withId = (x: any) => (x ? { ...x, id: getId(x) } : x);

  const load = async () => {
    try {
      setLoading(true);
      setItems(((await api.get<Testimonial[]>('/admin/testimonials')) as any[]).map(withId));
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

  const startEdit = (item: Testimonial) => {
    const normalized = withId(item) as Testimonial;
    setEditing(normalized);
    setForm({
      name: normalized.name,
      location: normalized.location || '',
      avatar: normalized.avatar || '',
      rating: normalized.rating || 5,
      review: normalized.review || '',
      isApproved: normalized.isApproved !== false,
      isFeatured: !!normalized.isFeatured,
      order: normalized.order || 0,
    });
    setOpen(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      if (editing) await api.put(`/admin/testimonials/${getId(editing)}`, form);
      else await api.post('/admin/testimonials', form);
      success(editing ? 'Testimonial updated.' : 'Testimonial added.');
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
      await api.delete(`/admin/testimonials/${getId(confirm)}`);
      success('Testimonial deleted.');
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
        title="Testimonials"
        description="Approve, feature and manage customer reviews shown on the site."
        action={<Button onClick={startNew}>Add testimonial</Button>}
      />
      {loading ? (
        <div className="py-20 text-center text-muted">Loading…</div>
      ) : (
        <DataTable head={['Customer', 'Rating', 'Review', 'Status', 'Actions']}>
          {items.map((item) => (
            <tr key={getId(item)}>
              <Td>
                <div className="flex items-center gap-3">
                  {item.avatar ? (
                    <img src={item.avatar} alt="" className="h-11 w-11 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-yellow/15 font-display text-lg text-yellow">
                      {item.name[0]}
                    </div>
                  )}
                  <div>
                    <div className="font-semibold text-cream">{item.name}</div>
                    <div className="text-xs text-smoke">{item.location || '—'}</div>
                  </div>
                </div>
              </Td>
              <Td>
                <div className="flex items-center gap-1 text-yellow">
                  <Star size={14} className="fill-yellow" />
                  <span className="font-semibold text-cream">{item.rating}</span>
                </div>
              </Td>
              <Td className="max-w-md text-sm text-muted">
                <span className="line-clamp-2">“{item.review}”</span>
              </Td>
              <Td>
                <div className="flex flex-wrap gap-1">
                  <Badge tone={item.isApproved === false ? 'muted' : 'green'}>
                    {item.isApproved === false ? 'Pending' : 'Approved'}
                  </Badge>
                  {item.isFeatured ? <Badge tone="yellow">Featured</Badge> : null}
                </div>
              </Td>
              <Td>
                <ActionButtons onEdit={() => startEdit(item)} onDelete={() => setConfirm(item)} />
              </Td>
            </tr>
          ))}
          {!items.length ? (
            <tr>
              <td colSpan={5} className="px-5 py-10 text-center text-muted">
                No testimonials yet.
              </td>
            </tr>
          ) : null}
        </DataTable>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit testimonial' : 'Add testimonial'}>
        <form onSubmit={save} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input
              label="Location"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="e.g. Hauz Khas"
            />
          </div>
          <ImageUpload label="Avatar" value={form.avatar} onChange={(url) => setForm({ ...form, avatar: url })} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Rating"
              value={String(form.rating)}
              onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}
            >
              {[5, 4, 3, 2, 1].map((r) => (
                <option key={r} value={r}>
                  {r} star{r === 1 ? '' : 's'}
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
          <Textarea
            label="Review"
            required
            rows={4}
            value={form.review}
            onChange={(e) => setForm({ ...form, review: e.target.value })}
          />
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.isApproved}
                onChange={(e) => setForm({ ...form, isApproved: e.target.checked })}
                className="accent-yellow"
              />{' '}
              Approved (visible on site)
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
                className="accent-yellow"
              />{' '}
              Featured
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {editing ? 'Save changes' : 'Add testimonial'}
            </Button>
          </div>
        </form>
      </Modal>
      <ConfirmDialog
        open={!!confirm}
        title="Delete testimonial"
        message={`Delete the review from "${confirm?.name}"?`}
        onConfirm={remove}
        onClose={() => setConfirm(null)}
        loading={saving}
      />
    </div>
  );
}
