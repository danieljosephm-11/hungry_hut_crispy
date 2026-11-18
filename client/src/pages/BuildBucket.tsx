import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { api } from '../lib/api';
import type { BucketIngredient } from '../types';
import { Reveal } from '../components/Reveal';
import { Badge, Button, Card, EmptyState, SectionHeading, Skeleton } from '../components/ui';
import { inr } from '../lib/format';
import { useStore } from '../context/StoreContext';
import { useToast } from '../context/ToastContext';
import PageAtmosphere from '../components/site/PageAtmosphere';

export default function BuildBucket() {
  const [ingredients, setIngredients] = useState<BucketIngredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const { addItem } = useStore();
  const { success, error } = useToast();

  useEffect(() => {
    api
      .get<BucketIngredient[]>('/bucket/ingredients')
      .then(setIngredients)
      .catch(() => setIngredients([]))
      .finally(() => setLoading(false));
  }, []);

  const selected = useMemo(
    () =>
      ingredients
        .map((ingredient) => ({ ingredient, quantity: counts[ingredient.id] || 0 }))
        .filter((item) => item.quantity > 0),
    [ingredients, counts],
  );

  const pieces = selected.reduce((sum, item) => sum + item.quantity, 0);
  const total = selected.reduce((sum, item) => sum + item.quantity * item.ingredient.price, 0);

  const setCount = (id: string, next: number) => {
    const ingredient = ingredients.find((item) => item.id === id);
    const max = ingredient?.maxQuantity ?? 12;
    const clamped = Math.max(0, Math.min(max, next));
    setCounts((current) => ({ ...current, [id]: clamped }));
  };

  const addBucket = () => {
    if (!selected.length) {
      error('Pick at least one piece to build your bucket.');
      return;
    }
    const description = selected.map((item) => `${item.quantity} × ${item.ingredient.name}`).join(', ');
    addItem({
      key: `b:${Date.now()}:${Math.random().toString(36).slice(2, 6)}`,
      kind: 'bucket',
      id: `bucket-${Date.now()}`,
      name: `Custom Bucket (${pieces} pcs)`,
      image: '/images/bucket-feast.jpg',
      description,
      price: total,
      quantity: 1,
      pieces: selected.map((item) => ({
        ingredientId: item.ingredient.id,
        name: item.ingredient.name,
        quantity: item.quantity,
        unitPrice: item.ingredient.price,
        image: item.ingredient.image,
      })),
    });
    setCounts({});
    success('Your custom bucket is in the cart.');
  };

  return (
    <div className="bg-ink">
      <PageAtmosphere image="/images/bucket-feast.jpg" align="right" intensity="medium" glow="mixed" className="border-b border-line">
        <div className="container-hh py-14 sm:py-18 lg:py-20">
          <Reveal>
            <SectionHeading
              eyebrow="Build Your Bucket"
              title="Mix. Match."
              accent="Make it yours."
              description="Pick pieces, adjust quantities, and watch the total update live. Your bucket is priced accurately at checkout."
            />
          </Reveal>
        </div>
      </PageAtmosphere>

      <section className="section-pad relative isolate overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -left-20 top-10 h-80 w-80 rounded-full bg-orange/10 blur-[120px]" />
          <div className="absolute right-0 bottom-0 h-80 w-80 rounded-full bg-yellow/10 blur-[120px]" />
        </div>
        <div className="container-hh">

        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            {loading ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-64 rounded-3xl" />
                ))}
              </div>
            ) : ingredients.length === 0 ? (
              <EmptyState title="No bucket pieces available" description="The kitchen hasn’t set up bucket ingredients yet. Check back soon." />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {ingredients.map((ingredient, index) => {
                  const qty = counts[ingredient.id] || 0;
                  return (
                    <Reveal key={ingredient.id} delay={index * 0.04}>
                      <Card className="overflow-hidden">
                        <div className="image-zoom aspect-[4/3] overflow-hidden">
                          <img src={ingredient.image} alt={ingredient.name} className="h-full w-full object-cover" loading="lazy" />
                        </div>
                        <div className="p-5">
                          <div className="mb-1 flex items-start justify-between gap-3">
                            <h3 className="text-xl text-cream">{ingredient.name}</h3>
                            <span className="shrink-0 font-display text-2xl text-yellow">{inr(ingredient.price)}</span>
                          </div>
                          <p className="text-sm text-muted">{ingredient.description}</p>
                          <div className="mt-4 flex items-center justify-between">
                            <span className="text-[11px] uppercase tracking-[0.16em] text-smoke">per {ingredient.unitLabel || 'piece'} · max {ingredient.maxQuantity}</span>
                            <div className="inline-flex items-center gap-1 rounded-2xl border border-line bg-neumo p-1 shadow-neumo-raised-sm">
                              <button
                                type="button"
                                className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-muted transition hover:text-cream active:shadow-neumo-inset-sm"
                                onClick={() => setCount(ingredient.id, qty - 1)}
                                aria-label={`Remove one ${ingredient.name}`}
                              >
                                <Minus size={15} />
                              </button>
                              <span className="min-w-8 text-center text-sm font-bold text-cream">{qty}</span>
                              <button
                                type="button"
                                className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-muted transition hover:text-cream active:shadow-neumo-inset-sm"
                                onClick={() => setCount(ingredient.id, qty + 1)}
                                aria-label={`Add one ${ingredient.name}`}
                              >
                                <Plus size={15} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </Reveal>
                  );
                })}
              </div>
            )}
          </div>

          <div className="lg:sticky lg:top-28 lg:self-start">
            <Card className="glass-panel p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-2xl text-cream">Your bucket</h3>
                <Badge tone={pieces ? 'yellow' : 'muted'}>{pieces} pcs</Badge>
              </div>
              {selected.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-line p-6 text-center text-sm text-muted shadow-neumo-inset-sm">
                  Tap + on any piece to start building.
                </div>
              ) : (
                <ul className="space-y-3">
                  {selected.map((item) => (
                    <motion.li key={item.ingredient.id} layout className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-neumo px-4 py-3 shadow-neumo-inset-sm">
                      <div>
                        <div className="text-sm font-semibold text-cream">{item.ingredient.name}</div>
                        <div className="text-xs text-smoke">{item.quantity} × {inr(item.ingredient.price)}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-yellow">{inr(item.quantity * item.ingredient.price)}</span>
                        <button
                          type="button"
                          onClick={() => setCount(item.ingredient.id, 0)}
                          className="text-smoke hover:text-orange"
                          aria-label={`Remove ${item.ingredient.name}`}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </motion.li>
                  ))}
                </ul>
              )}

              <div className="mt-6 space-y-2 border-t border-line pt-4 text-sm">
                <div className="flex justify-between text-muted">
                  <span>Pieces</span>
                  <span className="font-semibold text-cream">{pieces}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-cream">
                  <span>Bucket total</span>
                  <span className="text-yellow">{inr(total)}</span>
                </div>
                <p className="text-xs text-smoke">Delivery, taxes and coupons are calculated at checkout.</p>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-2">
                <Button variant="ghost" onClick={() => setCounts({})} disabled={!pieces}>
                  Clear
                </Button>
                <Button onClick={addBucket} disabled={!pieces}>
                  <ShoppingBag size={15} /> Add bucket
                </Button>
              </div>
            </Card>
          </div>
        </div>
        </div>
      </section>
    </div>
  );
}
