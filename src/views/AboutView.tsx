import React from 'react';
import { Award, Compass, Shield, Watch, ArrowRight } from 'lucide-react';
import { useStore } from '../context/StoreContext';

import { SEOHead } from '../components/seo/SEOHead';
import { getBreadcrumbSchema, BASE_SITE_URL } from '../lib/seoSchemas';

export const AboutView: React.FC = () => {
  const { navigate } = useStore();

  const breadcrumbs = [
    { name: 'Showroom', url: '/' },
    { name: 'About Maison STORIUM', url: '/about' },
  ];

  const aboutSchema = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    '@id': `${BASE_SITE_URL}/about#aboutpage`,
    name: 'About Maison STORIUM — Pakistan’s Futuristic Luxury Showroom',
    url: `${BASE_SITE_URL}/about`,
    description:
      'The story behind Pakistan’s pioneering online luxury showroom for futuristic timepieces, aerospace titanium, and curated men’s accoutrements.',
    mainEntity: {
      '@id': `${BASE_SITE_URL}/#organization`,
    },
  };

  const schemas = [getBreadcrumbSchema(breadcrumbs), aboutSchema];

  return (
    <div className="w-full bg-transparent min-h-screen text-[#E8E8EC] py-16">
      <SEOHead
        title="About STORIUM — The Manifesto of Horological Presence & Craftsmanship | Pakistan"
        description="Learn the philosophy of Maison STORIUM Pakistan. Discover how we unite precision Japanese & Swiss mechanical movements with aerospace metallurgy and accessible luxury pricing."
        keywords="about storium, luxury watch brand pakistan, maison storium horology, storium showroom islamabad"
        canonicalPath="/about"
        schemas={schemas}
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Header */}
        <div className="text-center space-y-6 glass-panel p-10 sm:p-12 rounded-3xl shadow-2xl flex flex-col items-center">
          <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl overflow-hidden border border-[#D4AF37]/40 p-1 bg-[#0B0C0E] shadow-[0_0_30px_rgba(212,175,55,0.2)] flex-shrink-0">
            <img
              src="/logo.jpg"
              alt="Maison STORIUM Logo"
              className="w-full h-full object-cover rounded-xl"
            />
          </div>
          <div>
            <span className="text-xs uppercase tracking-[0.28em] text-[#D4AF37] font-semibold block mb-2">
              Maison STORIUM
            </span>
            <h1 className="text-3xl sm:text-5xl font-bold font-serif-luxury text-white gold-glow-heading">
              Wear Your Presence.
            </h1>
          </div>
          <p className="text-base sm:text-lg text-[#D1D5E0] max-w-2xl mx-auto font-light leading-relaxed luxury-text-shadow">
            The story behind Pakistan&apos;s pioneering online luxury showroom for futuristic timepieces and curated men&apos;s accoutrements.
          </p>
        </div>

        {/* Hero Visual */}
        <div className="relative rounded-3xl overflow-hidden border border-white/10 aspect-[16/9] shadow-2xl">
          <img
            src="/assets/exhibition-bench.jpg"
            alt="STORIUM Horology Craftsmanship & Atelier"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0C0E] via-transparent to-transparent opacity-80" />
        </div>

        {/* Philosophy */}
        <div className="space-y-6 text-sm sm:text-base text-[#D1D5E0] leading-relaxed glass-panel p-8 sm:p-10 rounded-3xl shadow-2xl">
          <h2 className="text-2xl sm:text-3xl font-bold text-white font-serif-luxury gold-glow-subtle">
            The Philosophy of Self-Definition
          </h2>
          <p className="luxury-text-shadow">
            At STORIUM, we reject the notion that luxury must be synonymous with exorbitant markups or antiquated heritage houses. We believe that what you wear and carry is not a passive accessory—it is an external proclamation of your presence, self-discipline, and vision.
          </p>
          <p className="luxury-text-shadow">
            Founded in Pakistan, STORIUM is built to offer men who demand excellence an accessible gateway into haute horologie. Every timepiece in our catalog is rigorously engineered using materials previously reserved for aerospace and surgical applications: 316L stainless steel, Grade 5 titanium, anti-reflective double-domed sapphire crystals, and precision mechanical escapements.
          </p>
        </div>

        {/* 3 Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          <div className="p-6 rounded-2xl glass-panel space-y-3 hover:border-[#D4AF37]/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-[#181A1F] flex items-center justify-center text-[#D4AF37] border border-white/5">
              <Watch className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white gold-glow-subtle">Precision Horology</h3>
            <p className="text-xs sm:text-sm text-[#CBD0DC] leading-relaxed luxury-text-shadow">
              Equipped with high-beat Japanese and Swiss mechanical calibres regulated for daily precision.
            </p>
          </div>

          <div className="p-6 rounded-2xl glass-panel space-y-3 hover:border-[#D4AF37]/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-[#181A1F] flex items-center justify-center text-[#D4AF37] border border-white/5">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white gold-glow-subtle">Indestructible Metals</h3>
            <p className="text-xs sm:text-sm text-[#CBD0DC] leading-relaxed luxury-text-shadow">
              Aerospace DLC coatings, DLC matte finishes, and sapphire crystals impervious to everyday scratches.
            </p>
          </div>

          <div className="p-6 rounded-2xl glass-panel space-y-3 hover:border-[#D4AF37]/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-[#181A1F] flex items-center justify-center text-[#D4AF37] border border-white/5">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white gold-glow-subtle">Pakistani Heritage</h3>
            <p className="text-xs sm:text-sm text-[#CBD0DC] leading-relaxed luxury-text-shadow">
              Proudly serving modern gentlemen across Karachi, Lahore, Islamabad, and nationwide with white-glove service.
            </p>
          </div>
        </div>

        {/* Showroom CTA */}
        <div className="p-8 sm:p-12 rounded-3xl glass-panel text-center space-y-6 shadow-2xl">
          <h3 className="text-2xl sm:text-3xl font-bold font-serif-luxury text-white gold-glow-heading">
            Discover the Showroom Collection
          </h3>
          <p className="text-xs sm:text-sm text-[#CBD0DC] max-w-lg mx-auto luxury-text-shadow">
            Experience our flagship automatic chronographs and skeletonized titanium designs.
          </p>
          <button
            type="button"
            onClick={() => navigate('watches')}
            className="py-3.5 px-8 rounded-xl bg-[#D4AF37] hover:bg-[#E5C378] text-[#0B0C0E] text-xs font-bold uppercase tracking-wider shadow-lg transition-all cursor-pointer"
          >
            Explore Watches Collection
          </button>
        </div>
      </div>
    </div>
  );
};
