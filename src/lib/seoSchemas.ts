import { Product, ProductReview } from '../types';

export const BASE_SITE_URL = typeof window !== 'undefined' && window.location.origin
  ? window.location.origin
  : 'https://storium.pk';

export const DEFAULT_OG_IMAGE = `${BASE_SITE_URL}/storium_manifesto_craftsmanship_1788637925678.jpg`;

/**
 * Generate Store / Organization / LocalBusiness Schema for STORIUM
 */
export function getStoreOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': ['Store', 'JewelryStore', 'ClothingStore'],
    '@id': `${BASE_SITE_URL}/#organization`,
    name: 'STORIUM',
    alternateName: 'STORIUM Luxury Watches & Accessories',
    url: BASE_SITE_URL,
    logo: `${BASE_SITE_URL}/emblem.png`,
    image: [
      `${BASE_SITE_URL}/emblem.png`,
      DEFAULT_OG_IMAGE,
    ],
    description:
      'STORIUM is Pakistan’s premier futuristic luxury watch showroom and accessory atelier, specializing in precision Japanese and Swiss horology, aerospace titanium, 316L steel, and sapphire crystal timepieces.',
    priceRange: 'PKR 15,000 - PKR 75,000',
    currenciesAccepted: 'PKR',
    paymentAccepted: 'Cash on Delivery, Visa, MasterCard, UnionPay, Debit Card',
    areaServed: {
      '@type': 'Country',
      name: 'Pakistan',
    },
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'PK',
      addressLocality: 'Islamabad',
      addressRegion: 'Federal Capital',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+92-300-STORIUM',
      contactType: 'customer service',
      areaServed: 'PK',
      availableLanguage: ['en', 'ur'],
    },
    knowsAbout: [
      'Luxury Watches',
      'Chronograph Watches',
      'Automatic Mechanical Timepieces',
      'Titanium Everyday Carry Accessories',
      'Horology in Pakistan',
    ],
  };
}

/**
 * Generate WebSite Schema with Sitelinks Searchbox
 */
export function getWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${BASE_SITE_URL}/#website`,
    url: BASE_SITE_URL,
    name: 'STORIUM — Luxury Watches & Accessories Pakistan',
    description: 'Wear Your Presence. Precision mechanical timepieces and luxury titanium accessories in Pakistan.',
    publisher: {
      '@id': `${BASE_SITE_URL}/#organization`,
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${BASE_SITE_URL}/shop?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
    inLanguage: 'en-US',
  };
}

/**
 * Generate BreadcrumbList Schema
 */
export function getBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${BASE_SITE_URL}${item.url.startsWith('/') ? '' : '/'}${item.url}`,
    })),
  };
}

/**
 * Generate Schema.org Product Schema with aggregate rating, offers, reviews, and specs
 */
export function getProductSchema(
  product: Product,
  reviews?: ProductReview[],
  ratingSummary?: { average: number; count: number }
) {
  const effectivePrice = product.salePrice ?? product.price;
  const productUrl = `${BASE_SITE_URL}/product/${product.slug}`;
  const images = (product.productImages && product.productImages.length > 0)
    ? product.productImages
    : [product.thumbnail || DEFAULT_OG_IMAGE];

  const schema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${productUrl}#product`,
    name: product.name,
    image: images,
    description: product.description || product.shortDescription,
    sku: product.sku,
    mpn: product.sku,
    brand: {
      '@type': 'Brand',
      name: product.brand || 'STORIUM',
    },
    category: product.categoryName || (product.category === 'watches' ? 'Watches' : "Men's Accessories"),
    itemCondition: 'https://schema.org/NewCondition',
    offers: {
      '@type': 'Offer',
      url: productUrl,
      priceCurrency: 'PKR',
      price: effectivePrice,
      priceValidUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      itemCondition: 'https://schema.org/NewCondition',
      availability:
        product.stockQuantity > 0 || product.availability === 'in_stock'
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'STORIUM',
      },
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: {
          '@type': 'MonetaryAmount',
          value: effectivePrice >= 15000 ? '0' : '500',
          currency: 'PKR',
        },
        shippingDestination: {
          '@type': 'DefinedRegion',
          addressCountry: 'PK',
        },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          handlingTime: {
            '@type': 'QuantitativeValue',
            minValue: 0,
            maxValue: 1,
            unitCode: 'DAY',
          },
          transitTime: {
            '@type': 'QuantitativeValue',
            minValue: 2,
            maxValue: 4,
            unitCode: 'DAY',
          },
        },
      },
      hasMerchantReturnPolicy: {
        '@type': 'MerchantReturnPolicy',
        applicableCountry: 'PK',
        returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
        merchantReturnDays: 7,
        returnMethod: 'https://schema.org/ReturnByMail',
        returnFees: 'https://schema.org/FreeReturn',
      },
    },
  };

  if (ratingSummary && ratingSummary.count > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: ratingSummary.average.toFixed(1),
      reviewCount: ratingSummary.count,
      bestRating: '5',
      worstRating: '1',
    };
  }

  if (reviews && reviews.length > 0) {
    const approvedReviews = reviews.filter((r) => r.status === 'approved' || r.status === undefined);
    if (approvedReviews.length > 0) {
      schema.review = approvedReviews.slice(0, 5).map((rev) => ({
        '@type': 'Review',
        author: {
          '@type': 'Person',
          name: rev.reviewerName || 'STORIUM Patron',
        },
        datePublished: rev.createdAt.split('T')[0],
        reviewBody: rev.body,
        name: rev.title,
        reviewRating: {
          '@type': 'Rating',
          ratingValue: rev.rating,
          bestRating: '5',
          worstRating: '1',
        },
      }));
    }
  }

  return schema;
}

/**
 * Generate ItemList Schema for catalog / collection views
 */
export function getItemListSchema(
  title: string,
  description: string,
  products: Product[],
  listUrl: string
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: title,
    description: description,
    url: listUrl.startsWith('http') ? listUrl : `${BASE_SITE_URL}${listUrl.startsWith('/') ? '' : '/'}${listUrl}`,
    numberOfItems: products.length,
    itemListElement: products.map((prod, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: prod.name,
      url: `${BASE_SITE_URL}/product/${prod.slug}`,
      image: prod.thumbnail || (prod.productImages && prod.productImages[0]),
    })),
  };
}

/**
 * Generate FAQPage Schema
 */
export function getFAQPageSchema(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}
