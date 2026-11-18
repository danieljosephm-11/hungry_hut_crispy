import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { Offer } from '../types';
import { Reveal } from '../components/Reveal';
import { EmptyState, SectionHeading, Skeleton } from '../components/ui';
import OfferCard from '../components/site/OfferCard';
import Marquee from '../components/site/Marquee';
import PageAtmosphere from '../components/site/PageAtmosphere';

export default function Offers() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<Offer[]>('/offers')
      .then(setOffers)
      .catch(() => setOffers([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-ink">
      <PageAtmosphere image="/images/wings.jpg" align="right" intensity="medium" glow="mixed" className="border-b border-line">
        <div className="container-hh py-14 sm:py-18 lg:py-20">
          <Reveal>
            <SectionHeading
              eyebrow="Offers & deals"
              title="Big flavour."
              accent="Smarter bill."
              description="Coupons, combos and limited drops — managed by the kitchen and applied accurately at checkout."
            />
          </Reveal>
        </div>
      </PageAtmosphere>
      <Marquee items={['SAVE ON BUCKETS', 'BOGO WINGS', 'FREE DELIVERY', 'WEEKEND DEALS', 'FRESH DROPS']} />
      <section className="section-pad relative isolate overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -left-20 top-10 h-80 w-80 rounded-full bg-orange/10 blur-[120px]" />
          <div className="absolute right-0 bottom-0 h-80 w-80 rounded-full bg-yellow/10 blur-[120px]" />
        </div>
        <div className="container-hh">
          {loading ? (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-80 rounded-3xl" />
              ))}
            </div>
          ) : offers.length ? (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {offers.map((offer, index) => (
                <Reveal key={offer.id} delay={index * 0.04}>
                  <OfferCard offer={offer} />
                </Reveal>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No active offers right now"
              description="The kitchen is cooking up the next drop. Check back soon."
            />
          )}
        </div>
      </section>
    </div>
  );
}
