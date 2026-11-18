import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { CheckCircle2, Info, TriangleAlert, X } from 'lucide-react';
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

type ToastKind = 'success' | 'error' | 'info';
interface Toast {
  id: number;
  message: string;
  kind: ToastKind;
}

interface ToastContextValue {
  toast: (message: string, kind?: ToastKind) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);
let counter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const reduce = useReducedMotion();

  const remove = useCallback((id: number) => setItems((current) => current.filter((item) => item.id !== id)), []);

  const toast = useCallback(
    (message: string, kind: ToastKind = 'info') => {
      const id = ++counter;
      setItems((current) => [...current, { id, message, kind }].slice(-4));
      window.setTimeout(() => remove(id), 4200);
    },
    [remove],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      toast,
      success: (message) => toast(message, 'success'),
      error: (message) => toast(message, 'error'),
      info: (message) => toast(message, 'info'),
    }),
    [toast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-3 bottom-3 z-[300] flex flex-col items-center gap-2 sm:bottom-6">
        <AnimatePresence initial={false}>
          {items.map((item) => {
            const Icon = item.kind === 'success' ? CheckCircle2 : item.kind === 'error' ? TriangleAlert : Info;
            return (
              <motion.div
                key={item.id}
                initial={reduce ? false : { opacity: 0, y: 18, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.98 }}
                transition={{ duration: reduce ? 0 : 0.22 }}
                className="pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-2xl border border-line bg-card px-4 py-3 shadow-neumo-raised-sm"
                role="status"
              >
                <Icon
                  size={18}
                  className={`mt-0.5 shrink-0 ${
                    item.kind === 'success' ? 'text-yellow' : item.kind === 'error' ? 'text-orange' : 'text-muted'
                  }`}
                />
                <p className="flex-1 text-sm leading-relaxed text-cream">{item.message}</p>
                <button
                  type="button"
                  onClick={() => remove(item.id)}
                  className="rounded-xl p-1.5 text-smoke transition hover:bg-neumo hover:text-cream"
                  aria-label="Dismiss notification"
                >
                  <X size={15} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside ToastProvider');
  return context;
}
