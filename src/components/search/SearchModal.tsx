import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, ArrowRight, Watch, Tag, Sparkles } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const SearchModal: React.FC = () => {
  const { isSearchOpen, closeSearch, products, navigate } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setSearchTerm('');
    }
  }, [isSearchOpen]);

  const cleanQuery = searchTerm.trim().toLowerCase();

  const filtered = cleanQuery
    ? products.filter((p) => {
      const matchName = p.name.toLowerCase().includes(cleanQuery);
      const matchSku = p.sku.toLowerCase().includes(cleanQuery);
      const matchCategory = p.categoryName.toLowerCase().includes(cleanQuery);
      const matchBrand = p.brand.toLowerCase().includes(cleanQuery);
      const matchTags = p.tags.some((t) => t.toLowerCase().includes(cleanQuery));
      const matchDesc = p.description.toLowerCase().includes(cleanQuery);
      return matchName || matchSku || matchCategory || matchBrand || matchTags || matchDesc;
    })
    : [];

  const handleSelectProduct = (slug: string) => {
    closeSearch();
    navigate('product', { slug });
  };

  const quickTags = ['Automatic', 'Chrono', 'Titanium', 'Sapphire', 'Minimalist', '300M Diver', 'Accessories'];

  return (
    <AnimatePresence>
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 md:p-12 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeSearch}
            className="fixed inset-0 bg-black/85 backdrop-blur-md"
          />

          {/* Search Modal Dialog */}
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-3xl bg-[#121316] border border-[#262930] rounded-2xl shadow-2xl overflow-hidden z-10 my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Header Bar */}
            <div className="p-4 sm:p-6 border-b border-[#262930] flex items-center gap-3">
              <Search className="w-5 h-5 text-[#D4AF37] flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search timepieces, SKU, complications, or materials..."
                className="flex-1 bg-transparent text-base sm:text-lg text-[#F5F5F7] placeholder-[#626673] focus:outline-none tracking-wide"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="p-1 rounded-full text-[#8E929E] hover:text-[#F5F5F7]"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={closeSearch}
                className="p-2 rounded-lg bg-[#181A1F] text-[#8E929E] hover:text-[#F5F5F7] border border-white/5 transition-colors text-xs uppercase tracking-wider"
              >
                ESC
              </button>
            </div>

            {/* Quick Filter Tags */}
            <div className="px-6 py-3 bg-[#0B0C0E]/50 border-b border-[#262930] flex items-center gap-2 overflow-x-auto text-xs scrollbar-none">
              <span className="text-[#626673] uppercase tracking-wider text-[10px] font-semibold flex-shrink-0">
                Suggestions:
              </span>
              {quickTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setSearchTerm(tag)}
                  className="px-2.5 py-1 rounded-md bg-[#181A1F] text-[#8E929E] hover:text-[#D4AF37] hover:border-[#D4AF37]/30 border border-[#262930] transition-colors flex-shrink-0"
                >
                  {tag}
                </button>
              ))}
            </div>

            {/* Search Results Area */}
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {cleanQuery ? (
                filtered.length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-[#8E929E] mb-2 uppercase tracking-wider">
                      <span>Matching Timepieces ({filtered.length})</span>
                      <span>Direct Access</span>
                    </div>

                    {filtered.map((product) => (
                      <div
                        key={product.id}
                        onClick={() => handleSelectProduct(product.slug)}
                        className="p-3 rounded-xl bg-[#181A1F] hover:bg-[#20232A] border border-[#262930] hover:border-[#D4AF37]/40 cursor-pointer flex items-center justify-between gap-4 transition-all group"
                      >
                        <div className="flex items-center gap-4">
                          <img
                            src={product.thumbnail}
                            alt={product.name}
                            className="w-14 h-14 rounded-lg object-cover bg-[#0B0C0E] border border-white/5 group-hover:scale-105 transition-transform"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-mono">
                                {product.sku}
                              </span>
                              <span className="text-[10px] uppercase text-[#8E929E]">
                                &bull; {product.brand}
                              </span>
                            </div>
                            <h4 className="text-sm font-semibold text-[#F5F5F7] group-hover:text-[#D4AF37] transition-colors">
                              {product.name}
                            </h4>
                            <p className="text-xs text-[#8E929E] line-clamp-1 mt-0.5">
                              {product.shortDescription}
                            </p>
                          </div>
                        </div>

                        <div className="text-right flex items-center gap-3">
                          <div>
                            <span className="block text-sm font-bold text-[#F5F5F7]">
                              Rs. {(product.salePrice || product.price).toLocaleString()}
                            </span>
                            <span className="text-[10px] text-emerald-400">
                              {product.stockQuantity > 0 ? 'In Stock' : 'Pre-Order'}
                            </span>
                          </div>
                          <ArrowRight className="w-4 h-4 text-[#8E929E] group-hover:text-[#D4AF37] group-hover:translate-x-1 transition-all" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center space-y-3">
                    <Watch className="w-10 h-10 text-[#3A3E48] mx-auto" />
                    <h4 className="text-base font-semibold text-[#F5F5F7]">No timepieces match &ldquo;{searchTerm}&rdquo;</h4>
                    <p className="text-xs text-[#8E929E] max-w-sm mx-auto">
                      Try searching for broader horological terms like &ldquo;Automatic&rdquo;, &ldquo;Titanium&rdquo;, or browse our complete showroom collection.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        closeSearch();
                        navigate('shop');
                      }}
                      className="mt-2 py-2 px-4 rounded-lg bg-[#181A1F] hover:bg-[#22252C] text-[#D4AF37] text-xs uppercase tracking-wider font-semibold border border-[#D4AF37]/30 transition-colors"
                    >
                      Browse Complete Showroom
                    </button>
                  </div>
                )
              ) : (
                <div className="py-8 text-center space-y-4">
                  <p className="text-xs uppercase tracking-widest text-[#8E929E]">
                    Explore STORIUM Showroom
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto">
                    <button
                      type="button"
                      onClick={() => {
                        closeSearch();
                        navigate('watches');
                      }}
                      className="p-4 rounded-xl bg-[#181A1F] hover:bg-[#20232A] border border-[#262930] hover:border-[#D4AF37]/30 text-left transition-all group"
                    >
                      <span className="text-xs uppercase tracking-wider text-[#D4AF37] font-semibold block mb-1">
                        Timepieces Collection
                      </span>
                      <span className="text-xs text-[#8E929E]">
                        Automatic, Chronographs, and Titanium Skeleton watches
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        closeSearch();
                        navigate('accessories');
                      }}
                      className="p-4 rounded-xl bg-[#181A1F] hover:bg-[#20232A] border border-[#262930] hover:border-[#D4AF37]/30 text-left transition-all group"
                    >
                      <span className="text-xs uppercase tracking-wider text-[#D4AF37] font-semibold block mb-1">
                        Men&apos;s Accoutrements
                      </span>
                      <span className="text-xs text-[#8E929E]">
                        Titanium cardholders, meteorite cufflinks, and EDC gear
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
