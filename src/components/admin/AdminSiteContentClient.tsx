'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Save,
  Check,
  AlertCircle,
  RefreshCw,
  Plus,
  Trash2,
  ExternalLink,
  Layers,
  Sparkles,
  Users,
  Info,
  TrendingUp,
  BookOpen,
  ShoppingBag,
  PhoneCall,
  Eye,
  EyeOff,
  Calendar,
  Compass,
  Mail,
} from 'lucide-react';
import Link from 'next/link';
import { getSiteContentDoc, saveSiteContentDoc } from '@/lib/firebase/firestore';
import {
  HeroContent,
  StatsContent,
  TeachingContent,
  CommunityContent,
  CallStructureContent,
  StoreSectionContent,
  OneOnOneContent,
  AboutContent,
  FinalCTAContent,
  BookContent,
  CommunityPageContent,
  AboutPageContent,
  ContactPageContent,
  StorePageContent,
} from '@/types/site-content';
import {
  DEFAULT_HERO_CONTENT,
  DEFAULT_STATS_CONTENT,
  DEFAULT_TEACHING_CONTENT,
  DEFAULT_COMMUNITY_CONTENT,
  DEFAULT_CALL_STRUCTURE_CONTENT,
  DEFAULT_STORE_SECTION_CONTENT,
  DEFAULT_ONE_ON_ONE_CONTENT,
  DEFAULT_ABOUT_CONTENT,
  DEFAULT_FINAL_CTA_CONTENT,
  DEFAULT_BOOK_PAGE_CONTENT,
  DEFAULT_COMMUNITY_PAGE_CONTENT,
  DEFAULT_ABOUT_PAGE_CONTENT,
  DEFAULT_CONTACT_PAGE_CONTENT,
  DEFAULT_STORE_PAGE_CONTENT,
} from '@/lib/firebase/content';

type TabKey =
  | 'hero'
  | 'stats'
  | 'teaching'
  | 'community'
  | 'callStructure'
  | 'book'
  | 'store'
  | 'oneOnOne'
  | 'about'
  | 'finalCta'
  | 'communityPage'
  | 'aboutPage'
  | 'contactPage'
  | 'storePage';

interface TabDefinition {
  key: TabKey;
  label: string;
  category: 'homepage' | 'pages';
  icon: React.ReactNode;
  previewUrl: string;
  description: string;
}

const TABS: TabDefinition[] = [
  // Homepage Sections
  {
    key: 'hero',
    label: 'Hero Banner',
    category: 'homepage',
    icon: <Sparkles className="w-4 h-4" />,
    previewUrl: '/#top',
    description: 'Main introduction, headline, credibility quote, and primary action buttons.',
  },
  {
    key: 'stats',
    label: 'Statistics',
    category: 'homepage',
    icon: <TrendingUp className="w-4 h-4" />,
    previewUrl: '/#stats',
    description: 'Four track-record metrics from Geetha’s working bookkeeping firm.',
  },
  {
    key: 'teaching',
    label: 'What I Teach',
    category: 'homepage',
    icon: <Compass className="w-4 h-4" />,
    previewUrl: '/#what-i-teach',
    description: 'Practical curriculum cards (discovery, pricing, workflows, software).',
  },
  {
    key: 'community',
    label: 'Community Promo',
    category: 'homepage',
    icon: <Users className="w-4 h-4" />,
    previewUrl: '/#community',
    description: 'Live mentorship overview, included benefits, and monthly membership pricing.',
  },
  {
    key: 'callStructure',
    label: 'Call Agenda',
    category: 'homepage',
    icon: <Calendar className="w-4 h-4" />,
    previewUrl: '/#community',
    description: 'Structured 3-part agenda for twice-weekly live group mentorship calls.',
  },
  {
    key: 'book',
    label: 'The Book & Chapters',
    category: 'homepage',
    icon: <BookOpen className="w-4 h-4" />,
    previewUrl: '/book',
    description: 'Book details, formats, compatibility, download URLs, chapters, and FAQ.',
  },
  {
    key: 'store',
    label: 'Store Promo Banner',
    category: 'homepage',
    icon: <ShoppingBag className="w-4 h-4" />,
    previewUrl: '/#store',
    description: 'Templates & cheat sheets promotional section on the homepage.',
  },
  {
    key: 'oneOnOne',
    label: '1-on-1 Strategy Call',
    category: 'homepage',
    icon: <PhoneCall className="w-4 h-4" />,
    previewUrl: '/#call',
    description: 'Private 30-minute consultation details, deliverables, and booking CTA.',
  },
  {
    key: 'about',
    label: 'About Geetha',
    category: 'homepage',
    icon: <Layers className="w-4 h-4" />,
    previewUrl: '/#about',
    description: 'Founder biography, background story, and 3 core life/business priorities.',
  },
  {
    key: 'finalCta',
    label: 'Final CTA',
    category: 'homepage',
    icon: <Sparkles className="w-4 h-4" />,
    previewUrl: '/#top',
    description: 'Closing call to action banner before the footer on the homepage.',
  },

  // Dedicated Pages
  {
    key: 'communityPage',
    label: 'Community Page',
    category: 'pages',
    icon: <Users className="w-4 h-4" />,
    previewUrl: '/community',
    description: 'Full /community page layout, benefits list, call schedule, and FAQs.',
  },
  {
    key: 'aboutPage',
    label: 'About Page',
    category: 'pages',
    icon: <Layers className="w-4 h-4" />,
    previewUrl: '/about',
    description: 'Full /about narrative, firm history, and core values.',
  },
  {
    key: 'contactPage',
    label: 'Contact Page & Form',
    category: 'pages',
    icon: <Mail className="w-4 h-4" />,
    previewUrl: '/contact',
    description: 'Contact copy, support email, and authenticated contact form availability switch.',
  },
  {
    key: 'storePage',
    label: 'Store Page',
    category: 'pages',
    icon: <ShoppingBag className="w-4 h-4" />,
    previewUrl: '/store',
    description: 'Full /store title, subtitle, and member perk recommendation banner.',
  },
];

export default function AdminSiteContentClient() {
  const [activeTab, setActiveTab] = useState<TabKey>('hero');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'homepage' | 'pages'>('all');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Content state for all 14 managed sections
  const [hero, setHero] = useState<HeroContent>(DEFAULT_HERO_CONTENT);
  const [stats, setStats] = useState<StatsContent>(DEFAULT_STATS_CONTENT);
  const [teaching, setTeaching] = useState<TeachingContent>(DEFAULT_TEACHING_CONTENT);
  const [community, setCommunity] = useState<CommunityContent>(DEFAULT_COMMUNITY_CONTENT);
  const [callStructure, setCallStructure] = useState<CallStructureContent>(DEFAULT_CALL_STRUCTURE_CONTENT);
  const [book, setBook] = useState<BookContent>(DEFAULT_BOOK_PAGE_CONTENT);
  const [store, setStore] = useState<StoreSectionContent>(DEFAULT_STORE_SECTION_CONTENT);
  const [oneOnOne, setOneOnOne] = useState<OneOnOneContent>(DEFAULT_ONE_ON_ONE_CONTENT);
  const [about, setAbout] = useState<AboutContent>(DEFAULT_ABOUT_CONTENT);
  const [finalCta, setFinalCta] = useState<FinalCTAContent>(DEFAULT_FINAL_CTA_CONTENT);
  const [communityPage, setCommunityPage] = useState<CommunityPageContent>(DEFAULT_COMMUNITY_PAGE_CONTENT);
  const [aboutPage, setAboutPage] = useState<AboutPageContent>(DEFAULT_ABOUT_PAGE_CONTENT);
  const [contactPage, setContactPage] = useState<ContactPageContent>(DEFAULT_CONTACT_PAGE_CONTENT);
  const [storePage, setStorePage] = useState<StorePageContent>(DEFAULT_STORE_PAGE_CONTENT);

  const loadAllContent = useCallback(async () => {
    try {
      const [
        heroDoc,
        statsDoc,
        teachDoc,
        commDoc,
        callDoc,
        bookDoc,
        storeDoc,
        call1on1Doc,
        aboutDoc,
        ctaDoc,
        commPageDoc,
        aboutPageDoc,
        contactPageDoc,
        storePageDoc,
      ] = await Promise.all([
        getSiteContentDoc<HeroContent>('hero'),
        getSiteContentDoc<StatsContent>('stats'),
        getSiteContentDoc<TeachingContent>('teaching'),
        getSiteContentDoc<CommunityContent>('community'),
        getSiteContentDoc<CallStructureContent>('callStructure'),
        getSiteContentDoc<BookContent>('book'),
        getSiteContentDoc<StoreSectionContent>('store'),
        getSiteContentDoc<OneOnOneContent>('oneOnOne'),
        getSiteContentDoc<AboutContent>('about'),
        getSiteContentDoc<FinalCTAContent>('finalCta'),
        getSiteContentDoc<CommunityPageContent>('communityPage'),
        getSiteContentDoc<AboutPageContent>('aboutPage'),
        getSiteContentDoc<ContactPageContent>('contactPage'),
        getSiteContentDoc<StorePageContent>('storePage'),
      ]);

      if (heroDoc) setHero((prev) => ({ ...prev, ...heroDoc }));
      if (statsDoc) setStats((prev) => ({ ...prev, ...statsDoc }));
      if (teachDoc) setTeaching((prev) => ({ ...prev, ...teachDoc }));
      if (commDoc) setCommunity((prev) => ({ ...prev, ...commDoc }));
      if (callDoc) setCallStructure((prev) => ({ ...prev, ...callDoc }));
      if (bookDoc) setBook((prev) => ({ ...prev, ...bookDoc }));
      if (storeDoc) setStore((prev) => ({ ...prev, ...storeDoc }));
      if (call1on1Doc) setOneOnOne((prev) => ({ ...prev, ...call1on1Doc }));
      if (aboutDoc) setAbout((prev) => ({ ...prev, ...aboutDoc }));
      if (ctaDoc) setFinalCta((prev) => ({ ...prev, ...ctaDoc }));
      if (commPageDoc) setCommunityPage((prev) => ({ ...prev, ...commPageDoc }));
      if (aboutPageDoc) setAboutPage((prev) => ({ ...prev, ...aboutPageDoc }));
      if (contactPageDoc) setContactPage((prev) => ({ ...prev, ...contactPageDoc }));
      if (storePageDoc) setStorePage((prev) => ({ ...prev, ...storePageDoc }));
    } catch (err: unknown) {
      console.warn('Error loading site content from Firestore:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAllContent();
  }, [loadAllContent]);

  const handleSaveCurrentSection = async () => {
    setSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      let dataToSave: unknown;
      let sectionName = '';

      switch (activeTab) {
        case 'hero':
          dataToSave = hero;
          sectionName = 'Hero Banner';
          break;
        case 'stats':
          dataToSave = stats;
          sectionName = 'Statistics';
          break;
        case 'teaching':
          dataToSave = teaching;
          sectionName = 'What I Teach';
          break;
        case 'community':
          dataToSave = community;
          sectionName = 'The Community';
          break;
        case 'callStructure':
          dataToSave = callStructure;
          sectionName = 'Call Agenda';
          break;
        case 'book':
          dataToSave = book;
          sectionName = 'The Book & Chapters';
          break;
        case 'store':
          dataToSave = store;
          sectionName = 'Store Section';
          break;
        case 'oneOnOne':
          dataToSave = oneOnOne;
          sectionName = '1-on-1 Strategy Call';
          break;
        case 'about':
          dataToSave = about;
          sectionName = 'About Geetha';
          break;
        case 'finalCta':
          dataToSave = finalCta;
          sectionName = 'Final CTA';
          break;
        case 'communityPage':
          dataToSave = communityPage;
          sectionName = 'Community Page';
          break;
        case 'aboutPage':
          dataToSave = aboutPage;
          sectionName = 'About Page';
          break;
        case 'contactPage':
          dataToSave = contactPage;
          sectionName = 'Contact Page';
          break;
        case 'storePage':
          dataToSave = storePage;
          sectionName = 'Store Page';
          break;
      }

      if (dataToSave) {
        await saveSiteContentDoc(activeTab, dataToSave as Record<string, unknown>);

        // Trigger on-demand Next.js static/ISR revalidation
        try {
          await fetch('/api/admin/site-content/revalidate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ section: activeTab }),
          });
        } catch (revErr) {
          console.warn('[CMS] Background revalidation notice:', revErr);
        }
      }

      setSuccessMessage(`Saved "${sectionName}" to Firestore. Changes are live on the website.`);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save section content';
      setErrorMessage(msg);
    } finally {
      setSaving(false);
    }
  };

  const getSectionEnabledState = (tabKey: TabKey): boolean => {
    switch (tabKey) {
      case 'hero':
        return hero.enabled !== false;
      case 'stats':
        return stats.enabled !== false;
      case 'teaching':
        return teaching.enabled !== false;
      case 'community':
        return community.enabled !== false;
      case 'callStructure':
        return callStructure.enabled !== false;
      case 'book':
        return book.enabled !== false;
      case 'store':
        return store.enabled !== false;
      case 'oneOnOne':
        return oneOnOne.enabled !== false;
      case 'about':
        return about.enabled !== false;
      case 'finalCta':
        return finalCta.enabled !== false;
      case 'communityPage':
        return communityPage.enabled !== false && communityPage.hero?.enabled !== false;
      case 'aboutPage':
        return aboutPage.enabled !== false && aboutPage.hero?.enabled !== false;
      case 'contactPage':
        return contactPage.enabled !== false;
      case 'storePage':
        return storePage.enabled !== false;
    }
  };

  const toggleSectionEnabled = (tabKey: TabKey) => {
    const currentState = getSectionEnabledState(tabKey);
    const newState = !currentState;

    switch (tabKey) {
      case 'hero':
        setHero({ ...hero, enabled: newState });
        break;
      case 'stats':
        setStats({ ...stats, enabled: newState });
        break;
      case 'teaching':
        setTeaching({ ...teaching, enabled: newState });
        break;
      case 'community':
        setCommunity({ ...community, enabled: newState });
        break;
      case 'callStructure':
        setCallStructure({ ...callStructure, enabled: newState });
        break;
      case 'book':
        setBook({ ...book, enabled: newState });
        break;
      case 'store':
        setStore({ ...store, enabled: newState });
        break;
      case 'oneOnOne':
        setOneOnOne({ ...oneOnOne, enabled: newState });
        break;
      case 'about':
        setAbout({ ...about, enabled: newState });
        break;
      case 'finalCta':
        setFinalCta({ ...finalCta, enabled: newState });
        break;
      case 'communityPage':
        setCommunityPage({
          ...communityPage,
          enabled: newState,
          hero: { ...communityPage.hero, enabled: newState },
        });
        break;
      case 'aboutPage':
        setAboutPage({
          ...aboutPage,
          enabled: newState,
          hero: { ...aboutPage.hero, enabled: newState },
        });
        break;
      case 'contactPage':
        setContactPage({ ...contactPage, enabled: newState });
        break;
      case 'storePage':
        setStorePage({ ...storePage, enabled: newState });
        break;
    }
  };

  const currentTabDef = TABS.find((t) => t.key === activeTab)!;
  const isCurrentEnabled = getSectionEnabledState(activeTab);

  const filteredTabs = TABS.filter((t) => {
    if (categoryFilter === 'all') return true;
    return t.category === categoryFilter;
  });

  return (
    <div className="space-y-6 pb-20">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-editorial text-3xl font-semibold text-[#181918]">
            Site Content & Section CMS
          </h1>
          <p className="text-sm text-[#5C5E5B] mt-1">
            Control live copy, visibility toggles, and item-level configurations directly in Firestore.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={currentTabDef.previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#244634] bg-[#EAF0EC] rounded-lg hover:bg-[#D8E6DB] transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Preview Live
          </Link>

          <button
            onClick={handleSaveCurrentSection}
            disabled={saving || loading}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#244634] rounded-lg hover:bg-[#1E3B2C] disabled:opacity-50 transition-colors shadow-xs"
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between text-sm shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-900"
          >
            Dismiss
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-center justify-between text-sm shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-xs font-semibold text-red-700 hover:text-red-900"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 border-b border-[#E2DBD0] pb-2">
        <span className="text-xs font-mono uppercase tracking-wider text-[#706E69] mr-2">
          Scope:
        </span>
        <button
          onClick={() => setCategoryFilter('all')}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            categoryFilter === 'all'
              ? 'bg-[#244634] text-white'
              : 'bg-[#F4EFE6] text-[#5C5E5B] hover:text-[#181918]'
          }`}
        >
          All Sections ({TABS.length})
        </button>
        <button
          onClick={() => setCategoryFilter('homepage')}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            categoryFilter === 'homepage'
              ? 'bg-[#244634] text-white'
              : 'bg-[#F4EFE6] text-[#5C5E5B] hover:text-[#181918]'
          }`}
        >
          Homepage ({TABS.filter((t) => t.category === 'homepage').length})
        </button>
        <button
          onClick={() => setCategoryFilter('pages')}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            categoryFilter === 'pages'
              ? 'bg-[#244634] text-white'
              : 'bg-[#F4EFE6] text-[#5C5E5B] hover:text-[#181918]'
          }`}
        >
          Dedicated Pages ({TABS.filter((t) => t.category === 'pages').length})
        </button>
      </div>

      {/* Tabs Navigation Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {filteredTabs.map((tab) => {
          const enabled = getSectionEnabledState(tab.key);
          const isSelected = activeTab === tab.key;

          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                isSelected
                  ? 'bg-white border-[#244634] shadow-sm ring-1 ring-[#244634]'
                  : 'bg-[#FAF7F2] border-[#E2DBD0] hover:bg-white hover:border-[#C5D8CC]'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span
                  className={`${
                    isSelected ? 'text-[#244634]' : 'text-[#706E69]'
                  }`}
                >
                  {tab.icon}
                </span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    enabled ? 'bg-emerald-500' : 'bg-gray-300'
                  }`}
                  title={enabled ? 'Visible' : 'Hidden'}
                />
              </div>
              <span
                className={`text-xs font-medium truncate ${
                  isSelected ? 'text-[#181918] font-semibold' : 'text-[#5C5E5B]'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Section Editor Card */}
      <div className="bg-white rounded-2xl border border-[#E2DBD0] shadow-xs overflow-hidden">
        {/* Editor Card Header with Master Visibility Switch */}
        <div className="p-6 border-b border-[#E8E2D7] bg-[#FAF7F2]/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-lg bg-[#EAF0EC] text-[#244634]">
                {currentTabDef.icon}
              </span>
              <div>
                <h2 className="font-editorial text-2xl font-semibold text-[#181918]">
                  {currentTabDef.label}
                </h2>
                <p className="text-xs text-[#5C5E5B] mt-0.5">
                  {currentTabDef.description}
                </p>
              </div>
            </div>
          </div>

          {/* Master Enable/Disable Control */}
          <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-xl border border-[#E2DBD0] shadow-xs">
            <div className="text-right">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[#181918]">
                  Section Visibility:
                </span>
                {isCurrentEnabled ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <Eye className="w-3 h-3 text-emerald-600" />
                    Visible
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                    <EyeOff className="w-3 h-3 text-amber-600" />
                    Hidden
                  </span>
                )}
              </div>
              <p className="text-[10px] text-[#706E69]">
                {isCurrentEnabled
                  ? 'Rendering on public site'
                  : 'Hidden from public visitors'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => toggleSectionEnabled(activeTab)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                isCurrentEnabled ? 'bg-[#244634]' : 'bg-gray-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  isCurrentEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Tab Specific Form Content */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* HERO TAB */}
          {activeTab === 'hero' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#706E69] mb-1.5 font-semibold">
                    Eyebrow Badge
                  </label>
                  <input
                    type="text"
                    value={hero.eyebrow}
                    onChange={(e) => setHero({ ...hero, eyebrow: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8D1C5] focus:outline-hidden focus:border-[#244634] text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#706E69] mb-1.5 font-semibold">
                    Headline
                  </label>
                  <input
                    type="text"
                    value={hero.headline}
                    onChange={(e) => setHero({ ...hero, headline: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8D1C5] focus:outline-hidden focus:border-[#244634] text-sm font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#706E69] mb-1.5 font-semibold">
                  Supporting Copy
                </label>
                <textarea
                  rows={3}
                  value={hero.supportingCopy}
                  onChange={(e) => setHero({ ...hero, supportingCopy: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8D1C5] focus:outline-hidden focus:border-[#244634] text-sm leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-4 rounded-xl bg-[#FAF7F2] border border-[#E2DBD0]">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#706E69] mb-1.5 font-semibold">
                    Credibility Quote
                  </label>
                  <textarea
                    rows={2}
                    value={hero.credibilityQuote}
                    onChange={(e) =>
                      setHero({ ...hero, credibilityQuote: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-lg border border-[#D8D1C5] bg-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#706E69] mb-1.5 font-semibold">
                    Quote Attribution
                  </label>
                  <input
                    type="text"
                    value={hero.credibilityAuthor}
                    onChange={(e) =>
                      setHero({ ...hero, credibilityAuthor: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-lg border border-[#D8D1C5] bg-white text-sm mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#706E69] mb-1.5 font-semibold">
                    Primary Button Label
                  </label>
                  <input
                    type="text"
                    value={hero.primaryButtonText}
                    onChange={(e) =>
                      setHero({ ...hero, primaryButtonText: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8D1C5] text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#706E69] mb-1.5 font-semibold">
                    Secondary Button Label
                  </label>
                  <input
                    type="text"
                    value={hero.secondaryButtonText}
                    onChange={(e) =>
                      setHero({ ...hero, secondaryButtonText: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8D1C5] text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STATS TAB */}
          {activeTab === 'stats' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#706E69] mb-1 font-semibold">
                    Eyebrow
                  </label>
                  <input
                    type="text"
                    value={stats.eyebrow}
                    onChange={(e) => setStats({ ...stats, eyebrow: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#D8D1C5] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#706E69] mb-1 font-semibold">
                    Heading
                  </label>
                  <input
                    type="text"
                    value={stats.title}
                    onChange={(e) => setStats({ ...stats, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#D8D1C5] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#706E69] mb-1 font-semibold">
                    Subtitle
                  </label>
                  <input
                    type="text"
                    value={stats.subtitle}
                    onChange={(e) => setStats({ ...stats, subtitle: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#D8D1C5] text-sm"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-[#181918]">
                    Individual Stat Cards ({stats.stats?.length || 0})
                  </h3>
                  <button
                    type="button"
                    onClick={() =>
                      setStats({
                        ...stats,
                        stats: [
                          ...(stats.stats || []),
                          {
                            id: `stat-${Date.now()}`,
                            enabled: true,
                            value: '100%',
                            label: 'Metric Name',
                            detail: 'Supporting context detail',
                          },
                        ],
                      })
                    }
                    className="inline-flex items-center gap-1.5 text-xs text-[#244634] font-semibold bg-[#EAF0EC] px-3 py-1.5 rounded-lg hover:bg-[#D8E6DB]"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Stat Card
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {stats.stats?.map((stat, idx) => (
                    <div
                      key={stat.id || idx}
                      className="p-4 rounded-xl border border-[#E2DBD0] bg-[#FAF7F2] space-y-3 relative"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <label className="text-xs font-mono uppercase tracking-wider text-[#706E69]">
                            Active:
                          </label>
                          <input
                            type="checkbox"
                            checked={stat.enabled !== false}
                            onChange={(e) => {
                              const updated = [...stats.stats];
                              updated[idx] = { ...updated[idx], enabled: e.target.checked };
                              setStats({ ...stats, stats: updated });
                            }}
                            className="rounded text-[#244634] focus:ring-[#244634] w-4 h-4"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = stats.stats.filter((_, i) => i !== idx);
                            setStats({ ...stats, stats: updated });
                          }}
                          className="text-xs text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] text-[#706E69]">Display Value</label>
                          <input
                            type="text"
                            value={stat.value}
                            onChange={(e) => {
                              const updated = [...stats.stats];
                              updated[idx] = { ...updated[idx], value: e.target.value };
                              setStats({ ...stats, stats: updated });
                            }}
                            className="w-full px-2.5 py-1.5 rounded border border-[#D8D1C5] bg-white text-sm font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-[#706E69]">Metric Label</label>
                          <input
                            type="text"
                            value={stat.label}
                            onChange={(e) => {
                              const updated = [...stats.stats];
                              updated[idx] = { ...updated[idx], label: e.target.value };
                              setStats({ ...stats, stats: updated });
                            }}
                            className="w-full px-2.5 py-1.5 rounded border border-[#D8D1C5] bg-white text-sm"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] text-[#706E69]">Description Detail</label>
                        <input
                          type="text"
                          value={stat.detail}
                          onChange={(e) => {
                            const updated = [...stats.stats];
                            updated[idx] = { ...updated[idx], detail: e.target.value };
                            setStats({ ...stats, stats: updated });
                          }}
                          className="w-full px-2.5 py-1.5 rounded border border-[#D8D1C5] bg-white text-xs"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TEACHING TAB */}
          {activeTab === 'teaching' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#706E69] mb-1 font-semibold">
                    Eyebrow
                  </label>
                  <input
                    type="text"
                    value={teaching.eyebrow}
                    onChange={(e) => setTeaching({ ...teaching, eyebrow: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#D8D1C5] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#706E69] mb-1 font-semibold">
                    Title
                  </label>
                  <input
                    type="text"
                    value={teaching.title}
                    onChange={(e) => setTeaching({ ...teaching, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#D8D1C5] text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#706E69] mb-1 font-semibold">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={teaching.description}
                  onChange={(e) => setTeaching({ ...teaching, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#D8D1C5] text-sm"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-[#181918]">
                    Curriculum Cards ({teaching.topics?.length || 0})
                  </h3>
                  <button
                    type="button"
                    onClick={() =>
                      setTeaching({
                        ...teaching,
                        topics: [
                          ...(teaching.topics || []),
                          {
                            id: `topic-${Date.now()}`,
                            enabled: true,
                            number: `0${(teaching.topics?.length || 0) + 1}`,
                            title: 'New Topic',
                            tagline: 'Practical operational focus',
                            description: 'How to execute this step calmly.',
                            takeaways: ['Step 1', 'Step 2'],
                          },
                        ],
                      })
                    }
                    className="inline-flex items-center gap-1.5 text-xs text-[#244634] font-semibold bg-[#EAF0EC] px-3 py-1.5 rounded-lg hover:bg-[#D8E6DB]"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Curriculum Card
                  </button>
                </div>

                <div className="space-y-4">
                  {teaching.topics?.map((topic, idx) => (
                    <div
                      key={topic.id || idx}
                      className="p-5 rounded-xl border border-[#E2DBD0] bg-[#FAF7F2] space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-white border border-[#D8D1C5]">
                            {topic.number}
                          </span>
                          <span className="text-sm font-semibold text-[#181918]">
                            {topic.title}
                          </span>
                        </div>

                        <div className="flex items-center gap-4">
                          <label className="inline-flex items-center gap-1.5 text-xs text-[#5C5E5B]">
                            <input
                              type="checkbox"
                              checked={topic.enabled !== false}
                              onChange={(e) => {
                                const updated = [...teaching.topics];
                                updated[idx] = { ...updated[idx], enabled: e.target.checked };
                                setTeaching({ ...teaching, topics: updated });
                              }}
                              className="rounded text-[#244634] w-4 h-4"
                            />
                            Visible
                          </label>

                          <button
                            type="button"
                            onClick={() => {
                              const updated = teaching.topics.filter((_, i) => i !== idx);
                              setTeaching({ ...teaching, topics: updated });
                            }}
                            className="text-xs text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] text-[#706E69]">Number</label>
                          <input
                            type="text"
                            value={topic.number}
                            onChange={(e) => {
                              const updated = [...teaching.topics];
                              updated[idx] = { ...updated[idx], number: e.target.value };
                              setTeaching({ ...teaching, topics: updated });
                            }}
                            className="w-full px-2.5 py-1.5 rounded border border-[#D8D1C5] bg-white text-xs font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-[#706E69]">Title</label>
                          <input
                            type="text"
                            value={topic.title}
                            onChange={(e) => {
                              const updated = [...teaching.topics];
                              updated[idx] = { ...updated[idx], title: e.target.value };
                              setTeaching({ ...teaching, topics: updated });
                            }}
                            className="w-full px-2.5 py-1.5 rounded border border-[#D8D1C5] bg-white text-xs font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-[#706E69]">Tagline</label>
                          <input
                            type="text"
                            value={topic.tagline}
                            onChange={(e) => {
                              const updated = [...teaching.topics];
                              updated[idx] = { ...updated[idx], tagline: e.target.value };
                              setTeaching({ ...teaching, topics: updated });
                            }}
                            className="w-full px-2.5 py-1.5 rounded border border-[#D8D1C5] bg-white text-xs"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] text-[#706E69]">Description</label>
                        <textarea
                          rows={2}
                          value={topic.description}
                          onChange={(e) => {
                            const updated = [...teaching.topics];
                            updated[idx] = { ...updated[idx], description: e.target.value };
                            setTeaching({ ...teaching, topics: updated });
                          }}
                          className="w-full px-2.5 py-1.5 rounded border border-[#D8D1C5] bg-white text-xs"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* COMMUNITY TAB */}
          {activeTab === 'community' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#706E69] mb-1 font-semibold">
                    Eyebrow
                  </label>
                  <input
                    type="text"
                    value={community.eyebrow}
                    onChange={(e) => setCommunity({ ...community, eyebrow: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#D8D1C5] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#706E69] mb-1 font-semibold">
                    Title
                  </label>
                  <input
                    type="text"
                    value={community.title}
                    onChange={(e) => setCommunity({ ...community, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#D8D1C5] text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#706E69] mb-1 font-semibold">
                  Subtitle
                </label>
                <input
                  type="text"
                  value={community.subtitle}
                  onChange={(e) => setCommunity({ ...community, subtitle: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#D8D1C5] text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#706E69] mb-1 font-semibold">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={community.description}
                  onChange={(e) => setCommunity({ ...community, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#D8D1C5] text-sm"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-4 rounded-xl bg-[#FAF7F2] border border-[#E2DBD0]">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#706E69] mb-1 font-semibold">
                    Call Schedule Note
                  </label>
                  <input
                    type="text"
                    value={community.callSchedule}
                    onChange={(e) =>
                      setCommunity({ ...community, callSchedule: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#D8D1C5] bg-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#706E69] mb-1 font-semibold">
                    Billing Period
                  </label>
                  <input
                    type="text"
                    value={community.billingPeriod}
                    onChange={(e) =>
                      setCommunity({ ...community, billingPeriod: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#D8D1C5] bg-white text-sm"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-[#181918]">
                    Included Features List ({community.features?.length || 0})
                  </h3>
                  <button
                    type="button"
                    onClick={() =>
                      setCommunity({
                        ...community,
                        features: [...(community.features || []), 'New community benefit'],
                      })
                    }
                    className="inline-flex items-center gap-1.5 text-xs text-[#244634] font-semibold bg-[#EAF0EC] px-3 py-1.5 rounded-lg hover:bg-[#D8E6DB]"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Benefit
                  </button>
                </div>

                <div className="space-y-2">
                  {community.features?.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={feat}
                        onChange={(e) => {
                          const updated = [...community.features];
                          updated[idx] = e.target.value;
                          setCommunity({ ...community, features: updated });
                        }}
                        className="flex-1 px-3 py-2 rounded-lg border border-[#D8D1C5] text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = community.features.filter((_, i) => i !== idx);
                          setCommunity({ ...community, features: updated });
                        }}
                        className="p-2 text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* CALL STRUCTURE TAB */}
          {activeTab === 'callStructure' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#706E69] mb-1 font-semibold">
                    Eyebrow
                  </label>
                  <input
                    type="text"
                    value={callStructure.eyebrow}
                    onChange={(e) =>
                      setCallStructure({ ...callStructure, eyebrow: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#D8D1C5] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#706E69] mb-1 font-semibold">
                    Title
                  </label>
                  <input
                    type="text"
                    value={callStructure.title}
                    onChange={(e) =>
                      setCallStructure({ ...callStructure, title: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#D8D1C5] text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#706E69] mb-1 font-semibold">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={callStructure.description}
                  onChange={(e) =>
                    setCallStructure({ ...callStructure, description: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[#D8D1C5] text-sm"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-[#181918]">
                    Agenda Segments ({callStructure.steps?.length || 0})
                  </h3>
                  <button
                    type="button"
                    onClick={() =>
                      setCallStructure({
                        ...callStructure,
                        steps: [
                          ...(callStructure.steps || []),
                          {
                            id: `step-${Date.now()}`,
                            enabled: true,
                            number: `Step ${(callStructure.steps?.length || 0) + 1}`,
                            title: 'New Segment',
                            duration: '20 min',
                            description: 'Agenda breakdown details.',
                          },
                        ],
                      })
                    }
                    className="inline-flex items-center gap-1.5 text-xs text-[#244634] font-semibold bg-[#EAF0EC] px-3 py-1.5 rounded-lg hover:bg-[#D8E6DB]"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Segment
                  </button>
                </div>

                <div className="space-y-4">
                  {callStructure.steps?.map((step, idx) => (
                    <div
                      key={step.id || idx}
                      className="p-4 rounded-xl border border-[#E2DBD0] bg-[#FAF7F2] space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <label className="text-xs font-semibold text-[#181918]">
                            Active:
                          </label>
                          <input
                            type="checkbox"
                            checked={step.enabled !== false}
                            onChange={(e) => {
                              const updated = [...callStructure.steps];
                              updated[idx] = { ...updated[idx], enabled: e.target.checked };
                              setCallStructure({ ...callStructure, steps: updated });
                            }}
                            className="rounded text-[#244634] w-4 h-4"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = callStructure.steps.filter((_, i) => i !== idx);
                            setCallStructure({ ...callStructure, steps: updated });
                          }}
                          className="text-xs text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] text-[#706E69]">Step Badge</label>
                          <input
                            type="text"
                            value={step.number}
                            onChange={(e) => {
                              const updated = [...callStructure.steps];
                              updated[idx] = { ...updated[idx], number: e.target.value };
                              setCallStructure({ ...callStructure, steps: updated });
                            }}
                            className="w-full px-2.5 py-1.5 rounded border border-[#D8D1C5] bg-white text-xs font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-[#706E69]">Title</label>
                          <input
                            type="text"
                            value={step.title}
                            onChange={(e) => {
                              const updated = [...callStructure.steps];
                              updated[idx] = { ...updated[idx], title: e.target.value };
                              setCallStructure({ ...callStructure, steps: updated });
                            }}
                            className="w-full px-2.5 py-1.5 rounded border border-[#D8D1C5] bg-white text-xs font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-[#706E69]">Duration / Tag</label>
                          <input
                            type="text"
                            value={step.duration}
                            onChange={(e) => {
                              const updated = [...callStructure.steps];
                              updated[idx] = { ...updated[idx], duration: e.target.value };
                              setCallStructure({ ...callStructure, steps: updated });
                            }}
                            className="w-full px-2.5 py-1.5 rounded border border-[#D8D1C5] bg-white text-xs"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] text-[#706E69]">Description</label>
                        <textarea
                          rows={2}
                          value={step.description}
                          onChange={(e) => {
                            const updated = [...callStructure.steps];
                            updated[idx] = { ...updated[idx], description: e.target.value };
                            setCallStructure({ ...callStructure, steps: updated });
                          }}
                          className="w-full px-2.5 py-1.5 rounded border border-[#D8D1C5] bg-white text-xs"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* BOOK & CHAPTERS TAB */}
          {activeTab === 'book' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#706E69] mb-1 font-semibold">
                    Eyebrow
                  </label>
                  <input
                    type="text"
                    value={book.eyebrow}
                    onChange={(e) => setBook({ ...book, eyebrow: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#D8D1C5] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#706E69] mb-1 font-semibold">
                    Book Title
                  </label>
                  <input
                    type="text"
                    value={book.title}
                    onChange={(e) => setBook({ ...book, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#D8D1C5] text-sm font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#706E69] mb-1 font-semibold">
                  Subtitle
                </label>
                <input
                  type="text"
                  value={book.subtitle}
                  onChange={(e) => setBook({ ...book, subtitle: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#D8D1C5] text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#706E69] mb-1 font-semibold">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={book.description}
                  onChange={(e) => setBook({ ...book, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#D8D1C5] text-sm leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 p-4 rounded-xl bg-[#FAF7F2] border border-[#E2DBD0]">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#706E69] mb-1 font-semibold">
                    Price (INR ₹)
                  </label>
                  <input
                    type="number"
                    value={book.price}
                    onChange={(e) => setBook({ ...book, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-[#D8D1C5] bg-white text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#706E69] mb-1 font-semibold">
                    Formats
                  </label>
                  <input
                    type="text"
                    value={book.format}
                    onChange={(e) => setBook({ ...book, format: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#D8D1C5] bg-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#706E69] mb-1 font-semibold">
                    Compatibility
                  </label>
                  <input
                    type="text"
                    value={book.compatibility}
                    onChange={(e) => setBook({ ...book, compatibility: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#D8D1C5] bg-white text-sm"
                  />
                </div>
              </div>

              {/* Download File URLs */}
              <div className="p-4 rounded-xl border border-[#E2DBD0] bg-white space-y-3">
                <h4 className="text-xs font-mono uppercase tracking-wider text-[#706E69] font-bold">
                  Protected Download Delivery URLs
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-[#706E69]">PDF Download URL</label>
                    <input
                      type="text"
                      placeholder="https://.../book.pdf"
                      value={book.pdfUrl || ''}
                      onChange={(e) => setBook({ ...book, pdfUrl: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded border border-[#D8D1C5] text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#706E69]">EPUB Download URL</label>
                    <input
                      type="text"
                      placeholder="https://.../book.epub"
                      value={book.epubUrl || ''}
                      onChange={(e) => setBook({ ...book, epubUrl: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded border border-[#D8D1C5] text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Book Chapters */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-[#181918]">
                    Table of Contents / Chapters ({book.chapters?.length || 0})
                  </h3>
                  <button
                    type="button"
                    onClick={() =>
                      setBook({
                        ...book,
                        chapters: [
                          ...(book.chapters || []),
                          {
                            id: `chap-${Date.now()}`,
                            enabled: true,
                            number: String((book.chapters?.length || 0) + 1),
                            title: 'New Chapter',
                            description: 'Chapter summary and core takeaway.',
                          },
                        ],
                      })
                    }
                    className="inline-flex items-center gap-1.5 text-xs text-[#244634] font-semibold bg-[#EAF0EC] px-3 py-1.5 rounded-lg hover:bg-[#D8E6DB]"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Chapter
                  </button>
                </div>

                <div className="space-y-3">
                  {book.chapters?.map((chap, idx) => (
                    <div
                      key={chap.id || idx}
                      className="p-3.5 rounded-xl border border-[#E2DBD0] bg-[#FAF7F2] flex items-start gap-3"
                    >
                      <input
                        type="checkbox"
                        checked={chap.enabled !== false}
                        onChange={(e) => {
                          const updated = [...(book.chapters || [])];
                          updated[idx] = { ...updated[idx], enabled: e.target.checked };
                          setBook({ ...book, chapters: updated });
                        }}
                        className="rounded text-[#244634] mt-2 w-4 h-4"
                        title="Chapter active"
                      />

                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={chap.number}
                            onChange={(e) => {
                              const updated = [...(book.chapters || [])];
                              updated[idx] = { ...updated[idx], number: e.target.value };
                              setBook({ ...book, chapters: updated });
                            }}
                            className="w-16 px-2 py-1 rounded border border-[#D8D1C5] bg-white text-xs font-mono"
                            placeholder="Ch #"
                          />
                          <input
                            type="text"
                            value={chap.title}
                            onChange={(e) => {
                              const updated = [...(book.chapters || [])];
                              updated[idx] = { ...updated[idx], title: e.target.value };
                              setBook({ ...book, chapters: updated });
                            }}
                            className="flex-1 px-2.5 py-1 rounded border border-[#D8D1C5] bg-white text-xs font-medium"
                            placeholder="Chapter Title"
                          />
                        </div>
                        <input
                          type="text"
                          value={chap.description}
                          onChange={(e) => {
                            const updated = [...(book.chapters || [])];
                            updated[idx] = { ...updated[idx], description: e.target.value };
                            setBook({ ...book, chapters: updated });
                          }}
                          className="w-full px-2.5 py-1 rounded border border-[#D8D1C5] bg-white text-xs"
                          placeholder="Summary"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const updated = (book.chapters || []).filter((_, i) => i !== idx);
                          setBook({ ...book, chapters: updated });
                        }}
                        className="text-red-600 hover:text-red-800 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STORE TAB */}
          {activeTab === 'store' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#706E69] mb-1 font-semibold">
                    Eyebrow
                  </label>
                  <input
                    type="text"
                    value={store.eyebrow}
                    onChange={(e) => setStore({ ...store, eyebrow: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#D8D1C5] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#706E69] mb-1 font-semibold">
                    Title
                  </label>
                  <input
                    type="text"
                    value={store.title}
                    onChange={(e) => setStore({ ...store, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#D8D1C5] text-sm font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#706E69] mb-1 font-semibold">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={store.description}
                  onChange={(e) => setStore({ ...store, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#D8D1C5] text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#706E69] mb-1 font-semibold">
                  Community Perk Note
                </label>
                <input
                  type="text"
                  value={store.communityNote}
                  onChange={(e) => setStore({ ...store, communityNote: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#D8D1C5] text-sm"
                />
              </div>
            </div>
          )}

          {/* 1-ON-1 TAB */}
          {activeTab === 'oneOnOne' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#706E69] mb-1 font-semibold">
                    Eyebrow
                  </label>
                  <input
                    type="text"
                    value={oneOnOne.eyebrow}
                    onChange={(e) => setOneOnOne({ ...oneOnOne, eyebrow: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#D8D1C5] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#706E69] mb-1 font-semibold">
                    Title
                  </label>
                  <input
                    type="text"
                    value={oneOnOne.title}
                    onChange={(e) => setOneOnOne({ ...oneOnOne, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#D8D1C5] text-sm font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#706E69] mb-1 font-semibold">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={oneOnOne.description}
                  onChange={(e) => setOneOnOne({ ...oneOnOne, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#D8D1C5] text-sm"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-4 rounded-xl bg-[#FAF7F2] border border-[#E2DBD0]">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#706E69] mb-1 font-semibold">
                    Session Duration / Platform
                  </label>
                  <input
                    type="text"
                    value={oneOnOne.duration}
                    onChange={(e) => setOneOnOne({ ...oneOnOne, duration: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#D8D1C5] bg-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#706E69] mb-1 font-semibold">
                    Button Label
                  </label>
                  <input
                    type="text"
                    value={oneOnOne.buttonText}
                    onChange={(e) => setOneOnOne({ ...oneOnOne, buttonText: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#D8D1C5] bg-white text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#706E69] mb-2 font-semibold">
                  Deliverables Checklist
                </label>
                <div className="space-y-2">
                  {oneOnOne.deliverables?.map((deliv, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={deliv}
                        onChange={(e) => {
                          const updated = [...oneOnOne.deliverables];
                          updated[idx] = e.target.value;
                          setOneOnOne({ ...oneOnOne, deliverables: updated });
                        }}
                        className="flex-1 px-3 py-1.5 rounded-lg border border-[#D8D1C5] text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = oneOnOne.deliverables.filter((_, i) => i !== idx);
                          setOneOnOne({ ...oneOnOne, deliverables: updated });
                        }}
                        className="p-1.5 text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      setOneOnOne({
                        ...oneOnOne,
                        deliverables: [...oneOnOne.deliverables, 'New deliverable point'],
                      })
                    }
                    className="inline-flex items-center gap-1.5 text-xs text-[#244634] font-semibold mt-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Deliverable
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ABOUT TAB */}
          {activeTab === 'about' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#706E69] mb-1 font-semibold">
                    Eyebrow
                  </label>
                  <input
                    type="text"
                    value={about.eyebrow}
                    onChange={(e) => setAbout({ ...about, eyebrow: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#D8D1C5] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#706E69] mb-1 font-semibold">
                    Title
                  </label>
                  <input
                    type="text"
                    value={about.title}
                    onChange={(e) => setAbout({ ...about, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#D8D1C5] text-sm font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#706E69] mb-2 font-semibold">
                  Story Paragraphs
                </label>
                <div className="space-y-3">
                  {about.paragraphs?.map((para, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <textarea
                        rows={2}
                        value={para}
                        onChange={(e) => {
                          const updated = [...about.paragraphs];
                          updated[idx] = e.target.value;
                          setAbout({ ...about, paragraphs: updated });
                        }}
                        className="flex-1 px-3 py-2 rounded-lg border border-[#D8D1C5] text-sm leading-relaxed"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = about.paragraphs.filter((_, i) => i !== idx);
                          setAbout({ ...about, paragraphs: updated });
                        }}
                        className="p-2 text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      setAbout({
                        ...about,
                        paragraphs: [...about.paragraphs, 'New narrative paragraph.'],
                      })
                    }
                    className="inline-flex items-center gap-1.5 text-xs text-[#244634] font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Paragraph
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#E2DBD0] space-y-4">
                <h4 className="text-xs font-mono uppercase tracking-wider text-[#706E69] font-bold">
                  Three Operating Priorities
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] text-[#706E69]">1st Priority Title</label>
                    <input
                      type="text"
                      value={about.faithTitle}
                      onChange={(e) => setAbout({ ...about, faithTitle: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded border border-[#D8D1C5] bg-white text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#706E69]">2nd Priority Title</label>
                    <input
                      type="text"
                      value={about.familyTitle}
                      onChange={(e) => setAbout({ ...about, familyTitle: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded border border-[#D8D1C5] bg-white text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#706E69]">3rd Priority Title</label>
                    <input
                      type="text"
                      value={about.businessTitle}
                      onChange={(e) => setAbout({ ...about, businessTitle: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded border border-[#D8D1C5] bg-white text-xs font-semibold"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* FINAL CTA TAB */}
          {activeTab === 'finalCta' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#706E69] mb-1 font-semibold">
                    Eyebrow
                  </label>
                  <input
                    type="text"
                    value={finalCta.eyebrow}
                    onChange={(e) => setFinalCta({ ...finalCta, eyebrow: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#D8D1C5] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#706E69] mb-1 font-semibold">
                    Headline
                  </label>
                  <input
                    type="text"
                    value={finalCta.headline}
                    onChange={(e) => setFinalCta({ ...finalCta, headline: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#D8D1C5] text-sm font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#706E69] mb-1 font-semibold">
                  Text Copy
                </label>
                <textarea
                  rows={2}
                  value={finalCta.text}
                  onChange={(e) => setFinalCta({ ...finalCta, text: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#D8D1C5] text-sm"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#706E69] mb-1 font-semibold">
                    Primary Button Label
                  </label>
                  <input
                    type="text"
                    value={finalCta.primaryButtonText}
                    onChange={(e) =>
                      setFinalCta({ ...finalCta, primaryButtonText: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#D8D1C5] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#706E69] mb-1 font-semibold">
                    Secondary Button Label
                  </label>
                  <input
                    type="text"
                    value={finalCta.secondaryButtonText}
                    onChange={(e) =>
                      setFinalCta({ ...finalCta, secondaryButtonText: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#D8D1C5] text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* COMMUNITY PAGE TAB */}
          {activeTab === 'communityPage' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#E2DBD0] space-y-3">
                <h4 className="text-xs font-mono uppercase tracking-wider text-[#706E69] font-bold">
                  Community Hero & Schedule
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] text-[#706E69]">Title</label>
                    <input
                      type="text"
                      value={communityPage.hero.title}
                      onChange={(e) =>
                        setCommunityPage({
                          ...communityPage,
                          hero: { ...communityPage.hero, title: e.target.value },
                        })
                      }
                      className="w-full px-2.5 py-1.5 rounded border border-[#D8D1C5] bg-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#706E69]">Subtitle</label>
                    <input
                      type="text"
                      value={communityPage.hero.subtitle}
                      onChange={(e) =>
                        setCommunityPage({
                          ...communityPage,
                          hero: { ...communityPage.hero, subtitle: e.target.value },
                        })
                      }
                      className="w-full px-2.5 py-1.5 rounded border border-[#D8D1C5] bg-white text-xs"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-mono uppercase tracking-wider text-[#706E69] font-bold mb-3">
                  Benefits ({communityPage.benefits?.items?.length || 0})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {communityPage.benefits?.items?.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="p-3 rounded-lg border border-[#E2DBD0] bg-white flex items-start gap-2"
                    >
                      <input
                        type="checkbox"
                        checked={item.enabled !== false}
                        onChange={(e) => {
                          const updated = [...communityPage.benefits.items];
                          updated[idx] = { ...updated[idx], enabled: e.target.checked };
                          setCommunityPage({
                            ...communityPage,
                            benefits: { ...communityPage.benefits, items: updated },
                          });
                        }}
                        className="rounded text-[#244634] mt-1 w-4 h-4"
                      />
                      <div className="flex-1">
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) => {
                            const updated = [...communityPage.benefits.items];
                            updated[idx] = { ...updated[idx], title: e.target.value };
                            setCommunityPage({
                              ...communityPage,
                              benefits: { ...communityPage.benefits, items: updated },
                            });
                          }}
                          className="w-full px-2 py-1 rounded border border-[#D8D1C5] text-xs font-medium"
                        />
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => {
                            const updated = [...communityPage.benefits.items];
                            updated[idx] = { ...updated[idx], description: e.target.value };
                            setCommunityPage({
                              ...communityPage,
                              benefits: { ...communityPage.benefits, items: updated },
                            });
                          }}
                          className="w-full px-2 py-1 rounded border border-[#D8D1C5] text-[11px] text-[#5C5E5B] mt-1"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ABOUT PAGE TAB */}
          {activeTab === 'aboutPage' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#706E69] mb-1 font-semibold">
                    Hero Eyebrow
                  </label>
                  <input
                    type="text"
                    value={aboutPage.hero.eyebrow}
                    onChange={(e) =>
                      setAboutPage({
                        ...aboutPage,
                        hero: { ...aboutPage.hero, eyebrow: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#D8D1C5] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#706E69] mb-1 font-semibold">
                    Hero Title
                  </label>
                  <input
                    type="text"
                    value={aboutPage.hero.title}
                    onChange={(e) =>
                      setAboutPage({
                        ...aboutPage,
                        hero: { ...aboutPage.hero, title: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#D8D1C5] text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#706E69] mb-2 font-semibold">
                  Story Paragraphs
                </label>
                <div className="space-y-3">
                  {aboutPage.story.paragraphs.map((p, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <textarea
                        rows={2}
                        value={p}
                        onChange={(e) => {
                          const updated = [...aboutPage.story.paragraphs];
                          updated[idx] = e.target.value;
                          setAboutPage({
                            ...aboutPage,
                            story: { ...aboutPage.story, paragraphs: updated },
                          });
                        }}
                        className="flex-1 px-3 py-2 rounded-lg border border-[#D8D1C5] text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = aboutPage.story.paragraphs.filter(
                            (_, i) => i !== idx
                          );
                          setAboutPage({
                            ...aboutPage,
                            story: { ...aboutPage.story, paragraphs: updated },
                          });
                        }}
                        className="p-2 text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      setAboutPage({
                        ...aboutPage,
                        story: {
                          ...aboutPage.story,
                          paragraphs: [...aboutPage.story.paragraphs, 'New story narrative.'],
                        },
                      })
                    }
                    className="inline-flex items-center gap-1.5 text-xs text-[#244634] font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Story Paragraph
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* CONTACT PAGE TAB */}
          {activeTab === 'contactPage' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#E2DBD0] flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-[#181918]">
                    Contact Form Availability
                  </h4>
                  <p className="text-xs text-[#5C5E5B] mt-0.5">
                    When disabled, the public contact page hides the form and instructs users to email directly.
                  </p>
                </div>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={contactPage.formEnabled}
                    onChange={(e) =>
                      setContactPage({ ...contactPage, formEnabled: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#244634]"></div>
                  <span className="text-xs font-semibold text-[#181918]">
                    {contactPage.formEnabled ? 'Form Open' : 'Form Paused'}
                  </span>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#706E69] mb-1 font-semibold">
                    Page Title
                  </label>
                  <input
                    type="text"
                    value={contactPage.title}
                    onChange={(e) =>
                      setContactPage({ ...contactPage, title: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#D8D1C5] text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#706E69] mb-1 font-semibold">
                    Direct Support Email
                  </label>
                  <input
                    type="email"
                    value={contactPage.supportEmail}
                    onChange={(e) =>
                      setContactPage({ ...contactPage, supportEmail: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#D8D1C5] text-sm font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#706E69] mb-1 font-semibold">
                  Subtitle Copy
                </label>
                <textarea
                  rows={2}
                  value={contactPage.subtitle}
                  onChange={(e) =>
                    setContactPage({ ...contactPage, subtitle: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[#D8D1C5] text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#706E69] mb-1 font-semibold">
                  Availability Notice
                </label>
                <input
                  type="text"
                  value={contactPage.availabilityNote}
                  onChange={(e) =>
                    setContactPage({ ...contactPage, availabilityNote: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[#D8D1C5] text-sm"
                />
              </div>
            </div>
          )}

          {/* STORE PAGE TAB */}
          {activeTab === 'storePage' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#E2DBD0] flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-[#181918]">
                    Community Recommendation Banner
                  </h4>
                  <p className="text-xs text-[#5C5E5B] mt-0.5">
                    Controls the banner advising shoppers that all templates are included free with community membership.
                  </p>
                </div>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={storePage.communityPromoEnabled}
                    onChange={(e) =>
                      setStorePage({
                        ...storePage,
                        communityPromoEnabled: e.target.checked,
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#244634]"></div>
                  <span className="text-xs font-semibold text-[#181918]">
                    {storePage.communityPromoEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#706E69] mb-1 font-semibold">
                    Page Title
                  </label>
                  <input
                    type="text"
                    value={storePage.title}
                    onChange={(e) =>
                      setStorePage({ ...storePage, title: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#D8D1C5] text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#706E69] mb-1 font-semibold">
                    Subtitle
                  </label>
                  <input
                    type="text"
                    value={storePage.subtitle}
                    onChange={(e) =>
                      setStorePage({ ...storePage, subtitle: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#D8D1C5] text-sm"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Editor Bottom Save Bar */}
        <div className="p-4 sm:p-6 border-t border-[#E8E2D7] bg-[#FAF7F2]/60 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-[#706E69]">
            <Info className="w-4 h-4 text-[#244634]" />
            <span>
              Changes save directly to Firestore <code>site_content/{activeTab}</code> and update in realtime.
            </span>
          </div>

          <button
            onClick={handleSaveCurrentSection}
            disabled={saving || loading}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-[#244634] rounded-xl hover:bg-[#1E3B2C] disabled:opacity-50 transition-colors shadow-xs"
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
