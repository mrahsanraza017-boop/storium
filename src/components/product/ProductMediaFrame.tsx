import React from 'react';
import { ProductMedia } from '../../types';

interface ProductMediaFrameProps {
    media: ProductMedia;
    className?: string;
}

export const ProductMediaFrame: React.FC<ProductMediaFrameProps> = ({ media, className = '' }) => {
    if (media.type === 'video') {
        return (
            <video
                src={media.url}
                className={`${className}`}
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
            />
        );
    }

    return <img src={media.url} alt={media.name || 'Product media'} className={className} loading="eager" />;
};
