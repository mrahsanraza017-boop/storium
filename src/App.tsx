import React, { useEffect, Suspense, lazy } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { StoreProvider, useStore } from './context/StoreContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { CartDrawer } from './components/cart/CartDrawer';
import { QuickViewModal } from './components/product/QuickViewModal';
import { SearchModal } from './components/search/SearchModal';
import { ToastContainer } from './components/common/ToastContainer';
import { WatchBackgroundCanvas } from './components/animation/WatchBackgroundCanvas';
import { AmbientBackground } from './components/animation/AmbientBackground';

// Eagerly load HomeView for instant First Contentful Paint / LCP
import { HomeView } from './views/HomeView';

// Lazily load other views to minimize initial JS bundle
const WatchesView = lazy(() => import('./views/WatchesView').then((m) => ({ default: m.WatchesView })));
const AccessoriesView = lazy(() => import('./views/AccessoriesView').then((m) => ({ default: m.AccessoriesView })));
const ShopView = lazy(() => import('./views/ShopView').then((m) => ({ default: m.ShopView })));
const ProductDetailView = lazy(() => import('./views/ProductDetailView').then((m) => ({ default: m.ProductDetailView })));
const CartView = lazy(() => import('./views/CartView').then((m) => ({ default: m.CartView })));
const CheckoutView = lazy(() => import('./views/CheckoutView').then((m) => ({ default: m.CheckoutView })));
const AccountView = lazy(() => import('./views/AccountView').then((m) => ({ default: m.AccountView })));
const AdminView = lazy(() => import('./views/AdminView').then((m) => ({ default: m.AdminView })));
const AboutView = lazy(() => import('./views/AboutView').then((m) => ({ default: m.AboutView })));
const ContactView = lazy(() => import('./views/ContactView').then((m) => ({ default: m.ContactView })));
const ShippingPolicyView = lazy(() => import('./views/PolicyViews').then((m) => ({ default: m.ShippingPolicyView })));
const ReturnPolicyView = lazy(() => import('./views/PolicyViews').then((m) => ({ default: m.ReturnPolicyView })));
const TermsView = lazy(() => import('./views/PolicyViews').then((m) => ({ default: m.TermsView })));

const ViewLoadingFallback = () => (
  <div className="w-full min-h-[60vh] flex items-center justify-center">
    <div className="w-8 h-8 rounded-full border-2 border-[#D4AF37]/20 border-t-[#D4AF37] animate-spin" />
  </div>
);

const AppContent: React.FC = () => {
  const { currentPage } = useStore();
  const prefersReducedMotion = useReducedMotion();

  // Animated scroll-scrubbed watch background is decorative; skip it on functional
  // flows (cart, checkout, account, admin, policies) to save mobile main-thread work.
  const showWatchBackground = !prefersReducedMotion && (
    currentPage === 'home' ||
    currentPage === 'watches' ||
    currentPage === 'accessories' ||
    currentPage === 'shop' ||
    currentPage === 'product' ||
    currentPage === 'about'
  );

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  }, [currentPage, prefersReducedMotion]);

  const renderCurrentView = () => {
    switch (currentPage) {
      case 'home':
        return <HomeView />;
      case 'watches':
        return <WatchesView />;
      case 'accessories':
        return <AccessoriesView />;
      case 'shop':
        return <ShopView />;
      case 'product':
        return <ProductDetailView />;
      case 'cart':
        return <CartView />;
      case 'checkout':
        return <CheckoutView />;
      case 'account':
      case 'wishlist':
        return <AccountView />;
      case 'admin':
        return <AdminView />;
      case 'about':
        return <AboutView />;
      case 'contact':
        return <ContactView />;
      case 'shipping-policy':
        return <ShippingPolicyView />;
      case 'return-policy':
        return <ReturnPolicyView />;
      case 'terms':
        return <TermsView />;
      default:
        return <HomeView />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0C0E] text-[#E8E8EC] font-sans relative">
      {/* Ambient gold atmosphere fills the blank areas behind the animation */}
      <AmbientBackground />

      {/* Global Scroll-Driven Watch Background Canvas */}
      {showWatchBackground && <WatchBackgroundCanvas />}

      {/* Top Luxury Navigation */}
      <div className="relative z-30">
        <Navbar />
      </div>

      {/* Main View Display with subtle luxury fade transition */}
      <main className="flex-1 w-full relative z-10" id="main-content">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={prefersReducedMotion ? false : { opacity: 0, y: 12, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={prefersReducedMotion ? undefined : { opacity: 0, y: -10, filter: 'blur(3px)' }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="w-full"
          >
            <Suspense fallback={<ViewLoadingFallback />}>
              {renderCurrentView()}
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Luxury Footer with Pakistan Trust Pillars */}
      <div className="relative z-20">
        <Footer />
      </div>

      {/* Global Interactive Overlays */}
      <CartDrawer />
      <QuickViewModal />
      <SearchModal />
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
}
