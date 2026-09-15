import React from 'react';
import { Truck, RefreshCcw, LockKeyhole, FileText } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { SEOHead } from '../components/seo/SEOHead';
import { getBreadcrumbSchema } from '../lib/seoSchemas';
import { parsePolicyTextToSections, interpolatePolicyTokens } from '../lib/policyText';

interface PolicyDocumentProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  lastUpdated: string;
  rawContent: string;
  canonicalPath: string;
  seoTitle: string;
  seoDescription: string;
  keywords: string;
}

const PolicyDocument: React.FC<PolicyDocumentProps> = ({
  eyebrow,
  title,
  subtitle,
  icon,
  lastUpdated,
  rawContent,
  canonicalPath,
  seoTitle,
  seoDescription,
  keywords,
}) => {
  const { businessSettings } = useStore();

  const tokens = {
    businessName: businessSettings.businessName,
    email: businessSettings.email,
    phone: businessSettings.phone,
    address: `${businessSettings.address}, ${businessSettings.city}, ${businessSettings.province}, ${businessSettings.country}`,
    workingHours: businessSettings.workingHours,
    country: businessSettings.country,
    paymentGatewayName: businessSettings.paymentGatewayName,
    shippingFreeAbove: businessSettings.shippingFreeAbove.toLocaleString(),
  };

  const sections = parsePolicyTextToSections(interpolatePolicyTokens(rawContent, tokens));

  const breadcrumbs = [{ name: 'Showroom', url: '/' }, { name: title, url: canonicalPath }];

  return (
    <div className="w-full bg-transparent min-h-screen text-[#E8E8EC] py-16">
      <SEOHead
        title={seoTitle}
        description={seoDescription}
        keywords={keywords}
        canonicalPath={canonicalPath}
        schemas={[getBreadcrumbSchema(breadcrumbs)]}
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="space-y-2">
          <span className="text-xs uppercase tracking-[0.25em] text-[#D4AF37] font-semibold flex items-center gap-2">
            {icon}
            {eyebrow}
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold font-serif-luxury text-[#F5F5F7]">{title}</h1>
          <p className="text-xs text-[#8E929E]">
            {subtitle} &bull; {businessSettings.businessName}, {businessSettings.country}
          </p>
          <p className="text-[11px] text-[#626673]">Last updated: {lastUpdated}</p>
        </div>

        <div className="space-y-8 text-sm text-[#9Ea2AF] leading-relaxed">
          {sections.length === 0 && (
            <p className="p-6 rounded-2xl bg-[#121316] border border-[#262930] text-[#CBD0DC]">
              This policy is being prepared. Please check back shortly, or contact us at {businessSettings.email}.
            </p>
          )}
          {sections.map((section, index) => (
            <section key={index} className="p-6 rounded-2xl bg-[#121316] border border-[#262930] space-y-3">
              {section.heading ? (
                <h2 className="text-base font-bold text-[#F5F5F7]">{section.heading}</h2>
              ) : (
                <h2 className="text-base font-bold text-[#F5F5F7]">General</h2>
              )}
              {section.paragraphs.map((paragraph, pIndex) => (
                <p key={pIndex}>{paragraph}</p>
              ))}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
};

export const ShippingPolicyView: React.FC = () => {
  const { businessSettings } = useStore();
  return (
    <PolicyDocument
      eyebrow="Showroom Logistics"
      title="Shipping Policy"
      subtitle="Nationwide Pakistan delivery"
      icon={<Truck className="w-4 h-4" />}
      lastUpdated="January 2026"
      canonicalPath="/shipping-policy"
      rawContent={businessSettings.policies.shipping}
      seoTitle="Shipping Policy & Nationwide Delivery | STORIUM Pakistan"
      seoDescription="Learn about STORIUM's shipping process, delivery timelines, charges and Cash on Delivery across Pakistan."
      keywords="shipping policy, delivery pakistan, cash on delivery"
    />
  );
};

export const ReturnPolicyView: React.FC = () => {
  const { businessSettings } = useStore();
  return (
    <PolicyDocument
      eyebrow="Patron Assurance"
      title="Refund Policy"
      subtitle="Returns, exchanges and refunds"
      icon={<RefreshCcw className="w-4 h-4" />}
      lastUpdated="January 2026"
      canonicalPath="/return-policy"
      rawContent={businessSettings.policies.refund}
      seoTitle="Refund & Return Policy | STORIUM Pakistan"
      seoDescription="STORIUM's refund and return policy — how to return eligible items and how refunds are processed."
      keywords="refund policy, return policy, exchange"
    />
  );
};

export const PrivacyPolicyView: React.FC = () => {
  const { businessSettings } = useStore();
  return (
    <PolicyDocument
      eyebrow="Your Privacy"
      title="Privacy Policy"
      subtitle="How we collect, use and protect your information"
      icon={<LockKeyhole className="w-4 h-4" />}
      lastUpdated="January 2026"
      canonicalPath="/privacy-policy"
      rawContent={businessSettings.policies.privacy}
      seoTitle="Privacy Policy | STORIUM Pakistan"
      seoDescription="Read how STORIUM collects, uses and protects your personal information on our online store."
      keywords="privacy policy, data protection"
    />
  );
};

export const TermsView: React.FC = () => {
  const { businessSettings } = useStore();
  return (
    <PolicyDocument
      eyebrow="Legal & Terms"
      title="Terms & Conditions"
      subtitle="The terms that govern your use of our store"
      icon={<FileText className="w-4 h-4" />}
      lastUpdated="January 2026"
      canonicalPath="/terms"
      rawContent={businessSettings.policies.terms}
      seoTitle="Terms & Conditions | STORIUM Pakistan"
      seoDescription="The terms and conditions that apply when you browse the store and place an order with STORIUM."
      keywords="terms and conditions, terms of service"
    />
  );
};