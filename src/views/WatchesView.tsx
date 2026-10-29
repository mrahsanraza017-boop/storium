import React, { useState, useMemo } from 'react';
import { RotateCcw } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { ProductGrid } from '../components/product/ProductGrid';
import { SaleBanner } from '../components/promotions/SaleBanner';
import { WatchDealsSection } from '../components/promotions/WatchDealsSection';
import { SEOHead } from '../components/seo/SEOHead';
import { getItemListSchema, getBreadcrumbSchema } from '../lib/seoSchemas';

export const WatchesView: React.FC = () => {
  const { products } = useStore();
  const [selectedType, setSelectedType] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'newest'>('featured');

  const watchProducts = useMemo(() => products.filter((p) => p.category === 'watches'), [products]);

  const effectivePrice = (p: { price: number; salePrice?: number }) => p.salePrice ?? p.price;

  // Watch "type" options derived from catalogue tags and subcategories
  const typeOptions = useMemo(() => {
    const preferred = ['Chrono', 'Automatic', 'Skeleton', 'Titanium', 'Minimalist', 'Diver', 'GMT'];
    const found = new Set<string>();
    watchProducts.forEach((p) => {
      (p.tags || []).forEach((t) => {
        if (preferred.includes(t)) found.add(t);
      });
      if (p.subcategory) found.add(p.subcategory);
    });
    const ordered = preferred.filter((t) => found.has(t));
    const extras = Array.from(found).filter((t) => !preferred.includes(t));
    return ['All', ...ordered, ...extras];
  }, [watchProducts]);

  // Counts per type option
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { All: watchProducts.length };
    typeOptions.forEach((type) => {
      if (type === 'All') return;
      counts[type] = watchProducts.filter(
        (p) => (p.tags || []).includes(type) || p.subcategory === type
      ).length;
    });
    return counts;
  }, [watchProducts, typeOptions]);

  const filteredWatches = useMemo(() => {
    return watchProducts
      .filter((p) => {
        const matchesType =
          selectedType === 'All' ||
          (p.tags || []).includes(selectedType) ||
          p.subcategory === selectedType;

        return matchesType;
      })
      .sort((a, b) => {
        const priceA = effectivePrice(a);
        const priceB = effectivePrice(b);
        if (sortBy === 'price-asc') return priceA - priceB;
        if (sortBy === 'price-desc') return priceB - priceA;
        if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
      });
  }, [watchProducts, selectedType, sortBy]);

  const hasActiveFilters = selectedType !== 'All' || sortBy !== 'featured';

  const handleResetFilters = () => {
    setSelectedType('All');
    setSortBy('featured');
  };


  const breadcrumbs = [
    { name: 'Showroom', url: '/' },
    { name: 'Watches', url: '/watches' },
  ];

  const schemas = [
    getBreadcrumbSchema(breadcrumbs),
    getItemListSchema(
      "Men's Luxury Watches Pakistan | STORIUM",
      'Discover STORIUM’s curated collection of luxury mechanical, automatic, and chronograph timepieces in Pakistan.',
      filteredWatches,
      '/watches'
    ),
  ];

  return (
    <div className="w-full bg-transparent min-h-screen text-[#E8E8EC] py-12">
      <SEOHead
        title="Men's Luxury Watches in Pakistan — Automatic, Chronograph & Titanium | STORIUM"
        description="Explore precision Japanese & Swiss mechanical watches in Pakistan. Featuring 316L stainless steel, sapphire crystal, DLC coatings, and 1-year warranty with express COD."
        keywords="luxury watches pakistan, automatic watches karachi, chronograph watch lahore, mechanical watch islamabad, buy luxury watch pakistan, storium timepieces"
        canonicalPath="/watches"
        schemas={schemas}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Semantic h1 heading for SEO & Accessibility */}
        <h1 className="sr-only">Timepieces Collection — STORIUM Luxury Mechanical & Automatic Watches</h1>

        {/* Promotional Sale Banner */}
        <div className="mb-8">
          <SaleBanner variant="section" />
        </div>

        {/* Filter Controls Area */}
        <div className="space-y-6 mb-10">
          {/* Top Row: Type Pills & Sort */}
          <div className="bg-[#121316]/75 border border-[#262930]/80 backdrop-blur-md rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
            {/* Watch Type Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none max-w-full">
              {typeOptions.map((type) => {
                const count = typeCounts[type] || 0;
                const isSelected = selectedType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSelectedType(type)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs uppercase tracking-wider font-semibold transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
                      isSelected
                        ? 'bg-[#D4AF37] text-[#0B0C0E] shadow-md'
                        : 'bg-[#181A1F] text-[#8E929E] hover:text-[#F5F5F7] border border-[#262930]'
                    }`}
                  >
                    <span>{type}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                        isSelected ? 'bg-[#0B0C0E]/20 text-[#0B0C0E]' : 'bg-[#121316] text-[#CBD0DC]'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Sort & Reset */}
            <div className="flex items-center gap-3">
              <label htmlFor="watches-sort-by" className="text-xs uppercase tracking-wider text-[#CBD0DC] hidden sm:inline">
                Sort:
              </label>
              <select
                id="watches-sort-by"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                aria-label="Sort timepieces by"
                className="bg-[#181A1F] border border-[#262930] rounded-lg px-3 py-1.5 text-xs text-[#F5F5F7] focus:outline-none focus:border-[#D4AF37]"
              >
                <option value="featured">Showroom Featured</option>
                <option value="newest">Latest Releases</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#181A1F] border border-[#262930] hover:border-[#D4AF37] text-[#D4AF37] text-xs font-semibold transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset All</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Product Grid */}
        <ProductGrid
          products={filteredWatches}
          emptyMessage="No timepieces match the current filters. Adjust your category selection."
          columns="4"
        />

        {/* Curated Watch Deals Section */}
        <div className="mt-16 pt-12 border-t border-[#262930]">
          <WatchDealsSection />
        </div>
      </div>
    </div>

  );
};
