import { AnimatePresence, motion } from 'framer-motion';
import { Menu, ShoppingBag, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import Logo from '../Logo';
import { useStore } from '../../context/StoreContext';
import { Button } from '../ui';

const NAV = [
  { to: '/', label: 'Home' },
  { to: '/menu', label: 'Menu' },
  { to: '/offers', label: 'Offers' },
  { to: '/build-your-bucket', label: 'Build Your Bucket' },
  { to: '/secret-menu', label: 'Secret Menu' },
  { to: '/about', label: 'About' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/testimonials', label: 'Reviews' },
  { to: '/faq', label: 'FAQ' },
  { to: '/contact', label: 'Contact' },
];

export default function Navbar() {
  const { cartCount, setCartOpen, settings } = useStore();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  return (
    <header
      className={`sticky top-0 z-[140] transition-all duration-300 ${
        scrolled
          ? 'glass-panel-strong border-x-0 border-t-0 border-b border-[rgba(255,241,229,0.14)]'
          : 'border-b border-[rgba(255,241,229,0.12)] bg-ink/55 backdrop-blur-xl'
      }`}
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-xl focus:bg-orange focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>
      {settings?.announcement ? (
        <div className="border-b border-[rgba(255,241,229,0.12)] bg-coal/45 backdrop-blur-md">
          <div className="container-hh flex h-9 items-center justify-center text-center text-[10px] font-bold uppercase tracking-[0.2em] text-muted sm:text-[11px]">
            <span className="line-clamp-1">{settings.announcement}</span>
          </div>
        </div>
      ) : null}
      <div className="container-hh flex h-16 items-center justify-between gap-3 sm:h-[76px]">
        <Link to="/" aria-label="Hungry Hut home" className="shrink-0">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-1 xl:flex" aria-label="Primary">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `rounded-xl px-3 py-2 text-[11px] font-bold uppercase tracking-[0.16em] transition-all duration-200 ${
                  isActive
                    ? 'bg-neumo text-orange shadow-neumo-inset-sm'
                    : 'text-muted hover:bg-neumo/70 hover:text-cream'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-line bg-neumo text-cream shadow-neumo-raised-sm transition-all duration-200 hover:text-orange active:shadow-neumo-inset-sm"
            aria-label="Open cart"
          >
            <ShoppingBag size={18} />
            {cartCount > 0 ? (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-orange px-1 text-[10px] font-bold text-white">
                {cartCount}
              </span>
            ) : null}
          </button>
          <Link to="/menu" className="hidden sm:inline-flex">
            <Button size="sm">Order Now</Button>
          </Link>
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-line bg-neumo text-cream shadow-neumo-raised-sm transition-all duration-200 hover:text-orange active:shadow-neumo-inset-sm xl:hidden"
            onClick={() => setOpen((value) => !value)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22 }}
            className="glass-panel-strong overflow-hidden border-x-0 border-b-0 border-t border-[rgba(255,241,229,0.14)] xl:hidden"
          >
            <nav className="container-hh flex flex-col gap-1.5 py-4" aria-label="Mobile">
              {NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `rounded-2xl px-4 py-3 text-sm font-semibold uppercase tracking-[0.14em] transition-all ${
                      isActive ? 'bg-neumo text-orange shadow-neumo-inset-sm' : 'text-muted hover:bg-neumo hover:text-cream'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
              <Link to="/menu" className="mt-2">
                <Button className="w-full">Order Now</Button>
              </Link>
            </nav>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
