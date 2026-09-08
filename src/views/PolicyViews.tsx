import React from 'react';
import { Truck, ShieldCheck, RefreshCcw, Check, Clock } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { SEOHead } from '../components/seo/SEOHead';
import { getBreadcrumbSchema, getFAQPageSchema } from '../lib/seoSchemas';

export const ShippingPolicyView: React.FC = () => {
  const { navigate } = useStore();

  const breadcrumbs = [
    { name: 'Showroom', url: '/' },
    { name: 'Shipping Policy', url: '/shipping-policy' },
  ];

  const shippingFaqs = [
    {
      question: 'How fast is delivery across Pakistan?',
      answer:
        'Deliveries to Lahore, Karachi, Islamabad, and Rawalpindi arrive in 1 to 2 business days via Express Air Courier. Faisalabad, Multan, and Peshawar take 2 to 3 days.',
    },
    {
      question: 'Is Cash on Delivery available for all orders?',
      answer:
        'Yes, Cash on Delivery (COD) is available nationwide across Pakistan with complimentary shipping on orders exceeding Rs. 15,000.',
    },
    {
      question: 'Are shipments insured during transit?',
      answer:
        'Every STORIUM parcel is 100% insured against loss, damage, or theft during transit, backed by instant replacement guarantee.',
    },
  ];

  const schemas = [getBreadcrumbSchema(breadcrumbs), getFAQPageSchema(shippingFaqs)];

  return (
    <div className="w-full bg-transparent min-h-screen text-[#E8E8EC] py-16">
      <SEOHead
        title="Nationwide Pakistan Shipping Policy & Delivery Timelines | STORIUM"
        description="Learn about STORIUM's express delivery timelines across Pakistan (1-2 days for major cities), Cash on Delivery options, and 100% transit insurance."
        keywords="storium shipping policy, watch delivery pakistan, cod watch delivery karachi lahore"
        canonicalPath="/shipping-policy"
        schemas={schemas}
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="space-y-2">
          <span className="text-xs uppercase tracking-[0.25em] text-[#D4AF37] font-semibold">
            Showroom Logistics
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold font-serif-luxury text-[#F5F5F7]">
            Nationwide Pakistan Shipping Policy
          </h1>
          <p className="text-xs text-[#8E929E]">Effective Date: January 2026 &bull; STORIUM Pakistan</p>
        </div>

        <div className="space-y-8 text-sm text-[#9Ea2AF] leading-relaxed">
          <section className="p-6 rounded-2xl bg-[#121316] border border-[#262930] space-y-3">
            <h2 className="text-base font-bold text-[#F5F5F7] flex items-center gap-2">
              <Truck className="w-4 h-4 text-[#D4AF37]" />
              <span>1. Order Processing &amp; Dispatch</span>
            </h2>
            <p>
              All orders confirmed before 4:00 PM PKT are prepared, inspected, serialized, and handed over to our express courier partners within 24 hours. Each timepiece undergoes a strict 12-point quality check (movement timing, case finishing, and screw alignment) prior to dispatch.
            </p>
          </section>

          <section className="p-6 rounded-2xl bg-[#121316] border border-[#262930] space-y-3">
            <h2 className="text-base font-bold text-[#F5F5F7] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#D4AF37]" />
              <span>2. Delivery Timelines by City</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
              <div className="p-3 rounded-xl bg-[#0B0C0E] border border-[#262930]">
                <strong className="text-[#F5F5F7] block mb-1">Lahore, Karachi, Islamabad, Rawalpindi</strong>
                <span>1 - 2 Business Days via Express Air Courier</span>
              </div>
              <div className="p-3 rounded-xl bg-[#0B0C0E] border border-[#262930]">
                <strong className="text-[#F5F5F7] block mb-1">Faisalabad, Multan, Peshawar, Sialkot, Gujranwala</strong>
                <span>2 - 3 Business Days</span>
              </div>
              <div className="p-3 rounded-xl bg-[#0B0C0E] border border-[#262930]">
                <strong className="text-[#F5F5F7] block mb-1">Hyderabad, Quetta, Abbottabad, Sukkur, Bahawalpur</strong>
                <span>3 - 4 Business Days</span>
              </div>
              <div className="p-3 rounded-xl bg-[#0B0C0E] border border-[#262930]">
                <strong className="text-[#F5F5F7] block mb-1">All Other Towns &amp; Rural Tehsils</strong>
                <span>3 - 5 Business Days</span>
              </div>
            </div>
          </section>

          <section className="p-6 rounded-2xl bg-[#121316] border border-[#262930] space-y-3">
            <h2 className="text-base font-bold text-[#F5F5F7]">
              3. Cash on Delivery (COD) Rules
            </h2>
            <p>
              Cash on Delivery is available for all destinations across Pakistan. Upon arrival, the customer inspects the outer tamper-evident courier bag before completing payment to the courier rider. Orders over Rs. 15,000 include complimentary courier charges nationwide.
            </p>
          </section>

          <section className="p-6 rounded-2xl bg-[#121316] border border-[#262930] space-y-3">
            <h2 className="text-base font-bold text-[#F5F5F7]">
              4. Full Transit Insurance
            </h2>
            <p>
              Every STORIUM shipment is 100% insured against transit theft, loss, or accidental parcel damage. If your shipment is compromised during transit, our concierge will issue an immediate replacement unit without dispute.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export const ReturnPolicyView: React.FC = () => {
  const breadcrumbs = [
    { name: 'Showroom', url: '/' },
    { name: '7-Day Return Policy', url: '/return-policy' },
  ];

  const returnFaqs = [
    {
      question: 'Can I return or exchange my watch if I change my mind?',
      answer:
        'Yes, STORIUM provides a 7-day hassle-free inspection window from the date of delivery for unworn timepieces in their original packaging.',
    },
    {
      question: 'How are refunds paid?',
      answer:
        'Approved returns are refunded within 48 hours via direct Pakistani inter-bank transfer (IBFT) or Raast.',
    },
  ];

  const schemas = [getBreadcrumbSchema(breadcrumbs), getFAQPageSchema(returnFaqs)];

  return (
    <div className="w-full bg-transparent min-h-screen text-[#E8E8EC] py-16">
      <SEOHead
        title="7-Day Inspection Guarantee & Return Policy | STORIUM Pakistan"
        description="Experience zero-risk luxury shopping with STORIUM's 7-day inspection and exchange policy with 48-hour direct bank refunds."
        keywords="storium return policy, watch exchange pakistan, 7 day inspection guarantee"
        canonicalPath="/return-policy"
        schemas={schemas}
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="space-y-2">
          <span className="text-xs uppercase tracking-[0.25em] text-[#D4AF37] font-semibold">
            Patron Assurance
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold font-serif-luxury text-[#F5F5F7]">
            7-Day Inspection &amp; Refund Policy
          </h1>
          <p className="text-xs text-[#8E929E]">Zero-Risk Luxury Purchase &bull; STORIUM Pakistan</p>
        </div>

        <div className="space-y-8 text-sm text-[#9Ea2AF] leading-relaxed">
          <section className="p-6 rounded-2xl bg-[#121316] border border-[#262930] space-y-3">
            <h2 className="text-base font-bold text-[#F5F5F7] flex items-center gap-2">
              <RefreshCcw className="w-4 h-4 text-[#D4AF37]" />
              <span>1. The 7-Day Inspection Guarantee</span>
            </h2>
            <p>
              We want you to appreciate your timepiece in natural light. If for any reason the dimensions, weight, or aesthetic finish do not completely satisfy you, you may initiate an exchange or return within seven (7) calendar days of delivery.
            </p>
          </section>

          <section className="p-6 rounded-2xl bg-[#121316] border border-[#262930] space-y-3">
            <h2 className="text-base font-bold text-[#F5F5F7]">
              2. Return Condition Requirements
            </h2>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#D4AF37] flex-shrink-0" />
                <span>The timepiece must be in unworn condition with all protective sapphire films intact.</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#D4AF37] flex-shrink-0" />
                <span>Original luxury box, serialized warranty card, and sizing tool must accompany the return.</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#D4AF37] flex-shrink-0" />
                <span>Straps or bracelets must not have been resized or scratched.</span>
              </li>
            </ul>
          </section>

          <section className="p-6 rounded-2xl bg-[#121316] border border-[#262930] space-y-3">
            <h2 className="text-base font-bold text-[#F5F5F7]">
              3. Refund Processing
            </h2>
            <p>
              Once our horologists inspect and approve the returned piece at our central showroom, refunds are disbursed within 48 hours via direct Pakistani bank transfer (IBFT) or Raast.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export const TermsView: React.FC = () => {
  const breadcrumbs = [
    { name: 'Showroom', url: '/' },
    { name: 'Terms & Warranty', url: '/terms' },
  ];

  const schemas = [getBreadcrumbSchema(breadcrumbs)];

  return (
    <div className="w-full bg-transparent min-h-screen text-[#E8E8EC] py-16">
      <SEOHead
        title="Terms of Service & 2-Year International Warranty | STORIUM Pakistan"
        description="Official terms of service, warranty provisions, movement guarantee, and authentication protocols for Maison STORIUM Pakistan."
        keywords="storium warranty terms, 2 year watch warranty pakistan, storium terms of service"
        canonicalPath="/terms"
        schemas={schemas}
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="space-y-2">
          <span className="text-xs uppercase tracking-[0.25em] text-[#D4AF37] font-semibold">
            Legal &amp; Warranty
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold font-serif-luxury text-[#F5F5F7]">
            Terms of Service &amp; 2-Year Warranty
          </h1>
          <p className="text-xs text-[#8E929E]">Maison STORIUM &bull; Registered in Pakistan</p>
        </div>

        <div className="space-y-8 text-sm text-[#9Ea2AF] leading-relaxed">
          <section className="p-6 rounded-2xl bg-[#121316] border border-[#262930] space-y-3">
            <h2 className="text-base font-bold text-[#F5F5F7] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
              <span>1. 2-Year International Movement Guarantee</span>
            </h2>
            <p>
              Every STORIUM timepiece carries a comprehensive 24-month warranty against internal mechanical movement defects. If your watch loses or gains excessive time or experiences escapement faults, STORIUM will service or replace the movement free of charge.
            </p>
          </section>

          <section className="p-6 rounded-2xl bg-[#121316] border border-[#262930] space-y-3">
            <h2 className="text-base font-bold text-[#F5F5F7]">
              2. Exclusions
            </h2>
            <p className="text-xs">
              The warranty does not cover normal cosmetic wear-and-tear (surface scratches from everyday wear), damage resulting from water intrusion due to an unthreaded crown, or unauthorized repairs performed outside the STORIUM horology workshop.
            </p>
          </section>

          <section className="p-6 rounded-2xl bg-[#121316] border border-[#262930] space-y-3">
            <h2 className="text-base font-bold text-[#F5F5F7]">
              3. Serialized Authenticity
            </h2>
            <p>
              STORIUM is an independent luxury watch brand. Each timepiece is laser-etched with a unique caseback serial number that matches its embossed physical Certificate of Authenticity.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
