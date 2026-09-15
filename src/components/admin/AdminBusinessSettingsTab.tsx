import React, { useMemo, useState } from 'react';
import { Save, RotateCcw, Upload, X, Info, Building2, Phone } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { uploadProductMedia } from '../../services/supabaseService';

interface SettingsForm {
  businessName: string;
  legalBusinessName: string;
  tagline: string;
  description: string;
  email: string;
  phone: string;
  whatsappLink: string;
  address: string;
  city: string;
  province: string;
  country: string;
  workingHours: string;
  paymentGatewayName: string;
  shippingFreeAbove: number;
  shippingFlatFee: number;
  storefrontImage: string;
  businessModel: string;
  securePaymentCopy: string;
  gatewayNotes: string;
  policiesShipping: string;
  policiesRefund: string;
  policiesPrivacy: string;
  policiesTerms: string;
  socialFacebook: string;
  socialInstagram: string;
  socialTiktok: string;
  socialYoutube: string;
}

export const AdminBusinessSettingsTab: React.FC = () => {
  const { businessSettings, updateBusinessSettings, resetBusinessSettings, addToast } = useStore();

  const [form, setForm] = useState<SettingsForm>(() => ({
    businessName: businessSettings.businessName,
    legalBusinessName: businessSettings.legalBusinessName,
    tagline: businessSettings.tagline,
    description: businessSettings.description,
    email: businessSettings.email,
    phone: businessSettings.phone,
    whatsappLink: businessSettings.whatsappLink,
    address: businessSettings.address,
    city: businessSettings.city,
    province: businessSettings.province,
    country: businessSettings.country,
    workingHours: businessSettings.workingHours,
    paymentGatewayName: businessSettings.paymentGatewayName,
    shippingFreeAbove: businessSettings.shippingFreeAbove,
    shippingFlatFee: businessSettings.shippingFlatFee,
    storefrontImage: businessSettings.storefrontImage,
    businessModel: businessSettings.businessModel,
    securePaymentCopy: businessSettings.securePaymentCopy,
    gatewayNotes: businessSettings.gatewayNotes,
    policiesShipping: businessSettings.policies.shipping,
    policiesRefund: businessSettings.policies.refund,
    policiesPrivacy: businessSettings.policies.privacy,
    policiesTerms: businessSettings.policies.terms,
    socialFacebook: businessSettings.socials.facebook,
    socialInstagram: businessSettings.socials.instagram,
    socialTiktok: businessSettings.socials.tiktok,
    socialYoutube: businessSettings.socials.youtube,
  }));

  const [isUploading, setIsUploading] = useState(false);
  const hasPublicStorefrontImage = useMemo(() => Boolean(form.storefrontImage), [form.storefrontImage]);

  const set = <K extends keyof SettingsForm>(key: K, value: SettingsForm[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = () => {
    updateBusinessSettings({
      businessName: form.businessName.trim() || 'STORIUM',
      legalBusinessName: form.legalBusinessName.trim(),
      tagline: form.tagline.trim(),
      description: form.description.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      whatsappLink: form.whatsappLink.trim() || `https://wa.me/${form.phone.replace(/\D/g, '')}`,
      address: form.address.trim(),
      city: form.city.trim(),
      province: form.province.trim(),
      country: form.country.trim() || 'Pakistan',
      workingHours: form.workingHours.trim(),
      paymentGatewayName: form.paymentGatewayName.trim() || 'Rapid Gateway',
      shippingFreeAbove: Number(form.shippingFreeAbove) || 0,
      shippingFlatFee: Number(form.shippingFlatFee) || 0,
      storefrontImage: form.storefrontImage.trim(),
      businessModel: form.businessModel,
      securePaymentCopy: form.securePaymentCopy,
      gatewayNotes: form.gatewayNotes,
      socials: {
        facebook: form.socialFacebook.trim(),
        instagram: form.socialInstagram.trim(),
        tiktok: form.socialTiktok.trim(),
        youtube: form.socialYoutube.trim(),
      },
      policies: {
        shipping: form.policiesShipping,
        refund: form.policiesRefund,
        privacy: form.policiesPrivacy,
        terms: form.policiesTerms,
      },
    });
  };

  const handleReset = () => {
    if (!confirm('Reset all business settings and policy content to the website defaults?')) return;
    resetBusinessSettings();
    setForm({
      businessName: 'STORIUM',
      legalBusinessName: '',
      tagline: 'Wear your presence',
      description: '',
      email: 'Storium.store@gmail.com',
      phone: '+92 321 5993022',
      whatsappLink: 'https://wa.me/923215993022',
      address: 'ANWAR SHAHID COLONY RENALA',
      city: 'Renala Khurd',
      province: 'Punjab',
      country: 'Pakistan',
      workingHours: 'Monday – Saturday: 10:00 AM – 10:00 PM PKT',
      paymentGatewayName: 'Rapid Gateway',
      shippingFreeAbove: 15000,
      shippingFlatFee: 500,
      storefrontImage: '',
      businessModel: '',
      securePaymentCopy: '',
      gatewayNotes: '',
      policiesShipping: '',
      policiesRefund: '',
      policiesPrivacy: '',
      policiesTerms: '',
      socialFacebook: '',
      socialInstagram: '',
      socialTiktok: '',
      socialYoutube: '',
    });
  };

  const handleStorefrontUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setIsUploading(true);
    try {
      const uploaded = await uploadProductMedia(files, 'business-storefront');
      if (uploaded.length > 0) {
        set('storefrontImage', uploaded[0].url);
        addToast('success', 'Image Uploaded', 'Storefront image staged. Press "Save" to publish it.');
      }
    } catch (err) {
      addToast('error', 'Upload Failed', err instanceof Error ? err.message : 'Could not upload image.');
    } finally {
      setIsUploading(false);
    }
  };

  const inputClass =
    'w-full py-2.5 px-3.5 rounded-xl bg-[#0B0C0E] border border-[#262930] text-[#F5F5F7] placeholder-[#626673] focus:outline-none focus:border-[#D4AF37] text-xs';
  const labelClass = 'block text-[#CBD0DC] uppercase tracking-wider mb-1.5 font-medium';
  const sectionCard = 'p-6 rounded-2xl bg-[#121316] border border-[#262930] space-y-5';
  const sectionTitle = 'text-sm font-bold uppercase tracking-wider text-[#F5F5F7] flex items-center gap-2';

  return (
    <div className="space-y-8">
      {/* Guidance banner */}
      <div className="p-5 rounded-2xl bg-[#181A1F] border border-[#262930] flex items-start gap-3 text-xs text-[#CBD0DC]">
        <Info className="w-4 h-4 text-[#D4AF37] flex-shrink-0 mt-0.5" />
        <p>
          These values are used everywhere on the public website — footer, contact page, policy pages, About page and
          checkout. Legal/business information that is not yet available (such as your exact legal business name, FBR
          NTN certificate or incorporation records) is <strong>never published</strong> on the website; it is provided
          directly to the merchant/payment provider during onboarding.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Business identity */}
        <div className={sectionCard}>
          <h3 className={sectionTitle}>
            <Building2 className="w-4 h-4 text-[#D4AF37]" />
            Business Identity
          </h3>
          <div className="space-y-4">
            <div>
              <label className={labelClass} htmlFor="set-business-name">Business Name (Trade Name)</label>
              <input id="set-business-name" className={inputClass} value={form.businessName} onChange={(e) => set('businessName', e.target.value)} placeholder="STORIUM" />
            </div>
            <div>
              <label className={labelClass} htmlFor="set-legal-name">Legal Business Name</label>
              <input id="set-legal-name" className={inputClass} value={form.legalBusinessName} onChange={(e) => set('legalBusinessName', e.target.value)} placeholder="Enter the name exactly as it appears on your official documents" />
              {!form.legalBusinessName && (
                <p className="text-[10px] text-amber-400/80 mt-1">Optional — shown in footer and used for merchant onboarding.</p>
              )}
            </div>
            <div>
              <label className={labelClass} htmlFor="set-tagline">Tagline</label>
              <input id="set-tagline" className={inputClass} value={form.tagline} onChange={(e) => set('tagline', e.target.value)} />
            </div>
            <div>
              <label className={labelClass} htmlFor="set-description">Business Description (Short)</label>
              <textarea id="set-description" rows={3} className={inputClass} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="One-to-two sentence public description of your business." />
            </div>
          </div>
        </div>

        {/* Address & contact */}
        <div className={sectionCard}>
          <h3 className={sectionTitle}>
            <Phone className="w-4 h-4 text-[#D4AF37]" />
            Address &amp; Contact
          </h3>
          <div className="space-y-4">
            <div>
              <label className={labelClass} htmlFor="set-address">Complete Business Address</label>
              <input id="set-address" className={inputClass} value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="e.g. ANWAR SHAHID COLONY RENALA" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className={labelClass} htmlFor="set-city">City</label>
                <input id="set-city" className={inputClass} value={form.city} onChange={(e) => set('city', e.target.value)} />
              </div>
              <div>
                <label className={labelClass} htmlFor="set-province">Province</label>
                <input id="set-province" className={inputClass} value={form.province} onChange={(e) => set('province', e.target.value)} />
              </div>
              <div>
                <label className={labelClass} htmlFor="set-country">Country</label>
                <input id="set-country" className={inputClass} value={form.country} onChange={(e) => set('country', e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelClass} htmlFor="set-email">Email Address</label>
                <input id="set-email" type="email" className={inputClass} value={form.email} onChange={(e) => set('email', e.target.value)} />
              </div>
              <div>
                <label className={labelClass} htmlFor="set-phone">Contact Number</label>
                <input id="set-phone" className={inputClass} value={form.phone} onChange={(e) => set('phone', e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelClass} htmlFor="set-whatsapp">WhatsApp Link</label>
                <input id="set-whatsapp" className={inputClass} value={form.whatsappLink} onChange={(e) => set('whatsappLink', e.target.value)} placeholder="https://wa.me/92xxxxxxxxxx" />
              </div>
              <div>
                <label className={labelClass} htmlFor="set-hours">Working Hours</label>
                <input id="set-hours" className={inputClass} value={form.workingHours} onChange={(e) => set('workingHours', e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        {/* Payment gateway & shipping */}
        <div className={sectionCard}>
          <h3 className={sectionTitle}>
            <Save className="w-4 h-4 text-[#D4AF37]" />
            Payment Gateway &amp; Shipping
          </h3>
          <div className="space-y-4">
            <div>
              <label className={labelClass} htmlFor="set-gateway">Payment Gateway Name</label>
              <input id="set-gateway" className={inputClass} value={form.paymentGatewayName} onChange={(e) => set('paymentGatewayName', e.target.value)} placeholder="Rapid Gateway" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelClass} htmlFor="set-free-above">Free Delivery Above (PKR)</label>
                <input id="set-free-above" type="number" min={0} className={inputClass} value={form.shippingFreeAbove} onChange={(e) => set('shippingFreeAbove', Number(e.target.value))} />
              </div>
              <div>
                <label className={labelClass} htmlFor="set-flat-fee">Standard Delivery Fee (PKR)</label>
                <input id="set-flat-fee" type="number" min={0} className={inputClass} value={form.shippingFlatFee} onChange={(e) => set('shippingFlatFee', Number(e.target.value))} />
              </div>
            </div>
            <p className="text-[10px] text-[#8E929E]">Applied automatically at cart and checkout.</p>
          </div>
        </div>

        {/* Social media + storefront */}
        <div className={sectionCard}>
          <h3 className={sectionTitle}>
            <Save className="w-4 h-4 text-[#D4AF37]" />
            Social Media &amp; Storefront Photo
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelClass} htmlFor="set-fb">Facebook URL</label>
                <input id="set-fb" className={inputClass} value={form.socialFacebook} onChange={(e) => set('socialFacebook', e.target.value)} placeholder="https://facebook.com/..." />
              </div>
              <div>
                <label className={labelClass} htmlFor="set-ig">Instagram URL</label>
                <input id="set-ig" className={inputClass} value={form.socialInstagram} onChange={(e) => set('socialInstagram', e.target.value)} placeholder="https://instagram.com/..." />
              </div>
              <div>
                <label className={labelClass} htmlFor="set-tt">TikTok URL</label>
                <input id="set-tt" className={inputClass} value={form.socialTiktok} onChange={(e) => set('socialTiktok', e.target.value)} placeholder="https://tiktok.com/..." />
              </div>
              <div>
                <label className={labelClass} htmlFor="set-yt">YouTube URL</label>
                <input id="set-yt" className={inputClass} value={form.socialYoutube} onChange={(e) => set('socialYoutube', e.target.value)} placeholder="https://youtube.com/..." />
              </div>
            </div>

            <div>
              <span className={labelClass}>Business / Storefront Photo</span>
              {hasPublicStorefrontImage ? (
                <div className="relative inline-block">
                  <img src={form.storefrontImage} alt="Storefront preview" className="w-40 h-28 object-cover rounded-xl border border-[#262930]" />
                  <button
                    type="button"
                    onClick={() => set('storefrontImage', '')}
                    className="absolute -top-2 -right-2 p-1 rounded-full bg-rose-500 text-[#0B0C0E] hover:bg-rose-400"
                    aria-label="Remove storefront image"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <label className="flex items-center justify-center gap-2 w-40 h-28 rounded-xl border border-dashed border-[#262930] bg-[#0B0C0E] text-[#8E929E] text-xs cursor-pointer hover:border-[#D4AF37]/50 hover:text-[#D4AF37] transition-colors">
                  <Upload className="w-4 h-4" />
                  <span>{isUploading ? 'Uploading…' : 'Upload photo'}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleStorefrontUpload} />
                </label>
              )}
              <p className="text-[10px] text-[#8E929E] mt-1">
                Upload a genuine photo of your store/inventory so it can appear on the About and Contact pages. Product photographs are managed per-product in the Product Catalog tab.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Public business model & payment copy */}
      <div className={sectionCard}>
        <h3 className={sectionTitle}>
          <Info className="w-4 h-4 text-[#D4AF37]" />
          Business Model &amp; Secure Payment Process (public copy)
        </h3>
        <div className="space-y-4">
          <div>
            <label className={labelClass} htmlFor="set-model">"How We Work" — Business Model Explanation (About page)</label>
            <textarea id="set-model" rows={8} className={inputClass} value={form.businessModel} onChange={(e) => set('businessModel', e.target.value)} placeholder="Explain what you sell, where products come from, how inventory is maintained, how customers order, pay, and receive delivery, and how they reach support." />
          </div>
          <div>
            <label className={labelClass} htmlFor="set-payment">"Secure Payment Process" — Gateway Use-Case Explanation (checkout)</label>
            <textarea id="set-payment" rows={7} className={inputClass} value={form.securePaymentCopy} onChange={(e) => set('securePaymentCopy', e.target.value)} placeholder="One customer step per numbered line (1., 2., 3., ...) describing how the payment gateway is used." />
          </div>
        </div>
      </div>

      {/* Policy content */}
      <div className={sectionCard}>
        <h3 className={sectionTitle}>
          <Save className="w-4 h-4 text-[#D4AF37]" />
          Policy Content (shipping, refund, privacy, terms)
        </h3>
        <p className="text-[11px] text-[#8E929E] -mt-2">
          Plain text editor. Lines starting with <code className="text-[#D4AF37]">## </code> become section headings; blank lines become paragraph breaks.
          Tokens you can use: <code className="text-[#D4AF37]">{`{businessName}`}</code>, <code className="text-[#D4AF37]">{`{email}`}</code>, <code className="text-[#D4AF37]">{`{phone}`}</code>,{' '}
          <code className="text-[#D4AF37]">{`{address}`}</code>, <code className="text-[#D4AF37]">{`{workingHours}`}</code>, <code className="text-[#D4AF37]">{`{shippingFreeAbove}`}</code>.
        </p>
        <div className="grid grid-cols-1 gap-4">
          {(
            [
              ['shipping', 'Shipping Policy'] as const,
              ['refund', 'Refund Policy'] as const,
              ['privacy', 'Privacy Policy'] as const,
              ['terms', 'Terms & Conditions'] as const,
            ]
          ).map(([key, label]) => (
            <div key={key}>
              <label className={labelClass} htmlFor={`set-policy-${key}`}>{label}</label>
              <textarea
                id={`set-policy-${key}`}
                rows={10}
                className={`${inputClass} font-mono`}
                value={form[`policies${key[0].toUpperCase()}${key.slice(1)}` as keyof SettingsForm] as string}
                onChange={(e) => set(`policies${key[0].toUpperCase()}${key.slice(1)}` as keyof SettingsForm, e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Private gateway notes */}
      <div className={sectionCard}>
        <h3 className={sectionTitle}>
          <Save className="w-4 h-4 text-[#D4AF37]" />
          Private Notes (merchant records — never shown to the public)
        </h3>
        <div>
          <label className={labelClass} htmlFor="set-notes">Gateway / Merchant Notes</label>
          <textarea id="set-notes" rows={4} className={inputClass} value={form.gatewayNotes} onChange={(e) => set('gatewayNotes', e.target.value)} placeholder="Keep private references for merchant onboarding (credentials, document submissions, status). This is never rendered on the public website." />
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
        <button
          type="button"
          onClick={handleSave}
          className="w-full sm:w-auto py-3 px-6 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#C5A059] hover:from-[#E5C378] hover:to-[#D4AF37] text-[#0B0C0E] text-xs font-bold uppercase tracking-[0.2em] shadow-lg flex items-center justify-center gap-2 cursor-pointer"
        >
          <Save className="w-4 h-4" />
          Save Business Settings
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="w-full sm:w-auto py-3 px-6 rounded-xl bg-[#181A1F] hover:bg-[#22252C] text-[#8E929E] hover:text-[#F5F5F7] text-xs uppercase tracking-wider border border-[#262930] flex items-center justify-center gap-2 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          Reset to Defaults
        </button>
      </div>
    </div>
  );
};