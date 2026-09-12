import React from 'react';
import { ProductMedia } from '../../types';

interface ProductMediaFrameProps {
  media: ProductMedia;
  className?: string;
  priority?: boolean;
}

export const ProductMediaFrame: React.FC<ProductMediaFrameProps> = ({
  media,
  className = '',
  priority = false,
}) => {
  if (media.type === 'video') {
    return (
      <video
        src={media.url}
        className={className}
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
      />
    );
  }

  return (
    <img
      src={media.url}
      alt={media.name || 'Product media'}
      className={className}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
    />
  );
};
