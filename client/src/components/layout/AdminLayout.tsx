import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  BadgePercent,
  ChefHat,
  Drumstick,
  GalleryHorizontal,
  LayoutDashboard,
  Lock,
  LogOut,
  Menu,
  MessageSquareQuote,
  Package,
  Settings,
  ShoppingBag,
  Tags,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { useState } from 'react';
import Logo from '../Logo';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { to: '/admin/payments', label: 'Payments', icon: Wallet },
  { to: '/admin/products', label: 'Products', icon: Drumstick },
  { to: '/admin/categories', label: 'Categories', icon: Tags },
  { to: '/admin/offers', label: 'Offers & Coupons', icon: BadgePercent },
  { to: '/admin/bucket', label: 'Build Your Bucket', icon: Package },
  { to: '/admin/secret', label: 'Secret Menu', icon: Lock },
  { to: '/admin/testimonials', label: 'Testimonials', icon: MessageSquareQuote },
  { to: '/admin/gallery', label: 'Gallery', icon: GalleryHorizontal },
  { to: '/admin/customers', label: 'Customers', icon: Users },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const { success } = useToast();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const onLogout = async () => {
    await logout();
    success('Signed out');
    navigate('/admin/login');
  };

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <aside
      className={`${mobile ? 'flex' : 'hidden lg:flex'} h-full w-[270px] shrink-0 flex-col border-r border-[rgba(255,241,229,0.12)] bg-coal/80 backdrop-blur-xl`}
    >
      <div className="flex items-center justify-between border-b border-line px-5 py-5">
        <Logo compact />
        {mobile ? (
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-line bg-neumo text-muted shadow-neumo-raised-sm active:shadow-neumo-inset-sm"
            aria-label="Close admin menu"
          >
            <X size={16} />
          </button>
        ) : null}
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-200 ${
                isActive
                  ? 'bg-neumo text-orange shadow-neumo-inset-sm'
                  : 'text-muted hover:bg-neumo/70 hover:text-cream'
              }`
            }
          >
            <item.icon size={16} />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-line p-4">
        <div className="mb-3 rounded-2xl border border-line bg-neumo p-3 shadow-neumo-inset-sm">
          <div className="flex items-center gap-2 text-sm font-semibold text-cream">
            <ChefHat size={15} className="text-orange" />
            {user?.name || 'Admin'}
          </div>
          <div className="mt-0.5 text-xs text-smoke">{user?.email}</div>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-line bg-neumo px-4 py-2.5 text-sm font-semibold text-muted shadow-neumo-raised-sm transition hover:text-orange active:shadow-neumo-inset-sm"
        >
          <LogOut size={15} /> Sign out
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex min-h-screen bg-ink text-cream">
      <Sidebar />
      {open ? (
        <div className="fixed inset-0 z-[200] lg:hidden">
          <button className="absolute inset-0 bg-ink/65 backdrop-blur-sm" onClick={() => setOpen(false)} aria-label="Close" />
          <div className="absolute left-0 top-0 h-full">
            <Sidebar mobile />
          </div>
        </div>
      ) : null}

      <div className="relative flex min-w-0 flex-1 flex-col">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_80%_0%,rgba(255,107,0,0.08),transparent_55%),radial-gradient(ellipse_50%_35%_at_10%_100%,rgba(255,194,71,0.05),transparent_55%)]" />
          <div className="absolute inset-0 bg-gradient-to-b from-ink via-coal/30 to-ink" />
        </div>
        <header className="glass-panel sticky top-0 z-40 flex h-16 items-center justify-between border-x-0 border-t-0 border-b border-white/10 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-line bg-neumo text-cream shadow-neumo-raised-sm active:shadow-neumo-inset-sm lg:hidden"
              aria-label="Open admin menu"
            >
              <Menu size={17} />
            </button>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-smoke">Hungry Hut Admin</span>
          </div>
          <div className="hidden items-center gap-2 text-xs text-smoke sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/80 shadow-[0_0_10px_rgba(74,222,128,0.35)]" />
            {user?.role === 'manager' ? 'Manager' : 'Admin'}
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
