import { useRef, useState, type ChangeEvent } from 'react';
import { ImagePlus, LoaderCircle, Pencil, Trash2, Upload } from 'lucide-react';
import { api, errorMessage } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { Button, Card, EmptyState, Input, Modal, Spinner } from '../ui';

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <h1 className="text-4xl text-cream">{title}</h1>
        {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function DataTable({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-neumo/60 text-xs uppercase tracking-[0.14em] text-smoke">
            <tr>
              {head.map((item) => (
                <th key={item} className="whitespace-nowrap px-4 py-3 font-bold">
                  {item}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">{children}</tbody>
        </table>
      </div>
    </Card>
  );
}

export function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 align-middle text-sm text-cream ${className}`}>{children}</td>;
}

export function RowActions({
  onEdit,
  onDelete,
  extra,
}: {
  onEdit?: () => void;
  onDelete?: () => void;
  extra?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-end gap-1.5">
      {extra}
      {onEdit ? (
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-neumo text-muted shadow-neumo-raised-sm transition hover:text-orange active:shadow-neumo-inset-sm"
          aria-label="Edit"
        >
          <Pencil size={14} />
        </button>
      ) : null}
      {onDelete ? (
        <button
          type="button"
          onClick={onDelete}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-neumo text-muted shadow-neumo-raised-sm transition hover:text-orange active:shadow-neumo-inset-sm"
          aria-label="Delete"
        >
          <Trash2 size={14} />
        </button>
      ) : null}
    </div>
  );
}

export function ActionButtons({ onEdit, onDelete }: { onEdit?: () => void; onDelete?: () => void }) {
  return <RowActions onEdit={onEdit} onDelete={onDelete} />;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  loading?: boolean;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="text-sm text-muted">{message}</p>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant="danger" onClick={onConfirm} loading={loading}>
          Delete
        </Button>
      </div>
    </Modal>
  );
}

export function FieldRow({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}

export function Thumb({ src, alt, size = 48 }: { src?: string; alt: string; size?: number }) {
  if (!src) {
    return (
      <div
        className="flex items-center justify-center rounded-xl border border-line bg-neumo text-[10px] text-smoke shadow-neumo-inset-sm"
        style={{ width: size, height: size }}
      >
        —
      </div>
    );
  }
  return <img src={src} alt={alt} className="rounded-xl border border-line object-cover" style={{ width: size, height: size }} loading="lazy" />;
}

export function Toolbar({ children }: { children: React.ReactNode }) {
  return <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">{children}</div>;
}

export function ImageUpload({
  label,
  value,
  onChange,
}: {
  label?: string;
  value?: string;
  onChange: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const { success, error } = useToast();

  const onFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      setUploading(true);
      const result = await api.upload<{ url: string }>('/admin/upload', file, 'image');
      if (result?.url) {
        onChange(result.url);
        success('Image uploaded');
      } else {
        throw new Error('Upload did not return a URL.');
      }
    } catch (err) {
      error(errorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      {label ? <span className="field-label">{label}</span> : null}
      <div className="flex flex-col gap-3 rounded-2xl border border-line bg-neumo/40 p-3 shadow-neumo-inset-sm sm:flex-row sm:items-center">
        <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border border-line bg-card shadow-neumo-raised-sm">
          {value ? (
            <img src={value} alt={label || 'Uploaded image'} className="h-full w-full object-cover" />
          ) : (
            <ImagePlus size={22} className="text-smoke" />
          )}
        </div>
        <div className="flex-1 space-y-2">
          <Input value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder="Image URL or upload a file" />
          <div className="flex flex-wrap gap-2">
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
            <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={uploading}>
              {uploading ? <LoaderCircle size={14} className="animate-spin" /> : <Upload size={14} />} {uploading ? 'Uploading…' : 'Upload'}
            </Button>
            {value ? (
              <Button type="button" variant="ghost" size="sm" onClick={() => onChange('')}>
                Clear
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
