import { Calendar, Copy, Tag } from 'lucide-react';
import type { Offer } from '../../types';
import { inr, shortDate } from '../../lib/format';
import { Badge, Button } from '../ui';
import { useToast } from '../../context/ToastContext';

export default function OfferCard({ offer }: { offer: Offer }) {
  const { success } = useToast();
  const copy = async () => {
    if (!offer.code) return;
    try {
      await navigator.clipboard.writeText(offer.code);
      success(`Code ${offer.code} copied`);
    } catch {
      success(`Code: ${offer.code}`);
    }
  };

  const discountLabel =
    offer.discountType === 'percent'
      ? `${offer.discountValue}% OFF`
      : offer.discountType === 'fixed'
      ? `${inr(offer.discountValue || 0)} OFF`
      : offer.discountType === 'bogo'
      ? 'BUY 1 GET 1'
      : 'FREE DELIVERY';

  return (
    <article className="card-lift relative flex h-full flex-col overflow-hidden rounded-3xl border border-line bg-card p-6 shadow-neumo-raised-sm">
      <div className="pointer-events-none absolute right-0 top-0 h-24 w-24 rounded-bl-[3rem] bg-orange/5" />
      <div className="relative flex h-full flex-col">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <Badge tone={offer.theme === 'orange' ? 'orange' : 'yellow'}>
              {offer.badge || discountLabel}
            </Badge>
            {offer.isFeatured ? <Badge tone="muted">Featured</Badge> : null}
          </div>
          <span className="font-display text-2xl text-cream sm:text-3xl">{discountLabel}</span>
        </div>
        <h3 className="text-2xl text-cream sm:text-3xl">{offer.title}</h3>
        {offer.subtitle ? <p className="mt-1 font-serif text-lg italic text-yellow">{offer.subtitle}</p> : null}
        {offer.description ? <p className="mt-3 text-sm leading-relaxed text-muted">{offer.description}</p> : null}

        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-smoke">
          {offer.minOrder ? (
            <span className="inline-flex items-center gap-1.5">
              <Tag size={13} className="text-orange" /> Min {inr(offer.minOrder)}
            </span>
          ) : null}
          {offer.endsAt ? (
            <span className="inline-flex items-center gap-1.5">
              <Calendar size={13} className="text-orange" /> Valid till {shortDate(offer.endsAt)}
            </span>
          ) : null}
        </div>

        {offer.terms?.length ? (
          <ul className="mt-4 space-y-1.5 text-[11px] leading-relaxed text-smoke">
            {offer.terms.slice(0, 3).map((term, index) => (
              <li key={index} className="flex gap-2">
                <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-orange/70" />
                <span>{term}</span>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-6 flex items-center gap-2">
          {offer.code ? (
            <>
              <div className="flex-1 rounded-2xl border border-line bg-neumo px-4 py-2.5 font-mono text-sm font-bold tracking-[0.2em] text-yellow shadow-neumo-inset-sm">
                {offer.code}
              </div>
              <Button size="sm" variant="outline" onClick={copy} aria-label={`Copy ${offer.code}`}>
                <Copy size={14} /> Copy
              </Button>
            </>
          ) : (
            <div className="text-sm font-semibold text-muted">Auto-applied in cart when eligible</div>
          )}
        </div>
      </div>
    </article>
  );
}
