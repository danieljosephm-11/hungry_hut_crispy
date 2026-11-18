import { Link } from 'react-router-dom';
import { ArrowUpRight, Instagram, Facebook, Youtube, Phone, Mail, MapPin, Clock } from 'lucide-react';
import Logo from '../Logo';
import { useStore } from '../../context/StoreContext';

function XIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
      <path d="M18.244 2H21.5l-7.12 8.137L22.75 22h-6.557l-5.137-6.716L5.177 22H1.92l7.616-8.703L1 2h6.725l4.642 6.136L18.244 2Zm-1.144 17.966h1.82L6.744 3.926H4.79l12.31 16.04Z" />
    </svg>
  );
}

export default function Footer() {
  const { settings } = useStore();
  const social = settings?.social || {};

  const links = [
    { to: '/menu', label: 'Menu' },
    { to: '/offers', label: 'Offers' },
    { to: '/build-your-bucket', label: 'Build Your Bucket' },
    { to: '/secret-menu', label: 'Secret Menu' },
    { to: '/about', label: 'Our Story' },
    { to: '/gallery', label: 'Gallery' },
    { to: '/testimonials', label: 'Reviews' },
    { to: '/faq', label: 'FAQ' },
    { to: '/contact', label: 'Contact' },
    { to: '/track', label: 'Track Order' },
  ];

  return (
    <footer className="relative mt-12 overflow-hidden border-t border-[rgba(255,241,229,0.12)] bg-coal/80">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <img src="/images/interior.jpg" alt="" aria-hidden="true" className="h-full w-full object-cover opacity-[0.06] blur-[4px]" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-coal/95 to-coal/90" />
        <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-orange/10 blur-[120px]" />
        <div className="absolute right-0 bottom-0 h-72 w-72 rounded-full bg-yellow/8 blur-[120px]" />
      </div>
      <div className="container-hh relative section-pad">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr_1fr_1fr] lg:gap-12">
          <div>
            <Logo />
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-muted">
              Freshly fried. Always delicious. Hungry Hut brings premium fast-food craft, clean flavours, and a
              welcoming mood to every order.
            </p>
            <div className="mt-6 flex items-center gap-2">
              {[
                { href: social.instagram, label: 'Instagram', icon: Instagram },
                { href: social.facebook, label: 'Facebook', icon: Facebook },
                { href: social.x, label: 'X', icon: XIcon as any },
                { href: social.youtube, label: 'YouTube', icon: Youtube },
              ]
                .filter((item) => item.href)
                .map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={item.label}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-line bg-neumo text-muted shadow-neumo-raised-sm transition-all duration-200 hover:text-orange active:shadow-neumo-inset-sm"
                  >
                    <item.icon size={16} className={item.label === 'X' ? 'h-4 w-4' : undefined} />
                  </a>
                ))}
            </div>
          </div>

          <div>
            <h4 className="mb-4 text-lg tracking-wide text-cream">Explore</h4>
            <ul className="space-y-2.5">
              {links.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="group inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-orange"
                  >
                    {link.label}
                    <ArrowUpRight size={13} className="opacity-0 transition group-hover:opacity-100" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-lg tracking-wide text-cream">Visit &amp; Contact</h4>
            <ul className="space-y-3 text-sm text-muted">
              <li className="flex gap-3">
                <MapPin size={16} className="mt-0.5 shrink-0 text-orange" />
                <span>{settings?.address || 'Shop 12, Hauz Khas Village, New Delhi 110016'}</span>
              </li>
              <li className="flex gap-3">
                <Phone size={16} className="mt-0.5 shrink-0 text-orange" />
                <a href={`tel:${settings?.phone || ''}`} className="hover:text-orange">
                  {settings?.phone || '+91 98100 12345'}
                </a>
              </li>
              <li className="flex gap-3">
                <Mail size={16} className="mt-0.5 shrink-0 text-orange" />
                <a href={`mailto:${settings?.email || ''}`} className="hover:text-orange">
                  {settings?.email || 'hello@hungryhut.in'}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-lg tracking-wide text-cream">Hours</h4>
            <ul className="space-y-2 text-sm text-muted">
              {(settings?.openingHours?.length
                ? settings.openingHours
                : [
                    { day: 'Mon – Thu', hours: '11:00 – 23:00' },
                    { day: 'Fri – Sat', hours: '11:00 – 01:00' },
                    { day: 'Sunday', hours: '11:00 – 23:00' },
                  ]
              ).map((row) => (
                <li key={row.day} className="flex items-start gap-3">
                  <Clock size={15} className="mt-0.5 shrink-0 text-orange" />
                  <span>
                    <span className="text-cream">{row.day}</span>
                    <br />
                    {row.hours}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-5 rounded-2xl border border-line bg-neumo p-4 shadow-neumo-inset-sm">
              <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-orange">Order now</div>
              <p className="mt-1.5 text-xs leading-relaxed text-muted">
                Delivery in about {settings?.delivery?.etaMinutes || 30} min · Pickup in about {settings?.pickup?.etaMinutes || 15} min
              </p>
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-[rgba(255,241,229,0.12)] pt-6 text-xs text-smoke sm:flex-row">
          <p>© {new Date().getFullYear()} Hungry Hut. Freshly fried. Always delicious.</p>
          <p className="flex items-center gap-3">
            <Link to="/admin/login" className="hover:text-orange">
              Admin
            </Link>
            <span className="text-line">•</span>
            <span className="font-fraunces text-muted">The Ultimate Fast-Food Experience</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
