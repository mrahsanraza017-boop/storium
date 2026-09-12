import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Product } from '../../types';
import { ProductCard } from './ProductCard';

interface ProductGridProps {
  products: Product[];
  emptyMessage?: string;
  columns?: '2' | '3' | '4';
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  emptyMessage = 'No timepieces found in this selection.',
  columns = '4',
}) => {
  const prefersReducedMotion = useReducedMotion();

  if (products.length === 0) {
    return (
      <div className="py-16 text-center border border-dashed border-[#262930] rounded-2xl bg-[#121316]/50">
        <p className="text-[#8E929E] text-sm tracking-wide">{emptyMessage}</p>
      </div>
    );
  }

  const colClasses = {
    '2': 'grid-cols-1 sm:grid-cols-2',
    '3': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    '4': 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
  }[columns];

  return (
    <div className={`grid ${colClasses} gap-5 sm:gap-6 lg:gap-7`} data-product-grid>
      {products.map((product, index) => (
        <motion.div
          key={product.id}
          className="h-full"
          initial={prefersReducedMotion ? false : { opacity: 0, y: 18 }}
          whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.12 }}
          transition={{ duration: 0.55, delay: Math.min(index * 0.06, 0.3), ease: [0.22, 1, 0.36, 1] }}
        >
          <ProductCard product={product} />
        </motion.div>
      ))}
    </div>
  );
};
