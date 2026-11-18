import { AnimatePresence, motion } from 'framer-motion';
import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';
import { inr } from '../../lib/format';
import { Button, EmptyState } from '../ui';

export default function CartDrawer() {
  const { cart, cartOpen, setCartOpen, removeItem, setQuantity, cartSubtotal, clearCart, settings } = useStore();
  const navigate = useNavigate();

  const fee =
    cartSubtotal === 0
      ? 0
      : cartSubtotal >= (settings?.delivery.freeAbove || 799)
      ? 0
      : settings?.delivery.fee || 49;
  const taxRate = settings?.taxRate || 5;
  const tax = Math.round((cartSubtotal + fee) * (taxRate / 100) * 100) / 100;
  const total = Math.round((cartSubtotal + fee + tax) * 100) / 100;

  return (
    <AnimatePresence>
      {cartOpen ? (
        <div className="fixed inset-0 z-[180]">
          <motion.button
            type="button"
            aria-label="Close cart"
            className="absolute inset-0 bg-ink/65 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCartOpen(false)}
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            className="glass-panel-strong absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-y-0 border-r-0 border-l border-[rgba(255,241,229,0.14)]"
            aria-label="Shopping cart"
          >
            <div className="flex items-center justify-between border-b border-[rgba(255,241,229,0.12)] bg-coal/30 px-5 py-4 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-neumo text-orange shadow-neumo-raised-sm">
                  <ShoppingBag size={17} />
                </div>
                <div>
                  <h2 className="text-lg tracking-wide text-cream">Your Cart</h2>
                  <span className="text-xs text-smoke">{cart.length} {cart.length === 1 ? 'item' : 'items'}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCartOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-line bg-neumo text-muted shadow-neumo-raised-sm transition hover:text-orange active:shadow-neumo-inset-sm"
                aria-label="Close cart"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-ink/15 px-5 py-4">
              {cart.length === 0 ? (
                <EmptyState
                  title="Cart’s feeling light"
                  description="Add some crispy goodness from the menu."
                  action={
                    <Link to="/menu" onClick={() => setCartOpen(false)}>
                      <Button size="sm">Explore Menu</Button>
                    </Link>
                  }
                />
              ) : (
                <ul className="space-y-4">
                  {cart.map((item) => (
                    <li key={item.key} className="flex gap-3 rounded-3xl border border-line bg-card p-3 shadow-neumo-raised-sm">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="h-20 w-20 rounded-2xl object-cover" loading="lazy" />
                      ) : (
                        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-neumo text-xs text-muted shadow-neumo-inset-sm">Custom</div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="truncate text-sm font-semibold text-cream">{item.name}</h3>
                            <p className="mt-0.5 line-clamp-2 text-xs text-muted">{item.description}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeItem(item.key)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-neumo text-muted shadow-neumo-raised-sm transition hover:text-orange active:shadow-neumo-inset-sm"
                            aria-label={`Remove ${item.name}`}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                          <div className="inline-flex items-center gap-1 rounded-2xl border border-line bg-neumo p-1 shadow-neumo-raised-sm">
                            <button
                              type="button"
                              className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-muted transition hover:text-cream active:shadow-neumo-inset-sm"
                              onClick={() => setQuantity(item.key, item.quantity - 1)}
                              aria-label="Decrease quantity"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="min-w-7 text-center text-xs font-semibold text-cream">{item.quantity}</span>
                            <button
                              type="button"
                              className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-muted transition hover:text-cream active:shadow-neumo-inset-sm"
                              onClick={() => setQuantity(item.key, item.quantity + 1)}
                              aria-label="Increase quantity"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                          <span className="text-sm font-bold text-yellow">{inr(item.price * item.quantity)}</span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {cart.length > 0 ? (
              <div className="border-t border-[rgba(255,241,229,0.12)] bg-coal/35 px-5 py-4 backdrop-blur-sm">
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between text-muted">
                    <span>Subtotal</span>
                    <span>{inr(cartSubtotal)}</span>
                  </div>
                  <div className="flex justify-between text-muted">
                    <span>Delivery</span>
                    <span>{fee === 0 ? <span className="text-yellow">FREE</span> : inr(fee)}</span>
                  </div>
                  <div className="flex justify-between text-muted">
                    <span>Taxes ({taxRate}%)</span>
                    <span>{inr(tax)}</span>
                  </div>
                  <div className="flex justify-between border-t border-line pt-2 text-base font-bold text-cream">
                    <span>Estimated total</span>
                    <span className="text-yellow">{inr(total)}</span>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Button variant="ghost" size="sm" onClick={clearCart}>
                    Clear
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      setCartOpen(false);
                      navigate('/checkout');
                    }}
                  >
                    Checkout
                  </Button>
                </div>
              </div>
            ) : null}
          </motion.aside>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
