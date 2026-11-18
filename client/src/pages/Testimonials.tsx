import { useEffect, useState } from 'react';
import { Star, Quote } from 'lucide-react';
import { api } from '../lib/api';
import type { Testimonial } from '../types';
import { Reveal } from '../components/Reveal';
import { Card, EmptyState, SectionHeading, Skeleton } from '../components/ui';
import PageAtmosphere from '../components/site/PageAtmosphere';

export default function Testimonials() {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<Testimonial[]>('/testimonials')
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const avg = items.length ? (items.reduce((sum, item) => sum + item.rating, 0) / items.length).toFixed(1) : '4.9';

  return (
    <div className="bg-ink">
      <PageAtmosphere image="/images/dining.jpg" align="left" intensity="medium" glow="mixed" className="border-b border-line">
        <div className="container-hh py-14 sm:py-18 lg:py-20">
          <Reveal>
            <SectionHeading
              eyebrow="Reviews"
              title="People talk."
              accent="We fry."
              description="Real words from real guests. Every review shown here is approved by the team."
            />
            <div className="glass-dark mt-6 inline-flex items-center gap-3 rounded-2xl px-5 py-3">
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star key={index} size={16} className="fill-yellow text-yellow" />
                ))}
              </div>
              <span className="font-display text-2xl text-cream">{avg}</span>
              <span className="text-sm text-muted">average from {items.length} reviews</span>
            </div>
          </Reveal>
        </div>
      </PageAtmosphere>

      <section className="section-pad relative isolate overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -right-20 top-10 h-80 w-80 rounded-full bg-orange/10 blur-[120px]" />
          <div className="absolute left-0 bottom-0 h-72 w-72 rounded-full bg-yellow/10 blur-[120px]" />
        </div>
        <div className="container-hh">
          {loading ? (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-56 rounded-3xl" />
              ))}
            </div>
          ) : items.length ? (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {items.map((item, index) => (
                <Reveal key={item.id} delay={(index % 6) * 0.04}>
                  <Card className="h-full p-6">
                    <Quote size={22} className="mb-3 text-yellow/60" />
                    <div className="mb-3 flex gap-1">
                      {Array.from({ length: 5 }).map((_, star) => (
                        <Star key={star} size={14} className={star < item.rating ? 'fill-yellow text-yellow' : 'text-cream/20'} />
                      ))}
                    </div>
                    <p className="text-sm leading-relaxed text-muted">“{item.review}”</p>
                    <div className="mt-5 flex items-center gap-3 border-t border-line pt-4">
                      {item.avatar ? (
                        <img src={item.avatar} alt={item.name} className="h-11 w-11 rounded-full object-cover" loading="lazy" />
                      ) : (
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-yellow/15 font-display text-xl text-yellow">
                          {item.name[0]}
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-cream">{item.name}</div>
                        <div className="text-xs text-smoke">{item.location || 'Hungry Hut guest'}</div>
                      </div>
                    </div>
                  </Card>
                </Reveal>
              ))}
            </div>
          ) : (
            <EmptyState title="No reviews yet" description="Once guests share their thoughts and we approve them, they’ll appear here." />
          )}
        </div>
      </section>
    </div>
  );
}
