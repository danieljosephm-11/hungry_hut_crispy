import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { lazy, Suspense, useEffect } from 'react';
import SiteLayout from './components/layout/SiteLayout';
import AdminLayout from './components/layout/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';
import { Spinner } from './components/ui';
import ScrollToTop from './components/ScrollToTop';

const Home = lazy(() => import('./pages/Home'));
const Menu = lazy(() => import('./pages/Menu'));
const Offers = lazy(() => import('./pages/Offers'));
const BuildBucket = lazy(() => import('./pages/BuildBucket'));
const SecretMenu = lazy(() => import('./pages/SecretMenu'));
const About = lazy(() => import('./pages/About'));
const Gallery = lazy(() => import('./pages/Gallery'));
const Testimonials = lazy(() => import('./pages/Testimonials'));
const FAQ = lazy(() => import('./pages/FAQ'));
const Contact = lazy(() => import('./pages/Contact'));
const Checkout = lazy(() => import('./pages/Checkout'));
const OrderPage = lazy(() => import('./pages/OrderPage'));
const Track = lazy(() => import('./pages/Track'));

const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const ProductsAdmin = lazy(() => import('./pages/admin/Products'));
const CategoriesAdmin = lazy(() => import('./pages/admin/Categories'));
const OrdersAdmin = lazy(() => import('./pages/admin/Orders'));
const OffersAdmin = lazy(() => import('./pages/admin/Offers'));
const BucketAdmin = lazy(() => import('./pages/admin/BucketAdmin'));
const SecretAdmin = lazy(() => import('./pages/admin/SecretAdmin'));
const TestimonialsAdmin = lazy(() => import('./pages/admin/TestimonialsAdmin'));
const GalleryAdmin = lazy(() => import('./pages/admin/GalleryAdmin'));
const SettingsAdmin = lazy(() => import('./pages/admin/SettingsAdmin'));
const PaymentsAdmin = lazy(() => import('./pages/admin/Payments'));
const CustomersAdmin = lazy(() => import('./pages/admin/Customers'));

function PageFallback() {
  return (
    <div className="min-h-[60vh]">
      <Spinner label="Heating the fryer…" />
    </div>
  );
}

function TitleSync() {
  const { pathname } = useLocation();
  useEffect(() => {
    const base = 'Hungry Hut';
    const map: Record<string, string> = {
      '/': `${base} — Good Food. Great Mood.`,
      '/menu': `Menu — ${base}`,
      '/offers': `Offers & Deals — ${base}`,
      '/build-your-bucket': `Build Your Bucket — ${base}`,
      '/secret-menu': `Secret Menu — ${base}`,
      '/about': `Our Story — ${base}`,
      '/gallery': `Gallery — ${base}`,
      '/testimonials': `Reviews — ${base}`,
      '/faq': `FAQ — ${base}`,
      '/contact': `Contact — ${base}`,
      '/checkout': `Checkout — ${base}`,
      '/track': `Track Order — ${base}`,
      '/admin/login': `Admin Login — ${base}`,
      '/admin': `Dashboard — ${base} Admin`,
    };
    const title =
      map[pathname] ||
      (pathname.startsWith('/order/') ? `Your Order — ${base}` : pathname.startsWith('/admin') ? `Admin — ${base}` : base);
    document.title = title;
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <TitleSync />
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route element={<SiteLayout />}>
            <Route index element={<Home />} />
            <Route path="menu" element={<Menu />} />
            <Route path="offers" element={<Offers />} />
            <Route path="build-your-bucket" element={<BuildBucket />} />
            <Route path="secret-menu" element={<SecretMenu />} />
            <Route path="about" element={<About />} />
            <Route path="gallery" element={<Gallery />} />
            <Route path="testimonials" element={<Testimonials />} />
            <Route path="faq" element={<FAQ />} />
            <Route path="contact" element={<Contact />} />
            <Route path="checkout" element={<Checkout />} />
            <Route path="order/:orderNumber" element={<OrderPage />} />
            <Route path="track" element={<Track />} />
            <Route path="track/:orderNumber" element={<Track />} />
          </Route>

          <Route path="admin/login" element={<AdminLogin />} />
          <Route
            path="admin"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="products" element={<ProductsAdmin />} />
            <Route path="categories" element={<CategoriesAdmin />} />
            <Route path="orders" element={<OrdersAdmin />} />
            <Route path="payments" element={<PaymentsAdmin />} />
            <Route path="offers" element={<OffersAdmin />} />
            <Route path="bucket" element={<BucketAdmin />} />
            <Route path="secret" element={<SecretAdmin />} />
            <Route path="testimonials" element={<TestimonialsAdmin />} />
            <Route path="gallery" element={<GalleryAdmin />} />
            <Route path="customers" element={<CustomersAdmin />} />
            <Route path="settings" element={<SettingsAdmin />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  );
}
