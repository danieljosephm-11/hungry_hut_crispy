import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Sparkles, Unlock } from 'lucide-react';
import { api, errorMessage } from '../lib/api';
import type { SecretItem } from '../types';
import { useStore } from '../context/StoreContext';
import { useToast } from '../context/ToastContext';
import { Reveal } from '../components/Reveal';
import { Badge, Button, Card, Input, SectionHeading } from '../components/ui';
import { inr } from '../lib/format';
import PageAtmosphere from '../components/site/PageAtmosphere';

const SECRET_ITEMS_KEY = 'hh_secret_items_v1';

function readCachedItems(): SecretItem[] {
  try {
    const raw = localStorage.getItem(SECRET_ITEMS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as SecretItem[]) : [];
  } catch {
    return [];
  }
}

export default function SecretMenu() {
  const { secretUnlocked, unlockSecret, addItem, settings } = useStore();
  const { success, error } = useToast();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<SecretItem[]>([]);

  useEffect(() => {
    if (secretUnlocked && items.length === 0) {
      const cached = readCachedItems();
      if (cached.length) setItems(cached);
    }
  }, [secretUnlocked, items.length]);

  const unlock = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!code.trim()) return;
    try {
      setLoading(true);
      const result = await api.post<{ unlocked: boolean; items: SecretItem[] }>('/secret/unlock', { code });
      const nextItems = result.items || [];
      setItems(nextItems);
      localStorage.setItem(SECRET_ITEMS_KEY, JSON.stringify(nextItems));
      unlockSecret();
      success('The secret menu is yours.');
      setCode('');
    } catch (err) {
      error(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const add = (item: SecretItem) => {
    addItem({
      key: `s:${item.id}`,
      kind: 'secret',
      id: item.id,
      secretId: item.id,
      name: item.name,
      image: item.image,
      description: item.description,
      price: item.price,
      quantity: 1,
    });
  };

  const unlocked = secretUnlocked || items.length > 0;

  return (
    <div className="bg-ink">
      <PageAtmosphere image="/images/popcorn-chicken.jpg" align="center" intensity="strong" glow="orange" className="border-b border-line">
        <div className="container-hh py-14 sm:py-18 lg:py-20">
          <Reveal>
            <SectionHeading
              eyebrow="Chef’s whispers"
              title="The Secret"
              accent="Menu"
              description="A hidden selection revealed with the right word — designed as a special Hungry Hut experience."
            />
          </Reveal>
        </div>
      </PageAtmosphere>

      <section className="section-pad relative isolate overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <img src="/images/fried-chicken.jpg" alt="" aria-hidden="true" className="absolute -right-24 top-20 h-96 w-96 rounded-full object-cover opacity-[0.07] blur-3xl" loading="lazy" />
          <div className="absolute left-0 bottom-0 h-80 w-80 rounded-full bg-orange/10 blur-[120px]" />
        </div>
        <div className="container-hh">

        {!unlocked ? (
          <Reveal>
            <div className="mx-auto max-w-xl">
              <Card className="relative overflow-hidden p-8 text-center">
                <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-orange/40 to-transparent" />
                <div className="relative">
                  <motion.div
                    animate={{ y: [0, -3, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                    className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-line bg-neumo text-orange shadow-neumo-raised-sm"
                  >
                    <Lock size={28} />
                  </motion.div>
                  <h3 className="text-3xl text-cream">Say the word.</h3>
                  <p className="mt-3 text-sm text-muted">
                    {settings?.secretMenu?.hint || 'The kitchen left a hint somewhere on this site. Enter it below to unlock today’s drops.'}
                  </p>
                  <form onSubmit={unlock} className="mt-6 space-y-3">
                    <Input
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="Enter the secret word"
                      aria-label="Secret menu passphrase"
                      className="text-center uppercase tracking-[0.25em]"
                    />
                    <Button type="submit" className="w-full" size="lg" loading={loading}>
                      <Unlock size={16} /> Unlock the menu
                    </Button>
                  </form>
                </div>
              </Card>
            </div>
          </Reveal>
        ) : (
          <div>
            <Reveal className="mb-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-line bg-neumo px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-yellow shadow-neumo-inset-sm">
                <Sparkles size={14} className="text-orange" /> Unlocked — for your eyes (and appetite) only
              </div>
            </Reveal>
            {items.length === 0 && secretUnlocked ? (
              <div className="mb-6">
                <p className="mb-4 text-sm text-muted">You’ve unlocked the secret menu on this device. Enter the word to load today’s drops.</p>
                <form onSubmit={unlock} className="flex max-w-md gap-2">
                  <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Enter the secret word" />
                  <Button type="submit" loading={loading}>Load</Button>
                </form>
              </div>
            ) : secretUnlocked ? (
              <div className="mb-6">
                <p className="mb-3 text-sm text-muted">Showing your unlocked drops on this device. Enter the word to refresh today’s list.</p>
                <form onSubmit={unlock} className="flex max-w-md gap-2">
                  <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Refresh with secret word" />
                  <Button type="submit" variant="outline" loading={loading}>Refresh</Button>
                </form>
              </div>
            ) : null}
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item, index) => (
                <Reveal key={item.id} delay={index * 0.05}>
                  <Card className="card-lift h-full overflow-hidden">
                    <div className="image-zoom aspect-[4/3] overflow-hidden">
                      <img src={item.image} alt={item.name} className="h-full w-full object-cover" loading="lazy" />
                    </div>
                    <div className="p-5">
                      <div className="mb-2 flex flex-wrap gap-2">
                        <Badge tone="yellow">{item.badge || 'Secret drop'}</Badge>
                        {item.foodType === 'veg' ? <Badge tone="green">Veg</Badge> : null}
                      </div>
                      <h3 className="text-2xl text-cream">{item.name}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted">{item.description}</p>
                      <div className="mt-5 flex items-center justify-between gap-3">
                        <span className="font-display text-3xl text-yellow">{inr(item.price)}</span>
                        <Button size="sm" onClick={() => add(item)}>Add to cart</Button>
                      </div>
                    </div>
                  </Card>
                </Reveal>
              ))}
            </div>
          </div>
        )}
        </div>
      </section>
    </div>
  );
}
