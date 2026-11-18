import { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { api } from '../lib/api';
import type { Settings } from '../types';
import { Reveal } from '../components/Reveal';
import { SectionHeading, Skeleton } from '../components/ui';
import PageAtmosphere from '../components/site/PageAtmosphere';

export default function FAQ() {
  const [faqs, setFaqs] = useState<Array<{ question: string; answer: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<number | null>(0);

  useEffect(() => {
    api
      .get<Settings>('/settings')
      .then((settings) => setFaqs(settings.faqs || []))
      .catch(() => setFaqs([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-ink">
      <PageAtmosphere image="/images/kitchen.jpg" align="left" intensity="soft" glow="mixed" className="border-b border-line">
        <div className="container-hh py-14 sm:py-18 lg:py-20">
          <Reveal className="max-w-3xl">
            <SectionHeading
              eyebrow="FAQ"
              title="Frequently asked"
              accent="questions"
              description="Delivery, payments, ingredients, the secret menu — the answers to what most people want to know before they order."
            />
          </Reveal>
        </div>
      </PageAtmosphere>

      <section className="section-pad relative isolate overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-0 top-10 h-72 w-72 rounded-full bg-orange/10 blur-[120px]" />
          <div className="absolute right-0 bottom-0 h-72 w-72 rounded-full bg-yellow/10 blur-[120px]" />
        </div>
        <div className="container-hh max-w-4xl">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-16 rounded-2xl" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {faqs.map((faq, index) => {
                const isOpen = open === index;
                return (
                  <Reveal key={faq.question} delay={index * 0.03}>
                    <div className="overflow-hidden rounded-2xl border border-line bg-card/80 shadow-neumo-raised-sm backdrop-blur-sm">
                      <button
                        type="button"
                        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left sm:px-6 sm:py-5"
                        onClick={() => setOpen(isOpen ? null : index)}
                        aria-expanded={isOpen}
                      >
                        <span className="font-semibold text-cream sm:text-lg">{faq.question}</span>
                        <ChevronDown size={18} className={`shrink-0 text-yellow transition ${isOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {isOpen ? (
                        <div className="border-t border-line px-5 py-4 text-sm leading-relaxed text-muted sm:px-6 sm:py-5 sm:text-base">
                          {faq.answer}
                        </div>
                      ) : null}
                    </div>
                  </Reveal>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
