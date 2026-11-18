import { Flame, Heart, Timer, Utensils } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Reveal } from '../components/Reveal';
import { Card, SectionHeading } from '../components/ui';
import Marquee from '../components/site/Marquee';
import PageAtmosphere from '../components/site/PageAtmosphere';

export default function About() {
  const { settings } = useStore();
  const story = settings?.story;

  const values = [
    { icon: Flame, title: 'Fried to order', text: 'We don’t cook ahead. When you order, the fryer starts — and you taste the difference.' },
    { icon: Timer, title: '24-hour marinade', text: 'Every piece rests overnight in buttermilk and spice so the crunch has something to protect.' },
    { icon: Utensils, title: 'Real ingredients', text: 'Fresh chicken, house sauces, and breads toasted on the pass. No shortcuts, ever.' },
    { icon: Heart, title: 'Made with care', text: 'Fast food, made slowly where it matters. The kind you want to share, not just eat.' },
  ];

  return (
    <div className="bg-ink">
      <PageAtmosphere image={story?.image || '/images/restaurant.jpg'} align="right" intensity="medium" glow="mixed" className="border-b border-line">
        <div className="container-hh py-14 sm:py-18 lg:py-20">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <Reveal>
              <SectionHeading
                eyebrow="Our story"
                title={story?.heading?.split('. ')[0] || 'Small kitchen.'}
                accent={story?.heading?.split('. ').slice(1).join('. ') || 'Big crunch. Zero shortcuts.'}
                description={
                  story?.body ||
                  'Hungry Hut started in 2016 with one fryer, a hand-written menu and a stubborn belief that fast food can still be real food.'
                }
              />
              <div className="mt-8 grid grid-cols-3 gap-4">
                {[
                  { label: 'Since', value: String(story?.establishedYear || 2016) },
                  { label: 'Happy guests', value: settings?.stats?.happyCustomers || '48K+' },
                  { label: 'Orders served', value: settings?.stats?.ordersServed || '1.2M+' },
                ].map((stat) => (
                  <div key={stat.label} className="glass-dark rounded-2xl p-4 text-center">
                    <div className="font-display text-2xl text-yellow sm:text-3xl">{stat.value}</div>
                    <div className="mt-1 text-[10px] uppercase tracking-[0.18em] text-smoke">{stat.label}</div>
                  </div>
                ))}
              </div>
            </Reveal>
            <Reveal delay={0.05} className="grid grid-cols-2 gap-4">
              <img src={story?.image || '/images/restaurant.jpg'} alt="Hungry Hut" className="h-64 w-full rounded-3xl border border-line object-cover shadow-neumo-raised-sm sm:h-80" />
              <img src={story?.image2 || '/images/chef.jpg'} alt="Hungry Hut kitchen" className="mt-8 h-64 w-full rounded-3xl border border-line object-cover shadow-neumo-raised-sm sm:h-80" />
            </Reveal>
          </div>
        </div>
      </PageAtmosphere>

      <Marquee items={['SINCE 2016', 'HAND-BREADED', 'SMALL BATCHES', 'NO HEAT LAMPS', 'GOOD FOOD, GOOD MOOD']} />

      <section className="section-pad relative isolate overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <img src="/images/interior.jpg" alt="" aria-hidden="true" className="absolute -right-24 top-10 h-96 w-96 rounded-full object-cover opacity-[0.07] blur-2xl" loading="lazy" />
          <div className="absolute left-0 bottom-0 h-72 w-72 rounded-full bg-orange/10 blur-[120px]" />
        </div>
        <div className="container-hh">
          <Reveal className="mb-10">
            <SectionHeading eyebrow="What we believe" title="The Hut" accent="way" align="center" className="mx-auto" />
          </Reveal>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((item, index) => (
              <Reveal key={item.title} delay={index * 0.05}>
                <Card className="h-full p-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow/10 text-yellow">
                    <item.icon size={22} />
                  </div>
                  <h3 className="text-2xl text-cream">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{item.text}</p>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section-pad relative isolate overflow-hidden bg-coal/30">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <img src="/images/kitchen.jpg" alt="" aria-hidden="true" className="h-full w-full object-cover opacity-[0.08] blur-[3px]" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/85 to-ink/75" />
        </div>
        <div className="container-hh grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <Reveal>
            <img src="/images/kitchen.jpg" alt="Inside the Hungry Hut kitchen" className="w-full rounded-[2rem] border border-line object-cover shadow-neumo-raised" loading="lazy" />
          </Reveal>
          <Reveal delay={0.05}>
            <SectionHeading
              eyebrow="Behind the counter"
              title="A kitchen you can"
              accent="hear"
              description="The sizzle, the timer, the call of ‘order up’ — that’s the soundtrack at Hungry Hut. We keep our doors open to the kitchen because there’s nothing to hide and everything to smell."
            />
            <p className="mt-5 text-sm leading-relaxed text-muted">
              From Hauz Khas Village, we serve a neighbourhood that treats us like their late-night living room. Whether
              it’s a solo burger, a date-night bucket, or a family feast for six, we cook it like someone we know is
              waiting for it.
            </p>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
