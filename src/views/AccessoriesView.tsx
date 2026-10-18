import React, { useState, useMemo } from 'react';
import { Search, X, Tag, RotateCcw, Sparkles, Bell, ArrowRight, ShieldCheck, Gem } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { ProductGrid } from '../components/product/ProductGrid';
import { ACCESSORY_SUBCATEGORIES } from '../types';
import { SEOHead } from '../components/seo/SEOHead';
import { getItemListSchema, getBreadcrumbSchema } from '../lib/seoSchemas';

export const AccessoriesView: React.FC = () => {
  const { products, activeSubcategoryFilter, setActiveSubcategoryFilter, navigate, addToast } = useStore();

  const [selectedSubcategory, setSelectedSubcategory] = useState<string>(
    activeSubcategoryFilter || 'All'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'newest'>('featured');
  const [notifyEmail, setNotifyEmail] = useState('');
  const [notified, setNotified] = useState(false);

  // Match both 'accessories' and legacy 'mens-accessories'
  const allAccessories = useMemo(() => {
    return products.filter((p) => p.category === 'accessories' || p.category === 'mens-accessories');
  }, [products]);

  const effectivePrice = (p: { price: number; salePrice?: number }) => p.salePrice ?? p.price;

  // Subcategory count lookup
  const subcategoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: allAccessories.length };
    ACCESSORY_SUBCATEGORIES.forEach((sub) => {
      counts[sub] = allAccessories.filter((p) => p.subcategory === sub).length;
    });
    return counts;
  }, [allAccessories]);

  // Filtered list (when products exist)
  const filteredAccessories = useMemo(() => {
    return allAccessories
      .filter((p) => {
        const matchesSubcategory =
          selectedSubcategory === 'All' || p.subcategory === selectedSubcategory;
        const matchesSearch =
          !searchQuery.trim() ||
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.subcategory && p.subcategory.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (p.tags || []).some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

        return matchesSubcategory && matchesSearch;
      })
      .sort((a, b) => {
        const priceA = effectivePrice(a);
        const priceB = effectivePrice(b);
        if (sortBy === 'price-asc') return priceA - priceB;
        if (sortBy === 'price-desc') return priceB - priceA;
        if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
      });
  }, [allAccessories, selectedSubcategory, searchQuery, sortBy]);

  const handleSelectSubcategory = (sub: string) => {
    setSelectedSubcategory(sub);
    setActiveSubcategoryFilter(sub === 'All' ? null : sub);
  };

  const hasActiveFilters =
    selectedSubcategory !== 'All' ||
    searchQuery.trim() !== '' ||
    sortBy !== 'featured';

  const handleResetFilters = () => {
    setSelectedSubcategory('All');
    setActiveSubcategoryFilter(null);
    setSearchQuery('');
    setSortBy('featured');
  };

  const handleNotifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifyEmail) return;
    setNotified(true);
    addToast('success', 'VIP Priority Registered', `You will receive private notification the moment the Accessories collection launches.`);
    setNotifyEmail('');
  };

  const breadcrumbs = [
    { name: 'Showroom', url: '/' },
    { name: 'Accessories', url: '/accessories' },
  ];

  const schemas = [
    getBreadcrumbSchema(breadcrumbs),
    getItemListSchema(
      'Luxury Accessories | STORIUM Pakistan',
      'Discover aerospace titanium cardholders, luxury leather wallets, sunglasses, and curated accoutrements in Pakistan.',
      filteredAccessories,
      '/accessories'
    ),
  ];

  return (
    <div className="w-full bg-transparent min-h-screen text-[#E8E8EC] py-12">
      <SEOHead
        title="Luxury Accessories — Titanium Wallets, EDC & Accoutrements | STORIUM Pakistan"
        description="Precision-machined titanium cardholders, genuine leather wallets, designer eyewear, and luxury everyday carry essentials in Pakistan with express nationwide delivery."
        keywords="accessories pakistan, titanium cardholder pakistan, luxury wallet lahore, designer sunglasses karachi, storium accessories, edc pakistan"
        canonicalPath="/accessories"
        schemas={schemas}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* If no accessories have been uploaded yet: Show luxurious Coming Soon state */}
        {allAccessories.length === 0 ? (
          <div className="py-12 sm:py-20 flex flex-col items-center justify-center text-center">
            {/* Ambient Backlight Glow */}
            <div className="relative w-full max-w-4xl p-8 sm:p-16 rounded-3xl glass-panel border border-[#D4AF37]/30 shadow-2xl overflow-hidden">
              <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />

              {/* Tag Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#181A1F] border border-[#D4AF37]/50 text-xs uppercase tracking-[0.25em] text-[#D4AF37] font-semibold mb-6 shadow-md">
                <Sparkles className="w-3.5 h-3.5 text-[#D4AF37] animate-pulse" />
                <span>STORIUM Atelier &mdash; Coming Soon</span>
              </div>

              {/* Main Heading */}
              <h1 className="text-4xl sm:text-6xl font-bold font-serif-luxury text-white gold-glow-heading mb-6 tracking-tight">
                Accessories Collection
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-lg text-[#CBD0DC] max-w-2xl mx-auto leading-relaxed mb-10 luxury-text-shadow">
                Precision-machined Grade-5 titanium cardholders, vegetable-tanned Tuscan leather goods, and sartorial accents are currently being forged. Our premiere collection will debut shortly.
              </p>

              {/* Teaser Feature Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12 text-left">
                <div className="p-5 rounded-2xl bg-[#0B0C0E]/80 border border-[#262930] hover:border-[#D4AF37]/40 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-[#121316] border border-[#262930] flex items-center justify-center text-[#D4AF37] mb-3">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <h2 className="text-sm font-bold text-white mb-1">Titanium Everyday Carry</h2>
                  <p className="text-xs text-[#8E929E] leading-relaxed">
                    Aerospace-grade Grade-5 titanium cardholders with military-spec RFID theft shielding and instant mechanical ejectors.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-[#0B0C0E]/80 border border-[#262930] hover:border-[#D4AF37]/40 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-[#121316] border border-[#262930] flex items-center justify-center text-[#D4AF37] mb-3">
                    <Gem className="w-5 h-5" />
                  </div>
                  <h2 className="text-sm font-bold text-white mb-1">Handcrafted Leather</h2>
                  <p className="text-xs text-[#8E929E] leading-relaxed">
                    Full-grain vegetable-tanned Tuscan leather wallets, weekenders, and reversible belts that age with a rich personal patina.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-[#0B0C0E]/80 border border-[#262930] hover:border-[#D4AF37]/40 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-[#121316] border border-[#262930] flex items-center justify-center text-[#D4AF37] mb-3">
                    <Tag className="w-5 h-5" />
                  </div>
                  <h2 className="text-sm font-bold text-white mb-1">Sartorial Accents</h2>
                  <p className="text-xs text-[#8E929E] leading-relaxed">
                    Muonionalusta meteorite cufflinks, titanium cable bangles, and precision double-edge safety razors.
                  </p>
                </div>
              </div>

              {/* VIP Early Access Notification Form */}
              <div className="max-w-md mx-auto mb-8">
                <h2 className="text-xs uppercase tracking-[0.2em] font-semibold text-[#CBD0DC] mb-3">
                  Be Notified Upon Premiere Launch
                </h2>
                {notified ? (
                  <div className="p-4 rounded-xl bg-[#181A1F] border border-[#D4AF37]/40 text-xs text-[#D4AF37] font-semibold">
                    ✓ You are registered for VIP Early Access! We will email you once products are live.
                  </div>
                ) : (
                  <form onSubmit={handleNotifySubmit} className="flex gap-2">
                    <input
                      type="email"
                      value={notifyEmail}
                      onChange={(e) => setNotifyEmail(e.target.value)}
                      placeholder="Enter your email address"
                      required
                      aria-label="Email address for accessories launch notifications"
                      className="flex-1 py-3 px-4 rounded-xl bg-[#0B0C0E] border border-[#262930] text-xs text-[#F5F5F7] placeholder-[#626673] focus:outline-none focus:border-[#D4AF37] transition-colors"
                    />
                    <button
                      type="submit"
                      className="px-5 py-3 rounded-xl bg-[#D4AF37] hover:bg-[#E5C378] text-[#0B0C0E] font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-lg shadow-[#D4AF37]/20 cursor-pointer"
                    >
                      <Bell className="w-3.5 h-3.5" />
                      <span>Notify Me</span>
                    </button>
                  </form>
                )}
              </div>

              {/* Call to Action: Explore Watches */}
              <div className="pt-4 border-t border-[#262930]/60 flex flex-col sm:flex-row items-center justify-center gap-4">
                <span className="text-xs text-[#8E929E]">Looking for our flagship horology?</span>
                <button
                  type="button"
                  onClick={() => navigate('watches')}
                  className="px-6 py-2.5 rounded-xl bg-[#181A1F] hover:bg-[#20232A] border border-[#D4AF37]/40 text-[#D4AF37] hover:text-white text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <span>Explore Timepieces</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* When products are added: Automatically render full collection UI! */
          <div>
            {/* Header Banner */}
            <div className="glass-panel p-8 sm:p-10 rounded-3xl mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 shadow-2xl">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#181A1F]/90 border border-[#D4AF37]/40 text-[11px] uppercase tracking-widest text-[#E5C378] backdrop-blur-sm shadow-sm">
                  <Tag className="w-3 h-3 text-[#D4AF37]" />
                  <span>Curated Showroom Accoutrements</span>
                </div>
                <h1 className="text-3xl sm:text-5xl font-bold font-serif-luxury text-white gold-glow-heading">
                  Accessories
                </h1>
                <p className="text-sm sm:text-base text-[#D1D5E0] max-w-2xl leading-relaxed luxury-text-shadow">
                  Precision-machined titanium essentials, vegetable-tanned Tuscan leather goods, and sartorial accents crafted to command presence and elevate your lifestyle.
                </p>
              </div>

              <div className="text-sm text-[#CBD0DC] font-mono px-4 py-2 rounded-xl glass-panel-subtle">
                Showing <span className="text-[#D4AF37] font-bold">{filteredAccessories.length}</span> of {allAccessories.length} Accessories
              </div>
            </div>

            {/* Subcategories Horizontal Scroll Filter Bar */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] uppercase tracking-[0.2em] text-[#CBD0DC] font-semibold">
                  Explore Subcategories
                </span>
                {selectedSubcategory !== 'All' && (
                  <button
                    type="button"
                    onClick={() => handleSelectSubcategory('All')}
                    className="text-xs text-[#D4AF37] hover:underline cursor-pointer"
                  >
                    Clear subcategory
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-3 scrollbar-thin scrollbar-thumb-[#262930] scrollbar-track-transparent">
                <button
                  type="button"
                  onClick={() => handleSelectSubcategory('All')}
                  className={`px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider font-semibold transition-all flex items-center gap-2 flex-shrink-0 cursor-pointer ${
                    selectedSubcategory === 'All'
                      ? 'bg-[#D4AF37] text-[#0B0C0E] shadow-lg shadow-[#D4AF37]/20'
                      : 'bg-[#121316] text-[#8E929E] hover:text-[#F5F5F7] border border-[#262930] hover:border-[#D4AF37]/40'
                  }`}
                >
                  <span>All Accessories</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                      selectedSubcategory === 'All'
                        ? 'bg-[#0B0C0E]/20 text-[#0B0C0E]'
                        : 'bg-[#181A1F] text-[#CBD0DC]'
                    }`}
                  >
                    {subcategoryCounts['All'] || 0}
                  </span>
                </button>

                {ACCESSORY_SUBCATEGORIES.map((sub) => {
                  const count = subcategoryCounts[sub] || 0;
                  const isSelected = selectedSubcategory === sub;

                  return (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => handleSelectSubcategory(sub)}
                      className={`px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider font-semibold transition-all flex items-center gap-2 flex-shrink-0 cursor-pointer ${
                        isSelected
                          ? 'bg-[#D4AF37] text-[#0B0C0E] shadow-lg shadow-[#D4AF37]/20'
                          : 'bg-[#121316] text-[#8E929E] hover:text-[#F5F5F7] border border-[#262930] hover:border-[#D4AF37]/40'
                      }`}
                    >
                      <span>{sub}</span>
                      {count > 0 && (
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                            isSelected
                              ? 'bg-[#0B0C0E]/20 text-[#0B0C0E]'
                              : 'bg-[#181A1F] text-[#CBD0DC]'
                          }`}
                        >
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Filter Controls Area (Search & Sort only, NO price filter) */}
            <div className="space-y-6 mb-10">
              <div className="bg-[#121316]/75 border border-[#262930]/80 backdrop-blur-md rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-[#8E929E] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="accessories-search-input"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search accessories by name, material, SKU..."
                    aria-label="Search accessories by name, material, SKU"
                    className="w-full py-2.5 pl-10 pr-9 rounded-xl bg-[#0B0C0E] border border-[#262930] text-xs text-[#F5F5F7] placeholder-[#626673] focus:outline-none focus:border-[#D4AF37] transition-colors"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      aria-label="Clear search filter"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8E929E] hover:text-white cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <label htmlFor="accessories-sort-by" className="text-xs uppercase tracking-wider text-[#CBD0DC] hidden sm:inline">
                      Sort:
                    </label>
                    <select
                      id="accessories-sort-by"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      aria-label="Sort accessories"
                      className="py-2 px-3 rounded-xl bg-[#0B0C0E] border border-[#262930] text-xs text-[#F5F5F7] focus:outline-none focus:border-[#D4AF37]"
                    >
                      <option value="featured">Featured First</option>
                      <option value="newest">New Arrivals</option>
                      <option value="price-asc">Price: Low to High</option>
                      <option value="price-desc">Price: High to Low</option>
                    </select>
                  </div>

                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="flex items-center gap-1 py-2 px-3 rounded-xl bg-[#181A1F] hover:bg-[#20232A] text-xs text-[#D4AF37] border border-[#262930] transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset All</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Product Grid or Empty Filter Result */}
            {filteredAccessories.length > 0 ? (
              <ProductGrid products={filteredAccessories} columns="4" />
            ) : (
              <div className="py-24 text-center rounded-3xl bg-[#121316] border border-[#262930] p-8 space-y-4 max-w-2xl mx-auto">
                <div className="w-16 h-16 rounded-2xl bg-[#181A1F] border border-[#262930] flex items-center justify-center mx-auto text-[#D4AF37]">
                  <Tag className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold text-[#F5F5F7] font-serif-luxury">
                  No Accessories Found
                </h2>
                <p className="text-xs sm:text-sm text-[#CBD0DC] max-w-md mx-auto leading-relaxed">
                  We currently don&apos;t have items matching &ldquo;{selectedSubcategory}&rdquo; with your search query. Try another search or reset your filter.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="py-3 px-6 rounded-xl bg-[#D4AF37] hover:bg-[#E5C378] text-[#0B0C0E] text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    View All Accessories ({allAccessories.length})
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
