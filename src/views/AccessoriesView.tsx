import React, { useState, useMemo } from 'react';
import { Search, X, Tag, RotateCcw } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { ProductGrid } from '../components/product/ProductGrid';
import { ACCESSORY_SUBCATEGORIES } from '../types';
import { SEOHead } from '../components/seo/SEOHead';
import { getItemListSchema, getBreadcrumbSchema } from '../lib/seoSchemas';

export const AccessoriesView: React.FC = () => {
  const { products, activeSubcategoryFilter, setActiveSubcategoryFilter } = useStore();

  const [selectedSubcategory, setSelectedSubcategory] = useState<string>(
    activeSubcategoryFilter || 'All'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'newest'>('featured');

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
        {/* If no accessories have been uploaded yet: Big Size & Fully Animated Coming Soon */}
        {allAccessories.length === 0 ? (
          <div className="relative min-h-[75vh] flex flex-col items-center justify-center text-center px-4 overflow-hidden select-none">
            {/* Ambient Breathing Radial Gold Aura */}
            <div className="coming-soon-glow-orb absolute w-[300px] sm:w-[560px] md:w-[750px] h-[300px] sm:h-[450px] bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.25)_0%,rgba(212,175,55,0.06)_50%,transparent_75%)] rounded-full blur-3xl pointer-events-none -z-10" />

            {/* Big Size Fully Animated Coming Soon Text */}
            <h1 className="coming-soon-giant-text font-serif-luxury font-black text-center uppercase tracking-[0.14em] sm:tracking-[0.2em] md:tracking-[0.26em] text-5xl sm:text-7xl md:text-8xl lg:text-9xl xl:text-[10rem] leading-none py-6">
              Coming Soon
            </h1>
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
