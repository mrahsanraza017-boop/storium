import React, { useState } from 'react';
import { ShieldCheck, Truck, Clock, RefreshCw, ArrowRight, Check, Watch, Tag, Users, FileText, Phone } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { PageView } from '../../types';

export const Footer: React.FC = () => {
  const { navigate, addToast } = useStore();
  const [emailInput, setEmailInput] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput) return;
    setIsSubscribed(true);
    addToast('success', 'Private Access Granted', 'You are now registered for private timepiece drops.');
    setEmailInput('');
  };

  return (
    <footer className="w-full bg-transparent border-t border-[#262930]/80 pb-12 text-[#9Ea2AF]">
      {/* 4-Pillar Trust Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-b border-[#262930]/80">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-start gap-4 p-5 rounded-2xl bg-[#0B0C0E]/75 backdrop-blur-md border border-[#262930]/80 hover:border-[#D4AF37]/30 transition-all shadow-lg">
            <div className="p-3 rounded-xl bg-[#121316] border border-[#262930] text-[#D4AF37] flex-shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-[#F5F5F7] uppercase tracking-wider">
                Nationwide Pakistan Delivery
              </h4>
              <p className="mt-1 text-xs text-[#CBD0DC] leading-relaxed">
                Insured express delivery to Karachi, Lahore, Islamabad, and 100+ cities across Pakistan.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-5 rounded-2xl bg-[#0B0C0E]/75 backdrop-blur-md border border-[#262930]/80 hover:border-[#D4AF37]/30 transition-all shadow-lg">
            <div className="p-3 rounded-xl bg-[#121316] border border-[#262930] text-[#D4AF37] flex-shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-[#F5F5F7] uppercase tracking-wider">
                Cash on Delivery Available
              </h4>
              <p className="mt-1 text-xs text-[#CBD0DC] leading-relaxed">
                Pay upon arrival at your doorstep or checkout securely with Debit Card.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-5 rounded-2xl bg-[#0B0C0E]/75 backdrop-blur-md border border-[#262930]/80 hover:border-[#D4AF37]/30 transition-all shadow-lg">
            <div className="p-3 rounded-xl bg-[#121316] border border-[#262930] text-[#D4AF37] flex-shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-[#F5F5F7] uppercase tracking-wider">
                2-Year STORIUM Guarantee
              </h4>
              <p className="mt-1 text-xs text-[#CBD0DC] leading-relaxed">
                Comprehensive international movement warranty and sapphire crystal guarantee.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-5 rounded-2xl bg-[#0B0C0E]/75 backdrop-blur-md border border-[#262930]/80 hover:border-[#D4AF37]/30 transition-all shadow-lg">
            <div className="p-3 rounded-xl bg-[#121316] border border-[#262930] text-[#D4AF37] flex-shrink-0">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-[#F5F5F7] uppercase tracking-wider">
                7-Day Inspection Return
              </h4>
              <p className="mt-1 text-xs text-[#CBD0DC] leading-relaxed">
                Complimentary exchange or return policy if unsatisfied with your timepiece.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Navigation Chip Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 border-b border-[#262930]/60">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] uppercase tracking-[0.2em] text-[#8E929E] font-semibold mr-2 hidden sm:inline">Quick Nav:</span>
          {[
            { label: 'Timepieces', page: 'watches' as PageView, icon: <Watch className="w-3 h-3" /> },
            { label: 'Accessories', page: 'accessories' as PageView, icon: <Tag className="w-3 h-3" /> },
            { label: 'Showroom Catalog', page: 'shop' as PageView, icon: <ArrowRight className="w-3 h-3" /> },
            { label: 'My Account', page: 'account' as PageView, icon: <Users className="w-3 h-3" /> },
            { label: 'About STORIUM', page: 'about' as PageView, icon: <FileText className="w-3 h-3" /> },
            { label: 'Contact Concierge', page: 'contact' as PageView, icon: <Phone className="w-3 h-3" /> },
          ].map(({ label, page, icon }) => (
            <button
              key={label}
              type="button"
              onClick={() => navigate(page)}
              className="btn-solid-pill-inactive flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] uppercase tracking-wider cursor-pointer"
            >
              {icon}
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Footer Directory */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-5">
            <div
              onClick={() => navigate('home')}
              className="cursor-pointer flex items-center gap-3 group select-none"
            >
              <div className="relative w-11 h-11 rounded-xl overflow-hidden border border-[#D4AF37]/40 bg-[#121316] p-1 group-hover:border-[#D4AF37] transition-all shadow-[0_0_15px_rgba(212,175,55,0.2)] flex-shrink-0 flex items-center justify-center">
                <img
                  src="/favicon.png"
                  alt="STORIUM Logo"
                  width="44"
                  height="44"
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-contain rounded-lg group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="flex flex-col items-start">
                <div className="flex items-center gap-1.5">
                  <span className="text-2xl font-extrabold tracking-[0.22em] text-[#F5F5F7] font-montserrat uppercase group-hover:text-white transition-colors">
                    STORIUM
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
                </div>
                <p className="text-[10px] uppercase tracking-[0.25em] text-[#D4AF37] font-medium">
                  &ldquo;Wear your presence&rdquo;
                </p>
              </div>
            </div>
            <p className="text-xs text-[#CBD0DC] leading-relaxed max-w-sm">
              STORIUM is Pakistan&apos;s vanguard online luxury showroom for futuristic timepieces and curated men&apos;s accessories. Combining precision horology, aerospace materials, and accessible luxury.
            </p>

            {/* Newsletter Subscription */}
            <div className="pt-2">
              <label htmlFor="footer-newsletter-email" className="block text-xs uppercase tracking-wider font-semibold text-[#F5F5F7] mb-2">
                Private Showroom Registry
              </label>
              <form onSubmit={handleSubscribe} className="flex gap-2 max-w-sm">
                <div className="relative flex-1">
                  <input
                    id="footer-newsletter-email"
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="Enter your email"
                    aria-label="Email address for private showroom registry"
                    required
                    className="w-full py-2.5 px-3.5 rounded-lg bg-[#121316] border border-[#262930] text-xs text-[#F5F5F7] placeholder-[#8E929E] focus:outline-none focus:border-[#D4AF37] transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  aria-label="Subscribe to private showroom registry"
                  className="btn-solid-primary py-2.5 px-4 rounded-lg text-xs flex items-center justify-center gap-1 cursor-pointer"
                >
                  {isSubscribed ? <Check className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                </button>
              </form>
            </div>
          </div>

          {/* Showroom Collections */}
          <div>
            <h5 className="text-xs uppercase tracking-[0.18em] font-bold text-[#F5F5F7] mb-4 flex items-center gap-2">
              <Watch className="w-3.5 h-3.5 text-[#D4AF37]" />
              Timepieces
            </h5>
            <div className="flex flex-col gap-1.5">
              {[
                { label: 'All Watches', page: 'watches' as PageView },
                { label: 'Chronograph Series', page: 'shop' as PageView },
                { label: 'Automatic Mechanical', page: 'shop' as PageView },
                { label: 'Skeleton Titanium', page: 'shop' as PageView },
              ].map(({ label, page }) => (
                <button
                  key={label}
                  onClick={() => navigate(page)}
                  className="btn-solid-nav w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between group cursor-pointer"
                >
                  <span>{label}</span>
                  <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
              <button
                onClick={() => navigate('accessories')}
                className="btn-solid-nav w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between group cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  Men&apos;s Accessories
                  <span className="text-[9px] bg-[#D4AF37] text-[#0B0C0E] font-bold px-1.5 py-0.5 rounded tracking-wider">NEW</span>
                </span>
                <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </div>
          </div>

          {/* Client Concierge */}
          <div>
            <h5 className="text-xs uppercase tracking-[0.18em] font-bold text-[#F5F5F7] mb-4 flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-[#D4AF37]" />
              Concierge
            </h5>
            <div className="flex flex-col gap-1.5">
              {[
                { label: 'Customer Account', page: 'account' as PageView },
                { label: 'Private Wishlist', page: 'wishlist' as PageView },
                { label: 'Pakistan Shipping Policy', page: 'shipping-policy' as PageView },
                { label: '7-Day Returns & Refunds', page: 'return-policy' as PageView },
                { label: 'Terms & Conditions', page: 'terms' as PageView },
              ].map(({ label, page }) => (
                <button
                  key={label}
                  onClick={() => navigate(page)}
                  className="btn-solid-nav w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between group cursor-pointer"
                >
                  <span>{label}</span>
                  <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </div>

          {/* Brand & Studio */}
          <div>
            <h5 className="text-xs uppercase tracking-[0.18em] font-bold text-[#F5F5F7] mb-4 flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-[#D4AF37]" />
              Maison
            </h5>
            <div className="flex flex-col gap-1.5">
              <button
                onClick={() => navigate('about')}
                className="btn-solid-nav w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between group cursor-pointer"
              >
                <span>Brand Philosophy</span>
                <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
              <button
                onClick={() => navigate('contact')}
                className="btn-solid-nav w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between group cursor-pointer"
              >
                <span>Contact Showroom</span>
                <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
              <div className="mt-3 p-3 rounded-lg bg-[#0D0E10] border border-[#1E2127] space-y-2">
                <div className="flex items-center gap-2 text-[11px]">
                  <Phone className="w-3 h-3 text-[#D4AF37] flex-shrink-0" />
                  <div>
                    <span className="block text-[#8E929E]">Concierge Phone:</span>
                    <a href="https://wa.me/923215993022" target="_blank" rel="noopener noreferrer" className="text-[#CBD0DC] font-mono hover:text-[#D4AF37] transition-colors">+92 321 5993022</a>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <ShieldCheck className="w-3 h-3 text-[#D4AF37] flex-shrink-0" />
                  <div>
                    <span className="block text-[#8E929E]">Support Email:</span>
                    <a href="mailto:concierge@storium.pk" className="text-[#CBD0DC] font-mono hover:text-[#D4AF37] transition-colors">concierge@storium.pk</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Copyright & Legal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 border-t border-[#262930]/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        <p className="text-[#8E929E]">
          &copy; {new Date().getFullYear()} STORIUM Pakistan. All rights reserved. Registered Luxury Horology Maison.
        </p>
        <div className="flex items-center gap-2 flex-wrap justify-center">
          {[
            { label: 'Shipping Policy', page: 'shipping-policy' as PageView },
            { label: 'Return Policy', page: 'return-policy' as PageView },
            { label: 'Terms of Service', page: 'terms' as PageView },
          ].map(({ label, page }) => (
            <button
              key={label}
              onClick={() => navigate(page)}
              className="btn-solid-utility px-3 py-1.5 rounded-md text-[11px] tracking-wide cursor-pointer"
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </footer>
  );
};
