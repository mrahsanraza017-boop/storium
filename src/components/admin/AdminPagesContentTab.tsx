import React, { useState } from 'react';
import {
  Save,
  RotateCcw,
  Plus,
  Trash2,
  Edit2,
  Upload,
  Eye,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Layout,
  FileText,
  Image as ImageIcon,
  CheckCircle,
  ExternalLink,
  ChevronRight,
  Sliders,
  Type,
  HelpCircle,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { CustomPageSection, PageView, PagesContentConfig } from '../../types';
import { uploadProductMedia } from '../../services/supabaseService';

type TabPageKey = 'home' | 'about' | 'contact' | 'watches' | 'accessories' | 'shop' | 'policies';

export const AdminPagesContentTab: React.FC = () => {
  const {
    pagesContent,
    updatePageContent,
    addCustomSection,
    updateCustomSection,
    deleteCustomSection,
    reorderCustomSection,
    resetPagesContent,
    navigate,
    addToast,
  } = useStore();

  const [activePage, setActivePage] = useState<TabPageKey>('home');
  const [isUploading, setIsUploading] = useState<string | null>(null);

  // Local draft state for the selected page's core fields
  const [homeDraft, setHomeDraft] = useState(pagesContent.home);
  const [aboutDraft, setAboutDraft] = useState(pagesContent.about);
  const [contactDraft, setContactDraft] = useState(pagesContent.contact);
  const [watchesDraft, setWatchesDraft] = useState(pagesContent.watches);
  const [accessoriesDraft, setAccessoriesDraft] = useState(pagesContent.accessories);
  const [shopDraft, setShopDraft] = useState(pagesContent.shop);
  const [policiesDraft, setPoliciesDraft] = useState(pagesContent.policies);

  // Sync draft when active page changes or when pagesContent changes externally
  React.useEffect(() => {
    setHomeDraft(pagesContent.home);
    setAboutDraft(pagesContent.about);
    setContactDraft(pagesContent.contact);
    setWatchesDraft(pagesContent.watches);
    setAccessoriesDraft(pagesContent.accessories);
    setShopDraft(pagesContent.shop);
    setPoliciesDraft(pagesContent.policies);
  }, [pagesContent]);

  // Modal state for adding/editing a custom section
  const [editingSection, setEditingSection] = useState<{
    page: TabPageKey;
    section: CustomPageSection;
    isNew: boolean;
  } | null>(null);

  // Helper for image upload
  const handleUpload = async (
    targetFieldKey: string,
    onUrlReady: (url: string) => void,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setIsUploading(targetFieldKey);
    try {
      const uploaded = await uploadProductMedia(files, 'cms-pages');
      if (uploaded.length > 0 && uploaded[0].url) {
        onUrlReady(uploaded[0].url);
        addToast('success', 'Image Uploaded', 'Image was successfully uploaded.');
      }
    } catch (err: any) {
      addToast('error', 'Upload Failed', err?.message || 'Could not upload image');
    } finally {
      setIsUploading(null);
    }
  };

  const handleSavePage = (pageKey: TabPageKey) => {
    switch (pageKey) {
      case 'home':
        updatePageContent('home', homeDraft);
        break;
      case 'about':
        updatePageContent('about', aboutDraft);
        break;
      case 'contact':
        updatePageContent('contact', contactDraft);
        break;
      case 'watches':
        updatePageContent('watches', watchesDraft);
        break;
      case 'accessories':
        updatePageContent('accessories', accessoriesDraft);
        break;
      case 'shop':
        updatePageContent('shop', shopDraft);
        break;
      case 'policies':
        updatePageContent('policies', policiesDraft);
        break;
    }
  };

  const handleResetPage = (pageKey: TabPageKey) => {
    if (confirm(`Reset all content and sections for ${pageKey.toUpperCase()} to website defaults?`)) {
      resetPagesContent(pageKey);
    }
  };

  const openNewSectionModal = (pageKey: TabPageKey) => {
    setEditingSection({
      page: pageKey,
      isNew: true,
      section: {
        id: `sec-${Date.now()}`,
        title: '',
        subtitle: '',
        badge: 'Featured',
        content: '',
        image: '',
        imagePosition: 'right',
        layout: 'card',
        ctaText: '',
        ctaTarget: 'watches',
        enabled: true,
      },
    });
  };

  const handleSaveSectionModal = () => {
    if (!editingSection) return;
    const { page, section, isNew } = editingSection;
    if (!section.title.trim() && !section.content.trim()) {
      addToast('error', 'Incomplete Section', 'Please enter at least a heading or text content.');
      return;
    }

    if (isNew) {
      addCustomSection(page, section);
    } else {
      updateCustomSection(page, section.id, section);
    }
    setEditingSection(null);
  };

  const currentSections = pagesContent[activePage]?.customSections || [];

  return (
    <div className="space-y-8 pb-16">
      {/* Top Header & Overview Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl glass-panel border border-[#262930] shadow-2xl relative overflow-hidden">
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#D4AF37] text-[11px] font-bold uppercase tracking-[0.2em]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Storefront Content Management (CMS)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif-luxury text-white gold-glow-subtle">
            Website Texts, Headings &amp; Page Sections
          </h1>
          <p className="text-xs sm:text-sm text-[#CBD0DC] max-w-2xl leading-relaxed">
            Directly customize texts, hero banner descriptions, images, headings, and add unlimited rich text sections across all pages of your luxury store.
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10 shrink-0">
          <button
            type="button"
            onClick={() => navigate(activePage === 'policies' ? 'shipping-policy' : (activePage as PageView))}
            className="px-4 py-2.5 rounded-xl bg-[#181A1F] hover:bg-[#20232A] text-[#D4AF37] border border-[#262930] hover:border-[#D4AF37]/50 text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-md"
          >
            <Eye className="w-4 h-4" />
            <span>Preview Live Page</span>
          </button>
        </div>
      </div>

      {/* Page Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {(
          [
            { id: 'home', label: 'Home Page', icon: '🏠' },
            { id: 'about', label: 'About Page', icon: '📖' },
            { id: 'contact', label: 'Contact Page', icon: '📞' },
            { id: 'watches', label: 'Watches Page', icon: '⌚' },
            { id: 'accessories', label: 'Accessories Page', icon: '👔' },
            { id: 'shop', label: 'Showroom Catalog', icon: '🛍️' },
            { id: 'policies', label: 'Legal & Policies', icon: '📜' },
          ] as const
        ).map((tab) => {
          const isActive = activePage === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActivePage(tab.id)}
              className={`px-4 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2.5 flex-shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-[#D4AF37] to-[#C5A059] text-[#0B0C0E] shadow-[0_4px_20px_rgba(212,175,55,0.35)] scale-[1.02]'
                  : 'bg-[#121316] text-[#8E929E] hover:text-[#F5F5F7] hover:bg-[#181A1F] border border-[#262930]'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {pagesContent[tab.id]?.customSections?.length > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                    isActive ? 'bg-[#0B0C0E]/20 text-[#0B0C0E]' : 'bg-[#181A1F] text-[#D4AF37]'
                  }`}
                >
                  +{pagesContent[tab.id].customSections.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Page Editor Body */}
      <div className="p-6 sm:p-10 rounded-3xl glass-panel border border-[#262930] space-y-10 shadow-2xl">
        {/* ==============================================================
            HOME PAGE EDITOR
            ============================================================== */}
        {activePage === 'home' && (
          <div className="space-y-10">
            {/* 1. Hero Banner */}
            <div className="space-y-6 p-6 sm:p-8 rounded-2xl bg-[#0B0C0E]/60 border border-[#262930]">
              <div className="flex items-center justify-between border-b border-[#262930] pb-4">
                <div>
                  <h3 className="text-lg font-bold font-serif-luxury text-white gold-glow-subtle flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#D4AF37]" />
                    <span>Hero Banner &amp; Main Taglines</span>
                  </h3>
                  <p className="text-xs text-[#8E929E] mt-1">
                    The top prominent statement patrons see when opening STORIUM.
                  </p>
                </div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#D4AF37] px-2.5 py-1 rounded bg-[#D4AF37]/10 border border-[#D4AF37]/30">
                  Primary Banner
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs uppercase font-semibold text-[#CBD0DC] block mb-2">
                    Brand Tagline Badge (Pill Above Main Heading)
                  </label>
                  <input
                    type="text"
                    value={homeDraft.hero.badge}
                    onChange={(e) =>
                      setHomeDraft((prev) => ({
                        ...prev,
                        hero: { ...prev.hero, badge: e.target.value },
                      }))
                    }
                    placeholder="e.g. Pakistan's Futuristic Luxury Showroom"
                    className="w-full px-4 py-3 rounded-xl bg-[#121316] border border-[#262930] text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="text-xs uppercase font-semibold text-[#CBD0DC] block mb-2">
                    Main Hero Headline
                  </label>
                  <input
                    type="text"
                    value={homeDraft.hero.heading}
                    onChange={(e) =>
                      setHomeDraft((prev) => ({
                        ...prev,
                        hero: { ...prev.hero, heading: e.target.value },
                      }))
                    }
                    placeholder="e.g. Wear your presence."
                    className="w-full px-4 py-3 rounded-xl bg-[#121316] border border-[#262930] text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs uppercase font-semibold text-[#D4AF37] block mb-2 flex items-center gap-1.5">
                    <span>Banner Description (Hero Subtext)</span>
                    <span className="text-[10px] text-[#8E929E] font-normal lowercase">(requested: &quot;PAKISTAN&apos;S FUTURISTIC LUXURY&quot;)</span>
                  </label>
                  <textarea
                    rows={3}
                    value={homeDraft.hero.description}
                    onChange={(e) =>
                      setHomeDraft((prev) => ({
                        ...prev,
                        hero: { ...prev.hero, description: e.target.value },
                      }))
                    }
                    placeholder="Enter hero banner description..."
                    className="w-full px-4 py-3 rounded-xl bg-[#121316] border border-[#D4AF37]/50 text-sm text-white font-medium focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="text-xs uppercase font-semibold text-[#CBD0DC] block mb-2">
                    Primary CTA Button Text
                  </label>
                  <input
                    type="text"
                    value={homeDraft.hero.primaryCtaText}
                    onChange={(e) =>
                      setHomeDraft((prev) => ({
                        ...prev,
                        hero: { ...prev.hero, primaryCtaText: e.target.value },
                      }))
                    }
                    placeholder="e.g. Explore Timepieces"
                    className="w-full px-4 py-3 rounded-xl bg-[#121316] border border-[#262930] text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="text-xs uppercase font-semibold text-[#CBD0DC] block mb-2">
                    Secondary CTA Button Text
                  </label>
                  <input
                    type="text"
                    value={homeDraft.hero.secondaryCtaText}
                    onChange={(e) =>
                      setHomeDraft((prev) => ({
                        ...prev,
                        hero: { ...prev.hero, secondaryCtaText: e.target.value },
                      }))
                    }
                    placeholder="e.g. Showroom Catalog"
                    className="w-full px-4 py-3 rounded-xl bg-[#121316] border border-[#262930] text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>
            </div>

            {/* 2. Featured Showcase Header */}
            <div className="space-y-6 p-6 sm:p-8 rounded-2xl bg-[#0B0C0E]/60 border border-[#262930]">
              <h3 className="text-lg font-bold font-serif-luxury text-white gold-glow-subtle border-b border-[#262930] pb-3">
                Featured Watches Showcase Section
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="text-xs uppercase font-semibold text-[#CBD0DC] block mb-2">
                    Eyebrow
                  </label>
                  <input
                    type="text"
                    value={homeDraft.featuredShowcase.eyebrow}
                    onChange={(e) =>
                      setHomeDraft((prev) => ({
                        ...prev,
                        featuredShowcase: { ...prev.featuredShowcase, eyebrow: e.target.value },
                      }))
                    }
                    className="w-full px-4 py-3 rounded-xl bg-[#121316] border border-[#262930] text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="text-xs uppercase font-semibold text-[#CBD0DC] block mb-2">
                    Section Heading
                  </label>
                  <input
                    type="text"
                    value={homeDraft.featuredShowcase.heading}
                    onChange={(e) =>
                      setHomeDraft((prev) => ({
                        ...prev,
                        featuredShowcase: { ...prev.featuredShowcase, heading: e.target.value },
                      }))
                    }
                    className="w-full px-4 py-3 rounded-xl bg-[#121316] border border-[#262930] text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="text-xs uppercase font-semibold text-[#CBD0DC] block mb-2">
                    View All Button Text
                  </label>
                  <input
                    type="text"
                    value={homeDraft.featuredShowcase.viewAllText}
                    onChange={(e) =>
                      setHomeDraft((prev) => ({
                        ...prev,
                        featuredShowcase: { ...prev.featuredShowcase, viewAllText: e.target.value },
                      }))
                    }
                    className="w-full px-4 py-3 rounded-xl bg-[#121316] border border-[#262930] text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>
            </div>

            {/* 3. Product Spotlight */}
            <div className="space-y-6 p-6 sm:p-8 rounded-2xl bg-[#0B0C0E]/60 border border-[#262930]">
              <h3 className="text-lg font-bold font-serif-luxury text-white gold-glow-subtle border-b border-[#262930] pb-3">
                Flagship Product Spotlight Section
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs uppercase font-semibold text-[#CBD0DC] block mb-2">
                    Eyebrow
                  </label>
                  <input
                    type="text"
                    value={homeDraft.productSpotlight.eyebrow}
                    onChange={(e) =>
                      setHomeDraft((prev) => ({
                        ...prev,
                        productSpotlight: { ...prev.productSpotlight, eyebrow: e.target.value },
                      }))
                    }
                    className="w-full px-4 py-3 rounded-xl bg-[#121316] border border-[#262930] text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="text-xs uppercase font-semibold text-[#CBD0DC] block mb-2">
                    Title Heading
                  </label>
                  <input
                    type="text"
                    value={homeDraft.productSpotlight.title}
                    onChange={(e) =>
                      setHomeDraft((prev) => ({
                        ...prev,
                        productSpotlight: { ...prev.productSpotlight, title: e.target.value },
                      }))
                    }
                    className="w-full px-4 py-3 rounded-xl bg-[#121316] border border-[#262930] text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs uppercase font-semibold text-[#CBD0DC] block mb-2">
                    Description Text
                  </label>
                  <textarea
                    rows={3}
                    value={homeDraft.productSpotlight.description}
                    onChange={(e) =>
                      setHomeDraft((prev) => ({
                        ...prev,
                        productSpotlight: { ...prev.productSpotlight, description: e.target.value },
                      }))
                    }
                    className="w-full px-4 py-3 rounded-xl bg-[#121316] border border-[#262930] text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="text-xs uppercase font-semibold text-[#CBD0DC] block mb-2">
                    Custom Spotlight Image URL (Optional)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={homeDraft.productSpotlight.image || ''}
                      onChange={(e) =>
                        setHomeDraft((prev) => ({
                          ...prev,
                          productSpotlight: { ...prev.productSpotlight, image: e.target.value },
                        }))
                      }
                      placeholder="https://... or upload"
                      className="flex-1 px-4 py-3 rounded-xl bg-[#121316] border border-[#262930] text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                    />
                    <label className="px-4 py-3 rounded-xl bg-[#181A1F] hover:bg-[#20232A] text-[#D4AF37] border border-[#262930] flex items-center justify-center cursor-pointer transition-colors">
                      <Upload className="w-4 h-4" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          handleUpload('spotlight', (url) => {
                            setHomeDraft((prev) => ({
                              ...prev,
                              productSpotlight: { ...prev.productSpotlight, image: url },
                            }));
                          }, e)
                        }
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="text-xs uppercase font-semibold text-[#CBD0DC] block mb-2">
                    Price Label Text
                  </label>
                  <input
                    type="text"
                    value={homeDraft.productSpotlight.priceLabel || 'Accessible Luxury Price'}
                    onChange={(e) =>
                      setHomeDraft((prev) => ({
                        ...prev,
                        productSpotlight: { ...prev.productSpotlight, priceLabel: e.target.value },
                      }))
                    }
                    className="w-full px-4 py-3 rounded-xl bg-[#121316] border border-[#262930] text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>
            </div>

            {/* 4. Brand Philosophy */}
            <div className="space-y-6 p-6 sm:p-8 rounded-2xl bg-[#0B0C0E]/60 border border-[#262930]">
              <h3 className="text-lg font-bold font-serif-luxury text-white gold-glow-subtle border-b border-[#262930] pb-3">
                Brand Philosophy Section
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs uppercase font-semibold text-[#CBD0DC] block mb-2">
                    Eyebrow
                  </label>
                  <input
                    type="text"
                    value={homeDraft.philosophy.eyebrow}
                    onChange={(e) =>
                      setHomeDraft((prev) => ({
                        ...prev,
                        philosophy: { ...prev.philosophy, eyebrow: e.target.value },
                      }))
                    }
                    className="w-full px-4 py-3 rounded-xl bg-[#121316] border border-[#262930] text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="text-xs uppercase font-semibold text-[#CBD0DC] block mb-2">
                    Philosophical Quote (Main Heading)
                  </label>
                  <input
                    type="text"
                    value={homeDraft.philosophy.quote}
                    onChange={(e) =>
                      setHomeDraft((prev) => ({
                        ...prev,
                        philosophy: { ...prev.philosophy, quote: e.target.value },
                      }))
                    }
                    className="w-full px-4 py-3 rounded-xl bg-[#121316] border border-[#262930] text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="text-xs uppercase font-semibold text-[#CBD0DC] block mb-2">
                    Philosophy Body Text
                  </label>
                  <textarea
                    rows={4}
                    value={homeDraft.philosophy.description}
                    onChange={(e) =>
                      setHomeDraft((prev) => ({
                        ...prev,
                        philosophy: { ...prev.philosophy, description: e.target.value },
                      }))
                    }
                    className="w-full px-4 py-3 rounded-xl bg-[#121316] border border-[#262930] text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>
            </div>

            {/* 5. Trust Badges */}
            <div className="space-y-6 p-6 sm:p-8 rounded-2xl bg-[#0B0C0E]/60 border border-[#262930]">
              <h3 className="text-lg font-bold font-serif-luxury text-white gold-glow-subtle border-b border-[#262930] pb-3">
                Nationwide Trust &amp; Guarantee Badges
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Badge 1 */}
                <div className="p-4 rounded-xl bg-[#121316] border border-[#262930] space-y-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37]">Badge 1</span>
                  <input
                    type="text"
                    value={homeDraft.trustBadges.badge1.title}
                    onChange={(e) =>
                      setHomeDraft((prev) => ({
                        ...prev,
                        trustBadges: {
                          ...prev.trustBadges,
                          badge1: { ...prev.trustBadges.badge1, title: e.target.value },
                        },
                      }))
                    }
                    placeholder="Title"
                    className="w-full px-3 py-2 rounded-lg bg-[#0B0C0E] border border-[#262930] text-xs text-white"
                  />
                  <textarea
                    rows={3}
                    value={homeDraft.trustBadges.badge1.description}
                    onChange={(e) =>
                      setHomeDraft((prev) => ({
                        ...prev,
                        trustBadges: {
                          ...prev.trustBadges,
                          badge1: { ...prev.trustBadges.badge1, description: e.target.value },
                        },
                      }))
                    }
                    placeholder="Description"
                    className="w-full px-3 py-2 rounded-lg bg-[#0B0C0E] border border-[#262930] text-xs text-[#CBD0DC]"
                  />
                </div>

                {/* Badge 2 */}
                <div className="p-4 rounded-xl bg-[#121316] border border-[#262930] space-y-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37]">Badge 2</span>
                  <input
                    type="text"
                    value={homeDraft.trustBadges.badge2.title}
                    onChange={(e) =>
                      setHomeDraft((prev) => ({
                        ...prev,
                        trustBadges: {
                          ...prev.trustBadges,
                          badge2: { ...prev.trustBadges.badge2, title: e.target.value },
                        },
                      }))
                    }
                    placeholder="Title"
                    className="w-full px-3 py-2 rounded-lg bg-[#0B0C0E] border border-[#262930] text-xs text-white"
                  />
                  <textarea
                    rows={3}
                    value={homeDraft.trustBadges.badge2.description}
                    onChange={(e) =>
                      setHomeDraft((prev) => ({
                        ...prev,
                        trustBadges: {
                          ...prev.trustBadges,
                          badge2: { ...prev.trustBadges.badge2, description: e.target.value },
                        },
                      }))
                    }
                    placeholder="Description"
                    className="w-full px-3 py-2 rounded-lg bg-[#0B0C0E] border border-[#262930] text-xs text-[#CBD0DC]"
                  />
                </div>

                {/* Badge 3 */}
                <div className="p-4 rounded-xl bg-[#121316] border border-[#262930] space-y-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37]">Badge 3</span>
                  <input
                    type="text"
                    value={homeDraft.trustBadges.badge3.title}
                    onChange={(e) =>
                      setHomeDraft((prev) => ({
                        ...prev,
                        trustBadges: {
                          ...prev.trustBadges,
                          badge3: { ...prev.trustBadges.badge3, title: e.target.value },
                        },
                      }))
                    }
                    placeholder="Title"
                    className="w-full px-3 py-2 rounded-lg bg-[#0B0C0E] border border-[#262930] text-xs text-white"
                  />
                  <textarea
                    rows={3}
                    value={homeDraft.trustBadges.badge3.description}
                    onChange={(e) =>
                      setHomeDraft((prev) => ({
                        ...prev,
                        trustBadges: {
                          ...prev.trustBadges,
                          badge3: { ...prev.trustBadges.badge3, description: e.target.value },
                        },
                      }))
                    }
                    placeholder="Description"
                    className="w-full px-3 py-2 rounded-lg bg-[#0B0C0E] border border-[#262930] text-xs text-[#CBD0DC]"
                  />
                </div>
              </div>
            </div>

            {/* 6. Conversion CTA */}
            <div className="space-y-6 p-6 sm:p-8 rounded-2xl bg-[#0B0C0E]/60 border border-[#262930]">
              <h3 className="text-lg font-bold font-serif-luxury text-white gold-glow-subtle border-b border-[#262930] pb-3">
                Final Showroom Conversion Section
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs uppercase font-semibold text-[#CBD0DC] block mb-2">
                    Eyebrow
                  </label>
                  <input
                    type="text"
                    value={homeDraft.conversionCta.eyebrow}
                    onChange={(e) =>
                      setHomeDraft((prev) => ({
                        ...prev,
                        conversionCta: { ...prev.conversionCta, eyebrow: e.target.value },
                      }))
                    }
                    className="w-full px-4 py-3 rounded-xl bg-[#121316] border border-[#262930] text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="text-xs uppercase font-semibold text-[#CBD0DC] block mb-2">
                    Heading
                  </label>
                  <input
                    type="text"
                    value={homeDraft.conversionCta.heading}
                    onChange={(e) =>
                      setHomeDraft((prev) => ({
                        ...prev,
                        conversionCta: { ...prev.conversionCta, heading: e.target.value },
                      }))
                    }
                    className="w-full px-4 py-3 rounded-xl bg-[#121316] border border-[#262930] text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs uppercase font-semibold text-[#CBD0DC] block mb-2">
                    Description Text
                  </label>
                  <textarea
                    rows={3}
                    value={homeDraft.conversionCta.description}
                    onChange={(e) =>
                      setHomeDraft((prev) => ({
                        ...prev,
                        conversionCta: { ...prev.conversionCta, description: e.target.value },
                      }))
                    }
                    className="w-full px-4 py-3 rounded-xl bg-[#121316] border border-[#262930] text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="text-xs uppercase font-semibold text-[#CBD0DC] block mb-2">
                    Primary Button Label
                  </label>
                  <input
                    type="text"
                    value={homeDraft.conversionCta.primaryCtaText}
                    onChange={(e) =>
                      setHomeDraft((prev) => ({
                        ...prev,
                        conversionCta: { ...prev.conversionCta, primaryCtaText: e.target.value },
                      }))
                    }
                    className="w-full px-4 py-3 rounded-xl bg-[#121316] border border-[#262930] text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="text-xs uppercase font-semibold text-[#CBD0DC] block mb-2">
                    Secondary Button Label
                  </label>
                  <input
                    type="text"
                    value={homeDraft.conversionCta.secondaryCtaText}
                    onChange={(e) =>
                      setHomeDraft((prev) => ({
                        ...prev,
                        conversionCta: { ...prev.conversionCta, secondaryCtaText: e.target.value },
                      }))
                    }
                    className="w-full px-4 py-3 rounded-xl bg-[#121316] border border-[#262930] text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==============================================================
            ABOUT PAGE EDITOR
            ============================================================== */}
        {activePage === 'about' && (
          <div className="space-y-8">
            <div className="p-6 sm:p-8 rounded-2xl bg-[#0B0C0E]/60 border border-[#262930] space-y-6">
              <h3 className="text-lg font-bold font-serif-luxury text-white gold-glow-subtle border-b border-[#262930] pb-3">
                About Maison STORIUM — Header &amp; Manifesto
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs uppercase font-semibold text-[#CBD0DC] block mb-2">
                    Header Badge
                  </label>
                  <input
                    type="text"
                    value={aboutDraft.header.badge}
                    onChange={(e) =>
                      setAboutDraft((prev) => ({
                        ...prev,
                        header: { ...prev.header, badge: e.target.value },
                      }))
                    }
                    className="w-full px-4 py-3 rounded-xl bg-[#121316] border border-[#262930] text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="text-xs uppercase font-semibold text-[#CBD0DC] block mb-2">
                    Main Title Heading
                  </label>
                  <input
                    type="text"
                    value={aboutDraft.header.heading}
                    onChange={(e) =>
                      setAboutDraft((prev) => ({
                        ...prev,
                        header: { ...prev.header, heading: e.target.value },
                      }))
                    }
                    className="w-full px-4 py-3 rounded-xl bg-[#121316] border border-[#262930] text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs uppercase font-semibold text-[#CBD0DC] block mb-2">
                    Subtitle Description
                  </label>
                  <textarea
                    rows={2}
                    value={aboutDraft.header.subtitle}
                    onChange={(e) =>
                      setAboutDraft((prev) => ({
                        ...prev,
                        header: { ...prev.header, subtitle: e.target.value },
                      }))
                    }
                    className="w-full px-4 py-3 rounded-xl bg-[#121316] border border-[#262930] text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs uppercase font-semibold text-[#CBD0DC] block mb-2">
                    Hero Visual Image URL
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={aboutDraft.heroVisual.imageUrl}
                      onChange={(e) =>
                        setAboutDraft((prev) => ({
                          ...prev,
                          heroVisual: { ...prev.heroVisual, imageUrl: e.target.value },
                        }))
                      }
                      className="flex-1 px-4 py-3 rounded-xl bg-[#121316] border border-[#262930] text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                    />
                    <label className="px-4 py-3 rounded-xl bg-[#181A1F] hover:bg-[#20232A] text-[#D4AF37] border border-[#262930] flex items-center justify-center cursor-pointer transition-colors">
                      <Upload className="w-4 h-4" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          handleUpload('aboutHero', (url) => {
                            setAboutDraft((prev) => ({
                              ...prev,
                              heroVisual: { ...prev.heroVisual, imageUrl: url },
                            }));
                          }, e)
                        }
                      />
                    </label>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs uppercase font-semibold text-[#CBD0DC] block mb-2">
                    Philosophy Heading
                  </label>
                  <input
                    type="text"
                    value={aboutDraft.philosophy.heading}
                    onChange={(e) =>
                      setAboutDraft((prev) => ({
                        ...prev,
                        philosophy: { ...prev.philosophy, heading: e.target.value },
                      }))
                    }
                    className="w-full px-4 py-3 rounded-xl bg-[#121316] border border-[#262930] text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs uppercase font-semibold text-[#CBD0DC] block mb-2">
                    Philosophy Story &amp; Craftsmanship Text (Separate paragraphs with blank lines)
                  </label>
                  <textarea
                    rows={6}
                    value={aboutDraft.philosophy.content}
                    onChange={(e) =>
                      setAboutDraft((prev) => ({
                        ...prev,
                        philosophy: { ...prev.philosophy, content: e.target.value },
                      }))
                    }
                    className="w-full px-4 py-3 rounded-xl bg-[#121316] border border-[#262930] text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==============================================================
            CONTACT PAGE EDITOR
            ============================================================== */}
        {activePage === 'contact' && (
          <div className="space-y-8">
            <div className="p-6 sm:p-8 rounded-2xl bg-[#0B0C0E]/60 border border-[#262930] space-y-6">
              <h3 className="text-lg font-bold font-serif-luxury text-white gold-glow-subtle border-b border-[#262930] pb-3">
                Contact &amp; Concierge Desk Headers
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs uppercase font-semibold text-[#CBD0DC] block mb-2">
                    Header Badge
                  </label>
                  <input
                    type="text"
                    value={contactDraft.header.badge}
                    onChange={(e) =>
                      setContactDraft((prev) => ({
                        ...prev,
                        header: { ...prev.header, badge: e.target.value },
                      }))
                    }
                    className="w-full px-4 py-3 rounded-xl bg-[#121316] border border-[#262930] text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="text-xs uppercase font-semibold text-[#CBD0DC] block mb-2">
                    Main Title Heading
                  </label>
                  <input
                    type="text"
                    value={contactDraft.header.heading}
                    onChange={(e) =>
                      setContactDraft((prev) => ({
                        ...prev,
                        header: { ...prev.header, heading: e.target.value },
                      }))
                    }
                    className="w-full px-4 py-3 rounded-xl bg-[#121316] border border-[#262930] text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs uppercase font-semibold text-[#CBD0DC] block mb-2">
                    Subtitle Description
                  </label>
                  <textarea
                    rows={3}
                    value={contactDraft.header.subtitle}
                    onChange={(e) =>
                      setContactDraft((prev) => ({
                        ...prev,
                        header: { ...prev.header, subtitle: e.target.value },
                      }))
                    }
                    className="w-full px-4 py-3 rounded-xl bg-[#121316] border border-[#262930] text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==============================================================
            WATCHES, ACCESSORIES & SHOP PAGES EDITORS
            ============================================================== */}
        {(activePage === 'watches' || activePage === 'accessories' || activePage === 'shop') && (
          <div className="space-y-8">
            <div className="p-6 sm:p-8 rounded-2xl bg-[#0B0C0E]/60 border border-[#262930] space-y-6">
              <h3 className="text-lg font-bold font-serif-luxury text-white gold-glow-subtle border-b border-[#262930] pb-3">
                {activePage === 'watches'
                  ? 'Watches Collection Header Banner'
                  : activePage === 'accessories'
                  ? 'Accessories Collection Header Banner'
                  : 'Showroom Catalog Header Banner'}
              </h3>

              {(() => {
                const draft =
                  activePage === 'watches'
                    ? watchesDraft
                    : activePage === 'accessories'
                    ? accessoriesDraft
                    : shopDraft;

                const setDraft =
                  activePage === 'watches'
                    ? setWatchesDraft
                    : activePage === 'accessories'
                    ? setAccessoriesDraft
                    : setShopDraft;

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-xs uppercase font-semibold text-[#CBD0DC] block mb-2">
                        Eyebrow Tagline
                      </label>
                      <input
                        type="text"
                        value={draft.eyebrow}
                        onChange={(e) =>
                          setDraft((prev: any) => ({ ...prev, eyebrow: e.target.value }))
                        }
                        className="w-full px-4 py-3 rounded-xl bg-[#121316] border border-[#262930] text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>

                    <div>
                      <label className="text-xs uppercase font-semibold text-[#CBD0DC] block mb-2">
                        Main Section Heading
                      </label>
                      <input
                        type="text"
                        value={draft.heading}
                        onChange={(e) =>
                          setDraft((prev: any) => ({ ...prev, heading: e.target.value }))
                        }
                        className="w-full px-4 py-3 rounded-xl bg-[#121316] border border-[#262930] text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="text-xs uppercase font-semibold text-[#CBD0DC] block mb-2">
                        Subtitle Description
                      </label>
                      <textarea
                        rows={3}
                        value={draft.subtitle}
                        onChange={(e) =>
                          setDraft((prev: any) => ({ ...prev, subtitle: e.target.value }))
                        }
                        className="w-full px-4 py-3 rounded-xl bg-[#121316] border border-[#262930] text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="text-xs uppercase font-semibold text-[#CBD0DC] block mb-2">
                        Banner Background Image URL (Optional)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={draft.bannerImage || ''}
                          onChange={(e) =>
                            setDraft((prev: any) => ({ ...prev, bannerImage: e.target.value }))
                          }
                          placeholder="https://... or upload"
                          className="flex-1 px-4 py-3 rounded-xl bg-[#121316] border border-[#262930] text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                        />
                        <label className="px-4 py-3 rounded-xl bg-[#181A1F] hover:bg-[#20232A] text-[#D4AF37] border border-[#262930] flex items-center justify-center cursor-pointer transition-colors">
                          <Upload className="w-4 h-4" />
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) =>
                              handleUpload(activePage, (url) => {
                                setDraft((prev: any) => ({ ...prev, bannerImage: url }));
                              }, e)
                            }
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* ==============================================================
            POLICIES PAGE EDITOR
            ============================================================== */}
        {activePage === 'policies' && (
          <div className="space-y-8">
            <div className="p-6 sm:p-8 rounded-2xl bg-[#0B0C0E]/60 border border-[#262930] space-y-6">
              <h3 className="text-lg font-bold font-serif-luxury text-white gold-glow-subtle border-b border-[#262930] pb-3">
                Policy Document Headings &amp; Subtitles
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Shipping */}
                <div className="p-4 rounded-xl bg-[#121316] border border-[#262930] space-y-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#D4AF37]">
                    1. Shipping Policy
                  </span>
                  <input
                    type="text"
                    value={policiesDraft.shippingTitle}
                    onChange={(e) =>
                      setPoliciesDraft((prev) => ({ ...prev, shippingTitle: e.target.value }))
                    }
                    placeholder="Title"
                    className="w-full px-3 py-2 rounded-lg bg-[#0B0C0E] border border-[#262930] text-xs text-white"
                  />
                  <input
                    type="text"
                    value={policiesDraft.shippingSubtitle}
                    onChange={(e) =>
                      setPoliciesDraft((prev) => ({ ...prev, shippingSubtitle: e.target.value }))
                    }
                    placeholder="Subtitle"
                    className="w-full px-3 py-2 rounded-lg bg-[#0B0C0E] border border-[#262930] text-xs text-[#CBD0DC]"
                  />
                </div>

                {/* Refund */}
                <div className="p-4 rounded-xl bg-[#121316] border border-[#262930] space-y-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#D4AF37]">
                    2. Refund Policy
                  </span>
                  <input
                    type="text"
                    value={policiesDraft.refundTitle}
                    onChange={(e) =>
                      setPoliciesDraft((prev) => ({ ...prev, refundTitle: e.target.value }))
                    }
                    placeholder="Title"
                    className="w-full px-3 py-2 rounded-lg bg-[#0B0C0E] border border-[#262930] text-xs text-white"
                  />
                  <input
                    type="text"
                    value={policiesDraft.refundSubtitle}
                    onChange={(e) =>
                      setPoliciesDraft((prev) => ({ ...prev, refundSubtitle: e.target.value }))
                    }
                    placeholder="Subtitle"
                    className="w-full px-3 py-2 rounded-lg bg-[#0B0C0E] border border-[#262930] text-xs text-[#CBD0DC]"
                  />
                </div>

                {/* Privacy */}
                <div className="p-4 rounded-xl bg-[#121316] border border-[#262930] space-y-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#D4AF37]">
                    3. Privacy Policy
                  </span>
                  <input
                    type="text"
                    value={policiesDraft.privacyTitle}
                    onChange={(e) =>
                      setPoliciesDraft((prev) => ({ ...prev, privacyTitle: e.target.value }))
                    }
                    placeholder="Title"
                    className="w-full px-3 py-2 rounded-lg bg-[#0B0C0E] border border-[#262930] text-xs text-white"
                  />
                  <input
                    type="text"
                    value={policiesDraft.privacySubtitle}
                    onChange={(e) =>
                      setPoliciesDraft((prev) => ({ ...prev, privacySubtitle: e.target.value }))
                    }
                    placeholder="Subtitle"
                    className="w-full px-3 py-2 rounded-lg bg-[#0B0C0E] border border-[#262930] text-xs text-[#CBD0DC]"
                  />
                </div>

                {/* Terms */}
                <div className="p-4 rounded-xl bg-[#121316] border border-[#262930] space-y-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#D4AF37]">
                    4. Terms &amp; Conditions
                  </span>
                  <input
                    type="text"
                    value={policiesDraft.termsTitle}
                    onChange={(e) =>
                      setPoliciesDraft((prev) => ({ ...prev, termsTitle: e.target.value }))
                    }
                    placeholder="Title"
                    className="w-full px-3 py-2 rounded-lg bg-[#0B0C0E] border border-[#262930] text-xs text-white"
                  />
                  <input
                    type="text"
                    value={policiesDraft.termsSubtitle}
                    onChange={(e) =>
                      setPoliciesDraft((prev) => ({ ...prev, termsSubtitle: e.target.value }))
                    }
                    placeholder="Subtitle"
                    className="w-full px-3 py-2 rounded-lg bg-[#0B0C0E] border border-[#262930] text-xs text-[#CBD0DC]"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==============================================================
            PAGE SAVE & RESET BUTTONS
            ============================================================== */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#262930]">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => handleSavePage(activePage)}
              className="w-full sm:w-auto py-3.5 px-8 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#C5A059] hover:from-[#E5C378] hover:to-[#D4AF37] text-[#0B0C0E] text-xs font-bold uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Save {activePage.toUpperCase()} Changes</span>
            </button>

            <button
              type="button"
              onClick={() => handleResetPage(activePage)}
              className="py-3.5 px-5 rounded-xl bg-[#181A1F] hover:bg-[#20232A] text-[#8E929E] hover:text-[#E8E8EC] border border-[#262930] text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset Page Defaults</span>
            </button>
          </div>
        </div>

        {/* ==============================================================
            CUSTOM SECTIONS MANAGER (ADD MORE SECTIONS OF TEXT & IMAGES)
            ============================================================== */}
        <div className="pt-8 border-t border-[#262930] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#D4AF37] font-bold">
                <Layout className="w-4 h-4" />
                <span>Custom Extra Sections</span>
              </div>
              <h3 className="text-xl font-bold font-serif-luxury text-white mt-1">
                Add More Text, Image &amp; Heading Sections to {activePage.toUpperCase()}
              </h3>
              <p className="text-xs text-[#8E929E] mt-0.5">
                Add bespoke luxury banners, story sections, featured blocks, or image callouts dynamically.
              </p>
            </div>

            <button
              type="button"
              onClick={() => openNewSectionModal(activePage)}
              className="py-3 px-6 rounded-xl bg-[#D4AF37] hover:bg-[#E5C378] text-[#0B0C0E] text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 self-start sm:self-auto cursor-pointer shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Section</span>
            </button>
          </div>

          {currentSections.length === 0 ? (
            <div className="p-8 rounded-2xl bg-[#0B0C0E]/40 border border-dashed border-[#262930] text-center space-y-3">
              <Type className="w-8 h-8 text-[#8E929E] mx-auto opacity-40" />
              <p className="text-sm font-semibold text-[#CBD0DC]">No custom extra sections added yet</p>
              <p className="text-xs text-[#8E929E] max-w-md mx-auto">
                Need to tell another story, showcase a collection feature, or place an editorial text block? Click &ldquo;Add New Section&rdquo; above.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {currentSections.map((sec, idx) => (
                <div
                  key={sec.id}
                  className={`p-5 rounded-2xl border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                    sec.enabled
                      ? 'bg-[#121316] border-[#262930] hover:border-[#D4AF37]/40'
                      : 'bg-[#121316]/50 border-white/5 opacity-60'
                  }`}
                >
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <span className="text-xs font-mono font-bold text-[#D4AF37] p-2 rounded-lg bg-[#181A1F] border border-white/5">
                      #{idx + 1}
                    </span>
                    {sec.image && (
                      <img
                        src={sec.image}
                        alt={sec.title}
                        className="w-16 h-12 object-cover rounded-lg border border-white/10 shrink-0"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30">
                          {sec.layout || 'card'}
                        </span>
                        {sec.badge && (
                          <span className="text-[10px] text-[#8E929E] font-medium truncate">
                            [{sec.badge}]
                          </span>
                        )}
                        {!sec.enabled && (
                          <span className="text-[10px] text-amber-400 font-semibold">(Hidden)</span>
                        )}
                      </div>
                      <h4 className="text-base font-bold text-white font-serif-luxury truncate mt-1">
                        {sec.title || 'Untitled Section'}
                      </h4>
                      <p className="text-xs text-[#8E929E] line-clamp-1 mt-0.5">
                        {sec.content || 'No text content'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                    {/* Toggle Visibility */}
                    <button
                      type="button"
                      onClick={() =>
                        updateCustomSection(activePage, sec.id, { enabled: !sec.enabled })
                      }
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer border ${
                        sec.enabled
                          ? 'bg-[#181A1F] text-emerald-400 border-emerald-500/30'
                          : 'bg-[#181A1F] text-[#8E929E] border-white/10'
                      }`}
                    >
                      {sec.enabled ? 'Visible' : 'Hidden'}
                    </button>

                    {/* Reorder Up */}
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => reorderCustomSection(activePage, sec.id, 'up')}
                      className="p-2 rounded-lg bg-[#181A1F] text-[#8E929E] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed border border-[#262930] cursor-pointer"
                      title="Move Up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>

                    {/* Reorder Down */}
                    <button
                      type="button"
                      disabled={idx === currentSections.length - 1}
                      onClick={() => reorderCustomSection(activePage, sec.id, 'down')}
                      className="p-2 rounded-lg bg-[#181A1F] text-[#8E929E] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed border border-[#262930] cursor-pointer"
                      title="Move Down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>

                    {/* Edit */}
                    <button
                      type="button"
                      onClick={() =>
                        setEditingSection({
                          page: activePage,
                          section: { ...sec },
                          isNew: false,
                        })
                      }
                      className="p-2 rounded-lg bg-[#181A1F] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#0B0C0E] border border-[#262930] cursor-pointer transition-colors"
                      title="Edit Section"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Delete section "${sec.title || 'Untitled'}"?`)) {
                          deleteCustomSection(activePage, sec.id);
                        }
                      }}
                      className="p-2 rounded-lg bg-[#181A1F] text-rose-400 hover:bg-rose-500 hover:text-white border border-[#262930] cursor-pointer transition-colors"
                      title="Delete Section"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ==============================================================
          MODAL: ADD / EDIT CUSTOM SECTION
          ============================================================== */}
      {editingSection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-2xl bg-[#121316] border border-[#262930] rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-[#262930] pb-4">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#D4AF37]">
                  {editingSection.page.toUpperCase()} Page
                </span>
                <h3 className="text-xl font-bold font-serif-luxury text-white gold-glow-subtle">
                  {editingSection.isNew ? 'Add New Content Section' : 'Edit Section Details'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingSection(null)}
                className="p-2 rounded-xl bg-[#181A1F] text-[#8E929E] hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-5 max-h-[65vh] overflow-y-auto pr-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase font-semibold text-[#CBD0DC] block mb-1.5">
                    Section Heading (Title) *
                  </label>
                  <input
                    type="text"
                    value={editingSection.section.title}
                    onChange={(e) =>
                      setEditingSection({
                        ...editingSection,
                        section: { ...editingSection.section, title: e.target.value },
                      })
                    }
                    placeholder="e.g. Masterful Titanium Finishing"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0C0E] border border-[#262930] text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="text-xs uppercase font-semibold text-[#CBD0DC] block mb-1.5">
                    Eyebrow / Subtitle
                  </label>
                  <input
                    type="text"
                    value={editingSection.section.subtitle || ''}
                    onChange={(e) =>
                      setEditingSection({
                        ...editingSection,
                        section: { ...editingSection.section, subtitle: e.target.value },
                      })
                    }
                    placeholder="e.g. Atelier Innovation"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0C0E] border border-[#262930] text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase font-semibold text-[#CBD0DC] block mb-1.5">
                    Badge Tag (Pill)
                  </label>
                  <input
                    type="text"
                    value={editingSection.section.badge || ''}
                    onChange={(e) =>
                      setEditingSection({
                        ...editingSection,
                        section: { ...editingSection.section, badge: e.target.value },
                      })
                    }
                    placeholder="e.g. Limited Edition"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0C0E] border border-[#262930] text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="text-xs uppercase font-semibold text-[#CBD0DC] block mb-1.5">
                    Layout Style
                  </label>
                  <select
                    value={editingSection.section.layout || 'card'}
                    onChange={(e) =>
                      setEditingSection({
                        ...editingSection,
                        section: {
                          ...editingSection.section,
                          layout: e.target.value as any,
                        },
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0C0E] border border-[#262930] text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="card">Luxury Glass Card</option>
                    <option value="split">Split Columns (Image + Text)</option>
                    <option value="centered">Centered Editorial</option>
                    <option value="banner">Wide Full Banner</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs uppercase font-semibold text-[#CBD0DC] block mb-1.5">
                  Body Text Content * (Multi-paragraph supported, separate with blank lines)
                </label>
                <textarea
                  rows={5}
                  value={editingSection.section.content}
                  onChange={(e) =>
                    setEditingSection({
                      ...editingSection,
                      section: { ...editingSection.section, content: e.target.value },
                    })
                  }
                  placeholder="Enter detailed text content for this section..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0C0E] border border-[#262930] text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase font-semibold text-[#CBD0DC] block mb-1.5">
                    Section Image URL (Optional)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editingSection.section.image || ''}
                      onChange={(e) =>
                        setEditingSection({
                          ...editingSection,
                          section: { ...editingSection.section, image: e.target.value },
                        })
                      }
                      placeholder="https://... or upload"
                      className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#0B0C0E] border border-[#262930] text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                    />
                    <label className="px-3.5 py-2.5 rounded-xl bg-[#181A1F] hover:bg-[#20232A] text-[#D4AF37] border border-[#262930] flex items-center justify-center cursor-pointer">
                      <Upload className="w-4 h-4" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          handleUpload('modalSecImage', (url) => {
                            setEditingSection((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    section: { ...prev.section, image: url },
                                  }
                                : null
                            );
                          }, e)
                        }
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="text-xs uppercase font-semibold text-[#CBD0DC] block mb-1.5">
                    Image Position (For Split Layout)
                  </label>
                  <select
                    value={editingSection.section.imagePosition || 'right'}
                    onChange={(e) =>
                      setEditingSection({
                        ...editingSection,
                        section: {
                          ...editingSection.section,
                          imagePosition: e.target.value as any,
                        },
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0C0E] border border-[#262930] text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="right">Right Side</option>
                    <option value="left">Left Side</option>
                    <option value="top">Top</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase font-semibold text-[#CBD0DC] block mb-1.5">
                    CTA Button Text (Optional)
                  </label>
                  <input
                    type="text"
                    value={editingSection.section.ctaText || ''}
                    onChange={(e) =>
                      setEditingSection({
                        ...editingSection,
                        section: { ...editingSection.section, ctaText: e.target.value },
                      })
                    }
                    placeholder="e.g. Explore Horology"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0C0E] border border-[#262930] text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="text-xs uppercase font-semibold text-[#CBD0DC] block mb-1.5">
                    CTA Destination Page
                  </label>
                  <select
                    value={editingSection.section.ctaTarget || 'watches'}
                    onChange={(e) =>
                      setEditingSection({
                        ...editingSection,
                        section: {
                          ...editingSection.section,
                          ctaTarget: e.target.value as any,
                        },
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0C0E] border border-[#262930] text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="watches">Watches Collection</option>
                    <option value="accessories">Accessories Collection</option>
                    <option value="shop">Full Catalog</option>
                    <option value="about">About Maison</option>
                    <option value="contact">Contact Concierge</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="sec-enabled-check"
                  checked={editingSection.section.enabled}
                  onChange={(e) =>
                    setEditingSection({
                      ...editingSection,
                      section: { ...editingSection.section, enabled: e.target.checked },
                    })
                  }
                  className="w-4 h-4 rounded text-[#D4AF37] focus:ring-0 bg-[#0B0C0E] border-[#262930]"
                />
                <label htmlFor="sec-enabled-check" className="text-xs text-[#CBD0DC] cursor-pointer">
                  Section is Active &amp; Visible to Patrons
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#262930]">
              <button
                type="button"
                onClick={() => setEditingSection(null)}
                className="py-2.5 px-5 rounded-xl bg-[#181A1F] hover:bg-[#20232A] text-[#8E929E] text-xs font-semibold uppercase tracking-wider cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveSectionModal}
                className="py-2.5 px-6 rounded-xl bg-[#D4AF37] hover:bg-[#E5C378] text-[#0B0C0E] text-xs font-bold uppercase tracking-wider cursor-pointer shadow-lg"
              >
                {editingSection.isNew ? 'Create Section' : 'Save Section'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

