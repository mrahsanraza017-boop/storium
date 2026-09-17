import React, { useState, useMemo, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Search, X, RotateCcw } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { ProductGrid } from '../components/product/ProductGrid';
import { CustomPriceFilter, PriceRange, PricePreset } from '../components/filters/CustomPriceFilter';

import { SEOHead } from '../components/seo/SEOHead';
import { getItemListSchema, getBreadcrumbSchema } from '../lib/seoSchemas';

const CATALOG_PRICE_PRESETS: PricePreset[] = [
  { label: 'Under Rs. 20,000', min: 0, max: 20000 },
  { label: 'Rs. 20,000 – Rs. 40,000', min: 20000, max: 40000 },
  { label: 'Rs. 40,000 – Rs. 70,000', min: 40000, max: 70000 },
  { label: 'Above Rs. 70,000', min: 70000, max: Infinity },
];

export const ShopView: React.FC = () => {
  const { products, categories, activeCategoryFilter } = useStore();

  const [selectedCategory, setSelectedCategory] = useState<string>(
    activeCategoryFilter || 'all'
  );
  const [searchFilter, setSearchFilter] = useState('');

  const effectivePrice = (p: { price: number; salePrice?: number }) => p.salePrice ?? p.price;

  const priceBounds = useMemo<PriceRange>(() => {
    if (products.length === 0) return { min: 0, max: 150000 };
    const prices = products.map((p) => effectivePrice(p));
    const maxPrice = Math.max(...prices, 1000);
    return { min: 0, max: Math.ceil(maxPrice / 1000) * 1000 };
  }, [products]);

  const [priceRange, setPriceRange] = useState<PriceRange>({ min: 0, max: 150000 });
  const [availabilityOnly, setAvailabilityOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'newest'>('featured');

  useEffect(() => {
    if (priceBounds.max > 0) {
      setPriceRange((prev) => ({
        min: prev.min === 0 ? priceBounds.min : prev.min,
        max: prev.max === 150000 ? priceBounds.max : prev.max,
      }));
    }
  }, [priceBounds]);

  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const matchesCategory =
          selectedCategory === 'all' || p.category === selectedCategory;
        const matchesSearch =
          !searchFilter.trim() ||
          p.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
          p.sku.toLowerCase().includes(searchFilter.toLowerCase()) ||
          p.brand.toLowerCase().includes(searchFilter.toLowerCase()) ||
          p.tags.some((t) => t.toLowerCase().includes(searchFilter.toLowerCase()));
        const price = effectivePrice(p);
        const matchesPrice = price >= priceRange.min && price <= priceRange.max;
        const matchesAvailability = !availabilityOnly || p.stockQuantity > 0;

        return matchesCategory && matchesSearch && matchesPrice && matchesAvailability;
      })
      .sort((a, b) => {
        const priceA = effectivePrice(a);
        const priceB = effectivePrice(b);
        if (sortBy === 'price-asc') return priceA - priceB;
        if (sortBy === 'price-desc') return priceB - priceA;
        if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
      });
  }, [products, selectedCategory, searchFilter, priceRange, availabilityOnly, sortBy]);

  const hasActiveFilters =
    selectedCategory !== 'all' ||
    searchFilter.trim() !== '' ||
    priceRange.min > priceBounds.min ||
    priceRange.max < priceBounds.max ||
    availabilityOnly;

  const handleReset = () => {
    setSelectedCategory('all');
    setSearchFilter('');
    setPriceRange({ min: priceBounds.min, max: priceBounds.max });
    setAvailabilityOnly(false);
    setSortBy('featured');
  };

  const breadcrumbs = [
    { name: 'Showroom', url: '/' },
    { name: 'Full Catalog', url: '/shop' },
  ];

  const schemas = [
    getBreadcrumbSchema(breadcrumbs),
    getItemListSchema(
      'STORIUM Full Showroom Catalog',
      'Browse all precision luxury timepieces and bespoke titanium accessories at STORIUM Pakistan.',
      filteredProducts,
      '/shop'
    ),
  ];

  return (
    <div className="w-full bg-transparent min-h-screen text-[#E8E8EC] py-12">
      <SEOHead
        title="Full Luxury Catalog — Precision Timepieces & Curated Accessories | STORIUM Showroom"
        description="Browse the complete catalog of STORIUM watches and titanium accessories in Pakistan. Filter by price, category, and availability with instant COD and card checkout."
        keywords="luxury watch catalog pakistan, buy watches online karachi, storium store lahore, buy accessories pakistan"
        canonicalPath="/shop"
        schemas={schemas}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="glass-panel p-8 sm:p-10 rounded-3xl mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 shadow-2xl">
          <div>
            <span className="text-xs uppercase tracking-[0.25em] text-[#D4AF37] font-semibold block mb-2">
              Full Inventory
            </span>
            <h1 className="text-3xl sm:text-5xl font-bold font-serif-luxury text-white gold-glow-heading">
              Showroom Catalog
            </h1>
            <p className="mt-2 text-sm sm:text-base text-[#D1D5E0] max-w-xl luxury-text-shadow">
              Explore our complete portfolio of horological creations and precision men&apos;s accessories.
            </p>
          </div>

          <div className="text-sm text-[#CBD0DC] font-mono px-4 py-2 rounded-xl glass-panel-subtle">
            Displaying <span className="text-[#D4AF37] font-bold">{filteredProducts.length}</span> Products
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="space-y-6 mb-10">
          {/* Top Row: Categories, Search, In-stock, Sort */}
          <div className="bg-[#121316]/75 border border-[#262930]/80 backdrop-blur-md rounded-2xl p-5 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Category Buttons */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  className={`px-4 py-2 rounded-xl text-xs uppercase tracking-wider font-semibold transition-all flex-shrink-0 cursor-pointer ${
                    selectedCategory === 'all'
                      ? 'bg-[#D4AF37] text-[#0B0C0E]'
                      : 'bg-[#181A1F] text-[#8E929E] hover:text-[#F5F5F7] border border-[#262930]'
                  }`}
                >
                  All Showroom ({products.length})
                </button>

                {categories.map((cat) => {
                  const count = products.filter((p) => p.category === cat.slug).length;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.slug)}
                      className={`px-4 py-2 rounded-xl text-xs uppercase tracking-wider font-semibold transition-all flex-shrink-0 cursor-pointer ${
                        selectedCategory === cat.slug
                          ? 'bg-[#D4AF37] text-[#0B0C0E]'
                          : 'bg-[#181A1F] text-[#8E929E] hover:text-[#F5F5F7] border border-[#262930]'
                      }`}
                    >
                      {cat.name} ({count})
                    </button>
                  );
                })}
              </div>

              {/* Keyword Search inside Shop */}
              <div className="relative w-full lg:w-72">
                <Search className="w-4 h-4 text-[#8E929E] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="shop-search-input"
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Search collection..."
                  aria-label="Search collection by name, SKU, or tag"
                  className="w-full py-2 pl-9 pr-8 rounded-xl bg-[#181A1F] border border-[#262930] text-xs text-[#F5F5F7] placeholder-[#626673] focus:outline-none focus:border-[#D4AF37]"
                />
                {searchFilter && (
                  <button
                    type="button"
                    onClick={() => setSearchFilter('')}
                    aria-label="Clear search filter"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8E929E] hover:text-[#F5F5F7] cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Controls Row: In Stock Toggle, Sort, Reset */}
            <div className="pt-3 border-t border-[#262930] flex flex-wrap items-center justify-between gap-4 text-xs">
              <label htmlFor="shop-in-stock-checkbox" className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  id="shop-in-stock-checkbox"
                  type="checkbox"
                  checked={availabilityOnly}
                  onChange={(e) => setAvailabilityOnly(e.target.checked)}
                  aria-label="Filter in-stock products only"
                  className="rounded bg-[#181A1F] border-[#262930] text-[#D4AF37] focus:ring-0 accent-[#D4AF37]"
                />
                <span className="text-[#F5F5F7] font-medium">In Stock Only</span>
              </label>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <label htmlFor="shop-sort-by" className="text-[#CBD0DC]">Sort:</label>
                  <select
                    id="shop-sort-by"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    aria-label="Sort products by"
                    className="bg-[#181A1F] border border-[#262930] rounded-lg px-2.5 py-1 text-xs text-[#F5F5F7] focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="featured">Featured First</option>
                    <option value="newest">Newest Releases</option>
                    <option value="price-asc">Price: Ascending</option>
                    <option value="price-desc">Price: Descending</option>
                  </select>
                </div>

                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleReset}
                    className="flex items-center gap-1 text-[#D4AF37] hover:underline cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Clear All</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Custom Price Filter Component */}
          <CustomPriceFilter
            bounds={priceBounds}
            value={priceRange}
            onChange={setPriceRange}
            presets={CATALOG_PRICE_PRESETS}
            step={500}
            label="Filter Showroom Catalog by Price"
          />
        </div>

        {/* Reusable Product Grid */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={`${selectedCategory}-${searchFilter}-${priceRange.min}-${priceRange.max}-${availabilityOnly}-${sortBy}-${filteredProducts.length}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <ProductGrid
              products={filteredProducts}
              emptyMessage="No showroom pieces found matching your specific filter criteria."
              columns="4"
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
