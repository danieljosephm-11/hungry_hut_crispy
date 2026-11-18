import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  ChevronDown,
  Clock,
  Drumstick,
  Flame,
  MapPin,
  Phone,
  Quote,
  Star,
  Truck,
  UtensilsCrossed,
} from 'lucide-react';
import { api } from '../lib/api';
import type { Category, GalleryItem, HomeData, Offer, Product, Testimonial } from '../types';
import { Button, Card, SectionHeading, Skeleton } from '../components/ui';
import { Reveal, Stagger, staggerItem } from '../components/Reveal';
import ProductCard from '../components/site/ProductCard';
import ProductModal from '../components/site/ProductModal';
import OfferCard from '../components/site/OfferCard';
import CrispyMeter from '../components/site/CrispyMeter';
import Marquee from '../components/site/Marquee';
import { useStore } from '../context/StoreContext';
import { inr } from '../lib/format';

export default function Home() {
  const [data, setData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [quick, setQuick] = useState<Product | null>(null);
  const [faqOpen, setFaqOpen] = useState<number | null>(0);
  const { settings } = useStore();

  useEffect(() => {
    let mounted = true;
    api
      .get<HomeData>('/home')
      .then((result) => mounted && setData(result))
      .catch(() => {})
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  const categories = data?.categories || [];
  const featured = data?.featured || [];
  const offers = data?.offers || [];
  const testimonials = data?.testimonials || [];
  const gallery = data?.gallery || [];
  const faqs = data?.faqs?.length ? data.faqs : settings?.faqs || [];

  return (
    <div className="overflow-hidden bg-ink">
      <Hero settings={data?.settings || settings} crispy={data?.crispy} />
      <Marquee
        items={[
          'CRISPY BITES. HAPPIER NIGHTS.',
          'FRESHLY FRIED',
          'BUILD YOUR BUCKET',
          'PREMIUM FAST FOOD',
          'GOOD FOOD. GREAT MOOD.',
        ]}
      />
      <Bestsellers products={featured} loading={loading} onQuickView={setQuick} />
      <Story />
      <Categories categories={categories} loading={loading} />
      <WhyHungryHut />
      <CrispySpotlight crispy={data?.crispy} />
      <OfferStrip offers={offers} loading={loading} />
      <BucketTeaser />
      <TestimonialsSection items={testimonials} loading={loading} />
      <GalleryTeaser items={gallery} loading={loading} />
      <FAQSection faqs={faqs} open={faqOpen} setOpen={setFaqOpen} />
      <FinalCTA />
      <ProductModal product={quick} open={!!quick} onClose={() => setQuick(null)} />
    </div>
  );
}

function Hero({ settings, crispy }: { settings: any; crispy: any }) {
  const heroImage = settings?.hero?.image || '/images/hero-chicken.jpg';
  return (
    <section className="site-background relative isolate overflow-hidden bg-ink">
      <div className="container-hh relative grid items-center gap-12 py-12 sm:py-16 lg:grid-cols-[1.02fr_0.98fr] lg:gap-10 lg:py-24">
        <Reveal className="relative z-10 max-w-2xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-orange/20 bg-ink/40 px-3 py-1.5 font-fraunces text-[10px] font-semibold uppercase tracking-[0.14em] text-orange shadow-[inset_0_1px_0_rgba(255,241,229,0.05)] backdrop-blur-md sm:text-[11px]">
            <span className="h-1.5 w-1.5 rounded-full bg-orange shadow-[0_0_12px_rgba(255,107,0,0.8)]" />
            {settings?.tagline || 'The Ultimate Fast-Food Experience'}
          </div>
          <h1 className="font-fraunces text-[3.5rem] font-semibold leading-[0.95] tracking-[-0.02em] text-cream sm:text-[5.2rem] lg:text-[6.8rem]">
            CRISPY BITES.
            <br />
            <span className="bg-gradient-to-r from-yellow via-yellow-soft to-orange bg-clip-text text-transparent">HAPPIER NIGHTS.</span>
          </h1>
          <p className="mt-6 max-w-xl font-serif text-xl italic leading-8 text-cream/90 sm:text-2xl">
            Freshly fried. Always delicious.
          </p>
          <p className="mt-3 max-w-lg text-sm leading-7 text-muted sm:text-base">
            Premium fried chicken, burgers, pizzas and buckets — crafted hot, served fast, and designed to be unforgettable.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link to="/menu">
              <Button size="lg" className="shadow-glow-orange">
                Explore Menu <ArrowRight size={16} />
              </Button>
            </Link>
            <Link to="/menu">
              <Button size="lg" variant="outline" className="glass-dark">
                Order Now
              </Button>
            </Link>
          </div>
          <div className="mt-10 grid gap-3 text-sm text-muted sm:grid-cols-3 sm:gap-4">
            {[
              { icon: Clock, label: `Delivery ${settings?.delivery?.etaMinutes || 30} min` },
              { icon: Truck, label: `Free above ${inr(settings?.delivery?.freeAbove || 799)}` },
              { icon: Star, label: `${settings?.stats?.rating || '4.9'} rated` },
            ].map((item) => (
              <div key={item.label} className="glass-dark flex items-center gap-3 rounded-2xl px-4 py-3">
                <item.icon size={16} className="text-orange" />
                <span className="text-cream/90">{item.label}</span>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal delay={0.08} className="relative">
          <div className="relative mx-auto max-w-xl">
            <div className="absolute -inset-8 rounded-[3rem] bg-gradient-to-tr from-orange/25 via-[#E32619]/10 to-yellow/12 blur-3xl" />
            <div className="absolute -inset-3 rounded-[2.75rem] border border-orange/25 opacity-70" />
            <div className="relative overflow-hidden rounded-[2.5rem] border border-[rgba(255,241,229,0.14)] bg-card/75 p-3 shadow-[0_30px_80px_-35px_rgba(21,19,18,0.6)] backdrop-blur-sm sm:p-4">
              <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] sm:aspect-square lg:aspect-[4/5]">
                <img
                  src={heroImage}
                  alt="Hungry Hut signature fried chicken"
                  className="h-full w-full object-cover"
                  {...({ fetchpriority: 'high' } as any)}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-tr from-orange/10 via-transparent to-transparent mix-blend-screen" />
              </div>
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                className="glass-dark absolute left-5 top-5 rounded-2xl px-4 py-3 sm:left-7 sm:top-7"
              >
                <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-orange">Chef’s note</div>
                <div className="mt-1 text-sm font-semibold text-cream">{settings?.hero?.liveNote || 'Hand-breaded & fried to order'}</div>
              </motion.div>
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                className="glass-dark absolute bottom-5 right-5 rounded-2xl px-4 py-3 sm:bottom-7 sm:right-7"
              >
                <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-yellow">Tonight’s mood</div>
                <div className="mt-1 text-sm font-semibold text-cream">Hot. Crispy. Premium.</div>
              </motion.div>
            </div>
            {crispy ? (
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 6.5, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
                className="mt-4 lg:absolute lg:-bottom-10 lg:-left-10 lg:mt-0 lg:w-[290px]"
              >
                <CrispyMeter initial={crispy} compact poll={false} />
              </motion.div>
            ) : null}
          </div>
        </Reveal>
      </div>

      <div className="container-hh relative z-10 pb-14 lg:pb-20">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: 'Fresh to order', value: 'Made Hot', icon: Flame },
            { label: 'Delivery', value: `${settings?.delivery?.etaMinutes || 30} min`, icon: Truck },
            { label: 'Menu favourites', value: 'Fresh Picks', icon: UtensilsCrossed },
          ].map((stat, index) => (
            <Reveal key={stat.label} delay={0.05 + index * 0.04}>
              <div className="glass-dark flex items-center gap-4 rounded-3xl p-5 shadow-neumo-raised-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neumo text-orange shadow-neumo-inset-sm">
                  <stat.icon size={20} />
                </div>
                <div>
                  <div className="font-display text-3xl text-cream">{stat.value}</div>
                  <div className="text-[11px] uppercase tracking-[0.18em] text-smoke">{stat.label}</div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Bestsellers({ products, loading, onQuickView }: { products: Product[]; loading: boolean; onQuickView: (p: Product) => void }) {
  return (
    <section className="section-pad relative isolate overflow-hidden bg-coal/40">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <img src="/images/big-burger.jpg" alt="" aria-hidden="true" className="absolute -right-24 top-10 h-96 w-96 rounded-full object-cover opacity-[0.07] blur-2xl" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/20 via-transparent to-ink/30" />
      </div>
      <div className="container-hh">
        <div className="mb-12 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <Reveal>
            <SectionHeading
              eyebrow="Crowd favourites"
              title="Bestsellers"
              accent="from the fryer"
              description="Signature plates, crafted fresh and served with Hungry Hut character."
            />
          </Reveal>
          <Reveal delay={0.08}>
            <Link to="/menu">
              <Button variant="outline">
                Full Menu <ArrowRight size={15} />
              </Button>
            </Link>
          </Reveal>
        </div>
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-80 rounded-3xl" />
            ))}
          </div>
        ) : (
          <Stagger className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {products.slice(0, 8).map((product) => (
              <motion.div key={product.id} variants={staggerItem}>
                <ProductCard product={product} onQuickView={onQuickView} />
              </motion.div>
            ))}
          </Stagger>
        )}
      </div>
    </section>
  );
}

function Story() {
  return (
    <section className="section-pad relative isolate overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <img src="/images/restaurant.jpg" alt="" aria-hidden="true" className="absolute -left-20 bottom-0 h-[28rem] w-[28rem] rounded-full object-cover opacity-[0.08] blur-2xl" loading="lazy" />
        <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-orange/10 blur-[120px]" />
      </div>
      <div className="container-hh grid items-center gap-12 lg:grid-cols-2">
        <Reveal className="relative">
          <div className="grid grid-cols-2 gap-4">
            <img src="/images/restaurant.jpg" alt="Hungry Hut interior" className="h-64 w-full rounded-3xl border border-line object-cover shadow-neumo-raised-sm sm:h-80" loading="lazy" />
            <img src="/images/chef.jpg" alt="Chef plating at Hungry Hut" className="mt-8 h-64 w-full rounded-3xl border border-line object-cover shadow-neumo-raised-sm sm:h-80" loading="lazy" />
          </div>
          <div className="mt-6 inline-flex rounded-2xl border border-line bg-neumo px-5 py-4 shadow-neumo-raised-sm">
            <div>
              <div className="font-display text-3xl text-yellow">Since 2016</div>
              <div className="text-[11px] uppercase tracking-[0.18em] text-muted">Small batches · Big crunch</div>
            </div>
          </div>
        </Reveal>
        <Reveal delay={0.05}>
          <SectionHeading
            eyebrow="Our Story"
            title="Small kitchen."
            accent="Big crunch."
            description="We started with one fryer and a simple belief: fast food can still feel crafted. Every piece is marinated, hand-breaded, and fried to order for real flavour and texture."
          />
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {[
              { title: '24-hour marinade', text: 'Buttermilk, spice and patience in every batch.' },
              { title: 'Fried to order', text: 'Cooked fresh so it reaches you at its best.' },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-line bg-card/80 p-5 shadow-neumo-raised-sm backdrop-blur-sm">
                <div className="font-semibold text-cream">{item.title}</div>
                <p className="mt-1 text-sm text-muted">{item.text}</p>
              </div>
            ))}
          </div>
          <Link to="/about" className="mt-8 inline-flex">
            <Button variant="outline">
              Read our story <ArrowRight size={15} />
            </Button>
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

function Categories({ categories, loading }: { categories: Category[]; loading: boolean }) {
  const displayName = (category: Category) =>
    category.slug === 'chicken'
      ? 'Fried Chicken'
      : category.slug === 'drinks'
        ? 'Beverages'
        : category.name;

  return (
    <section className="section-pad relative isolate overflow-hidden bg-coal/30">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <img src="/images/pizza-special.jpg" alt="" aria-hidden="true" className="absolute -left-16 top-8 h-80 w-80 rounded-full object-cover opacity-[0.08] blur-2xl" loading="lazy" />
        <img src="/images/fries.jpg" alt="" aria-hidden="true" className="absolute -right-16 bottom-0 h-72 w-72 rounded-full object-cover opacity-[0.07] blur-2xl" loading="lazy" />
      </div>
      <div className="container-hh">
        <Reveal className="mb-10">
          <SectionHeading
            eyebrow="Browse by craving"
            title="Pick your"
            accent="category"
            align="center"
            className="mx-auto"
          />
        </Reveal>
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-40 rounded-3xl" />
            ))}
          </div>
        ) : (
          <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <motion.div key={category.id} variants={staggerItem}>
                <Link
                  to={`/menu?category=${category.slug}`}
                  className="card-lift group relative flex h-48 items-end overflow-hidden rounded-3xl border border-line bg-card p-6 shadow-neumo-raised-sm"
                >
                  {category.image ? (
                    <img
                      src={category.image}
                      alt={category.name}
                      className="absolute inset-0 h-full w-full object-cover opacity-45 transition duration-700 group-hover:scale-105 group-hover:opacity-60"
                      loading="lazy"
                    />
                  ) : null}
                  <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/55 to-transparent" />
                  <div className="relative">
                    <div className="font-display text-3xl text-cream">{displayName(category)}</div>
                    <p className="mt-1 text-sm text-muted">{category.description}</p>
                  </div>
                  <ArrowRight className="absolute right-5 top-5 text-orange opacity-0 transition group-hover:opacity-100" size={18} />
                </Link>
              </motion.div>
            ))}
          </Stagger>
        )}
      </div>
    </section>
  );
}

function WhyHungryHut() {
  const items = [
    { icon: Drumstick, title: 'Buttermilk brined', text: '24 hours in the marinade for depth in every bite.' },
    { icon: Flame, title: 'Fried to order', text: 'No heat lamps. Small batches, cooked fresh.' },
    { icon: UtensilsCrossed, title: 'Real ingredients', text: 'Fresh chicken, house sauces, and honest flavour.' },
    { icon: Clock, title: 'Honest timing', text: 'The Live Crispy Meter reflects real kitchen activity.' },
  ];
  return (
    <section className="section-pad relative isolate overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-72 w-[40rem] -translate-x-1/2 rounded-full bg-orange/10 blur-[120px]" />
      </div>
      <div className="container-hh">
        <Reveal className="mb-10">
          <SectionHeading eyebrow="Why Hungry Hut" title="Built for the" accent="crunch" align="center" className="mx-auto" />
        </Reveal>
        <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <motion.div key={item.title} variants={staggerItem}>
              <Card className="h-full p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-neumo text-orange shadow-neumo-inset-sm">
                  <item.icon size={22} />
                </div>
                <h3 className="text-2xl text-cream">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{item.text}</p>
              </Card>
            </motion.div>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

function CrispySpotlight({ crispy }: { crispy: any }) {
  return (
    <section className="section-pad relative isolate overflow-hidden bg-coal/30">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <img src="/images/kitchen.jpg" alt="" aria-hidden="true" className="absolute -right-24 top-1/2 h-[26rem] w-[26rem] -translate-y-1/2 rounded-full object-cover opacity-[0.08] blur-2xl" loading="lazy" />
        <div className="absolute left-0 top-10 h-64 w-64 rounded-full bg-orange/10 blur-[110px]" />
      </div>
      <div className="container-hh grid items-center gap-10 lg:grid-cols-[1fr_1fr]">
        <Reveal>
          <SectionHeading
            eyebrow="Live from the kitchen"
            title="The Crispy"
            accent="Meter"
            description="A minimal live status view based on real orders and prep capacity, so you know how the kitchen is running right now."
          />
          <ul className="mt-6 space-y-3 text-sm text-muted">
            <li className="flex gap-3"><span className="mt-2 h-1.5 w-1.5 rounded-full bg-orange shadow-[0_0_10px_rgba(255,107,0,0.7)]" /> Based on real placed, confirmed and preparing orders.</li>
            <li className="flex gap-3"><span className="mt-2 h-1.5 w-1.5 rounded-full bg-orange shadow-[0_0_10px_rgba(255,107,0,0.7)]" /> Wait time adapts to kitchen capacity and batch prep.</li>
            <li className="flex gap-3"><span className="mt-2 h-1.5 w-1.5 rounded-full bg-orange shadow-[0_0_10px_rgba(255,107,0,0.7)]" /> Refreshes automatically every 15 seconds.</li>
          </ul>
        </Reveal>
        <Reveal delay={0.05}>{crispy ? <CrispyMeter initial={crispy} /> : <Skeleton className="h-80 rounded-3xl" />}</Reveal>
      </div>
    </section>
  );
}

function OfferStrip({ offers, loading }: { offers: Offer[]; loading: boolean }) {
  return (
    <section className="section-pad relative isolate overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <img src="/images/wings.jpg" alt="" aria-hidden="true" className="absolute -left-20 top-20 h-80 w-80 rounded-full object-cover opacity-[0.07] blur-2xl" loading="lazy" />
        <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-yellow/10 blur-[120px]" />
      </div>
      <div className="container-hh">
        <div className="mb-10 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <Reveal>
            <SectionHeading eyebrow="Deals & drops" title="Offers worth" accent="biting into" />
          </Reveal>
          <Reveal delay={0.05}>
            <Link to="/offers">
              <Button variant="outline">All offers <ArrowRight size={15} /></Button>
            </Link>
          </Reveal>
        </div>
        {loading ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-72 rounded-3xl" />
            ))}
          </div>
        ) : offers.length ? (
          <Stagger className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {offers.slice(0, 3).map((offer) => (
              <motion.div key={offer.id} variants={staggerItem}>
                <OfferCard offer={offer} />
              </motion.div>
            ))}
          </Stagger>
        ) : (
          <div className="rounded-3xl border border-dashed border-line p-10 text-center text-muted">Fresh offers are in the oven.</div>
        )}
      </div>
    </section>
  );
}

function BucketTeaser() {
  return (
    <section className="section-pad relative isolate overflow-hidden bg-coal/30">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <img src="/images/bucket-feast.jpg" alt="" aria-hidden="true" className="h-full w-full object-cover opacity-[0.08] blur-[3px]" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/85 to-ink/70" />
      </div>
      <div className="container-hh overflow-hidden rounded-[2.5rem] border border-[rgba(255,241,229,0.14)] bg-card/70 p-8 shadow-[0_30px_80px_-40px_rgba(21,19,18,0.55)] backdrop-blur-md sm:p-12">
        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <Reveal>
            <div className="eyebrow mb-4">Build Your Bucket</div>
            <h2 className="text-4xl text-cream sm:text-5xl lg:text-6xl">
              Mix. Match. <span className="serif-italic normal-case text-yellow">Make it yours.</span>
            </h2>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
              Choose pieces, adjust quantities, and see your bucket total update live before adding it to cart.
            </p>
            <Link to="/build-your-bucket" className="mt-7 inline-flex">
              <Button size="lg">Start building <ArrowRight size={16} /></Button>
            </Link>
          </Reveal>
          <Reveal delay={0.05} className="relative">
            <div className="rounded-3xl border border-line bg-neumo/70 p-3 shadow-neumo-inset-sm backdrop-blur-sm">
              <img src="/images/bucket-feast.jpg" alt="A bucket of fried chicken" className="w-full rounded-2xl object-cover" loading="lazy" />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection({ items, loading }: { items: Testimonial[]; loading: boolean }) {
  return (
    <section className="section-pad relative isolate overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <img src="/images/dining.jpg" alt="" aria-hidden="true" className="absolute -right-24 bottom-0 h-96 w-96 rounded-full object-cover opacity-[0.07] blur-2xl" loading="lazy" />
      </div>
      <div className="container-hh">
        <Reveal className="mb-10">
          <SectionHeading eyebrow="Guest love" title="People talk." accent="We fry." align="center" className="mx-auto" />
        </Reveal>
        {loading ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-56 rounded-3xl" />
            ))}
          </div>
        ) : (
          <Stagger className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {items.slice(0, 6).map((item) => (
              <motion.div key={item.id} variants={staggerItem}>
                <Card className="h-full p-6">
                  <Quote size={20} className="mb-3 text-orange/80" />
                  <div className="mb-3 flex gap-1">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star key={index} size={14} className={index < item.rating ? 'fill-yellow text-yellow' : 'text-line'} />
                    ))}
                  </div>
                  <p className="text-sm leading-relaxed text-muted">“{item.review}”</p>
                  <div className="mt-5 flex items-center gap-3">
                    {item.avatar ? (
                      <img src={item.avatar} alt={item.name} className="h-10 w-10 rounded-full border border-line object-cover" loading="lazy" />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neumo font-bold text-yellow shadow-neumo-inset-sm">
                        {item.name[0]}
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-semibold text-cream">{item.name}</div>
                      {item.location ? <div className="text-xs text-smoke">{item.location}</div> : null}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </Stagger>
        )}
        <div className="mt-8 text-center">
          <Link to="/testimonials"><Button variant="outline">Read all reviews</Button></Link>
        </div>
      </div>
    </section>
  );
}

function GalleryTeaser({ items, loading }: { items: GalleryItem[]; loading: boolean }) {
  return (
    <section className="section-pad relative isolate overflow-hidden bg-coal/30">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-10 top-0 h-72 w-72 rounded-full bg-orange/10 blur-[120px]" />
      </div>
      <div className="container-hh">
        <div className="mb-10 flex items-end justify-between gap-6">
          <Reveal>
            <SectionHeading eyebrow="The feed" title="From our" accent="kitchen" />
          </Reveal>
          <Reveal delay={0.05}>
            <Link to="/gallery"><Button variant="outline">View gallery</Button></Link>
          </Reveal>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} className="aspect-square rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {items.slice(0, 8).map((item, index) => (
              <Reveal key={item.id} delay={index * 0.03} className={index === 0 || index === 5 ? 'sm:col-span-2 sm:row-span-2' : ''}>
                <div className="image-zoom h-full overflow-hidden rounded-2xl border border-line bg-neumo shadow-neumo-raised-sm">
                  <img src={item.image} alt={item.alt || item.title} className="h-full w-full object-cover" loading="lazy" />
                </div>
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function FAQSection({ faqs, open, setOpen }: { faqs: Array<{ question: string; answer: string }>; open: number | null; setOpen: (v: number | null) => void }) {
  if (!faqs.length) return null;
  return (
    <section className="section-pad relative isolate overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute right-0 bottom-0 h-80 w-80 rounded-full bg-yellow/10 blur-[120px]" />
      </div>
      <div className="container-hh grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <Reveal>
          <SectionHeading eyebrow="FAQ" title="Questions?" accent="We’ve got answers." />
          <p className="mt-4 max-w-md text-muted">Delivery, payments, ingredients, and the details that matter before you order.</p>
          <Link to="/faq" className="mt-6 inline-flex"><Button variant="outline">Full FAQ</Button></Link>
        </Reveal>
        <div className="space-y-3">
          {faqs.slice(0, 5).map((faq, index) => {
            const isOpen = open === index;
            return (
              <Reveal key={faq.question} delay={index * 0.03}>
                <div className="rounded-2xl border border-line bg-card/85 shadow-neumo-raised-sm backdrop-blur-sm">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                    onClick={() => setOpen(isOpen ? null : index)}
                    aria-expanded={isOpen}
                  >
                    <span className="font-semibold text-cream">{faq.question}</span>
                    <span className={`inline-flex h-8 w-8 items-center justify-center rounded-xl bg-neumo text-orange shadow-neumo-raised-sm transition ${isOpen ? 'shadow-neumo-inset-sm' : ''}`}>
                      <ChevronDown size={16} className={`transition ${isOpen ? 'rotate-180' : ''}`} />
                    </span>
                  </button>
                  {isOpen ? <div className="border-t border-line px-5 py-4 text-sm leading-relaxed text-muted">{faq.answer}</div> : null}
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  const { settings } = useStore();
  return (
    <section className="section-pad relative isolate overflow-hidden bg-coal/30">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <img src="/images/hero-chicken.jpg" alt="" aria-hidden="true" className="h-full w-full object-cover opacity-[0.1] blur-[4px]" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/88 to-ink/70" />
        <div className="absolute -left-20 top-0 h-72 w-72 rounded-full bg-orange/15 blur-[120px]" />
        <div className="absolute right-0 bottom-0 h-80 w-80 rounded-full bg-yellow/10 blur-[120px]" />
      </div>
      <div className="container-hh">
        <div className="relative overflow-hidden rounded-[2.5rem] border border-[rgba(255,241,229,0.14)] bg-card/65 p-8 shadow-[0_30px_80px_-40px_rgba(21,19,18,0.55)] backdrop-blur-md sm:p-12">
          <div className="pointer-events-none absolute right-0 top-0 h-48 w-48 rounded-bl-[4rem] border-b border-l border-orange/25 bg-gradient-to-bl from-orange/10 to-transparent" />
          <Reveal className="relative max-w-2xl">
            <div className="eyebrow mb-4">Ready when you are</div>
            <h2 className="text-4xl text-cream sm:text-5xl lg:text-6xl">
              Tonight calls for <span className="serif-italic normal-case text-yellow">something crispy.</span>
            </h2>
            <p className="mt-4 text-muted">Order delivery, pick up at the counter, or drop by {settings?.address || 'the Hut'}.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/menu"><Button size="lg">Order now <ArrowRight size={16} /></Button></Link>
              <a href={`tel:${settings?.phone || ''}`}><Button size="lg" variant="outline" className="glass-dark"><Phone size={16} /> Call us</Button></a>
              <Link to="/contact"><Button size="lg" variant="ghost"><MapPin size={16} /> Find us</Button></Link>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
