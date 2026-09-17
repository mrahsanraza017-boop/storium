import React, { useState, useMemo, useEffect } from 'react';
import { Watch, RotateCcw } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { ProductGrid } from '../components/product/ProductGrid';
import { CustomPriceFilter, PriceRange, PricePreset } from '../components/filters/CustomPriceFilter';
import { SEOHead } from '../components/seo/SEOHead';
import { getItemListSchema, getBreadcrumbSchema } from '../lib/seoSchemas';

const WATCH_PRICE_PRESETS: PricePreset[] = [
  { label: 'Under Rs. 35,000', min: 0, max: 35000 },
  { label: 'Rs. 35,000 – Rs. 50,000', min: 35000, max: 50000 },
  { label: 'Rs. 50,000 – Rs. 75,000', min: 50000, max: 75000 },
  { label: 'Above Rs. 75,000', min: 75000, max: Infinity },
];

export const WatchesView: React.FC = () => {
  const { products } = useStore();
  const [selectedType, setSelectedType] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'newest'>('featured');

  const watchProducts = useMemo(() => products.filter((p) => p.category === 'watches'), [products]);

  const effectivePrice = (p: { price: number; salePrice?: number }) => p.salePrice ?? p.price;

  const priceBounds = useMemo<PriceRange>(() => {
    if (watchProducts.length === 0) return { min: 0, max: 100000 };
    const prices = watchProducts.map((p) => effectivePrice(p));
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    return {
      min: Math.floor(minPrice / 5000) * 5000,
      max: Math.ceil(maxPrice / 5000) * 5000,
    };
  }, [watchProducts]);

  const [priceRange, setPriceRange] = useState<PriceRange>({ min: 0, max: 150000 });

  // Sync price range once bounds are computed
  useEffect(() => {
    if (priceBounds.max > 0) {
      setPriceRange((prev) => ({
        min: prev.min === 0 ? priceBounds.min : prev.min,
        max: prev.max === 150000 ? priceBounds.max : prev.max,
      }));
    }
  }, [priceBounds]);

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

        const price = effectivePrice(p);
        const matchesPrice = price >= priceRange.min && price <= priceRange.max;

        return matchesType && matchesPrice;
      })
      .sort((a, b) => {
        const priceA = effectivePrice(a);
        const priceB = effectivePrice(b);
        if (sortBy === 'price-asc') return priceA - priceB;
        if (sortBy === 'price-desc') return priceB - priceA;
        if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
      });
  }, [watchProducts, selectedType, priceRange, sortBy]);

  const hasActiveFilters =
    selectedType !== 'All' ||
    priceRange.min > priceBounds.min ||
    priceRange.max < priceBounds.max;

  const handleResetFilters = () => {
    setSelectedType('All');
    setPriceRange({ min: priceBounds.min, max: priceBounds.max });
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
        {/* Header Banner */}
        <div className="glass-panel p-8 sm:p-10 rounded-3xl mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 shadow-2xl">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#181A1F]/90 border border-[#D4AF37]/40 text-[11px] uppercase tracking-widest text-[#E5C378] backdrop-blur-sm shadow-sm">
              <Watch className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Curated Showroom</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold font-serif-luxury text-white gold-glow-heading">
              Timepieces Collection
            </h1>
            <p className="text-sm sm:text-base text-[#D1D5E0] max-w-xl luxury-text-shadow">
              Precision Japanese and Swiss mechanical movements encased in aerospace-grade titanium and 316L surgical steel with scratch-proof sapphire crystal.
            </p>
          </div>

          <div className="text-sm text-[#CBD0DC] font-mono px-4 py-2 rounded-xl glass-panel-subtle">
            Showing <span className="text-[#D4AF37] font-bold">{filteredWatches.length}</span> of {watchProducts.length} Timepieces
          </div>
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

          {/* Custom Price Filter Component */}
          <CustomPriceFilter
            bounds={priceBounds}
            value={priceRange}
            onChange={setPriceRange}
            presets={WATCH_PRICE_PRESETS}
            step={1000}
            label="Filter Timepieces by Price"
          />
        </div>

        {/* Product Grid */}
        <ProductGrid
          products={filteredWatches}
          emptyMessage="No timepieces match the current filters. Adjust your custom price range or selection."
          columns="4"
        />
      </div>
    </div>
  );
};
