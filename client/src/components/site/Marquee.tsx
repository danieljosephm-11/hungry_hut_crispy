export default function Marquee({ items }: { items: string[] }) {
  const row = [...items, ...items];
  return (
    <div className="overflow-hidden border-y border-line bg-neumo shadow-neumo-inset-sm">
      <div className="flex w-max animate-marquee items-center gap-10 py-3 font-display text-lg tracking-[0.08em] text-cream sm:text-xl">
        {row.map((item, index) => (
          <span key={`${item}-${index}`} className="inline-flex items-center gap-10 whitespace-nowrap">
            <span>{item}</span>
            <span className="text-orange">•</span>
          </span>
        ))}
      </div>
    </div>
  );
}
