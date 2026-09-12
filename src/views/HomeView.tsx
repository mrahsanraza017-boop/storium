import React from 'react';
import {
  ArrowRight,
  Shield,
  Truck,
  Sparkles,
  Watch,
  Award,
  Layers,
  Compass,
  CheckCircle2,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { ProductGrid } from '../components/product/ProductGrid';
import { MotionReveal } from '../components/animation/MotionReveal';
import { StarRating } from '../components/reviews/StarRating';

import { SEOHead } from '../components/seo/SEOHead';
import {
  getStoreOrganizationSchema,
  getWebSiteSchema,
  getFAQPageSchema,
} from '../lib/seoSchemas';

export const HomeView: React.FC = () => {
  const { products, navigate, getFeaturedHomeReviews, getProductById } = useStore();

  const showroomWatches = products.filter((p) => p.category === 'watches');
  const featuredWatches = showroomWatches.filter((p) => p.featured);
  const showcaseWatches = featuredWatches.length > 0 ? featuredWatches : showroomWatches.slice(0, 4);
  const flagshipProduct = products.find((p) => p.id === 'storium-aethelgard-chrono') || products[0];
  const featuredReviews = getFeaturedHomeReviews();

  const homeFaqs = [
    {
      question: 'Does STORIUM offer Cash on Delivery across Pakistan?',
      answer:
        'Yes, STORIUM provides express delivery with Cash on Delivery (COD) and Visa/Mastercard card payment options across all major cities and towns in Pakistan within 2 to 4 working days.',
    },
    {
      question: 'What warranty and guarantees come with STORIUM timepieces?',
      answer:
        'Every STORIUM timepiece is individually serialized with its laser-engraved caseback SKU and accompanied by our embossed Certificate of Authenticity, 2-Year International Movement Warranty, and a 7-day inspection guarantee.',
    },
    {
      question: 'What materials are used in STORIUM luxury watches?',
      answer:
        'STORIUM horology is engineered with surgical-grade 316L stainless steel, aerospace titanium alloys, double-domed anti-reflective scratch-proof sapphire crystal, and precision Japanese Seiko VK-series mecha-quartz & automatic calibres.',
    },
  ];

  const schemas = [
    getStoreOrganizationSchema(),
    getWebSiteSchema(),
    getFAQPageSchema(homeFaqs),
  ];

  return (
    <div className="w-full flex flex-col bg-transparent text-[#E8E8EC]">
      <SEOHead
        title="STORIUM — Wear Your Presence | Luxury Watches & Accessories Pakistan"
        description="Pakistan's premier futuristic luxury watch showroom and accessory atelier. Explore precision Japanese & Swiss horology, aerospace titanium, 316L steel, and sapphire crystal timepieces with nationwide COD."
        keywords="luxury watches pakistan, storium watches, buy watches online pakistan, automatic watches karachi, chronograph watches lahore, titanium accessories, mens luxury watches islamabad"
        canonicalPath="/"
        schemas={schemas}
      />
      {/* 1. CINEMATIC HERO BANNER (3D Watch Animates in the Background) */}
      <section
        id="hero-frame-container"
        data-hero-frames-mount="true"
        data-section="hero"
        className="relative min-h-[92vh] flex items-center justify-center overflow-hidden border-b border-[#262930]/60 bg-transparent"
      >
        {/* Subtle Ambient Radial Lighting */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#D4AF37]/10 via-transparent to-transparent pointer-events-none" />

        {/* Hero Content Overlay */}
        <MotionReveal className="relative z-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center flex flex-col items-center">
          {/* Brand Tagline Badge - Tagline text color explicitly BLACK */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#D4AF37] via-[#E5C378] to-[#D4AF37] border border-white/20 mb-8 shadow-[0_4px_25px_rgba(212,175,55,0.4)]">
            <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
            <span className="text-[11px] sm:text-xs uppercase tracking-[0.25em] text-black font-extrabold">
              Pakistan&apos;s Futuristic Luxury Showroom
            </span>
          </div>

          {/* Main Statement */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white font-serif-luxury leading-[1.1] max-w-4xl gold-glow-heading drop-shadow-2xl">
            Wear your presence.
          </h1>

          {/* Subtext */}
          <div className="mt-6 px-6 py-3 rounded-2xl glass-panel-subtle max-w-2xl">
            <p className="text-base sm:text-lg md:text-xl text-[#D1D5E0] font-light leading-relaxed luxury-text-shadow">
              Timepieces forged from aerospace titanium, surgical steel, and sapphire crystal. Designed for leaders who command authority without uttering a sound.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => navigate('watches')}
              className="w-full sm:w-auto py-4 px-8 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#C5A059] hover:from-[#E5C378] hover:to-[#D4AF37] text-[#0B0C0E] text-xs uppercase tracking-[0.2em] font-bold shadow-[0_10px_30px_rgba(212,175,55,0.35)] hover:shadow-[0_15px_40px_rgba(212,175,55,0.5)] transition-all flex items-center justify-center gap-2 group cursor-pointer"
            >
              <span>Explore Timepieces</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              type="button"
              onClick={() => navigate('shop')}
              className="w-full sm:w-auto py-4 px-8 rounded-xl bg-[#121316]/90 hover:bg-[#181A1F] text-[#F5F5F7] hover:text-white text-xs uppercase tracking-[0.2em] font-semibold border border-[#262930] hover:border-[#D4AF37]/60 backdrop-blur-md transition-all shadow-xl cursor-pointer"
            >
              Showroom Catalog
            </button>
          </div>

          {/* Micro horological specs bar with frosted glass styling */}
          <div className="mt-16 pt-8 border-t border-white/15 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center w-full max-w-3xl">
            <div className="p-3.5 rounded-xl glass-panel shadow-lg">
              <span className="block text-lg sm:text-xl font-bold text-white gold-glow-subtle">316L / Ti</span>
              <span className="text-[10px] uppercase tracking-wider text-[#CBD0DC]">Aerospace Metallurgy</span>
            </div>
            <div className="p-3.5 rounded-xl glass-panel shadow-lg">
              <span className="block text-lg sm:text-xl font-bold text-white gold-glow-subtle">Sapphire</span>
              <span className="text-[10px] uppercase tracking-wider text-[#CBD0DC]">Double-Domed AR Glass</span>
            </div>
            <div className="p-3.5 rounded-xl glass-panel shadow-lg">
              <span className="block text-lg sm:text-xl font-bold text-white gold-glow-subtle">10 ATM</span>
              <span className="text-[10px] uppercase tracking-wider text-[#CBD0DC]">Screw-Down Water Res.</span>
            </div>
            <div className="p-3.5 rounded-xl glass-panel shadow-lg">
              <span className="block text-lg sm:text-xl font-bold text-white gold-glow-subtle">Nationwide</span>
              <span className="text-[10px] uppercase tracking-wider text-[#CBD0DC]">Express Pakistan COD</span>
            </div>
          </div>
        </MotionReveal>
      </section>

      {/* 2. BRAND INTRODUCTION SECTION
          data-section="brand-introduction"
      */}
      <section data-section="brand-introduction" className="py-24 bg-transparent border-b border-[#262930]/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <MotionReveal direction="left" className="lg:col-span-5 p-8 sm:p-10 rounded-3xl glass-panel space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl overflow-hidden border border-[#D4AF37]/40 bg-[#121316] p-0.5 shadow-md flex-shrink-0">
                  <img src="/emblem.png" alt="STORIUM Emblem" className="w-full h-full object-cover rounded-lg" />
                </div>
                <span className="text-xs uppercase tracking-[0.25em] text-[#D4AF37] font-semibold block">
                  The STORIUM Manifesto
                </span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white font-serif-luxury leading-tight gold-glow-subtle">
                Not an ordinary store. <br />
                A futuristic luxury showroom.
              </h2>
              <p className="text-sm sm:text-base text-[#D1D5E0] leading-relaxed luxury-text-shadow">
                STORIUM was founded in Pakistan on a singular conviction: the objects you wear and carry are not passive ornaments—they are an extension of your presence and ambition.
              </p>
              <p className="text-sm sm:text-base text-[#D1D5E0] leading-relaxed luxury-text-shadow">
                By uniting precision Japanese &amp; Swiss mechanical movements with futuristic industrial silhouettes and direct showroom pricing, we bridge the chasm between unattainable Swiss luxury and mass-market disposable watches.
              </p>

              <div className="pt-4 flex items-center gap-6">
                <div>
                  <span className="block text-2xl font-bold text-[#D4AF37] font-serif-luxury drop-shadow-[0_2px_8px_rgba(212,175,55,0.35)]">100%</span>
                  <span className="text-xs text-[#CBD0DC]">Original &amp; Guaranteed</span>
                </div>
                <div className="w-px h-10 bg-[#262930]" />
                <div>
                  <span className="block text-2xl font-bold text-[#D4AF37] font-serif-luxury drop-shadow-[0_2px_8px_rgba(212,175,55,0.35)]">2 Years</span>
                  <span className="text-xs text-[#CBD0DC]">Movement Warranty</span>
                </div>
                <div className="w-px h-10 bg-[#262930]" />
                <div>
                  <span className="block text-2xl font-bold text-[#D4AF37] font-serif-luxury drop-shadow-[0_2px_8px_rgba(212,175,55,0.35)]">7 Days</span>
                  <span className="text-xs text-[#CBD0DC]">Hassle-Free Inspection</span>
                </div>
              </div>
            </MotionReveal>

            <MotionReveal direction="right" className="lg:col-span-7 relative">
              <div className="relative rounded-2xl overflow-hidden bg-[#121316] border border-[#262930] aspect-[16/10] group shadow-2xl">
                <img
                  src="/assets/exhibition-bench.webp"
                  alt="STORIUM Horology Craftsmanship"
                  width={1600}
                  height={1000}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B0C0E] via-transparent to-transparent opacity-85" />
                <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-mono">
                      EXHIBITION BENCH
                    </span>
                    <h3 className="text-lg font-bold text-white gold-glow-subtle">
                      Precision Micro-Engineering
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('about')}
                    className="p-3 rounded-full bg-[#181A1F]/90 text-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#0B0C0E] border border-white/10 backdrop-blur-md transition-all cursor-pointer shadow-lg"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </MotionReveal>
          </div>
        </div>
      </section>

      {/* 3. FEATURED WATCHES SHOWCASE
          Rendered through the Reusable ProductGrid component (Automatic animations)
          data-section="featured-watches"
      */}
      <section data-section="featured-watches" className="py-24 bg-transparent border-b border-[#262930]/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4 p-6 sm:p-8 rounded-2xl glass-panel">
            <div>
              <span className="text-xs uppercase tracking-[0.25em] text-[#D4AF37] font-semibold block mb-2">
                Flagship Horology
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-white font-serif-luxury gold-glow-subtle">
                Curated Showroom Timepieces
              </h2>
            </div>

            <button
              type="button"
              onClick={() => navigate('watches')}
              className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] font-semibold text-[#D4AF37] hover:text-[#E5C378] transition-colors cursor-pointer"
            >
              <span>View All Watches ({products.filter((p) => p.category === 'watches').length})</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Automatic Product Animation Grid */}
          <ProductGrid products={showcaseWatches} columns="4" />
        </div>
      </section>

      {/* 4. PREMIUM PRODUCT SPOTLIGHT
          Spotlight on Flagship Obsidian Stealth
          data-section="product-showcase"
      */}
      <section data-section="product-showcase" className="py-24 bg-transparent border-b border-[#262930]/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-8 sm:p-12 lg:p-16 rounded-3xl glass-panel relative overflow-hidden">
            {/* Ambient gold glow */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
              {/* Product Image Stage */}
              <div className="lg:col-span-6 flex justify-center">
                <div
                  onClick={() => navigate('product', { slug: flagshipProduct.slug })}
                  className="relative max-w-md w-full aspect-square rounded-2xl overflow-hidden bg-[#0B0C0E] border border-[#D4AF37]/30 cursor-pointer group shadow-2xl"
                >
                  <img
                    src={flagshipProduct.thumbnail}
                    alt={flagshipProduct.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0B0C0E]/80 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs text-[#E8E8EC]">
                    <span className="px-2.5 py-1 rounded bg-[#D4AF37] text-[#0B0C0E] font-bold uppercase tracking-wider text-[10px] shadow">
                      Flagship Masterpiece
                    </span>
                    <span className="text-[#D4AF37] font-semibold drop-shadow">Click to Inspect &rarr;</span>
                  </div>
                </div>
              </div>

              {/* Technical Blueprint Callouts */}
              <div className="lg:col-span-6 space-y-6">
                <div>
                  <span className="text-xs uppercase tracking-[0.25em] text-[#D4AF37] font-semibold block mb-2">
                    Showroom Spotlight
                  </span>
                  <h3 className="text-2xl sm:text-4xl font-bold text-white font-serif-luxury gold-glow-subtle">
                    {flagshipProduct.name}
                  </h3>
                  <p className="mt-3 text-sm sm:text-base text-[#D1D5E0] leading-relaxed luxury-text-shadow">
                    {flagshipProduct.description}
                  </p>
                </div>

                {/* Technical highlights list */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 rounded-xl glass-panel-subtle">
                    <span className="text-[10px] uppercase tracking-widest text-[#CBD0DC] block mb-1">
                      Calibre Engine
                    </span>
                    <span className="text-xs font-semibold text-white">
                      {flagshipProduct.specifications['Movement'] || 'Hybrid Mecha-Quartz Sweep'}
                    </span>
                  </div>

                  <div className="p-4 rounded-xl glass-panel-subtle">
                    <span className="text-[10px] uppercase tracking-widest text-[#CBD0DC] block mb-1">
                      Optics
                    </span>
                    <span className="text-xs font-semibold text-white">
                      Double-Domed Sapphire Crystal
                    </span>
                  </div>

                  <div className="p-4 rounded-xl glass-panel-subtle">
                    <span className="text-[10px] uppercase tracking-widest text-[#CBD0DC] block mb-1">
                      Case Metallics
                    </span>
                    <span className="text-xs font-semibold text-white">
                      DLC Matte Black 316L Steel
                    </span>
                  </div>

                  <div className="p-4 rounded-xl glass-panel-subtle">
                    <span className="text-[10px] uppercase tracking-widest text-[#CBD0DC] block mb-1">
                      Water Resistance
                    </span>
                    <span className="text-xs font-semibold text-white">
                      10 ATM / 100 Meters Tested
                    </span>
                  </div>
                </div>

                {/* Price and CTAs */}
                <div className="pt-4 flex flex-col sm:flex-row items-center gap-4">
                  <div>
                    <span className="text-xs text-[#CBD0DC] block">Accessible Luxury Price</span>
                    <span className="text-2xl sm:text-3xl font-bold text-white gold-glow-subtle">
                      Rs. {(flagshipProduct.salePrice || flagshipProduct.price).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex gap-3 w-full sm:w-auto sm:ml-auto">
                    <button
                      type="button"
                      onClick={() => navigate('product', { slug: flagshipProduct.slug })}
                      className="flex-1 sm:flex-initial py-3.5 px-6 rounded-xl bg-[#D4AF37] hover:bg-[#E5C378] text-[#0B0C0E] text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-lg"
                    >
                      Inspect Timepiece
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate('checkout')}
                      className="py-3.5 px-6 rounded-xl bg-[#181A1F] hover:bg-[#22252C] text-white text-xs font-semibold uppercase tracking-wider border border-[#262930] hover:border-[#D4AF37]/50 transition-all cursor-pointer"
                    >
                      Direct Order
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. BRAND PHILOSOPHY SECTION
          "Products you wear and carry should reflect your personality."
          data-section="brand-philosophy"
      */}
      <section data-section="brand-philosophy" className="py-24 bg-transparent border-b border-[#262930]/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="p-8 sm:p-14 rounded-3xl glass-panel space-y-8">
            <span className="text-xs uppercase tracking-[0.28em] text-[#D4AF37] font-semibold block">
              The Philosophy of Presence
            </span>

            <blockquote className="text-2xl sm:text-4xl md:text-5xl font-serif-luxury font-medium text-white leading-tight gold-glow-heading">
              &ldquo;Products you wear and carry should reflect your personality.&rdquo;
            </blockquote>

            <p className="text-sm sm:text-base text-[#D1D5E0] leading-relaxed max-w-2xl mx-auto font-light luxury-text-shadow">
              In an era of fleeting fast-fashion and generic digital displays, the mechanical timepiece remains a defiant statement of discipline, composure, and individuality. A STORIUM watch is not merely a tool to measure hours; it is a signature of who you are.
            </p>

            <div className="pt-4 flex justify-center">
              <div className="w-20 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent shadow-[0_0_12px_#D4AF37]" />
            </div>
          </div>
        </div>
      </section>

      {/* 6b. CLIENT REVIEWS
          Admin-featured approved reviews
          data-section="client-reviews"
      */}
      {featuredReviews.length > 0 && (
        <section data-section="client-reviews" className="py-24 bg-transparent border-b border-[#262930]/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <MotionReveal>
              <div className="text-center mb-12 space-y-3">
                <span className="text-xs uppercase tracking-[0.25em] text-[#D4AF37] font-semibold block">
                  Client Reviews
                </span>
                <h2 className="text-3xl sm:text-4xl font-bold text-white font-serif-luxury gold-glow-heading">
                  Voices from the showroom
                </h2>
                <p className="text-sm text-[#CBD0DC] max-w-xl mx-auto luxury-text-shadow">
                  Selected reflections from patrons across Pakistan — curated by STORIUM.
                </p>
              </div>
            </MotionReveal>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredReviews.map((review, index) => {
                const product = getProductById(review.productId);
                return (
                  <MotionReveal key={review.id} delay={index * 0.06}>
                    <article className="h-full p-6 sm:p-7 rounded-2xl glass-panel flex flex-col gap-4 hover:border-[#D4AF37]/40 transition-colors">
                      <StarRating value={review.rating} size="sm" />
                      <h3 className="text-base font-bold text-white font-serif-luxury leading-snug">
                        {review.title}
                      </h3>
                      <p className="text-sm text-[#CBD0DC] leading-relaxed flex-1 luxury-text-shadow">
                        “{review.body}”
                      </p>
                      <div className="pt-3 border-t border-[#262930]/80 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-[#F5F5F7] truncate">
                            {review.reviewerName}
                            {review.city ? ` · ${review.city}` : ''}
                          </p>
                          {product && (
                            <button
                              type="button"
                              onClick={() => navigate('product', { slug: product.slug })}
                              className="mt-1 text-[11px] text-[#D4AF37] hover:underline truncate max-w-full"
                            >
                              {product.name}
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  </MotionReveal>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* 7. TRUST / SHIPPING / PAYMENT INFO
          Tailored to Pakistan nationwide luxury service
          data-section="trust-badges"
      */}
      <section data-section="trust-badges" className="py-20 bg-transparent border-b border-[#262930]/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl glass-panel space-y-4 hover:border-[#D4AF37]/40 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-[#181A1F] flex items-center justify-center text-[#D4AF37] shadow-md border border-white/5">
                <Truck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white gold-glow-subtle">
                Pakistan Nationwide Courier
              </h3>
              <p className="text-xs sm:text-sm text-[#CBD0DC] leading-relaxed luxury-text-shadow">
                We partner with premier express logistics to deliver insured parcels to Karachi, Lahore, Islamabad, Rawalpindi, Peshawar, Quetta, and every corner of Pakistan within 2 to 4 working days.
              </p>
            </div>

            <div className="p-8 rounded-2xl glass-panel space-y-4 hover:border-[#D4AF37]/40 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-[#181A1F] flex items-center justify-center text-[#D4AF37] shadow-md border border-white/5">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white gold-glow-subtle">
                Cash on Delivery &amp; Debit Cards
              </h3>
              <p className="text-xs sm:text-sm text-[#CBD0DC] leading-relaxed luxury-text-shadow">
                Pay with complete peace of mind using Cash on Delivery (COD) upon inspection at your door, or complete instant checkout via Visa &amp; Mastercard debit cards.
              </p>
            </div>

            <div className="p-8 rounded-2xl glass-panel space-y-4 hover:border-[#D4AF37]/40 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-[#181A1F] flex items-center justify-center text-[#D4AF37] shadow-md border border-white/5">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white gold-glow-subtle">
                STORIUM Certificate of Authenticity
              </h3>
              <p className="text-xs sm:text-sm text-[#CBD0DC] leading-relaxed luxury-text-shadow">
                Every timepiece is individually serialized with its laser-engraved caseback SKU and accompanied by our embossed Certificate of Authenticity and 2-Year International Warranty card.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 8. FINAL CONVERSION SECTION
          data-section="conversion-cta"
      */}
      <section data-section="conversion-cta" className="py-24 bg-transparent relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#D4AF37]/10 via-transparent to-transparent pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="p-10 sm:p-16 rounded-3xl glass-panel space-y-8 flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl overflow-hidden border border-[#D4AF37]/50 bg-[#0B0C0E] p-1 shadow-[0_0_25px_rgba(212,175,55,0.25)]">
              <img src="/emblem.png" alt="STORIUM Emblem" className="w-full h-full object-cover rounded-xl" />
            </div>

            <span className="text-xs uppercase tracking-[0.25em] text-[#D4AF37] font-semibold block">
              Step into the Showroom
            </span>

            <h2 className="text-3xl sm:text-5xl font-bold text-white font-serif-luxury leading-tight gold-glow-heading">
              Your wrist speaks before you do.
            </h2>

            <p className="text-sm sm:text-base text-[#D1D5E0] max-w-xl mx-auto luxury-text-shadow">
              Discover timepieces built to transcend trends. Explore our full collection with complimentary insured delivery across Pakistan.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <button
                type="button"
                onClick={() => navigate('shop')}
                className="w-full sm:w-auto py-4 px-10 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#C5A059] hover:from-[#E5C378] hover:to-[#D4AF37] text-[#0B0C0E] text-xs font-bold uppercase tracking-[0.2em] shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Explore All Products</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => navigate('contact')}
                className="w-full sm:w-auto py-4 px-8 rounded-xl bg-[#181A1F] hover:bg-[#20232A] text-white text-xs font-semibold uppercase tracking-[0.2em] border border-[#262930] hover:border-[#D4AF37]/50 transition-all cursor-pointer"
              >
                Speak with Concierge
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
