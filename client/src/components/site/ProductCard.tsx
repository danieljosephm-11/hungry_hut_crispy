import { Flame, Plus, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Product } from '../../types';
import { inr } from '../../lib/format';
import { Badge, Button } from '../ui';
import { useStore } from '../../context/StoreContext';

export default function ProductCard({
  product,
  onQuickView,
}: {
  product: Product;
  onQuickView?: (product: Product) => void;
}) {
  const { addItem } = useStore();

  const add = () => {
    addItem({
      key: `p:${product.id}`,
      kind: 'product',
      id: product.id,
      productId: product.id,
      name: product.name,
      image: product.image,
      description: product.description,
      price: product.price,
      quantity: 1,
    });
  };

  const showCompare = !!(product.compareAtPrice && product.compareAtPrice > product.price);

  return (
    <motion.article
      layout
      className="card-lift group relative flex h-full flex-col overflow-hidden rounded-3xl border border-line bg-card shadow-neumo-raised-sm"
    >
      <button
        type="button"
        onClick={() => onQuickView?.(product)}
        className="image-zoom relative aspect-[4/3] w-full overflow-hidden text-left"
        aria-label={`View ${product.name}`}
      >
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />
        <div className="absolute left-3 top-3 flex max-w-[85%] flex-wrap gap-1.5">
          {product.isBestseller ? <Badge tone="yellow">Bestseller</Badge> : null}
          {product.isNew ? <Badge tone="orange">New</Badge> : null}
          {product.isSpicy ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-orange/30 bg-ink/50 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-orange backdrop-blur-sm">
              <Flame size={11} /> Spicy
            </span>
          ) : null}
          {product.foodType === 'veg' ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-ink/40 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-300 backdrop-blur-sm">
              Veg
            </span>
          ) : null}
        </div>
        {showCompare ? (
          <div className="absolute bottom-3 right-3 rounded-full border border-orange/30 bg-ink/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-orange backdrop-blur-sm">
            Save {inr(product.compareAtPrice! - product.price)}
          </div>
        ) : null}
      </button>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-1.5 flex items-start justify-between gap-3">
          <h3 className="text-[1.3rem] leading-[1.05] text-cream sm:text-2xl">{product.name}</h3>
          {product.rating ? (
            <span className="mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-full border border-line bg-neumo px-2 py-1 text-[11px] font-semibold text-yellow shadow-neumo-inset-sm">
              <Star size={11} className="fill-yellow text-yellow" /> {product.rating.toFixed(1)}
            </span>
          ) : null}
        </div>
        <p className="mb-5 line-clamp-2 text-sm leading-6 text-muted">{product.description}</p>
        <div className="mt-auto flex items-end justify-between gap-3 border-t border-line pt-4">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-[1.7rem] leading-none text-yellow">{inr(product.price)}</span>
              {showCompare ? <span className="text-sm text-smoke line-through">{inr(product.compareAtPrice!)}</span> : null}
            </div>
            {product.calories ? <div className="mt-1 text-[11px] text-smoke">{product.calories} kcal</div> : null}
          </div>
          <Button size="sm" onClick={add} aria-label={`Add ${product.name} to cart`}>
            <Plus size={14} /> Add
          </Button>
        </div>
      </div>
    </motion.article>
  );
}
