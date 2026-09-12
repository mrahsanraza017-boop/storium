import React from 'react';
import { ProductMedia } from '../../types';

interface ProductMediaFrameProps {
  media: ProductMedia;
  className?: string;
  priority?: boolean;
}

const UNSLASH_HOST = 'images.unsplash.com';
const SRC_SET_WIDTHS = [360, 540, 720, 960];

// Build a responsive srcset/sizes pair for supported (Unsplash) remote images.
const buildResponsiveAttrs = (url: string) => {
  if (!url.includes(UNSLASH_HOST) || !url.includes('w=')) return {};

  const candidates = SRC_SET_WIDTHS.map((w) => ({
    url: url.replace(/w=\d+/, `w=${w}`),
    w,
  }));

  const srcset = [...candidates, { url, w: 1200 }].map(({ url: u, w }) => `${u} ${w}w`).join(', ');
  return {
    src: url,
    srcSet: srcset,
    sizes: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw',
  };
};

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
      {...buildResponsiveAttrs(media.url)}
      alt={media.name || 'Product media'}
      width="600"
      height="600"
      className={className}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
    />
  );
};
