import { useEffect, useState } from 'react';
import { api, errorMessage } from '../../lib/api';
import type { BucketIngredient } from '../../types';
import { useToast } from '../../context/ToastContext';
import { inr } from '../../lib/format';
import { Badge, Button, Input, Modal, Textarea } from '../../components/ui';
import { ActionButtons, ConfirmDialog, DataTable, ImageUpload, PageHeader, Td } from '../../components/admin/AdminBits';

const empty = {
  name: '',
  description: '',
  image: '',
  price: 0,
  maxQuantity: 12,
  unitLabel: 'piece',
  isActive: true,
  order: 0,
};

export default function BucketAdmin() {
  const [items, setItems] = useState<BucketIngredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<BucketIngredient | null>(null);
  const [form, setForm] = useState<any>(empty);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState<BucketIngredient | null>(null);
  const { success, error } = useToast();
  const getId = (x: any) => x?.id || x?._id;
  const withId = (x: any) => (x ? { ...x, id: getId(x) } : x);

  const load = async () => {
    try {
      setLoading(true);
      setItems(((await api.get<BucketIngredient[]>('/admin/bucket/ingredients')) as any[]).map(withId));
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

  const startEdit = (item: BucketIngredient) => {
    const normalized = withId(item) as BucketIngredient;
    setEditing(normalized);
    setForm({
      name: normalized.name,
      description: normalized.description || '',
      image: normalized.image || '',
      price: normalized.price,
      maxQuantity: normalized.maxQuantity || 12,
      unitLabel: normalized.unitLabel || 'piece',
      isActive: normalized.isActive !== false,
      order: normalized.order || 0,
    });
    setOpen(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      if (editing) await api.put(`/admin/bucket/ingredients/${getId(editing)}`, form);
      else await api.post('/admin/bucket/ingredients', form);
      success(editing ? 'Ingredient updated.' : 'Ingredient created.');
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
      await api.delete(`/admin/bucket/ingredients/${getId(confirm)}`);
      success('Ingredient removed.');
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
        title="Build Your Bucket"
        description="Manage the pieces customers can add to a custom bucket, including price and max quantity."
        action={<Button onClick={startNew}>Add ingredient</Button>}
      />
      {loading ? (
        <div className="py-20 text-center text-muted">Loading…</div>
      ) : (
        <DataTable head={['Ingredient', 'Price', 'Max qty', 'Unit', 'Order', 'Status', 'Actions']}>
          {items.map((item) => (
            <tr key={getId(item)}>
              <Td>
                <div className="flex items-center gap-3">
                  {item.image ? (
                    <img src={item.image} alt="" className="h-14 w-14 rounded-xl object-cover" />
                  ) : (
                    <div className="h-14 w-14 rounded-xl bg-neumo/70" />
                  )}
                  <div>
                    <div className="font-semibold text-cream">{item.name}</div>
                    <div className="max-w-xs text-xs text-smoke line-clamp-1">{item.description}</div>
                  </div>
                </div>
              </Td>
              <Td className="font-semibold text-yellow">{inr(item.price)}</Td>
              <Td>{item.maxQuantity}</Td>
              <Td className="text-muted">{item.unitLabel}</Td>
              <Td>{item.order ?? 0}</Td>
              <Td>
                <Badge tone={item.isActive ? 'green' : 'muted'}>{item.isActive ? 'Active' : 'Hidden'}</Badge>
              </Td>
              <Td>
                <ActionButtons onEdit={() => startEdit(item)} onDelete={() => setConfirm(item)} />
              </Td>
            </tr>
          ))}
          {!items.length ? (
            <tr>
              <td colSpan={7} className="px-5 py-10 text-center text-muted">
                No bucket ingredients yet.
              </td>
            </tr>
          ) : null}
        </DataTable>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit ingredient' : 'New ingredient'}>
        <form onSubmit={save} className="space-y-4">
          <Input label="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Textarea
            label="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={2}
          />
          <ImageUpload label="Image" value={form.image} onChange={(url) => setForm({ ...form, image: url })} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Price per unit (₹)"
              type="number"
              min={0}
              required
              value={form.price}
              onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
            />
            <Input
              label="Max quantity per bucket"
              type="number"
              min={1}
              max={50}
              required
              value={form.maxQuantity}
              onChange={(e) => setForm({ ...form, maxQuantity: Number(e.target.value) })}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Unit label"
              value={form.unitLabel}
              onChange={(e) => setForm({ ...form, unitLabel: e.target.value })}
              placeholder="piece"
            />
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
            Active (visible in builder)
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {editing ? 'Save changes' : 'Create ingredient'}
            </Button>
          </div>
        </form>
      </Modal>
      <ConfirmDialog
        open={!!confirm}
        title="Remove ingredient"
        message={`Remove "${confirm?.name}" from the bucket builder?`}
        onConfirm={remove}
        onClose={() => setConfirm(null)}
        loading={saving}
      />
    </div>
  );
}
