import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '../lib/api';
import type { GalleryItem } from '../types';
import { Reveal } from '../components/Reveal';
import { EmptyState, SectionHeading, Skeleton } from '../components/ui';
import PageAtmosphere from '../components/site/PageAtmosphere';

const FILTERS = ['All', 'Food', 'Buckets', 'Burgers', 'Pizza', 'Interiors', 'Kitchen', 'Moments'];

export default function Gallery() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    api
      .get<GalleryItem[]>('/gallery')
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () => (filter === 'All' ? items : items.filter((item) => item.category === filter)),
    [items, filter],
  );

  const move = (dir: 1 | -1) => {
    if (active === null) return;
    setActive((active + dir + filtered.length) % filtered.length);
  };

  useEffect(() => {
    if (active === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActive(null);
      if (e.key === 'ArrowRight') move(1);
      if (e.key === 'ArrowLeft') move(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, filtered.length]);

  return (
    <div className="bg-ink">
      <PageAtmosphere image="/images/interior.jpg" align="center" intensity="medium" glow="mixed" className="border-b border-line">
        <div className="container-hh py-14 sm:py-18 lg:py-20">
          <Reveal>
            <SectionHeading
              eyebrow="Gallery"
              title="From our"
              accent="kitchen"
              description="Buckets, burgers, late-night slices and the people who make it happen. Tap any photo to open it."
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
          <Reveal delay={0.05} className="mb-8">
            <div className="scroll-fade no-scrollbar flex gap-2 overflow-x-auto pb-1">
              {FILTERS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setFilter(item)}
                  className={`whitespace-nowrap rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] transition ${
                    filter === item
                      ? 'border-yellow bg-yellow text-ink'
                      : 'border-line bg-neumo/40 text-muted hover:border-yellow/30 hover:text-cream'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </Reveal>

          {loading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <Skeleton key={index} className="aspect-square rounded-2xl" />
              ))}
            </div>
          ) : filtered.length ? (
            <div className="columns-2 gap-3 sm:columns-3 lg:columns-4">
              {filtered.map((item, index) => (
                <Reveal key={item.id} delay={(index % 8) * 0.03} className="mb-3 break-inside-avoid">
                  <button
                    type="button"
                    onClick={() => setActive(index)}
                    className="image-zoom group relative block w-full overflow-hidden rounded-2xl border border-line text-left"
                  >
                    <img src={item.image} alt={item.alt || item.title} className="w-full object-cover" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
                    <div className="absolute inset-x-0 bottom-0 p-3 opacity-0 transition group-hover:opacity-100">
                      <div className="text-sm font-semibold text-cream">{item.title}</div>
                      <div className="text-[11px] uppercase tracking-[0.16em] text-yellow">{item.category}</div>
                    </div>
                  </button>
                </Reveal>
              ))}
            </div>
          ) : (
            <EmptyState title="No photos in this filter yet" description="Try another category — or come back when the kitchen adds more." />
          )}
        </div>
      </section>

      <AnimatePresence>
        {active !== null && filtered[active] ? (
          <motion.div
            className="fixed inset-0 z-[220] flex items-center justify-center bg-black/90 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button type="button" className="absolute inset-0" onClick={() => setActive(null)} aria-label="Close lightbox" />
            <button
              type="button"
              onClick={() => setActive(null)}
              className="absolute right-4 top-4 z-10 rounded-full border border-line bg-ink/50 p-2 text-cream"
              aria-label="Close"
            >
              <X size={18} />
            </button>
            <button
              type="button"
              onClick={() => move(-1)}
              className="absolute left-3 z-10 rounded-full border border-line bg-ink/50 p-2 text-cream sm:left-6"
              aria-label="Previous image"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              onClick={() => move(1)}
              className="absolute right-3 z-10 rounded-full border border-line bg-ink/50 p-2 text-cream sm:right-6"
              aria-label="Next image"
            >
              <ChevronRight size={20} />
            </button>
            <motion.figure
              key={filtered[active].id}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              className="relative z-10 max-h-[85vh] max-w-5xl"
            >
              <img
                src={filtered[active].image}
                alt={filtered[active].alt || filtered[active].title}
                className="max-h-[78vh] w-auto max-w-full rounded-2xl object-contain"
              />
              <figcaption className="mt-3 text-center">
                <div className="font-semibold text-cream">{filtered[active].title}</div>
                <div className="text-xs uppercase tracking-[0.18em] text-yellow">{filtered[active].category}</div>
              </figcaption>
            </motion.figure>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
