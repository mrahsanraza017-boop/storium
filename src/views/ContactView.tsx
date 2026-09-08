import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, MessageSquare, Clock, CheckCircle, Loader2 } from 'lucide-react';
import { useStore } from '../context/StoreContext';

import { SEOHead } from '../components/seo/SEOHead';
import { getBreadcrumbSchema, BASE_SITE_URL } from '../lib/seoSchemas';

export const ContactView: React.FC = () => {
  const { submitContactInquiry } = useStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    topic: 'Timepiece Inquiries',
    message: '',
  });

  const breadcrumbs = [
    { name: 'Showroom', url: '/' },
    { name: 'Client Concierge', url: '/contact' },
  ];

  const contactSchema = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    '@id': `${BASE_SITE_URL}/contact#contactpage`,
    name: 'Client Concierge & Support | Maison STORIUM Pakistan',
    url: `${BASE_SITE_URL}/contact`,
    description: 'Contact STORIUM luxury watch showroom for horological consultation, custom sizing, and order assistance.',
    mainEntity: {
      '@id': `${BASE_SITE_URL}/#organization`,
    },
  };

  const schemas = [getBreadcrumbSchema(breadcrumbs), contactSchema];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await submitContactInquiry({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        topic: formData.topic,
        message: formData.message,
      });

      setIsSubmitted(true);
    } catch (err) {
      console.error('Contact submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full bg-transparent min-h-screen text-[#E8E8EC] py-16">
      <SEOHead
        title="Concierge & Client Support — STORIUM Luxury Showroom Pakistan"
        description="Speak with STORIUM horological advisors for product inquiries, bespoke orders, tracking, and warranty service across Pakistan."
        keywords="contact storium, storium customer service, luxury watch consultation pakistan, storium whatsapp helpline"
        canonicalPath="/contact"
        schemas={schemas}
      />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3">
          <span className="text-xs uppercase tracking-[0.28em] text-[#D4AF37] font-semibold">
            Client Concierge
          </span>
          <h1 className="text-3xl sm:text-5xl font-bold font-serif-luxury text-[#F5F5F7]">
            Connect With the Showroom
          </h1>
          <p className="text-sm text-[#8E929E] max-w-xl mx-auto">
            Whether you require horological consultation, custom sizing, or order inquiries, our dedicated concierge team is at your disposal.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Direct channels */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-6 rounded-2xl bg-[#121316] border border-[#262930] space-y-6">
              <h3 className="text-base font-bold text-[#F5F5F7] font-serif-luxury uppercase tracking-wider">
                Direct Communication
              </h3>

              <div className="space-y-4 text-xs">
                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 rounded-xl bg-[#181A1F] text-[#D4AF37] border border-[#262930]">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[#8E929E] block">WhatsApp / Phone Concierge</span>
                    <a
                      href="https://wa.me/923215993022"
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono text-sm font-semibold text-[#F5F5F7] hover:text-[#D4AF37]"
                    >
                      +92 321 5993022
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 rounded-xl bg-[#181A1F] text-[#D4AF37] border border-[#262930]">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[#8E929E] block">Electronic Correspondence</span>
                    <a
                      href="mailto:concierge@storium.pk"
                      className="font-mono text-sm font-semibold text-[#F5F5F7] hover:text-[#D4AF37]"
                    >
                      concierge@storium.pk
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 rounded-xl bg-[#181A1F] text-[#D4AF37] border border-[#262930]">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[#8E929E] block">Concierge Working Hours</span>
                    <span className="text-[#F5F5F7]">Monday &ndash; Saturday: 10:00 AM &ndash; 10:00 PM PKT</span>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 rounded-xl bg-[#181A1F] text-[#D4AF37] border border-[#262930]">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[#8E929E] block">Showroom Hub &amp; Fulfillment</span>
                    <span className="text-[#F5F5F7]">Gulberg III, Lahore &amp; Clifton, Karachi (Pakistan)</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#0B0C0E] border border-[#262930] text-xs text-[#8E929E] space-y-2">
              <span className="text-[#D4AF37] font-semibold uppercase tracking-wider block">
                Cash on Delivery Verification
              </span>
              <p>
                All COD orders placed on STORIUM undergo automated SMS verification before dispatch through our TCS / Leopard express network.
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-7">
            <div className="p-8 rounded-2xl bg-[#121316] border border-[#262930] shadow-xl">
              {isSubmitted ? (
                <div className="py-16 text-center space-y-4">
                  <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto" />
                  <h3 className="text-xl font-bold font-serif-luxury text-[#F5F5F7]">
                    Inquiry Received
                  </h3>
                  <p className="text-xs text-[#8E929E] max-w-sm mx-auto">
                    Thank you, {formData.name}. Our horology specialist will review your request and reach out shortly via phone or email.
                  </p>

                  <p className="text-xs text-emerald-400">Our concierge team has received your request.</p>

                  <div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsSubmitted(false);
                        setFormData({
                          name: '',
                          email: '',
                          phone: '',
                          topic: 'Timepiece Inquiries',
                          message: '',
                        });
                      }}
                      className="mt-4 py-2.5 px-6 rounded-xl bg-[#181A1F] text-[#D4AF37] text-xs font-semibold uppercase tracking-wider border border-[#262930] hover:bg-[#20232a] transition-colors"
                    >
                      Send Another Inquiry
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold font-serif-luxury text-[#F5F5F7]">
                      Send Showroom Inquiry
                    </h3>
                  </div>

                  <div>
                    <label className="block text-[#8E929E] uppercase tracking-wider mb-1">
                      Your Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Asad Qureshi"
                      className="w-full py-2.5 px-3.5 rounded-xl bg-[#0B0C0E] border border-[#262930] text-[#F5F5F7] focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[#8E929E] uppercase tracking-wider mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="asad@example.pk"
                        className="w-full py-2.5 px-3.5 rounded-xl bg-[#0B0C0E] border border-[#262930] text-[#F5F5F7] focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                    <div>
                      <label className="block text-[#8E929E] uppercase tracking-wider mb-1">
                        Phone / WhatsApp *
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+92 300 1234567"
                        className="w-full py-2.5 px-3.5 rounded-xl bg-[#0B0C0E] border border-[#262930] text-[#F5F5F7] focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[#8E929E] uppercase tracking-wider mb-1">
                      Inquiry Topic
                    </label>
                    <select
                      value={formData.topic}
                      onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                      className="w-full py-2.5 px-3.5 rounded-xl bg-[#0B0C0E] border border-[#262930] text-[#F5F5F7] focus:outline-none focus:border-[#D4AF37]"
                    >
                      <option value="Timepiece Inquiries">Timepiece Inquiries &amp; Calibres</option>
                      <option value="Order Tracking">Order Tracking &amp; Delivery</option>
                      <option value="Warranty & Service">2-Year Warranty &amp; Service</option>
                      <option value="Corporate Gifting">Corporate &amp; Executive Gifting</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[#8E929E] uppercase tracking-wider mb-1">
                      Message *
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="How may our concierge assist you?"
                      className="w-full py-2.5 px-3.5 rounded-xl bg-[#0B0C0E] border border-[#262930] text-[#F5F5F7] focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#C5A059] hover:from-[#E5C378] hover:to-[#D4AF37] disabled:opacity-60 text-[#0B0C0E] text-xs uppercase tracking-[0.2em] font-bold shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-[#0B0C0E]" />
                        <span>Sending Your Inquiry...</span>
                      </>
                    ) : (
                      <>
                        <span>Transmit Inquiry</span>
                        <Send className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
