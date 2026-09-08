import React, { useEffect } from 'react';
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

// Showroom Views
import { HomeView } from './views/HomeView';
import { WatchesView } from './views/WatchesView';
import { AccessoriesView } from './views/AccessoriesView';
import { ShopView } from './views/ShopView';
import { ProductDetailView } from './views/ProductDetailView';
import { CartView } from './views/CartView';
import { CheckoutView } from './views/CheckoutView';
import { AccountView } from './views/AccountView';
import { AdminView } from './views/AdminView';
import { AboutView } from './views/AboutView';
import { ContactView } from './views/ContactView';
import { ShippingPolicyView, ReturnPolicyView, TermsView } from './views/PolicyViews';

const AppContent: React.FC = () => {
  const { currentPage } = useStore();
  const prefersReducedMotion = useReducedMotion();

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

      {/* Global 300-Frame Scroll-Driven Watch Background Canvas */}
      <WatchBackgroundCanvas />

      {/* Top Luxury Navigation */}
      <div className="relative z-30">
        <Navbar />
      </div>

      {/* Main View Display with subtle luxury fade transition */}
      <main className="flex-1 w-full relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={prefersReducedMotion ? false : { opacity: 0, y: 12, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={prefersReducedMotion ? undefined : { opacity: 0, y: -10, filter: 'blur(3px)' }}
            transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
            className="w-full"
          >
            {renderCurrentView()}
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
