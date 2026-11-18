export const inr = (value: number | undefined | null) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: Number.isInteger(value || 0) ? 0 : 2,
  }).format(value || 0);

export const number = (value: number | undefined | null) =>
  new Intl.NumberFormat('en-IN').format(value || 0);

export const dateTime = (value?: string | Date | null) => {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
};

export const shortDate = (value?: string | Date | null) => {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' }).format(new Date(value));
};

export const timeOnly = (value?: string | Date | null) => {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit' }).format(new Date(value));
};

export function relativeTime(value?: string | null) {
  if (!value) return '—';
  const diff = Date.now() - new Date(value).getTime();
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} min ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} hr ago`;
  return shortDate(value);
}

export const initials = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');

export const titleCase = (value = '') =>
  value
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());

export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function timeAgo(minutes: number) {
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  return `${Math.floor(minutes / 60)} hr ago`;
}

export function imageUrl(path?: string) {
  if (!path) return '/images/bucket-feast.jpg';
  if (/^https?:\/\//i.test(path) || path.startsWith('/')) return path;
  return `/images/${path}`;
}
