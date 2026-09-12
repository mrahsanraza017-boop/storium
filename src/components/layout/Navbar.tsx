import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Search,
  ShoppingBag,
  Heart,
  User,
  Menu,
  X,
  Compass,
  Watch,
  Sparkles,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { PageView } from '../../types';

export const Navbar: React.FC = () => {
  const {
    currentPage,
    navigate,
    cartCount,
    wishlist,
    openCartDrawer,
    openSearch,
    currentUser,
  } = useStore();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks: { label: string; page: PageView; category?: string; badge?: string }[] = [
    { label: 'Showroom', page: 'home' },
    { label: 'Watches', page: 'watches' },
    { label: "Men's Accessories", page: 'accessories', badge: 'New' },
    { label: 'About', page: 'about' },
    { label: 'Contact', page: 'contact' },
  ];

  const handleNavClick = (page: PageView, category?: string) => {
    navigate(page, { category });
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0B0C0E]/90 backdrop-blur-xl border-b border-[#262930]/80">
      {/* Top Luxury Announcement Bar (Nationwide Pakistan Delivery & COD) */}
      <div className="bg-gradient-to-r from-[#D4AF37] via-[#E5C378] to-[#D4AF37] border-b border-[#C5A059] py-1.5 px-4 text-center shadow-md">
        <p className="text-[11px] sm:text-xs text-black tracking-widest uppercase font-bold flex items-center justify-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
          <span>Complimentary Express Delivery Nationwide Across Pakistan &bull; Cash on Delivery Available</span>
        </p>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-2 sm:gap-4">
        {/* Mobile menu button */}
        <div className="flex items-center lg:hidden shrink-0">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 sm:p-2 rounded-lg text-[#8E929E] hover:text-[#F5F5F7] hover:bg-[#181A1F] transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
          </button>
        </div>

        {/* Brand Logo & Tagline */}
        <div
          onClick={() => handleNavClick('home')}
          className="cursor-pointer flex items-center gap-2.5 sm:gap-3 select-none group min-w-0"
        >
          <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-xl overflow-hidden border border-[#D4AF37]/40 bg-transparent p-1 group-hover:border-[#D4AF37] transition-all shadow-[0_0_15px_rgba(212,175,55,0.2)] flex-shrink-0 flex items-center justify-center">
            <img
              src="/favicon.png"
              alt="STORIUM Logo"
              width="44"
              height="44"
              className="w-full h-full object-contain rounded-lg group-hover:scale-105 transition-transform duration-300"
            />
          </div>
          <div className="flex flex-col">
            <span className="font-serif-luxury text-base sm:text-lg font-bold tracking-[0.2em] text-white group-hover:text-[#D4AF37] transition-colors leading-none">
              STORIUM
            </span>
            <span className="text-[8px] sm:text-[9px] uppercase tracking-[0.22em] text-[#D4AF37] font-semibold mt-1">
              HAUTE HORLOGERIE
            </span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => {
            const isActive = currentPage === link.page;

            return (
              <button
                key={link.label}
                type="button"
                onClick={() => handleNavClick(link.page, link.category)}
                className={`relative text-xs uppercase tracking-widest font-semibold transition-all py-1 flex items-center gap-1.5 ${isActive
                  ? 'text-[#F5F5F7]'
                  : 'text-[#8E929E] hover:text-[#E8E8EC]'
                  }`}
              >
                <span>{link.label}</span>
                {link.badge && (
                  <span className="px-1.5 py-0.2 text-[9px] uppercase font-bold tracking-wider bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30 rounded">
                    {link.badge}
                  </span>
                )}
                {/* Active Indicator Line */}
                {isActive && (
                  <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#D4AF37] rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Actions: Search, Wishlist, Account, Cart */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Quick Search */}
          <button
            type="button"
            onClick={openSearch}
            className="p-2.5 rounded-full text-[#8E929E] hover:text-[#F5F5F7] hover:bg-[#181A1F] transition-all"
            title="Search Showroom"
            aria-label="Search Showroom"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Wishlist */}
          <button
            type="button"
            onClick={() => handleNavClick('wishlist')}
            className="relative p-2.5 rounded-full text-[#8E929E] hover:text-[#F5F5F7] hover:bg-[#181A1F] transition-all"
            title="Wishlist"
            aria-label={`Wishlist (${wishlist.length} items)`}
          >
            <Heart className="w-5 h-5" />
            {wishlist.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#D4AF37] text-[#0B0C0E] text-[10px] font-bold flex items-center justify-center">
                {wishlist.length}
              </span>
            )}
          </button>

          {/* Customer Account */}
          <button
            type="button"
            onClick={() => handleNavClick('account')}
            className={`p-2.5 rounded-full transition-all ${currentUser
              ? 'text-[#D4AF37] hover:bg-[#181A1F]'
              : 'text-[#8E929E] hover:text-[#F5F5F7] hover:bg-[#181A1F]'
              }`}
            title={currentUser ? `Account: ${currentUser.fullName}` : 'Sign In'}
            aria-label={currentUser ? `Account of ${currentUser.fullName}` : 'Customer Account Login'}
          >
            <User className="w-5 h-5" />
          </button>

          {/* Shopping Bag / Cart */}
          <button
            type="button"
            onClick={openCartDrawer}
            className="relative p-2.5 rounded-full bg-[#181A1F] text-[#F5F5F7] hover:text-[#D4AF37] border border-[#262930] hover:border-[#D4AF37]/50 transition-all flex items-center gap-2 px-3.5"
            title="Shopping Bag"
            aria-label={`Shopping Bag (${cartCount} items)`}
          >
            <ShoppingBag className="w-5 h-5" />
            <span className="hidden sm:inline text-xs uppercase tracking-wider font-semibold">
              Bag
            </span>
            {cartCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-[#D4AF37] text-[#0B0C0E] text-xs font-bold flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>

        </div>
      </div>

      {/* Mobile Menu Dropdown / Slide-Down */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="lg:hidden overflow-hidden bg-[#121316] border-b border-[#262930] px-4 pt-3 pb-6 space-y-2 shadow-2xl"
          >
            {navLinks.map((link, index) => (
              <motion.button
                key={link.label}
                type="button"
                onClick={() => handleNavClick(link.page, link.category)}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.04, duration: 0.24 }}
                className="w-full text-left py-2.5 px-3 rounded-lg text-sm uppercase tracking-wider font-medium text-[#E8E8EC] hover:bg-[#181A1F] hover:text-[#D4AF37] flex items-center justify-between"
              >
                <span>{link.label}</span>
                {link.badge && (
                  <span className="px-2 py-0.5 text-[10px] bg-[#D4AF37]/20 text-[#D4AF37] rounded">
                    {link.badge}
                  </span>
                )}
              </motion.button>
            ))}

          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
