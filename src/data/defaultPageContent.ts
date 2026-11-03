import { PagesContentConfig } from '../types';

export const DEFAULT_PAGES_CONTENT: PagesContentConfig = {
  home: {
    hero: {
      badge: "Pakistan's Futuristic Luxury Showroom",
      heading: 'Wear your presence.',
      description: "PAKISTAN'S FUTURISTIC LUXURY",
      primaryCtaText: 'Explore Timepieces',
      primaryCtaTarget: 'watches',
      secondaryCtaText: 'Showroom Catalog',
      secondaryCtaTarget: 'shop',
      bgImage: '',
    },
    featuredShowcase: {
      eyebrow: 'Flagship Horology',
      heading: 'Curated Showroom Timepieces',
      viewAllText: 'View All',
    },
    productSpotlight: {
      eyebrow: 'Showroom Spotlight',
      title: 'Obsidian Stealth Chrono 42mm',
      description:
        'A masterwork of horological minimalism. Crafted from aerospace-grade 316L stainless steel with a matte DLC coating, scratch-resistant double-domed sapphire crystal, and an ultra-precise mecha-quartz movement.',
      image: '',
      priceLabel: 'Accessible Luxury Price',
      ctaText: 'Inspect Timepiece',
    },
    philosophy: {
      eyebrow: 'The Philosophy of Presence',
      quote: '“Products you wear and carry should reflect your personality.”',
      description:
        'In an era of fleeting fast-fashion and generic digital displays, the mechanical timepiece remains a defiant statement of discipline, composure, and individuality. A STORIUM watch is not merely a tool to measure hours; it is a signature of who you are.',
    },
    trustBadges: {
      badge1: {
        title: 'Pakistan Nationwide Courier',
        description:
          'We partner with premier express logistics to deliver insured parcels to Karachi, Lahore, Islamabad, Rawalpindi, Peshawar, Quetta, and every corner of Pakistan within 2 to 4 working days.',
        icon: 'Truck',
      },
      badge2: {
        title: 'Cash on Delivery & Debit Cards',
        description:
          'Pay with complete peace of mind using Cash on Delivery (COD) upon inspection at your door, or complete instant checkout via Visa & Mastercard debit cards.',
        icon: 'Shield',
      },
      badge3: {
        title: 'STORIUM Certificate of Authenticity',
        description:
          'Every timepiece is individually serialized with its laser-engraved caseback SKU and accompanied by our embossed Certificate of Authenticity and 1-Year International Warranty card.',
        icon: 'Award',
      },
    },
    conversionCta: {
      eyebrow: 'Step into the Showroom',
      heading: 'Your wrist speaks before you do.',
      description:
        'Discover timepieces built to transcend trends. Explore our full collection with complimentary insured delivery across Pakistan.',
      logoUrl: '/logo.png',
      primaryCtaText: 'Explore All Products',
      primaryCtaTarget: 'shop',
      secondaryCtaText: 'Speak with Concierge',
      secondaryCtaTarget: 'contact',
    },
    customSections: [],
  },

  about: {
    header: {
      badge: 'Maison STORIUM',
      heading: 'Wear Your Presence.',
      subtitle:
        "The story behind Pakistan's pioneering online luxury showroom for futuristic timepieces and curated men's accoutrements.",
      logoUrl: '/logo.png',
    },
    heroVisual: {
      imageUrl: '/assets/exhibition-bench.webp',
      altText: 'STORIUM Horology Craftsmanship & Atelier',
    },
    philosophy: {
      heading: 'The Philosophy of Self-Definition',
      content: `At STORIUM, we reject the notion that luxury must be synonymous with exorbitant markups or antiquated heritage houses. We believe that what you wear and carry is not a passive accessory—it is an external proclamation of your presence, self-discipline, and vision.

Founded in Pakistan, STORIUM is built to offer men who demand excellence an accessible gateway into haute horologie. Every timepiece in our catalog is rigorously engineered using materials previously reserved for aerospace and surgical applications: 316L stainless steel, Grade 5 titanium, anti-reflective double-domed sapphire crystals, and precision mechanical escapements.`,
    },
    customSections: [],
  },

  contact: {
    header: {
      badge: 'Client Concierge',
      heading: 'Speak with Horological Concierge',
      subtitle:
        'Our horology specialists are available to answer your technical questions, guide your timepiece selection, or assist with order tracking.',
    },
    details: {
      title: 'STORIUM Atelier & Concierge Desk',
      description:
        'Connect with our dedicated advisors for personalized guidance, bespoke horology inquiries, and corporate gift commissions.',
    },
    customSections: [],
  },

  watches: {
    eyebrow: 'Precision Engineering',
    heading: 'Curated Timepieces',
    subtitle:
      'Explore precision Japanese & Swiss horology, aerospace titanium, 316L steel, and sapphire crystal timepieces with nationwide COD.',
    bannerImage: '',
    customSections: [],
  },

  accessories: {
    eyebrow: 'Atelier Accoutrements',
    heading: 'Men’s Luxury Accessories',
    subtitle:
      'Curated everyday carry essentials, titanium bracelets, leather goods, and minimalist accessories forged for discerning gentlemen.',
    bannerImage: '',
    customSections: [],
  },

  shop: {
    eyebrow: 'Full Inventory',
    heading: 'Showroom Catalog',
    subtitle:
      'Explore our complete portfolio of horological creations and precision men’s accessories.',
    bannerImage: '',
    customSections: [],
  },

  policies: {
    shippingEyebrow: 'Nationwide Logistics',
    shippingTitle: 'Shipping & Delivery Policy',
    shippingSubtitle: 'Express insured delivery across Pakistan',
    refundEyebrow: 'Client Guarantee',
    refundTitle: 'Returns & Exchange Policy',
    refundSubtitle: 'Inspection guarantee and authentic support',
    privacyEyebrow: 'Security & Integrity',
    privacyTitle: 'Privacy Policy',
    privacySubtitle: 'How we respect and safeguard your personal information',
    termsEyebrow: 'Terms of Service',
    termsTitle: 'Terms & Conditions',
    termsSubtitle: 'Operating guidelines for Maison STORIUM Pakistan',
    customSections: [],
  },
};

