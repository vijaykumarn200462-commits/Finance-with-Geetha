'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  BookOpen,
  ShoppingBag,
  Eye,
  EyeOff,
  Calendar,
  Compass,
  Mail,
  Upload,
  Camera,
  LayoutDashboard,
  CheckCircle2,
  Clock,
  Phone,
  Shield,
  RotateCcw,
  Globe,
} from 'lucide-react';
import { auth } from '@/lib/firebase/client';
import { getSiteContentDoc } from '@/lib/firebase/firestore';
import {
  BrandingContent,
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
  WhyUsContent,
} from '@/types/site-content';
import {
  DEFAULT_BRANDING_CONTENT,
  DEFAULT_HERO_CONTENT,
  DEFAULT_PROFILE_IMAGE,
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
  DEFAULT_WHY_US_CONTENT,
} from '@/lib/firebase/content';

export type MainCategory =
  | 'branding'
  | 'hero'
  | 'services'
  | 'aboutWhyUs'
  | 'contact'
  | 'otherPages';

interface CategoryItem {
  id: MainCategory;
  label: string;
  badgeLabel: string;
  description: string;
  icon: React.ElementType;
  previewUrl: string;
}

const CATEGORIES: CategoryItem[] = [
  {
    id: 'branding',
    label: 'Branding & Header',
    badgeLabel: 'Identity',
    description: 'Manage website logo, business name, tagline, and navigation bar display settings.',
    icon: Sparkles,
    previewUrl: '/',
  },
  {
    id: 'hero',
    label: 'Homepage Hero',
    badgeLabel: 'Hero Banner',
    description: 'Main introduction headline, description, consultation buttons, and Geetha N. profile card.',
    icon: LayoutDashboard,
    previewUrl: '/#hero',
  },
  {
    id: 'services',
    label: 'Services & Offerings',
    badgeLabel: 'Services',
    description: 'Professional bookkeeping, daily ledger maintenance, and reporting service packages.',
    icon: Compass,
    previewUrl: '/#services',
  },
  {
    id: 'aboutWhyUs',
    label: 'About & Why Choose Us',
    badgeLabel: 'About / Trust',
    description: 'About Geetha N., the 3 core feature cards, and Why Partner With Us benefits.',
    icon: Layers,
    previewUrl: '/#about',
  },
  {
    id: 'contact',
    label: 'Contact & Inquiry',
    badgeLabel: 'Inquiries',
    description: 'Direct phone, email, working hours, address, and client quick inquiry form switch.',
    icon: Mail,
    previewUrl: '/#contact',
  },
  {
    id: 'otherPages',
    label: 'Other Active Pages',
    badgeLabel: 'Dedicated Pages',
    description: 'Dedicated subpages including Full About Page, Dedicated Store, Book, and Community.',
    icon: BookOpen,
    previewUrl: '/about',
  },
];

export default function AdminSiteContentClient() {
  const [activeCategory, setActiveCategory] = useState<MainCategory>('branding');
  const [subTabAboutWhyUs, setSubTabAboutWhyUs] = useState<'about' | 'whyUs'>('about');
  const [subTabOtherPages, setSubTabOtherPages] = useState<
    'aboutPage' | 'storePage' | 'book' | 'communityPage'
  >('aboutPage');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Content state for all managed sections
  const [branding, setBranding] = useState<BrandingContent>(DEFAULT_BRANDING_CONTENT);
  const [hero, setHero] = useState<HeroContent>(DEFAULT_HERO_CONTENT);
  const [teaching, setTeaching] = useState<TeachingContent>(DEFAULT_TEACHING_CONTENT);
  const [about, setAbout] = useState<AboutContent>(DEFAULT_ABOUT_CONTENT);
  const [whyUs, setWhyUs] = useState<WhyUsContent>(DEFAULT_WHY_US_CONTENT);
  const [contactPage, setContactPage] = useState<ContactPageContent>(DEFAULT_CONTACT_PAGE_CONTENT);

  // Other pages content state
  const [aboutPage, setAboutPage] = useState<AboutPageContent>(DEFAULT_ABOUT_PAGE_CONTENT);
  const [storePage, setStorePage] = useState<StorePageContent>(DEFAULT_STORE_PAGE_CONTENT);
  const [book, setBook] = useState<BookContent>(DEFAULT_BOOK_PAGE_CONTENT);
  const [communityPage, setCommunityPage] = useState<CommunityPageContent>(DEFAULT_COMMUNITY_PAGE_CONTENT);

  // Retained state (prevent loss of existing document data)
  const [stats, setStats] = useState<StatsContent>(DEFAULT_STATS_CONTENT);
  const [community, setCommunity] = useState<CommunityContent>(DEFAULT_COMMUNITY_CONTENT);
  const [callStructure, setCallStructure] = useState<CallStructureContent>(DEFAULT_CALL_STRUCTURE_CONTENT);
  const [store, setStore] = useState<StoreSectionContent>(DEFAULT_STORE_SECTION_CONTENT);
  const [oneOnOne, setOneOnOne] = useState<OneOnOneContent>(DEFAULT_ONE_ON_ONE_CONTENT);
  const [finalCta, setFinalCta] = useState<FinalCTAContent>(DEFAULT_FINAL_CTA_CONTENT);

  // Snapshot of loaded data for unsaved changes detection
  const [initialSnapshot, setInitialSnapshot] = useState<string>('');

  // Logo upload state
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoUploadProgress, setLogoUploadProgress] = useState(0);

  // Profile photo upload state
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoUploadProgress, setPhotoUploadProgress] = useState(0);

  // Load all site content from Firestore
  const loadAllContent = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const [
        brandingDoc,
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
        whyUsDoc,
        commPageDoc,
        aboutPageDoc,
        contactPageDoc,
        storePageDoc,
      ] = await Promise.all([
        getSiteContentDoc<BrandingContent>('branding'),
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
        getSiteContentDoc<WhyUsContent>('whyUs'),
        getSiteContentDoc<CommunityPageContent>('communityPage'),
        getSiteContentDoc<AboutPageContent>('aboutPage'),
        getSiteContentDoc<ContactPageContent>('contactPage'),
        getSiteContentDoc<StorePageContent>('storePage'),
      ]);

      const loadedBranding = brandingDoc ? { ...DEFAULT_BRANDING_CONTENT, ...brandingDoc } : DEFAULT_BRANDING_CONTENT;
      const loadedHero = heroDoc ? { ...DEFAULT_HERO_CONTENT, ...heroDoc } : DEFAULT_HERO_CONTENT;
      const loadedTeach = teachDoc ? { ...DEFAULT_TEACHING_CONTENT, ...teachDoc } : DEFAULT_TEACHING_CONTENT;
      const loadedAbout = aboutDoc ? { ...DEFAULT_ABOUT_CONTENT, ...aboutDoc } : DEFAULT_ABOUT_CONTENT;
      const loadedWhyUs = whyUsDoc ? { ...DEFAULT_WHY_US_CONTENT, ...whyUsDoc } : DEFAULT_WHY_US_CONTENT;
      const loadedContact = contactPageDoc ? { ...DEFAULT_CONTACT_PAGE_CONTENT, ...contactPageDoc } : DEFAULT_CONTACT_PAGE_CONTENT;
      const loadedAboutPage = aboutPageDoc ? { ...DEFAULT_ABOUT_PAGE_CONTENT, ...aboutPageDoc } : DEFAULT_ABOUT_PAGE_CONTENT;
      const loadedStorePage = storePageDoc ? { ...DEFAULT_STORE_PAGE_CONTENT, ...storePageDoc } : DEFAULT_STORE_PAGE_CONTENT;
      const loadedBook = bookDoc ? { ...DEFAULT_BOOK_PAGE_CONTENT, ...bookDoc } : DEFAULT_BOOK_PAGE_CONTENT;
      const loadedCommPage = commPageDoc ? { ...DEFAULT_COMMUNITY_PAGE_CONTENT, ...commPageDoc } : DEFAULT_COMMUNITY_PAGE_CONTENT;

      setBranding(loadedBranding);
      setHero(loadedHero);
      setTeaching(loadedTeach);
      setAbout(loadedAbout);
      setWhyUs(loadedWhyUs);
      setContactPage(loadedContact);
      setAboutPage(loadedAboutPage);
      setStorePage(loadedStorePage);
      setBook(loadedBook);
      setCommunityPage(loadedCommPage);

      if (statsDoc) setStats((prev) => ({ ...prev, ...statsDoc }));
      if (commDoc) setCommunity((prev) => ({ ...prev, ...commDoc }));
      if (callDoc) setCallStructure((prev) => ({ ...prev, ...callDoc }));
      if (storeDoc) setStore((prev) => ({ ...prev, ...storeDoc }));
      if (call1on1Doc) setOneOnOne((prev) => ({ ...prev, ...call1on1Doc }));
      if (ctaDoc) setFinalCta((prev) => ({ ...prev, ...ctaDoc }));

      setInitialSnapshot(
        JSON.stringify({
          branding: loadedBranding,
          hero: loadedHero,
          teaching: loadedTeach,
          about: loadedAbout,
          whyUs: loadedWhyUs,
          contactPage: loadedContact,
          aboutPage: loadedAboutPage,
          storePage: loadedStorePage,
          book: loadedBook,
          communityPage: loadedCommPage,
        })
      );
    } catch (err: unknown) {
      console.warn('Error loading site content from Firestore:', err);
      setErrorMessage('Could not load site content from Firestore. Please verify your connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllContent();
  }, [loadAllContent]);

  // Determine current active section key to save
  const currentSectionKey = useMemo(() => {
    switch (activeCategory) {
      case 'branding':
        return 'branding';
      case 'hero':
        return 'hero';
      case 'services':
        return 'teaching';
      case 'aboutWhyUs':
        return subTabAboutWhyUs;
      case 'contact':
        return 'contactPage';
      case 'otherPages':
        return subTabOtherPages;
      default:
        return 'branding';
    }
  }, [activeCategory, subTabAboutWhyUs, subTabOtherPages]);

  // Unsaved changes check for current category
  const hasUnsavedChanges = useMemo(() => {
    if (!initialSnapshot) return false;
    try {
      const parsed = JSON.parse(initialSnapshot);
      switch (activeCategory) {
        case 'branding':
          return JSON.stringify(parsed.branding) !== JSON.stringify(branding);
        case 'hero':
          return JSON.stringify(parsed.hero) !== JSON.stringify(hero);
        case 'services':
          return JSON.stringify(parsed.teaching) !== JSON.stringify(teaching);
        case 'aboutWhyUs':
          if (subTabAboutWhyUs === 'about') {
            return JSON.stringify(parsed.about) !== JSON.stringify(about);
          }
          return JSON.stringify(parsed.whyUs) !== JSON.stringify(whyUs);
        case 'contact':
          return JSON.stringify(parsed.contactPage) !== JSON.stringify(contactPage);
        case 'otherPages':
          if (subTabOtherPages === 'aboutPage') return JSON.stringify(parsed.aboutPage) !== JSON.stringify(aboutPage);
          if (subTabOtherPages === 'storePage') return JSON.stringify(parsed.storePage) !== JSON.stringify(storePage);
          if (subTabOtherPages === 'book') return JSON.stringify(parsed.book) !== JSON.stringify(book);
          if (subTabOtherPages === 'communityPage') return JSON.stringify(parsed.communityPage) !== JSON.stringify(communityPage);
          return false;
      }
    } catch {
      return false;
    }
    return false;
  }, [
    initialSnapshot,
    activeCategory,
    subTabAboutWhyUs,
    subTabOtherPages,
    branding,
    hero,
    teaching,
    about,
    whyUs,
    contactPage,
    aboutPage,
    storePage,
    book,
    communityPage,
  ]);

  // Discard current changes and restore snapshot
  const handleDiscardChanges = () => {
    if (!initialSnapshot) return;
    try {
      const parsed = JSON.parse(initialSnapshot);
      if (activeCategory === 'branding') setBranding(parsed.branding);
      if (activeCategory === 'hero') setHero(parsed.hero);
      if (activeCategory === 'services') setTeaching(parsed.teaching);
      if (activeCategory === 'aboutWhyUs') {
        if (subTabAboutWhyUs === 'about') setAbout(parsed.about);
        else setWhyUs(parsed.whyUs);
      }
      if (activeCategory === 'contact') setContactPage(parsed.contactPage);
      if (activeCategory === 'otherPages') {
        if (subTabOtherPages === 'aboutPage') setAboutPage(parsed.aboutPage);
        if (subTabOtherPages === 'storePage') setStorePage(parsed.storePage);
        if (subTabOtherPages === 'book') setBook(parsed.book);
        if (subTabOtherPages === 'communityPage') setCommunityPage(parsed.communityPage);
      }
      setSuccessMessage('Unsaved changes discarded.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch {
      // Graceful
    }
  };

  // Upload image helper via secure API endpoint
  const uploadImageFile = async (
    file: File,
    target: 'branding' | 'hero',
    onProgress: (p: number) => void
  ): Promise<string> => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      throw new Error(`Unsupported file type "${file.type}". Please upload JPEG, PNG, or WebP.`);
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new Error(`File is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Limit is 5MB.`);
    }

    const token = await auth.currentUser?.getIdToken();
    if (!token) {
      throw new Error('Authentication required. Please log in as an administrator.');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('target', target);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/admin/profile-photo');
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && event.total > 0) {
          const percent = Math.round((event.loaded / event.total) * 95);
          onProgress(percent);
        }
      };

      xhr.onload = () => {
        try {
          const data = JSON.parse(xhr.responseText || '{}');
          if (xhr.status >= 200 && xhr.status < 300 && data.url) {
            onProgress(100);
            resolve(data.url);
          } else {
            reject(new Error(data.error || `Upload failed with status ${xhr.status}`));
          }
        } catch {
          reject(new Error(`Failed to parse upload server response (${xhr.status})`));
        }
      };

      xhr.onerror = () => reject(new Error('Network connection error during image upload.'));
      xhr.send(formData);
    });
  };

  // Logo upload handler
  const handleLogoUpload = async (file: File) => {
    setUploadingLogo(true);
    setLogoUploadProgress(0);
    setErrorMessage(null);
    try {
      const url = await uploadImageFile(file, 'branding', setLogoUploadProgress);
      setBranding((prev) => ({ ...prev, logoUrl: url }));
      setSuccessMessage('Logo uploaded and applied to branding configuration.');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Logo upload failed';
      setErrorMessage(msg);
    } finally {
      setUploadingLogo(false);
    }
  };

  // Hero profile photo upload handler
  const handlePhotoUpload = async (file: File) => {
    setUploadingPhoto(true);
    setPhotoUploadProgress(0);
    setErrorMessage(null);
    try {
      const url = await uploadImageFile(file, 'hero', setPhotoUploadProgress);
      setHero((prev) => ({ ...prev, profileImageUrl: url }));
      setSuccessMessage('Profile photograph uploaded and updated on hero card.');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Profile photo upload failed';
      setErrorMessage(msg);
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Save current active section
  const handleSaveCurrentSection = async () => {
    setSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      let dataToSave: unknown;
      let sectionTitle = '';

      switch (currentSectionKey) {
        case 'branding':
          dataToSave = branding;
          sectionTitle = 'Branding & Header';
          break;
        case 'hero':
          dataToSave = hero;
          sectionTitle = 'Homepage Hero';
          break;
        case 'teaching':
          dataToSave = teaching;
          sectionTitle = 'Services & Offerings';
          break;
        case 'about':
          dataToSave = about;
          sectionTitle = 'About Section';
          break;
        case 'whyUs':
          dataToSave = whyUs;
          sectionTitle = 'Why Choose Us';
          break;
        case 'contactPage':
          dataToSave = contactPage;
          sectionTitle = 'Contact & Inquiry';
          break;
        case 'aboutPage':
          dataToSave = aboutPage;
          sectionTitle = 'Dedicated About Page';
          break;
        case 'storePage':
          dataToSave = storePage;
          sectionTitle = 'Dedicated Store Page';
          break;
        case 'book':
          dataToSave = book;
          sectionTitle = 'The Book & Chapters';
          break;
        case 'communityPage':
          dataToSave = communityPage;
          sectionTitle = 'Community Page';
          break;
      }

      if (!dataToSave) {
        throw new Error('No section data to save.');
      }

      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        throw new Error('Authentication required. Please sign in as an administrator.');
      }

      const res = await fetch('/api/admin/site-content', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ section: currentSectionKey, data: dataToSave }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Save failed with status ${res.status}`);
      }

      // Update initial snapshot so unsaved changes indicator clears
      setInitialSnapshot((prev) => {
        try {
          const parsed = JSON.parse(prev || '{}');
          parsed[currentSectionKey] = dataToSave;
          return JSON.stringify(parsed);
        } catch {
          return prev;
        }
      });

      setSuccessMessage(`Saved "${sectionTitle}" successfully. Website content and caches have been refreshed.`);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save section content';
      setErrorMessage(msg);
    } finally {
      setSaving(false);
    }
  };

  // Status helper for categories
  const getCategoryStatus = (catId: MainCategory) => {
    switch (catId) {
      case 'branding':
        return { label: 'Active', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'hero':
        return hero.enabled !== false
          ? { label: 'Active', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
          : { label: 'Hidden', color: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'services':
        return teaching.enabled !== false
          ? { label: 'Active', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
          : { label: 'Hidden', color: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'aboutWhyUs':
        return about.enabled !== false && whyUs.enabled !== false
          ? { label: 'Active', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
          : { label: 'Partially Hidden', color: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'contact':
        return contactPage.enabled !== false
          ? {
              label: contactPage.formEnabled ? 'Active (Form Open)' : 'Active (Form Paused)',
              color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            }
          : { label: 'Hidden', color: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'otherPages':
        return { label: 'Dedicated Pages', color: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  // Preview URL for current section
  const currentPreviewUrl = useMemo(() => {
    if (activeCategory === 'branding') return '/';
    if (activeCategory === 'hero') return '/#hero';
    if (activeCategory === 'services') return '/#services';
    if (activeCategory === 'aboutWhyUs') return subTabAboutWhyUs === 'about' ? '/#about' : '/#why-us';
    if (activeCategory === 'contact') return '/#contact';
    if (activeCategory === 'otherPages') {
      if (subTabOtherPages === 'aboutPage') return '/about';
      if (subTabOtherPages === 'storePage') return '/store';
      if (subTabOtherPages === 'book') return '/book';
      if (subTabOtherPages === 'communityPage') return '/community';
    }
    return '/';
  }, [activeCategory, subTabAboutWhyUs, subTabOtherPages]);

  const activeCategoryDef = CATEGORIES.find((c) => c.id === activeCategory) || CATEGORIES[0];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* 1. TOP HEADER & ACTION BAR */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold font-serif text-[#0f2c59]">
              Site Content & Branding CMS
            </h1>
            <span className="bg-emerald-50 text-[#138354] border border-emerald-200 text-[11px] font-mono px-2 py-0.5 rounded-full font-semibold uppercase">
              Live Connected
            </span>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Easily update website identity, homepage sections, services, and contact details without editing source code.
          </p>
        </div>

        {/* Global Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {hasUnsavedChanges && (
            <button
              type="button"
              onClick={handleDiscardChanges}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Discard</span>
            </button>
          )}

          <a
            href={currentPreviewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-[#0f2c59] bg-[#0f2c59]/5 hover:bg-[#0f2c59]/10 border border-[#0f2c59]/15 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5 text-[#138354]" />
            <span>Preview Live</span>
          </a>

          <button
            type="button"
            disabled={saving || loading}
            onClick={handleSaveCurrentSection}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#0f2c59] hover:bg-[#138354] disabled:opacity-60 shadow-xs transition-colors cursor-pointer"
          >
            {saving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 text-emerald-300" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. NOTIFICATIONS & STATUS BANNERS */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-3 shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-[#138354] flex-shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{successMessage}</div>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-start gap-3 shadow-xs">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{errorMessage}</div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-red-700 hover:text-red-900 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {hasUnsavedChanges && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>
              You have unsaved edits in <strong>{activeCategoryDef.label}</strong>. Click <strong>Save Changes</strong> to apply them to the public website.
            </span>
          </div>
          <button
            type="button"
            onClick={handleDiscardChanges}
            className="text-amber-800 hover:underline font-semibold"
          >
            Discard
          </button>
        </div>
      )}

      {/* 3. CATEGORY NAVIGATION TABS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isSelected = activeCategory === cat.id;
          const status = getCategoryStatus(cat.id);

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-[#0f2c59] text-white border-[#0f2c59] shadow-md shadow-[#0f2c59]/10'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-2">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    isSelected ? 'bg-white/15 text-white' : 'bg-slate-100 text-[#0f2c59]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                    isSelected ? 'bg-white/20 text-white border-white/30' : status.color
                  }`}
                >
                  {status.label}
                </span>
              </div>
              <div>
                <p className={`text-xs font-bold leading-snug ${isSelected ? 'text-white' : 'text-[#0f2c59]'}`}>
                  {cat.label}
                </p>
                <p className={`text-[11px] truncate mt-0.5 ${isSelected ? 'text-slate-200' : 'text-slate-500'}`}>
                  {cat.badgeLabel}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* 4. MAIN EDITOR CONTAINER */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
        {/* Category Header */}
        <div className="pb-6 mb-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold font-serif text-[#0f2c59] flex items-center gap-2">
              <span>{activeCategoryDef.label}</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">{activeCategoryDef.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-semibold px-3 py-1 rounded-full border ${
                getCategoryStatus(activeCategory).color
              }`}
            >
              {getCategoryStatus(activeCategory).label}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-[#138354] animate-spin mx-auto" />
            <p className="text-sm font-medium text-slate-600">Loading website content from Firestore...</p>
          </div>
        ) : (
          <div>
            {/* ------------------------------------------------------------- */}
            {/* CATEGORY 1: BRANDING & HEADER                                  */}
            {/* ------------------------------------------------------------- */}
            {activeCategory === 'branding' && (
              <div className="space-y-8">
                {/* Visual Header Mockup Preview */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Live Header Preview (How it appears to website visitors)
                  </p>
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {branding.showLogo !== false && (
                        <div
                          className={`rounded-full overflow-hidden border-2 border-[#0f2c59] bg-slate-100 flex-shrink-0 ${
                            branding.logoSize === 'small'
                              ? 'w-8 h-8'
                              : branding.logoSize === 'large'
                              ? 'w-12 h-12'
                              : 'w-10 h-10'
                          }`}
                        >
                          <img
                            src={branding.logoUrl || hero.profileImageUrl || DEFAULT_PROFILE_IMAGE}
                            alt="Logo"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = DEFAULT_PROFILE_IMAGE;
                            }}
                          />
                        </div>
                      )}
                      <div>
                        {branding.showBusinessName !== false && (
                          <p className="font-serif font-bold text-base text-[#0f2c59] leading-tight">
                            {branding.businessName || 'Finance with Geetha'}
                          </p>
                        )}
                        {branding.showTagline !== false && (
                          <p className="text-[10px] font-semibold text-[#138354] uppercase tracking-wider leading-none">
                            {branding.tagline || 'Bookkeeping & Accounting'}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="hidden md:flex items-center gap-4 text-xs font-medium text-slate-600">
                      <span>About</span>
                      <span>Services</span>
                      <span>Why Us</span>
                      <span>Contact</span>
                      <span className="bg-[#138354] text-white px-3 py-1.5 rounded-lg text-xs font-semibold">
                        Book Consultation
                      </span>
                    </div>
                  </div>
                </div>

                {/* Identity Inputs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                      Business Name
                    </label>
                    <input
                      type="text"
                      value={branding.businessName}
                      onChange={(e) => setBranding({ ...branding, businessName: e.target.value })}
                      placeholder="Finance with Geetha"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0f2c59]"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      Appears in the header navigation, page title, and copyright notices.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                      Tagline / Sub-label
                    </label>
                    <input
                      type="text"
                      value={branding.tagline}
                      onChange={(e) => setBranding({ ...branding, tagline: e.target.value })}
                      placeholder="Bookkeeping & Accounting"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0f2c59]"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      Appears directly below your business name in the header.
                    </p>
                  </div>
                </div>

                {/* Logo Image & Upload */}
                <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-4">
                  <h3 className="text-sm font-bold text-[#0f2c59] flex items-center gap-2">
                    <Camera className="w-4 h-4 text-[#138354]" />
                    <span>Website Logo / Profile Portrait</span>
                  </h3>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                    <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-[#0f2c59] shadow-sm bg-slate-100 flex-shrink-0">
                      <img
                        src={branding.logoUrl || hero.profileImageUrl || DEFAULT_PROFILE_IMAGE}
                        alt="Logo preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = DEFAULT_PROFILE_IMAGE;
                        }}
                      />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#0f2c59] hover:bg-[#138354] transition-colors cursor-pointer shadow-xs">
                          <Upload className="w-3.5 h-3.5" />
                          <span>{uploadingLogo ? 'Uploading...' : 'Upload New Logo'}</span>
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/svg+xml"
                            disabled={uploadingLogo}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleLogoUpload(file);
                            }}
                            className="sr-only"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => setBranding({ ...branding, logoUrl: DEFAULT_PROFILE_IMAGE })}
                          className="text-xs text-slate-600 hover:text-slate-800 underline font-medium"
                        >
                          Reset to Default
                        </button>
                      </div>

                      {uploadingLogo && (
                        <div className="w-full max-w-xs space-y-1">
                          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#138354] transition-all duration-200"
                              style={{ width: `${logoUploadProgress}%` }}
                            />
                          </div>
                          <p className="text-[11px] text-slate-500 font-mono">
                            Uploading... {logoUploadProgress}%
                          </p>
                        </div>
                      )}

                      <p className="text-xs text-slate-500">
                        Supports JPEG, PNG, WebP, or SVG. Maximum file size: 5MB. Uploaded images are stored securely in Firebase Storage.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Header Display Controls */}
                <div className="p-6 rounded-2xl border border-slate-200 bg-white space-y-4">
                  <h3 className="text-sm font-bold text-[#0f2c59]">Header Display Settings</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={branding.showLogo !== false}
                        onChange={(e) => setBranding({ ...branding, showLogo: e.target.checked })}
                        className="rounded text-[#138354] focus:ring-[#138354]"
                      />
                      <span className="text-xs font-semibold text-slate-800">Show Logo Image</span>
                    </label>

                    <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={branding.showBusinessName !== false}
                        onChange={(e) => setBranding({ ...branding, showBusinessName: e.target.checked })}
                        className="rounded text-[#138354] focus:ring-[#138354]"
                      />
                      <span className="text-xs font-semibold text-slate-800">Show Business Name</span>
                    </label>

                    <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={branding.showTagline !== false}
                        onChange={(e) => setBranding({ ...branding, showTagline: e.target.checked })}
                        className="rounded text-[#138354] focus:ring-[#138354]"
                      />
                      <span className="text-xs font-semibold text-slate-800">Show Tagline</span>
                    </label>
                  </div>

                  {/* Logo Size Selection */}
                  <div className="pt-3 border-t border-slate-100">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                      Logo Size in Header
                    </label>
                    <div className="flex items-center gap-4">
                      {(['small', 'medium', 'large'] as const).map((size) => (
                        <label key={size} className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 capitalize">
                          <input
                            type="radio"
                            name="logoSize"
                            value={size}
                            checked={(branding.logoSize || 'medium') === size}
                            onChange={() => setBranding({ ...branding, logoSize: size })}
                            className="text-[#138354] focus:ring-[#138354]"
                          />
                          <span>{size} ({size === 'small' ? '32px' : size === 'large' ? '48px' : '40px'})</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* CATEGORY 2: HOMEPAGE HERO BANNER                              */}
            {/* ------------------------------------------------------------- */}
            {activeCategory === 'hero' && (
              <div className="space-y-8">
                {/* Hero Visibility Switch */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-[#0f2c59]">Hero Section Visibility</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Toggle whether the Hero banner is displayed at the top of the homepage.
                    </p>
                  </div>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hero.enabled !== false}
                      onChange={(e) => setHero({ ...hero, enabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#138354]"></div>
                    <span className="text-xs font-bold text-slate-800">
                      {hero.enabled !== false ? 'Section Visible' : 'Section Hidden'}
                    </span>
                  </label>
                </div>

                {/* Main Headline & Description */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                      Eyebrow Label
                    </label>
                    <input
                      type="text"
                      value={hero.eyebrow}
                      onChange={(e) => setHero({ ...hero, eyebrow: e.target.value })}
                      placeholder="PROFESSIONAL ACCOUNTING & BOOKKEEPING"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0f2c59]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                      Main Heading
                    </label>
                    <input
                      type="text"
                      value={hero.headline}
                      onChange={(e) => setHero({ ...hero, headline: e.target.value })}
                      placeholder="Take Control of Your Business Finances"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-[#0f2c59] focus:outline-none focus:ring-2 focus:ring-[#0f2c59]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Supporting Description Copy
                  </label>
                  <textarea
                    rows={3}
                    value={hero.supportingCopy}
                    onChange={(e) => setHero({ ...hero, supportingCopy: e.target.value })}
                    placeholder="Accurate, reliable, and stress-free bookkeeping services tailored for businesses..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0f2c59]"
                  />
                </div>

                {/* Hero Action Buttons */}
                <div className="p-6 rounded-2xl border border-slate-200 bg-white space-y-4">
                  <h3 className="text-sm font-bold text-[#0f2c59]">Call-to-Action Buttons</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Primary Button */}
                    <div className="space-y-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-xs font-bold text-[#138354] uppercase tracking-wider">
                        Primary Button (Green)
                      </span>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Button Text</label>
                        <input
                          type="text"
                          value={hero.primaryButtonText || ''}
                          onChange={(e) => setHero({ ...hero, primaryButtonText: e.target.value })}
                          placeholder="Schedule Consultation"
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Destination URL / Anchor</label>
                        <input
                          type="text"
                          value={hero.primaryButtonLink || '/#contact'}
                          onChange={(e) => setHero({ ...hero, primaryButtonLink: e.target.value })}
                          placeholder="/#contact"
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono text-slate-800"
                        />
                      </div>
                    </div>

                    {/* Secondary Button */}
                    <div className="space-y-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-xs font-bold text-[#0f2c59] uppercase tracking-wider">
                        Secondary Button (Outline)
                      </span>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Button Text</label>
                        <input
                          type="text"
                          value={hero.secondaryButtonText || ''}
                          onChange={(e) => setHero({ ...hero, secondaryButtonText: e.target.value })}
                          placeholder="View Services"
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Destination URL / Anchor</label>
                        <input
                          type="text"
                          value={hero.secondaryButtonLink || '/#services'}
                          onChange={(e) => setHero({ ...hero, secondaryButtonLink: e.target.value })}
                          placeholder="/#services"
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono text-slate-800"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Trust Badges */}
                <div className="p-6 rounded-2xl border border-slate-200 bg-white space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-[#0f2c59]">Trust Indicator Badges</h3>
                      <p className="text-xs text-slate-500">Short reassurance bullet points below the CTA buttons.</p>
                    </div>
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hero.showTrustIndicators !== false}
                        onChange={(e) => setHero({ ...hero, showTrustIndicators: e.target.checked })}
                        className="rounded text-[#138354] focus:ring-[#138354]"
                      />
                      <span className="text-xs font-semibold text-slate-700">Show Badges</span>
                    </label>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Badge 1</label>
                      <input
                        type="text"
                        value={hero.trustIndicator1 || '100% Confidential'}
                        onChange={(e) => setHero({ ...hero, trustIndicator1: e.target.value })}
                        placeholder="100% Confidential"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Badge 2</label>
                      <input
                        type="text"
                        value={hero.trustIndicator2 || 'Tailored Solutions'}
                        onChange={(e) => setHero({ ...hero, trustIndicator2: e.target.value })}
                        placeholder="Tailored Solutions"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold"
                      />
                    </div>
                  </div>
                </div>

                {/* Hero Profile Card Editor */}
                <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-[#0f2c59] flex items-center gap-2">
                        <Users className="w-4 h-4 text-[#138354]" />
                        <span>Hero Profile Card</span>
                      </h3>
                      <p className="text-xs text-slate-500">
                        Prominent photo card displayed alongside the hero text.
                      </p>
                    </div>
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hero.showProfileCard !== false}
                        onChange={(e) => setHero({ ...hero, showProfileCard: e.target.checked })}
                        className="rounded text-[#138354] focus:ring-[#138354]"
                      />
                      <span className="text-xs font-bold text-slate-800">
                        {hero.showProfileCard !== false ? 'Card Visible' : 'Card Hidden'}
                      </span>
                    </label>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start gap-6 pt-2">
                    {/* Profile Photo Upload */}
                    <div className="space-y-2 flex-shrink-0 text-center">
                      <div className="w-28 h-28 rounded-2xl overflow-hidden border-2 border-[#0f2c59] shadow-sm bg-white mx-auto">
                        <img
                          src={hero.profileImageUrl || DEFAULT_PROFILE_IMAGE}
                          alt="Profile Preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = DEFAULT_PROFILE_IMAGE;
                          }}
                        />
                      </div>
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#0f2c59] hover:bg-[#138354] transition-colors cursor-pointer shadow-xs">
                        <Camera className="w-3.5 h-3.5" />
                        <span>{uploadingPhoto ? 'Uploading...' : 'Change Photo'}</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          disabled={uploadingPhoto}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handlePhotoUpload(file);
                          }}
                          className="sr-only"
                        />
                      </label>
                      {uploadingPhoto && (
                        <p className="text-[11px] text-slate-500 font-mono">
                          Uploading... {photoUploadProgress}%
                        </p>
                      )}
                    </div>

                    {/* Card Profile Fields */}
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                          Display Name
                        </label>
                        <input
                          type="text"
                          value={hero.profileName || ''}
                          onChange={(e) => setHero({ ...hero, profileName: e.target.value })}
                          placeholder="Geetha N."
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold text-[#0f2c59]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                          Professional Title
                        </label>
                        <input
                          type="text"
                          value={hero.profileRole || ''}
                          onChange={(e) => setHero({ ...hero, profileRole: e.target.value })}
                          placeholder="Independent Bookkeeper & Accountant"
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-[#138354]"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                          Short Bio / Description
                        </label>
                        <textarea
                          rows={2}
                          value={hero.profileDescription || ''}
                          onChange={(e) => setHero({ ...hero, profileDescription: e.target.value })}
                          placeholder="Dedicated financial partner helping you maintain clean books..."
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-700"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                          Phone Number
                        </label>
                        <input
                          type="text"
                          value={hero.profilePhone || ''}
                          onChange={(e) => setHero({ ...hero, profilePhone: e.target.value })}
                          placeholder="9538913912"
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono font-semibold"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={hero.profileEmail || ''}
                          onChange={(e) => setHero({ ...hero, profileEmail: e.target.value })}
                          placeholder="Cageethanofficail@gmail.com"
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* CATEGORY 3: SERVICES & OFFERINGS                              */}
            {/* ------------------------------------------------------------- */}
            {activeCategory === 'services' && (
              <div className="space-y-6">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-[#0f2c59]">Services Section Visibility</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Toggle whether the Services section appears on the homepage.
                    </p>
                  </div>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={teaching.enabled !== false}
                      onChange={(e) => setTeaching({ ...teaching, enabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#138354]"></div>
                    <span className="text-xs font-bold text-slate-800">
                      {teaching.enabled !== false ? 'Section Visible' : 'Section Hidden'}
                    </span>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                      Section Eyebrow
                    </label>
                    <input
                      type="text"
                      value={teaching.eyebrow}
                      onChange={(e) => setTeaching({ ...teaching, eyebrow: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                      Section Heading
                    </label>
                    <input
                      type="text"
                      value={teaching.title}
                      onChange={(e) => setTeaching({ ...teaching, title: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-[#0f2c59]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Intro Description
                  </label>
                  <textarea
                    rows={2}
                    value={teaching.description}
                    onChange={(e) => setTeaching({ ...teaching, description: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm"
                  />
                </div>

                {/* Service Cards List */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-[#0f2c59]">
                      Service Package Offerings ({teaching.topics.length})
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        const newTopic = {
                          id: `topic-${Date.now()}`,
                          enabled: true,
                          number: String(teaching.topics.length + 1).padStart(2, '0'),
                          title: 'New Service Package',
                          tagline: 'Service overview and key deliverables',
                          description: '✔ Core deliverable 1\n✔ Core deliverable 2',
                          takeaways: ['Feature 1', 'Feature 2'],
                        };
                        setTeaching({ ...teaching, topics: [...teaching.topics, newTopic] });
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-[#0f2c59] hover:bg-[#138354] transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Service Package</span>
                    </button>
                  </div>

                  <div className="space-y-4">
                    {teaching.topics.map((topic, idx) => (
                      <div
                        key={topic.id || idx}
                        className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-bold text-[#138354] bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-md">
                            Package #{topic.number || idx + 1}
                          </span>
                          <div className="flex items-center gap-3">
                            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                              <input
                                type="checkbox"
                                checked={topic.enabled !== false}
                                onChange={(e) => {
                                  const updated = [...teaching.topics];
                                  updated[idx] = { ...updated[idx], enabled: e.target.checked };
                                  setTeaching({ ...teaching, topics: updated });
                                }}
                                className="rounded text-[#138354]"
                              />
                              <span>Active</span>
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                const updated = teaching.topics.filter((_, i) => i !== idx);
                                setTeaching({ ...teaching, topics: updated });
                              }}
                              className="text-red-500 hover:text-red-700 p-1"
                              title="Delete package"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Service Title</label>
                            <input
                              type="text"
                              value={topic.title}
                              onChange={(e) => {
                                const updated = [...teaching.topics];
                                updated[idx] = { ...updated[idx], title: e.target.value };
                                setTeaching({ ...teaching, topics: updated });
                              }}
                              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold text-[#0f2c59]"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Tagline</label>
                            <input
                              type="text"
                              value={topic.tagline}
                              onChange={(e) => {
                                const updated = [...teaching.topics];
                                updated[idx] = { ...updated[idx], tagline: e.target.value };
                                setTeaching({ ...teaching, topics: updated });
                              }}
                              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Included Deliverables (Line separated)
                          </label>
                          <textarea
                            rows={2}
                            value={topic.description}
                            onChange={(e) => {
                              const updated = [...teaching.topics];
                              updated[idx] = { ...updated[idx], description: e.target.value };
                              setTeaching({ ...teaching, topics: updated });
                            }}
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* CATEGORY 4: ABOUT & WHY CHOOSE US                             */}
            {/* ------------------------------------------------------------- */}
            {activeCategory === 'aboutWhyUs' && (
              <div className="space-y-6">
                {/* Sub-tab pills */}
                <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl w-fit">
                  <button
                    type="button"
                    onClick={() => setSubTabAboutWhyUs('about')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      subTabAboutWhyUs === 'about'
                        ? 'bg-white text-[#0f2c59] shadow-xs'
                        : 'text-slate-600 hover:text-slate-800'
                    }`}
                  >
                    About Geetha N. ({about.enabled !== false ? 'Active' : 'Hidden'})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubTabAboutWhyUs('whyUs')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      subTabAboutWhyUs === 'whyUs'
                        ? 'bg-white text-[#0f2c59] shadow-xs'
                        : 'text-slate-600 hover:text-slate-800'
                    }`}
                  >
                    Why Choose Us ({whyUs.enabled !== false ? 'Active' : 'Hidden'})
                  </button>
                </div>

                {/* SUB-TAB 1: ABOUT SECTION */}
                {subTabAboutWhyUs === 'about' && (
                  <div className="space-y-6">
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-[#0f2c59]">About Section Visibility</h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Controls the About section and its 3 feature cards on the homepage.
                        </p>
                      </div>
                      <label className="inline-flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={about.enabled !== false}
                          onChange={(e) => setAbout({ ...about, enabled: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#138354]"></div>
                        <span className="text-xs font-bold text-slate-800">
                          {about.enabled !== false ? 'Section Visible' : 'Section Hidden'}
                        </span>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                          Eyebrow Label
                        </label>
                        <input
                          type="text"
                          value={about.eyebrow}
                          onChange={(e) => setAbout({ ...about, eyebrow: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                          Main Heading
                        </label>
                        <input
                          type="text"
                          value={about.title}
                          onChange={(e) => setAbout({ ...about, title: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-[#0f2c59]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                        Biography & Introduction Copy
                      </label>
                      <textarea
                        rows={3}
                        value={about.description || ''}
                        onChange={(e) => setAbout({ ...about, description: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm"
                      />
                    </div>

                    {/* Feature Cards */}
                    <div className="space-y-4 pt-4 border-t border-slate-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-bold text-[#0f2c59]">
                            Core Value Feature Cards ({about.cards?.length || 3})
                          </h3>
                          <p className="text-xs text-slate-500">
                            The 3 feature cards displayed evenly on desktop (Absolute Accuracy, Save Time & Energy, Personalized Approach).
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const currentCards = about.cards ? [...about.cards] : [];
                            currentCards.push({
                              id: `card-${Date.now()}`,
                              enabled: true,
                              title: 'New Feature Card',
                              description: 'Description of value proposition or guarantee.',
                            });
                            setAbout({ ...about, cards: currentCards });
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-[#0f2c59] hover:bg-[#138354] transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Feature Card</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {(about.cards || [
                          { id: 'card-1', enabled: true, title: 'Absolute Accuracy', description: 'Every entry, ledger, and reconciliation is handled with precision to eliminate discrepancies and errors.' },
                          { id: 'card-2', enabled: true, title: 'Save Time & Energy', description: 'Delegate tedious paperwork and financial tracking so you can focus entirely on core business operations.' },
                          { id: 'card-3', enabled: true, title: 'Personalized Approach', description: 'Tailored financial packages and customized reporting that fit your unique business requirements.' },
                        ]).map((card, idx) => (
                          <div
                            key={card.id || idx}
                            className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3 flex flex-col justify-between"
                          >
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-mono font-bold text-[#138354]">
                                  Card #{idx + 1}
                                </span>
                                <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-700">
                                  <input
                                    type="checkbox"
                                    checked={card.enabled !== false}
                                    onChange={(e) => {
                                      const current = about.cards ? [...about.cards] : [];
                                      current[idx] = { ...current[idx], enabled: e.target.checked };
                                      setAbout({ ...about, cards: current });
                                    }}
                                    className="rounded text-[#138354]"
                                  />
                                  <span>Active</span>
                                </label>
                              </div>
                              <input
                                type="text"
                                value={card.title}
                                onChange={(e) => {
                                  const current = about.cards ? [...about.cards] : [];
                                  current[idx] = { ...current[idx], title: e.target.value };
                                  setAbout({ ...about, cards: current });
                                }}
                                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-[#0f2c59]"
                              />
                              <textarea
                                rows={3}
                                value={card.description}
                                onChange={(e) => {
                                  const current = about.cards ? [...about.cards] : [];
                                  current[idx] = { ...current[idx], description: e.target.value };
                                  setAbout({ ...about, cards: current });
                                }}
                                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-600"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const current = about.cards ? about.cards.filter((_, i) => i !== idx) : [];
                                setAbout({ ...about, cards: current });
                              }}
                              className="text-red-500 hover:text-red-700 text-xs flex items-center gap-1 self-end font-medium"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Remove</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* SUB-TAB 2: WHY CHOOSE US */}
                {subTabAboutWhyUs === 'whyUs' && (
                  <div className="space-y-6">
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-[#0f2c59]">Why Choose Us Visibility</h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Controls the Why Partner With Us section on the homepage.
                        </p>
                      </div>
                      <label className="inline-flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={whyUs.enabled !== false}
                          onChange={(e) => setWhyUs({ ...whyUs, enabled: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#138354]"></div>
                        <span className="text-xs font-bold text-slate-800">
                          {whyUs.enabled !== false ? 'Section Visible' : 'Section Hidden'}
                        </span>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                          Eyebrow Label
                        </label>
                        <input
                          type="text"
                          value={whyUs.eyebrow}
                          onChange={(e) => setWhyUs({ ...whyUs, eyebrow: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                          Section Heading
                        </label>
                        <input
                          type="text"
                          value={whyUs.title}
                          onChange={(e) => setWhyUs({ ...whyUs, title: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-[#0f2c59]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                        Intro Description
                      </label>
                      <textarea
                        rows={2}
                        value={whyUs.description}
                        onChange={(e) => setWhyUs({ ...whyUs, description: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                          Call-to-Action Phone Box Heading
                        </label>
                        <input
                          type="text"
                          value={whyUs.ctaTitle || 'Ready for Stress-Free Accounting?'}
                          onChange={(e) => setWhyUs({ ...whyUs, ctaTitle: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                          Consultation Direct Phone Number
                        </label>
                        <input
                          type="text"
                          value={whyUs.ctaPhone || '9538913912'}
                          onChange={(e) => setWhyUs({ ...whyUs, ctaPhone: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-mono font-bold"
                        />
                      </div>
                    </div>

                    {/* Benefits List */}
                    <div className="space-y-4 pt-4 border-t border-slate-100">
                      <h3 className="text-sm font-bold text-[#0f2c59]">Why Choose Us Key Reasons</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {(whyUs.reasons || []).map((reason, idx) => (
                          <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                            <span className="text-[11px] font-mono font-bold text-[#138354]">
                              Benefit #{idx + 1}
                            </span>
                            <input
                              type="text"
                              value={reason.title}
                              onChange={(e) => {
                                const updated = [...whyUs.reasons];
                                updated[idx] = { ...updated[idx], title: e.target.value };
                                setWhyUs({ ...whyUs, reasons: updated });
                              }}
                              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-[#0f2c59]"
                            />
                            <textarea
                              rows={3}
                              value={reason.description}
                              onChange={(e) => {
                                const updated = [...whyUs.reasons];
                                updated[idx] = { ...updated[idx], description: e.target.value };
                                setWhyUs({ ...whyUs, reasons: updated });
                              }}
                              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-600"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* CATEGORY 5: CONTACT & INQUIRY                                 */}
            {/* ------------------------------------------------------------- */}
            {activeCategory === 'contact' && (
              <div className="space-y-6">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-[#0f2c59]">Contact Section Visibility</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Toggle whether the Contact section is rendered on the homepage.
                    </p>
                  </div>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={contactPage.enabled !== false}
                      onChange={(e) => setContactPage({ ...contactPage, enabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#138354]"></div>
                    <span className="text-xs font-bold text-slate-800">
                      {contactPage.enabled !== false ? 'Section Visible' : 'Section Hidden'}
                    </span>
                  </label>
                </div>

                {/* Form Open / Paused switch */}
                <div className="p-4 rounded-2xl bg-[#F4EFE6]/50 border border-[#E2DBD0] flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-[#0f2c59]">Online Inquiry Form Status</h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      When paused, the web form is disabled and instructs visitors to call or email directly.
                    </p>
                  </div>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={contactPage.formEnabled}
                      onChange={(e) => setContactPage({ ...contactPage, formEnabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#138354]"></div>
                    <span className="text-xs font-bold text-slate-800">
                      {contactPage.formEnabled ? 'Form Open' : 'Form Paused'}
                    </span>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                      Section Heading
                    </label>
                    <input
                      type="text"
                      value={contactPage.title}
                      onChange={(e) => setContactPage({ ...contactPage, title: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-[#0f2c59]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                      Direct Support Email
                    </label>
                    <input
                      type="email"
                      value={contactPage.supportEmail}
                      onChange={(e) => setContactPage({ ...contactPage, supportEmail: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={contactPage.phone || ''}
                      onChange={(e) => setContactPage({ ...contactPage, phone: e.target.value })}
                      placeholder="9538913912"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                      Working Hours
                    </label>
                    <input
                      type="text"
                      value={contactPage.workingHours || ''}
                      onChange={(e) => setContactPage({ ...contactPage, workingHours: e.target.value })}
                      placeholder="Monday – Saturday: 9:00 AM – 6:00 PM"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Subtitle Copy
                  </label>
                  <textarea
                    rows={2}
                    value={contactPage.subtitle}
                    onChange={(e) => setContactPage({ ...contactPage, subtitle: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                      Availability Notice
                    </label>
                    <input
                      type="text"
                      value={contactPage.availabilityNote}
                      onChange={(e) => setContactPage({ ...contactPage, availabilityNote: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                      Direct Response Copy
                    </label>
                    <input
                      type="text"
                      value={contactPage.directCopy || ''}
                      onChange={(e) => setContactPage({ ...contactPage, directCopy: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* CATEGORY 6: OTHER ACTIVE PAGES (SUBPAGES)                      */}
            {/* ------------------------------------------------------------- */}
            {activeCategory === 'otherPages' && (
              <div className="space-y-6">
                {/* Sub-tab pills */}
                <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl w-fit flex-wrap">
                  <button
                    type="button"
                    onClick={() => setSubTabOtherPages('aboutPage')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      subTabOtherPages === 'aboutPage'
                        ? 'bg-white text-[#0f2c59] shadow-xs'
                        : 'text-slate-600 hover:text-slate-800'
                    }`}
                  >
                    Dedicated About Page (/about)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubTabOtherPages('storePage')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      subTabOtherPages === 'storePage'
                        ? 'bg-white text-[#0f2c59] shadow-xs'
                        : 'text-slate-600 hover:text-slate-800'
                    }`}
                  >
                    Dedicated Store Page (/store)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubTabOtherPages('book')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      subTabOtherPages === 'book'
                        ? 'bg-white text-[#0f2c59] shadow-xs'
                        : 'text-slate-600 hover:text-slate-800'
                    }`}
                  >
                    The Book & Chapters (/book)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubTabOtherPages('communityPage')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      subTabOtherPages === 'communityPage'
                        ? 'bg-white text-[#0f2c59] shadow-xs'
                        : 'text-slate-600 hover:text-slate-800'
                    }`}
                  >
                    Community Page (/community)
                  </button>
                </div>

                {/* DEDICATED ABOUT PAGE */}
                {subTabOtherPages === 'aboutPage' && (
                  <div className="space-y-6">
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-[#0f2c59]">Dedicated /about Page Visibility</h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          When disabled, visitors to /about see a graceful page-unavailable notice.
                        </p>
                      </div>
                      <label className="inline-flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={aboutPage.enabled !== false}
                          onChange={(e) => setAboutPage({ ...aboutPage, enabled: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#138354]"></div>
                        <span className="text-xs font-bold text-slate-800">
                          {aboutPage.enabled !== false ? 'Page Active' : 'Page Disabled'}
                        </span>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
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
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                          Hero Headline
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
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-[#0f2c59]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                        Story Heading
                      </label>
                      <input
                        type="text"
                        value={aboutPage.story.title}
                        onChange={(e) =>
                          setAboutPage({
                            ...aboutPage,
                            story: { ...aboutPage.story, title: e.target.value },
                          })
                        }
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold"
                      />
                    </div>
                  </div>
                )}

                {/* DEDICATED STORE PAGE */}
                {subTabOtherPages === 'storePage' && (
                  <div className="space-y-6">
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-[#0f2c59]">Dedicated /store Page Visibility</h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          When disabled, /store displays an inactive notice without deleting products.
                        </p>
                      </div>
                      <label className="inline-flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={storePage.enabled !== false}
                          onChange={(e) => setStorePage({ ...storePage, enabled: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#138354]"></div>
                        <span className="text-xs font-bold text-slate-800">
                          {storePage.enabled !== false ? 'Page Active' : 'Page Disabled'}
                        </span>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                          Catalog Heading
                        </label>
                        <input
                          type="text"
                          value={storePage.title}
                          onChange={(e) => setStorePage({ ...storePage, title: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-[#0f2c59]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                          Subtitle
                        </label>
                        <input
                          type="text"
                          value={storePage.subtitle}
                          onChange={(e) => setStorePage({ ...storePage, subtitle: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* THE BOOK */}
                {subTabOtherPages === 'book' && (
                  <div className="space-y-6">
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-[#0f2c59]">Book Section & Route Visibility</h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Controls public visibility of the Book page and homepage promo.
                        </p>
                      </div>
                      <label className="inline-flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={book.enabled !== false}
                          onChange={(e) => setBook({ ...book, enabled: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#138354]"></div>
                        <span className="text-xs font-bold text-slate-800">
                          {book.enabled !== false ? 'Active' : 'Disabled'}
                        </span>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                          Book Title
                        </label>
                        <input
                          type="text"
                          value={book.title}
                          onChange={(e) => setBook({ ...book, title: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-[#0f2c59]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                          Subtitle
                        </label>
                        <input
                          type="text"
                          value={book.subtitle}
                          onChange={(e) => setBook({ ...book, subtitle: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* COMMUNITY PAGE */}
                {subTabOtherPages === 'communityPage' && (
                  <div className="space-y-6">
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-[#0f2c59]">Community Page Visibility</h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Controls the public /community route visibility.
                        </p>
                      </div>
                      <label className="inline-flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={communityPage.enabled !== false}
                          onChange={(e) => setCommunityPage({ ...communityPage, enabled: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#138354]"></div>
                        <span className="text-xs font-bold text-slate-800">
                          {communityPage.enabled !== false ? 'Active' : 'Disabled'}
                        </span>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                          Community Hero Title
                        </label>
                        <input
                          type="text"
                          value={communityPage.hero.title}
                          onChange={(e) =>
                            setCommunityPage({
                              ...communityPage,
                              hero: { ...communityPage.hero, title: e.target.value },
                            })
                          }
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-[#0f2c59]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                          Hero Subtitle
                        </label>
                        <input
                          type="text"
                          value={communityPage.hero.subtitle}
                          onChange={(e) =>
                            setCommunityPage({
                              ...communityPage,
                              hero: { ...communityPage.hero, subtitle: e.target.value },
                            })
                          }
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
