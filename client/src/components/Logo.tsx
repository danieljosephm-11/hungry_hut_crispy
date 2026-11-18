import { motion } from 'framer-motion';

export function MascotMark({ className = 'h-10 w-10' }: { className?: string }) {
  return (
    <motion.svg
      viewBox="0 0 120 120"
      className={className}
      aria-hidden="true"
      whileHover={{ rotate: [0, -4, 4, 0], transition: { duration: 0.45 } }}
    >
      <circle cx="60" cy="60" r="55" fill="#292321" stroke="#FFC247" strokeWidth="2.5" />
      <g stroke="#151312" strokeLinejoin="round">
        <ellipse cx="39" cy="41" rx="16" ry="15" fill="#FFF1E5" strokeWidth="2.5" />
        <ellipse cx="61" cy="34" rx="18" ry="17" fill="#FFF1E5" strokeWidth="2.5" />
        <ellipse cx="82" cy="42" rx="15" ry="14" fill="#FFF1E5" strokeWidth="2.5" />
        <rect x="34" y="47" width="53" height="14" rx="7" fill="#FFF1E5" strokeWidth="2.5" />
        <path d="M82 55c8-1 11 5 8 9-2 4-7 5-9 2" fill="#FF6B00" strokeWidth="2" />
        <ellipse cx="60" cy="77" rx="31" ry="27" fill="#FFC247" strokeWidth="3" />
        <path d="M53 99c0 7 6 10 10 6 4 4 9 0 8-7" fill="#FF6B00" strokeWidth="2.5" />
        <path d="M60 80l15 6-15 6z" fill="#FF6B00" strokeWidth="2.5" />
        <path d="M41 74c4-4 9-4 13 0" fill="none" strokeWidth="3.5" strokeLinecap="round" />
        <circle cx="73" cy="73" r="4.5" fill="#151312" stroke="none" />
        <circle cx="74.5" cy="71.5" r="1.5" fill="#FFF1E5" stroke="none" />
        <path d="M35 99c8 6 41 6 49 0l-4 9c-11 5-30 5-41 0z" fill="#FF6B00" strokeWidth="2.5" />
      </g>
    </motion.svg>
  );
}

export default function Logo({
  compact = false,
  className = '',
  light = true,
}: {
  compact?: boolean;
  className?: string;
  light?: boolean;
}) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <MascotMark className={compact ? 'h-9 w-9' : 'h-11 w-11'} />
      {!compact ? (
        <div className="leading-none">
          <div className={`font-display text-[1.6rem] tracking-wide ${light ? 'text-cream' : 'text-ink'}`}>
            Hungry <span className="text-yellow">Hut</span>
          </div>
          <div className="mt-1 text-[9px] font-bold uppercase tracking-[0.28em] text-orange/90">
            Good Food, Great Mood
          </div>
        </div>
      ) : (
        <div className={`font-display text-xl tracking-wide ${light ? 'text-cream' : 'text-ink'}`}>
          Hungry <span className="text-yellow">Hut</span>
        </div>
      )}
    </div>
  );
}
