import { useEffect, useState } from 'react';
import { api, errorMessage } from '../../lib/api';
import type { SecretItem, Settings } from '../../types';
import { useToast } from '../../context/ToastContext';
import { inr } from '../../lib/format';
import { Badge, Button, Card, Input, Modal, Select, Textarea } from '../../components/ui';
import { ActionButtons, ConfirmDialog, DataTable, ImageUpload, PageHeader, Td } from '../../components/admin/AdminBits';

const empty = {
  name: '',
  description: '',
  price: 0,
  image: '',
  foodType: 'nonveg',
  badge: 'Secret drop',
  isActive: true,
  order: 0,
};

export default function SecretAdmin() {
  const [items, setItems] = useState<SecretItem[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SecretItem | null>(null);
  const [form, setForm] = useState<any>(empty);
  const [saving, setSaving] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [confirm, setConfirm] = useState<SecretItem | null>(null);
  const [config, setConfig] = useState({ isEnabled: true, hint: '', passphrase: '' });
  const { success, error } = useToast();
  const getId = (x: any) => x?.id || x?._id;
  const withId = (x: any) => (x ? { ...x, id: getId(x) } : x);

  const load = async () => {
    try {
      setLoading(true);
      const [secretItems, siteSettings] = await Promise.all([
        api.get<SecretItem[]>('/admin/secret'),
        api.get<Settings>('/admin/settings'),
      ]);
      setItems(((secretItems as any[]) || []).map(withId));
      setSettings(siteSettings);
      setConfig({
        isEnabled: siteSettings.secretMenu?.isEnabled !== false,
        hint: siteSettings.secretMenu?.hint || '',
        passphrase: siteSettings.secretMenu?.passphrase || '',
      });
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

  const startEdit = (item: SecretItem) => {
    const normalized = withId(item) as SecretItem;
    setEditing(normalized);
    setForm({
      name: normalized.name,
      description: normalized.description || '',
      price: normalized.price,
      image: normalized.image || '',
      foodType: normalized.foodType || 'nonveg',
      badge: normalized.badge || 'Secret drop',
      isActive: normalized.isActive !== false,
      order: normalized.order || 0,
    });
    setOpen(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      if (editing) await api.put(`/admin/secret/${getId(editing)}`, form);
      else await api.post('/admin/secret', form);
      success(editing ? 'Secret item updated.' : 'Secret item added.');
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
      await api.delete(`/admin/secret/${getId(confirm)}`);
      success('Secret item removed.');
      setConfirm(null);
      load();
    } catch (err) {
      error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const saveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingConfig(true);
      const payload: any = { secretMenu: { isEnabled: config.isEnabled, hint: config.hint } };
      if (config.passphrase.trim()) payload.secretMenu.passphrase = config.passphrase.trim();
      await api.put('/admin/settings', payload);
      success('Secret menu settings saved.');
      load();
    } catch (err) {
      error(errorMessage(err));
    } finally {
      setSavingConfig(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Secret Menu"
        description="Manage hidden drops and the passphrase customers use to unlock them."
        action={<Button onClick={startNew}>Add secret item</Button>}
      />

      <Card className="p-5 sm:p-6">
        <h2 className="mb-1 text-2xl text-cream">Unlock settings</h2>
        <p className="mb-4 text-sm text-muted">Control whether the secret menu is active and what word unlocks it.</p>
        <form onSubmit={saveConfig} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[auto_1fr_1fr_auto] sm:items-end">
          <label className="inline-flex items-center gap-2 rounded-xl border border-line bg-neumo/40 px-4 py-3 text-sm text-cream">
            <input
              type="checkbox"
              checked={config.isEnabled}
              onChange={(e) => setConfig({ ...config, isEnabled: e.target.checked })}
              className="accent-yellow"
            />
            Enabled
          </label>
          <Input
            label="Hint shown to guests"
            value={config.hint}
            onChange={(e) => setConfig({ ...config, hint: e.target.value })}
            placeholder="A clue for the passphrase"
          />
          <Input
            label="Passphrase"
            value={config.passphrase}
            onChange={(e) => setConfig({ ...config, passphrase: e.target.value })}
            placeholder="e.g. HUTCRISPY"
          />
          <Button type="submit" loading={savingConfig}>
            Save settings
          </Button>
        </form>
        <p className="mt-2 text-xs text-smoke">Leave passphrase as-is to keep the current secret word. Comparison is case-insensitive on the server.</p>
      </Card>

      {loading ? (
        <div className="py-20 text-center text-muted">Loading…</div>
      ) : (
        <DataTable head={['Item', 'Price', 'Type', 'Badge', 'Order', 'Status', 'Actions']}>
          {items.map((item) => (
            <tr key={getId(item)}>
              <Td>
                <div className="flex items-center gap-3">
                  <img src={item.image} alt="" className="h-14 w-14 rounded-xl object-cover bg-neumo/70" />
                  <div>
                    <div className="font-semibold text-cream">{item.name}</div>
                    <div className="max-w-xs text-xs text-smoke line-clamp-1">{item.description}</div>
                  </div>
                </div>
              </Td>
              <Td className="font-semibold text-yellow">{inr(item.price)}</Td>
              <Td>
                <Badge tone={item.foodType === 'veg' ? 'green' : item.foodType === 'egg' ? 'orange' : 'muted'}>
                  {item.foodType}
                </Badge>
              </Td>
              <Td>
                <Badge tone="yellow">{item.badge || 'Secret drop'}</Badge>
              </Td>
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
                No secret items yet.
              </td>
            </tr>
          ) : null}
        </DataTable>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit secret item' : 'New secret item'}>
        <form onSubmit={save} className="space-y-4">
          <Input label="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Textarea
            label="Description"
            required
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <ImageUpload label="Image" value={form.image} onChange={(url) => setForm({ ...form, image: url })} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Price (₹)"
              type="number"
              min={0}
              required
              value={form.price}
              onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
            />
            <Select label="Type" value={form.foodType} onChange={(e) => setForm({ ...form, foodType: e.target.value })}>
              <option value="nonveg">Non-veg</option>
              <option value="veg">Veg</option>
              <option value="egg">Egg</option>
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Badge" value={form.badge} onChange={(e) => setForm({ ...form, badge: e.target.value })} />
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
            Active
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {editing ? 'Save changes' : 'Add item'}
            </Button>
          </div>
        </form>
      </Modal>
      <ConfirmDialog
        open={!!confirm}
        title="Remove secret item"
        message={`Remove "${confirm?.name}" from the secret menu?`}
        onConfirm={remove}
        onClose={() => setConfirm(null)}
        loading={saving}
      />
    </div>
  );
}
