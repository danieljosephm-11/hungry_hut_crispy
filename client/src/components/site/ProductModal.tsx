import { Flame, Minus, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Product } from '../../types';
import { inr } from '../../lib/format';
import { Badge, Button, Modal } from '../ui';
import { useStore } from '../../context/StoreContext';

export default function ProductModal({
  product,
  open,
  onClose,
}: {
  product: Product | null;
  open: boolean;
  onClose: () => void;
}) {
  const { addItem } = useStore();
  const [qty, setQty] = useState(1);
  useEffect(() => setQty(1), [product?.id]);

  if (!product) return null;

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
      quantity: qty,
    });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={undefined} wide>
      <div className="grid gap-6 md:grid-cols-[1.05fr_0.95fr] md:items-start">
        <div className="overflow-hidden rounded-3xl border border-line bg-neumo shadow-neumo-inset-sm">
          <img src={product.image} alt={product.name} className="aspect-[4/3] h-full w-full object-cover" />
        </div>
        <div className="flex flex-col">
          <div className="mb-3 flex flex-wrap gap-2">
            {product.isBestseller ? <Badge tone="yellow">Bestseller</Badge> : null}
            {product.isNew ? <Badge tone="orange">New</Badge> : null}
            {product.isSpicy ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-orange/30 bg-orange/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-orange">
                <Flame size={11} /> Spicy
              </span>
            ) : null}
            {product.foodType ? <Badge tone={product.foodType === 'veg' ? 'green' : 'muted'}>{product.foodType}</Badge> : null}
          </div>
          <h3 className="text-3xl text-cream sm:text-4xl">{product.name}</h3>
          <p className="mt-3 text-sm leading-7 text-muted sm:text-base">{product.description}</p>
          <div className="mt-5 flex flex-wrap items-baseline gap-3">
            <span className="font-display text-4xl text-yellow">{inr(product.price)}</span>
            {product.compareAtPrice ? (
              <span className="text-lg text-smoke line-through">{inr(product.compareAtPrice)}</span>
            ) : null}
            {product.calories ? <span className="text-xs uppercase tracking-[0.16em] text-smoke">{product.calories} kcal</span> : null}
          </div>
          {product.tags?.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <span key={tag} className="tag-pill">
                  {tag}
                </span>
              ))}
            </div>
          ) : null}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="inline-flex items-center gap-1 self-start rounded-2xl border border-line bg-neumo p-1 shadow-neumo-raised-sm">
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-muted transition hover:text-cream active:shadow-neumo-inset-sm"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
              >
                <Minus size={16} />
              </button>
              <span className="min-w-10 text-center text-sm font-bold text-cream">{qty}</span>
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-muted transition hover:text-cream active:shadow-neumo-inset-sm"
                onClick={() => setQty((q) => Math.min(20, q + 1))}
                aria-label="Increase quantity"
              >
                <Plus size={16} />
              </button>
            </div>
            <Button size="lg" className="flex-1" onClick={add}>
              Add to cart · {inr(product.price * qty)}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
