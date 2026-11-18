import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { LoaderCircle, X } from 'lucide-react';
import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';
import { forwardRef, useEffect } from 'react';

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'primary', size = 'md', loading, disabled, children, ...props },
  ref,
) {
  const base =
    'inline-flex items-center justify-center gap-2 whitespace-nowrap font-bold uppercase tracking-[0.14em] transition-all duration-200 ease-crunch disabled:pointer-events-none disabled:opacity-50';
  const variants: Record<string, string> = {
    primary:
      'rounded-2xl bg-orange text-white shadow-neumo-raised-sm hover:bg-[#ff7a1a] active:shadow-neumo-inset-sm active:translate-y-[1px]',
    secondary:
      'rounded-2xl bg-neumo text-cream border border-line shadow-neumo-raised-sm hover:text-yellow active:shadow-neumo-inset-sm',
    outline:
      'rounded-2xl border border-line bg-transparent text-cream shadow-neumo-flat hover:border-orange/40 hover:text-orange active:shadow-neumo-inset-sm',
    ghost:
      'rounded-xl bg-transparent text-muted hover:bg-neumo hover:text-cream active:shadow-neumo-inset-sm',
    danger:
      'rounded-2xl bg-orange/90 text-white shadow-neumo-raised-sm hover:bg-orange active:shadow-neumo-inset-sm',
  };
  const sizes: Record<string, string> = {
    sm: 'px-4 py-2 text-[11px]',
    md: 'px-5 py-3 text-xs sm:text-[13px]',
    lg: 'px-7 py-3.5 text-sm sm:px-8 sm:py-4',
  };

  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cx(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {loading ? <LoaderCircle size={16} className="animate-spin" /> : null}
      {children}
    </button>
  );
});

export const IconButton = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { label: string }>(
  function IconButton({ className, label, children, ...props }, ref) {
    return (
      <button
        ref={ref}
        aria-label={label}
        title={label}
        className={cx(
          'inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-line bg-neumo text-muted shadow-neumo-raised-sm transition-all duration-200 hover:text-orange active:shadow-neumo-inset-sm',
          className,
        )}
        {...props}
      >
        {children}
      </button>
    );
  },
);

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, className, id, ...props },
  ref,
) {
  const inputId = id || (label ? label.toLowerCase().replace(/[^a-z0-9]+/g, '-') : undefined);
  return (
    <label className="block w-full" htmlFor={inputId}>
      {label ? (
        <span className="field-label">
          {label}
          {props.required ? <span className="ml-0.5 text-orange">*</span> : null}
        </span>
      ) : null}
      <input
        ref={ref}
        id={inputId}
        className={cx(
          'field',
          error ? 'border-orange/60' : '',
          className,
        )}
        {...props}
      />
      {hint && !error ? <span className="mt-1.5 block text-xs text-smoke">{hint}</span> : null}
      {error ? <span className="mt-1.5 block text-xs text-orange">{error}</span> : null}
    </label>
  );
});

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, className, id, ...props },
  ref,
) {
  const inputId = id || (label ? label.toLowerCase().replace(/[^a-z0-9]+/g, '-') : undefined);
  return (
    <label className="block w-full" htmlFor={inputId}>
      {label ? (
        <span className="field-label">
          {label}
          {props.required ? <span className="ml-0.5 text-orange">*</span> : null}
        </span>
      ) : null}
      <textarea
        ref={ref}
        id={inputId}
        className={cx('field min-h-[110px] resize-y', error ? 'border-orange/60' : '', className)}
        {...props}
      />
      {hint && !error ? <span className="mt-1.5 block text-xs text-smoke">{hint}</span> : null}
      {error ? <span className="mt-1.5 block text-xs text-orange">{error}</span> : null}
    </label>
  );
});

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, className, id, children, ...props },
  ref,
) {
  const inputId = id || (label ? label.toLowerCase().replace(/[^a-z0-9]+/g, '-') : undefined);
  return (
    <label className="block w-full" htmlFor={inputId}>
      {label ? (
        <span className="field-label">
          {label}
          {props.required ? <span className="ml-0.5 text-orange">*</span> : null}
        </span>
      ) : null}
      <select
        ref={ref}
        id={inputId}
        className={cx('field cursor-pointer appearance-none pr-10', error ? 'border-orange/60' : '', className)}
        {...props}
      >
        {children}
      </select>
      {hint && !error ? <span className="mt-1.5 block text-xs text-smoke">{hint}</span> : null}
      {error ? <span className="mt-1.5 block text-xs text-orange">{error}</span> : null}
    </label>
  );
});

export function Card({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div
      className={cx(
        'rounded-3xl border border-line bg-card shadow-neumo-raised-sm',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  accent,
  description,
  align = 'left',
  className,
}: {
  eyebrow?: string;
  title: string;
  accent?: string;
  description?: string;
  align?: 'left' | 'center';
  className?: string;
}) {
  return (
    <div className={cx('max-w-3xl', align === 'center' && 'mx-auto text-center', className)}>
      {eyebrow ? <div className={cx('eyebrow mb-4', align === 'center' && 'mx-auto')}>{eyebrow}</div> : null}
      <h2 className="section-title text-balance">
        {title}
        {accent ? (
          <>
            {' '}
            <span className="serif-italic normal-case tracking-[-0.02em] text-yellow">{accent}</span>
          </>
        ) : null}
      </h2>
      {description ? (
        <p className={cx('mt-5 max-w-2xl text-balance leading-7', align === 'center' && 'mx-auto')}>{description}</p>
      ) : null}
    </div>
  );
}

export function Badge({
  children,
  tone = 'yellow',
  className,
}: {
  children: ReactNode;
  tone?: 'yellow' | 'orange' | 'red' | 'green' | 'muted';
  className?: string;
}) {
  const tones: Record<string, string> = {
    yellow: 'border-yellow/30 bg-yellow/10 text-yellow',
    orange: 'border-orange/30 bg-orange/10 text-orange',
    red: 'border-orange/30 bg-orange/10 text-orange',
    green: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
    muted: 'border-line bg-neumo text-muted',
  };
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em]',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  wide?: boolean;
}) {
  const reduce = useReducedMotion();
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[200] flex items-end justify-center p-3 sm:items-center sm:p-6" role="dialog" aria-modal="true">
          <motion.button
            type="button"
            aria-label="Close dialog"
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: reduce ? 0 : 0.25, ease: [0.22, 1, 0.36, 1] }}
            className={cx(
              'glass-panel-strong relative z-10 max-h-[92vh] w-full overflow-y-auto rounded-3xl p-5 sm:p-6',
              wide ? 'max-w-4xl' : 'max-w-xl',
            )}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              {title ? <div className="text-xl font-display tracking-wide text-cream">{title}</div> : <span />}
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-line bg-neumo text-muted shadow-neumo-raised-sm transition hover:text-orange active:shadow-neumo-inset-sm"
                aria-label="Close"
              >
                <X size={17} />
              </button>
            </div>
            {children}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10 text-muted">
      <LoaderCircle className="h-7 w-7 animate-spin text-orange" />
      {label ? <p className="text-sm text-muted">{label}</p> : null}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-lg rounded-3xl border border-line bg-neumo p-10 text-center shadow-neumo-inset-sm">
      <h3 className="text-2xl text-cream">{title}</h3>
      {description ? <p className="mt-2 text-sm text-muted">{description}</p> : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx('animate-pulse rounded-2xl bg-neumo', className)} />;
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: 'text-yellow border-yellow/30 bg-yellow/10',
    confirmed: 'text-orange border-orange/30 bg-orange/10',
    preparing: 'text-orange border-orange/30 bg-orange/10',
    ready: 'text-emerald-300 border-emerald-400/30 bg-emerald-400/10',
    out_for_delivery: 'text-sky-300 border-sky-400/30 bg-sky-400/10',
    completed: 'text-emerald-300 border-emerald-400/30 bg-emerald-400/10',
    cancelled: 'text-smoke border-line bg-neumo',
    paid: 'text-emerald-300 border-emerald-400/30 bg-emerald-400/10',
    failed: 'text-orange border-orange/30 bg-orange/10',
    refunded: 'text-sky-300 border-sky-400/30 bg-sky-400/10',
  };
  return (
    <span
      className={cx(
        'inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em]',
        map[status] || 'text-muted border-line bg-neumo',
      )}
    >
      {status.replace(/_/g, ' ')}
    </span>
  );
}
