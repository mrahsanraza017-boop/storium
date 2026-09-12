import React, { useState, useMemo } from 'react';
import { SlidersHorizontal, ArrowUpDown, Check } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { ProductGrid } from '../components/product/ProductGrid';

import { SEOHead } from '../components/seo/SEOHead';
import { getItemListSchema, getBreadcrumbSchema } from '../lib/seoSchemas';

export const WatchesView: React.FC = () => {
  const { products } = useStore();
  const [selectedTag, setSelectedTag] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'newest'>('featured');
  const [maxPrice, setMaxPrice] = useState<number>(70000);

  // Filter for watches
  const watchProducts = products.filter((p) => p.category === 'watches');

  const tagsList = ['All', 'Chrono', 'Automatic', 'Skeleton', 'Titanium', 'Minimalist', 'Diver', 'GMT'];

  const filteredWatches = useMemo(() => {
    return watchProducts
      .filter((p) => {
        const matchesTag = selectedTag === 'All' || p.tags.includes(selectedTag);
        const effectivePrice = p.salePrice ?? p.price;
        const matchesPrice = effectivePrice <= maxPrice;
        return matchesTag && matchesPrice;
      })
      .sort((a, b) => {
        const priceA = a.salePrice ?? a.price;
        const priceB = b.salePrice ?? b.price;
        if (sortBy === 'price-asc') return priceA - priceB;
        if (sortBy === 'price-desc') return priceB - priceA;
        if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
      });
  }, [watchProducts, selectedTag, sortBy, maxPrice]);

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
        description="Explore precision Japanese & Swiss mechanical watches in Pakistan. Featuring 316L stainless steel, sapphire crystal, DLC coatings, and 2-year warranty with express COD."
        keywords="luxury watches pakistan, automatic watches karachi, chronograph watch lahore, mechanical watch islamabad, buy luxury watch pakistan, storium timepieces"
        canonicalPath="/watches"
        schemas={schemas}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Banner */}
        <div className="glass-panel p-8 sm:p-10 rounded-3xl mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 shadow-2xl">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#181A1F]/90 border border-[#D4AF37]/40 text-[11px] uppercase tracking-widest text-[#E5C378] backdrop-blur-sm shadow-sm">
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

        {/* Filter Controls Bar */}
        <div className="bg-[#121316]/75 border border-[#262930]/80 backdrop-blur-md rounded-2xl p-4 sm:p-6 mb-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Tag Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none max-w-full">
              {tagsList.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setSelectedTag(tag)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs uppercase tracking-wider font-semibold transition-all flex-shrink-0 cursor-pointer ${
                    selectedTag === tag
                      ? 'bg-[#D4AF37] text-[#0B0C0E] shadow-md'
                      : 'bg-[#181A1F] text-[#8E929E] hover:text-[#F5F5F7] border border-[#262930]'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-3">
              <label htmlFor="watches-sort-by" className="text-xs uppercase tracking-wider text-[#CBD0DC] hidden sm:inline">
                Sort By:
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
            </div>
          </div>

          {/* Price Range Slider */}
          <div className="pt-3 border-t border-[#262930] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#CBD0DC]">
            <div className="flex items-center gap-3">
              <label htmlFor="watches-max-price">Filter Max Price:</label>
              <input
                id="watches-max-price"
                type="range"
                min="20000"
                max="70000"
                step="2500"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                aria-label="Filter maximum price in PKR"
                className="w-40 sm:w-60 accent-[#D4AF37]"
              />
              <span className="font-bold text-[#F5F5F7]">Rs. {maxPrice.toLocaleString()}</span>
            </div>

            <button
              type="button"
              onClick={() => {
                setSelectedTag('All');
                setMaxPrice(70000);
                setSortBy('featured');
              }}
              className="text-xs text-[#D4AF37] hover:underline cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* Product Grid */}
        <ProductGrid
          products={filteredWatches}
          emptyMessage="No timepieces match the current filters. Adjust your price range or selection."
          columns="4"
        />
      </div>
    </div>
  );
};
