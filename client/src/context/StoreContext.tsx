import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { CartItem, Settings } from '../types';
import { api } from '../lib/api';

interface StoreContextValue {
  settings: Settings | null;
  settingsLoading: boolean;
  refreshSettings: () => Promise<void>;
  cart: CartItem[];
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  addItem: (item: CartItem) => void;
  removeItem: (key: string) => void;
  setQuantity: (key: string, quantity: number) => void;
  updateItem: (key: string, updates: Partial<CartItem>) => void;
  clearCart: () => void;
  cartCount: number;
  cartSubtotal: number;
  secretUnlocked: boolean;
  unlockSecret: () => void;
  rememberOrder: (entry: { orderNumber: string; phone: string; name?: string; placedAt?: string }) => void;
  recentOrders: Array<{ orderNumber: string; phone: string; name?: string; placedAt?: string }>;
}

const StoreContext = createContext<StoreContextValue | null>(null);
const CART_KEY = 'hh_cart_v1';
const SECRET_KEY = 'hh_secret_unlocked';
const ORDERS_KEY = 'hh_recent_orders_v1';

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>(() => read<CartItem[]>(CART_KEY, []));
  const [cartOpen, setCartOpen] = useState(false);
  const [secretUnlocked, setSecretUnlocked] = useState(() => read<boolean>(SECRET_KEY, false));
  const [recentOrders, setRecentOrders] = useState<
    Array<{ orderNumber: string; phone: string; name?: string; placedAt?: string }>
  >(() => read(ORDERS_KEY, []));

  const refreshSettings = useCallback(async () => {
    try {
      setSettingsLoading(true);
      const data = await api.get<Settings>('/settings');
      setSettings(data);
    } catch {
      // Keep any existing settings so the UI can still render.
    } finally {
      setSettingsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem(SECRET_KEY, JSON.stringify(secretUnlocked));
  }, [secretUnlocked]);

  useEffect(() => {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(recentOrders.slice(0, 10)));
  }, [recentOrders]);

  const addItem = useCallback((item: CartItem) => {
    setCart((current) => {
      // Merge identical simple items (same key means same product/secret/bucket composition).
      const index = current.findIndex((existing) => existing.key === item.key);
      if (index >= 0) {
        const copy = [...current];
        copy[index] = { ...copy[index], quantity: copy[index].quantity + item.quantity };
        return copy;
      }
      return [...current, item];
    });
    setCartOpen(true);
  }, []);

  const removeItem = useCallback((key: string) => setCart((current) => current.filter((item) => item.key !== key)), []);

  const setQuantity = useCallback((key: string, quantity: number) => {
    setCart((current) => {
      if (quantity <= 0) return current.filter((item) => item.key !== key);
      return current.map((item) => (item.key === key ? { ...item, quantity: Math.min(20, quantity) } : item));
    });
  }, []);

  const updateItem = useCallback((key: string, updates: Partial<CartItem>) => {
    setCart((current) => current.map((item) => (item.key === key ? { ...item, ...updates } : item)));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const unlockSecret = useCallback(() => setSecretUnlocked(true), []);

  const rememberOrder = useCallback(
    (entry: { orderNumber: string; phone: string; name?: string; placedAt?: string }) => {
      setRecentOrders((current) => {
        const filtered = current.filter((item) => item.orderNumber !== entry.orderNumber);
        return [entry, ...filtered].slice(0, 10);
      });
    },
    [],
  );

  const value = useMemo<StoreContextValue>(
    () => ({
      settings,
      settingsLoading,
      refreshSettings,
      cart,
      cartOpen,
      setCartOpen,
      addItem,
      removeItem,
      setQuantity,
      updateItem,
      clearCart,
      cartCount,
      cartSubtotal,
      secretUnlocked,
      unlockSecret,
      rememberOrder,
      recentOrders,
    }),
    [
      settings,
      settingsLoading,
      refreshSettings,
      cart,
      cartOpen,
      addItem,
      removeItem,
      setQuantity,
      updateItem,
      clearCart,
      cartCount,
      cartSubtotal,
      secretUnlocked,
      unlockSecret,
      rememberOrder,
      recentOrders,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used inside StoreProvider');
  return context;
}
