import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal } from 'lucide-react';
import { api } from '../lib/api';
import type { Category, Product } from '../types';
import { Button, EmptyState, Input, SectionHeading, Select, Skeleton } from '../components/ui';
import { Reveal } from '../components/Reveal';
import ProductCard from '../components/site/ProductCard';
import ProductModal from '../components/site/ProductModal';

export default function Menu() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [quick, setQuick] = useState<Product | null>(null);
  const [q, setQ] = useState(searchParams.get('q') || '');

  const activeCategory = searchParams.get('category') || 'all';
  const diet = searchParams.get('diet') || 'all';
  const sort = searchParams.get('sort') || 'popular';

  useEffect(() => {
    api
      .get<Category[]>('/categories')
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams(searchParams);
    api
      .get<Product[]>(`/products${params.toString() ? `?${params.toString()}` : ''}`)
      .then(setProducts)
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [searchParams]);

  const categoryLabel = (category: Category) => {
    if (category.slug === 'chicken') return 'Fried Chicken';
    if (category.slug === 'drinks') return 'Beverages';
    return category.name;
  };

  const orderedCategories = useMemo(() => {
    const bySlug = new Map(categories.map((category) => [category.slug, category]));
    const featuredSlugs = ['chicken', 'burgers', 'pizza', 'sides', 'combos', 'drinks'];
    const featured = featuredSlugs.map((slug) => bySlug.get(slug)).filter(Boolean) as Category[];
    const rest = categories.filter((category) => !featuredSlugs.includes(category.slug));
    return [...featured, ...rest];
  }, [categories]);

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (!value || value === 'all' || (key === 'sort' && value === 'popular')) next.delete(key);
    else next.set(key, value);
    setSearchParams(next);
  };

  const onSearch = (event: React.FormEvent) => {
    event.preventDefault();
    setParam('q', q.trim());
  };

  const clear = () => {
    setQ('');
    setSearchParams({});
  };

  return (
    <div className="relative isolate overflow-hidden bg-ink">
      <section className="site-background-soft relative isolate overflow-hidden border-b border-line">
        <div className="container-hh py-14 sm:py-18 lg:py-20">
          <Reveal>
            <SectionHeading
              eyebrow="The menu"
              title="What are you"
              accent="craving?"
              description="Fried chicken, burgers, pizzas, sides, combos and beverages — all freshly prepared and easy to order."
            />
          </Reveal>
        </div>
      </section>

      <section className="section-pad pt-8 sm:pt-10">
        <div className="container-hh">
          <div className="glass-panel sticky top-[68px] z-30 -mx-4 mb-8 border-x-0 px-4 py-4 sm:top-[76px] sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                <button
                  type="button"
                  onClick={() => setParam('category', 'all')}
                  className={`whitespace-nowrap rounded-2xl px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] transition-all duration-200 ${
                    activeCategory === 'all'
                      ? 'bg-neumo text-orange shadow-neumo-inset-sm'
                      : 'border border-line bg-neumo/80 text-muted shadow-neumo-raised-sm hover:text-cream'
                  }`}
                >
                  All
                </button>
                {orderedCategories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setParam('category', category.slug)}
                    className={`whitespace-nowrap rounded-2xl px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] transition-all duration-200 ${
                      activeCategory === category.slug
                        ? 'bg-neumo text-orange shadow-neumo-inset-sm'
                        : 'border border-line bg-neumo/80 text-muted shadow-neumo-raised-sm hover:text-cream'
                    }`}
                  >
                    {categoryLabel(category)}
                  </button>
                ))}
              </div>

              <form onSubmit={onSearch} className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative sm:w-64">
                  <Search size={15} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-smoke" />
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search the menu"
                    className="field py-2.5 pl-10 pr-4"
                    aria-label="Search menu"
                  />
                </div>
                <div className="flex gap-2">
                  <Select value={diet} onChange={(e) => setParam('diet', e.target.value)} className="py-2.5" aria-label="Diet filter">
                    <option value="all">All</option>
                    <option value="veg">Veg</option>
                    <option value="nonveg">Non-veg</option>
                    <option value="egg">Contains egg</option>
                  </Select>
                  <Select value={sort} onChange={(e) => setParam('sort', e.target.value)} className="py-2.5" aria-label="Sort">
                    <option value="popular">Popular</option>
                    <option value="price-asc">Price: Low</option>
                    <option value="price-desc">Price: High</option>
                    <option value="rating">Rating</option>
                  </Select>
                </div>
              </form>
            </div>
          </div>

          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <Skeleton key={index} className="h-80 rounded-3xl" />
              ))}
            </div>
          ) : products.length ? (
            <>
              <div className="mb-4 flex items-center justify-between text-sm text-muted">
                <span>{products.length} {products.length === 1 ? 'item' : 'items'}</span>
                {searchParams.toString() ? (
                  <button type="button" onClick={clear} className="inline-flex items-center gap-1.5 text-orange hover:underline">
                    <SlidersHorizontal size={14} /> Clear filters
                  </button>
                ) : null}
              </div>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} onQuickView={setQuick} />
                ))}
              </div>
            </>
          ) : (
            <EmptyState
              title="Nothing matches that craving"
              description="Try a different category, remove filters, or clear your search."
              action={<Button onClick={clear}>Reset filters</Button>}
            />
          )}
        </div>
      </section>
      <ProductModal product={quick} open={!!quick} onClose={() => setQuick(null)} />
    </div>
  );
}
