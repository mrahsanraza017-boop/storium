import React, { useEffect } from 'react';
import { BASE_SITE_URL, DEFAULT_OG_IMAGE } from '../../lib/seoSchemas';

export interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonicalPath?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'product';
  priceAmount?: number | string;
  priceCurrency?: string;
  availability?: string;
  noindex?: boolean;
  schemas?: Record<string, any> | Record<string, any>[];
}

const DEFAULT_TITLE = 'STORIUM — Wear Your Presence | Luxury Watches & Accessories Pakistan';
const DEFAULT_DESCRIPTION =
  'STORIUM is Pakistan’s futuristic luxury watch showroom and accessory atelier. Discover precision Japanese & Swiss mechanical movements, titanium cardholders, and aerospace-crafted essentials with nationwide express delivery and COD.';
const DEFAULT_KEYWORDS =
  'luxury watches pakistan, storium watches, buy watches online pakistan, automatic watches karachi, chronograph watches lahore, titanium accessories, luxury watch showroom islamabad, cash on delivery watches';

export const SEOHead: React.FC<SEOHeadProps> = ({
  title,
  description,
  keywords,
  canonicalPath,
  ogImage,
  ogType = 'website',
  priceAmount,
  priceCurrency = 'PKR',
  availability,
  noindex = false,
  schemas,
}) => {
  useEffect(() => {
    // 1. Update Document Title
    const fullTitle = title
      ? (title.includes('STORIUM') ? title : `${title} | STORIUM`)
      : DEFAULT_TITLE;
    document.title = fullTitle;

    // Helper to get or create meta tag
    const setMetaTag = (attrName: string, attrVal: string, contentVal: string) => {
      let meta = document.querySelector(`meta[${attrName}="${attrVal}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attrName, attrVal);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', contentVal);
    };

    // Helper to get or create link tag
    const setLinkTag = (relVal: string, hrefVal: string) => {
      let link = document.querySelector(`link[rel="${relVal}"]`);
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', relVal);
        document.head.appendChild(link);
      }
      link.setAttribute('href', hrefVal);
    };

    const finalDescription = description || DEFAULT_DESCRIPTION;
    const finalKeywords = keywords || DEFAULT_KEYWORDS;
    const finalOgImage = ogImage
      ? (ogImage.startsWith('http') ? ogImage : `${BASE_SITE_URL}${ogImage.startsWith('/') ? '' : '/'}${ogImage}`)
      : DEFAULT_OG_IMAGE;

    const currentPath = canonicalPath !== undefined
      ? (canonicalPath.startsWith('http') ? canonicalPath : `${BASE_SITE_URL}${canonicalPath.startsWith('/') ? '' : '/'}${canonicalPath}`)
      : `${BASE_SITE_URL}${window.location.pathname}`;

    // Standard SEO Meta Tags
    setMetaTag('name', 'description', finalDescription);
    setMetaTag('name', 'keywords', finalKeywords);
    setMetaTag('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
    setMetaTag('name', 'googlebot', noindex ? 'noindex, nofollow' : 'index, follow');

    // Canonical Tag
    setLinkTag('canonical', currentPath);

    // OpenGraph Tags
    setMetaTag('property', 'og:title', fullTitle);
    setMetaTag('property', 'og:description', finalDescription);
    setMetaTag('property', 'og:image', finalOgImage);
    setMetaTag('property', 'og:url', currentPath);
    setMetaTag('property', 'og:type', ogType);
    setMetaTag('property', 'og:site_name', 'STORIUM');
    setMetaTag('property', 'og:locale', 'en_US');

    if (ogType === 'product' && priceAmount) {
      setMetaTag('property', 'product:price:amount', String(priceAmount));
      setMetaTag('property', 'product:price:currency', priceCurrency);
      if (availability) {
        setMetaTag('property', 'product:availability', availability);
      }
    }

    // Twitter Card Tags
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', fullTitle);
    setMetaTag('name', 'twitter:description', finalDescription);
    setMetaTag('name', 'twitter:image', finalOgImage);
    setMetaTag('name', 'twitter:site', '@storium_pk');

    // Manage JSON-LD Schema Scripts
    const SCRIPT_ID = 'storium-seo-schema-jsonld';
    let scriptTag = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = SCRIPT_ID;
      scriptTag.type = 'application/ld+json';
      document.head.appendChild(scriptTag);
    }

    if (schemas) {
      const schemaData = Array.isArray(schemas)
        ? {
            '@context': 'https://schema.org',
            '@graph': schemas,
          }
        : schemas;
      scriptTag.textContent = JSON.stringify(schemaData, null, 2);
    } else {
      scriptTag.textContent = '';
    }
  }, [
    title,
    description,
    keywords,
    canonicalPath,
    ogImage,
    ogType,
    priceAmount,
    priceCurrency,
    availability,
    noindex,
    schemas,
  ]);

  return null;
};
