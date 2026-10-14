'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Save,
  AlertCircle,
  RefreshCw,
  Plus,
  Trash2,
  ExternalLink,
  Layers,
  Sparkles,
  Users,
  BookOpen,
  Compass,
  Mail,
  Upload,
  Camera,
  LayoutDashboard,
  CheckCircle2,
  RotateCcw,
  Star,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
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
  ReviewItem,
  ReviewsSectionContent,
} from '@/types/site-content';
import {
  DEFAULT_BRANDING_CONTENT,
  DEFAULT_HERO_CONTENT,
  DEFAULT_PROFILE_IMAGE,
  DEFAULT_TEACHING_CONTENT,
  DEFAULT_ABOUT_CONTENT,
  DEFAULT_BOOK_PAGE_CONTENT,
  DEFAULT_COMMUNITY_PAGE_CONTENT,
  DEFAULT_ABOUT_PAGE_CONTENT,
  DEFAULT_CONTACT_PAGE_CONTENT,
  DEFAULT_STORE_PAGE_CONTENT,
  DEFAULT_WHY_US_CONTENT,
  DEFAULT_REVIEWS_SECTION_CONTENT,
  DEFAULT_GOOGLE_MAPS_URL,
} from '@/lib/firebase/content';

export type MainCategory =
  | 'branding'
  | 'hero'
  | 'reviews'
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
    id: 'reviews',
    label: 'Homepage Reviews & Testimonials',
    badgeLabel: 'Google Reviews',
    description: 'Manage client Google reviews, ratings, screenshot uploads, ordering, and Google Maps URL.',
    icon: Star,
    previewUrl: '/#reviews',
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
  const [reviews, setReviews] = useState<ReviewsSectionContent>(DEFAULT_REVIEWS_SECTION_CONTENT);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [uploadingReviewImgId, setUploadingReviewImgId] = useState<string | null>(null);
  const [reviewUploadProgress, setReviewUploadProgress] = useState<Record<string, number>>({});

  // Other pages content state
  const [aboutPage, setAboutPage] = useState<AboutPageContent>(DEFAULT_ABOUT_PAGE_CONTENT);
  const [storePage, setStorePage] = useState<StorePageContent>(DEFAULT_STORE_PAGE_CONTENT);
  const [book, setBook] = useState<BookContent>(DEFAULT_BOOK_PAGE_CONTENT);
  const [communityPage, setCommunityPage] = useState<CommunityPageContent>(DEFAULT_COMMUNITY_PAGE_CONTENT);

  // Retained references for untouched historical documents (prevents accidental deletion or loss)
  const retainedDocsRef = useRef<{ [key: string]: unknown }>({});

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
        reviewsDoc,
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
        getSiteContentDoc<ReviewsSectionContent>('reviews'),
      ]);

      const loadedBranding = brandingDoc ? { ...DEFAULT_BRANDING_CONTENT, ...brandingDoc } : DEFAULT_BRANDING_CONTENT;
      const loadedHero: HeroContent = heroDoc
        ? {
            ...DEFAULT_HERO_CONTENT,
            ...heroDoc,
            primaryButtonText: heroDoc.primaryButtonText || DEFAULT_HERO_CONTENT.primaryButtonText,
            primaryButtonLink: heroDoc.primaryButtonLink || DEFAULT_HERO_CONTENT.primaryButtonLink,
            secondaryButtonText: heroDoc.secondaryButtonText || DEFAULT_HERO_CONTENT.secondaryButtonText,
            secondaryButtonLink: heroDoc.secondaryButtonLink || DEFAULT_HERO_CONTENT.secondaryButtonLink,
            trustIndicator1: heroDoc.trustIndicator1 || DEFAULT_HERO_CONTENT.trustIndicator1,
            trustIndicator2: heroDoc.trustIndicator2 || DEFAULT_HERO_CONTENT.trustIndicator2,
            profileName: heroDoc.profileName || DEFAULT_HERO_CONTENT.profileName,
            profileRole: heroDoc.profileRole || DEFAULT_HERO_CONTENT.profileRole,
            profileDescription: heroDoc.profileDescription || DEFAULT_HERO_CONTENT.profileDescription,
            profilePhone: heroDoc.profilePhone || DEFAULT_HERO_CONTENT.profilePhone,
            profileEmail: heroDoc.profileEmail || DEFAULT_HERO_CONTENT.profileEmail,
          }
        : DEFAULT_HERO_CONTENT;
      const loadedTeach = teachDoc ? { ...DEFAULT_TEACHING_CONTENT, ...teachDoc } : DEFAULT_TEACHING_CONTENT;
      const loadedAbout = aboutDoc ? { ...DEFAULT_ABOUT_CONTENT, ...aboutDoc } : DEFAULT_ABOUT_CONTENT;
      const loadedWhyUs = whyUsDoc ? { ...DEFAULT_WHY_US_CONTENT, ...whyUsDoc } : DEFAULT_WHY_US_CONTENT;
      const loadedContact = contactPageDoc ? { ...DEFAULT_CONTACT_PAGE_CONTENT, ...contactPageDoc } : DEFAULT_CONTACT_PAGE_CONTENT;
      const loadedAboutPage = aboutPageDoc ? { ...DEFAULT_ABOUT_PAGE_CONTENT, ...aboutPageDoc } : DEFAULT_ABOUT_PAGE_CONTENT;
      const loadedStorePage = storePageDoc ? { ...DEFAULT_STORE_PAGE_CONTENT, ...storePageDoc } : DEFAULT_STORE_PAGE_CONTENT;
      const loadedBook = bookDoc ? { ...DEFAULT_BOOK_PAGE_CONTENT, ...bookDoc } : DEFAULT_BOOK_PAGE_CONTENT;
      const loadedCommPage = commPageDoc ? { ...DEFAULT_COMMUNITY_PAGE_CONTENT, ...commPageDoc } : DEFAULT_COMMUNITY_PAGE_CONTENT;
      const loadedReviews: ReviewsSectionContent = reviewsDoc
        ? {
            ...DEFAULT_REVIEWS_SECTION_CONTENT,
            ...reviewsDoc,
            reviews:
              reviewsDoc.reviews && reviewsDoc.reviews.length > 0
                ? reviewsDoc.reviews
                : DEFAULT_REVIEWS_SECTION_CONTENT.reviews,
          }
        : DEFAULT_REVIEWS_SECTION_CONTENT;

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
      setReviews(loadedReviews);

      if (statsDoc) retainedDocsRef.current['stats'] = statsDoc;
      if (commDoc) retainedDocsRef.current['community'] = commDoc;
      if (callDoc) retainedDocsRef.current['callStructure'] = callDoc;
      if (storeDoc) retainedDocsRef.current['store'] = storeDoc;
      if (call1on1Doc) retainedDocsRef.current['oneOnOne'] = call1on1Doc;
      if (ctaDoc) retainedDocsRef.current['finalCta'] = ctaDoc;

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
          reviews: loadedReviews,
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadAllContent();
  }, [loadAllContent]);

  // Determine current active section key to save
  const currentSectionKey = useMemo(() => {
    switch (activeCategory) {
      case 'branding':
        return 'branding';
      case 'hero':
        return 'hero';
      case 'reviews':
        return 'reviews';
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
        case 'reviews':
          return JSON.stringify(parsed.reviews) !== JSON.stringify(reviews);
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
    reviews,
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
      if (activeCategory === 'reviews') setReviews(parsed.reviews);
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

  // Review Image / Screenshot Upload helper with real upload progress
  const uploadReviewImageFile = async (
    file: File,
    onProgress: (p: number) => void
  ): Promise<string> => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      throw new Error(`Unsupported file type "${file.type}". Please upload JPEG, PNG, WebP, GIF, or SVG.`);
    }
    if (file.size > 10 * 1024 * 1024) {
      throw new Error(`File is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Limit is 10MB.`);
    }

    const token = await auth.currentUser?.getIdToken();
    if (!token) {
      throw new Error('Authentication required. Please sign in as an administrator.');
    }

    const formData = new FormData();
    formData.append('file', file);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/admin/reviews/upload');
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

      xhr.onerror = () => reject(new Error('Network connection error during review image upload.'));
      xhr.send(formData);
    });
  };

  const handleReviewFieldChange = (
    reviewId: string,
    field: keyof ReviewItem,
    value: unknown
  ) => {
    setReviews((prev) => ({
      ...prev,
      reviews: prev.reviews.map((r) =>
        r.id === reviewId ? { ...r, [field]: value } : r
      ),
    }));
  };

  const handleAddReview = () => {
    const newId = `review-${Date.now()}`;
    const newOrder = (reviews.reviews.length || 0) + 1;
    const newReview: ReviewItem = {
      id: newId,
      reviewerName: 'New Client',
      reviewCountText: '1 review',
      rating: 5,
      reviewDate: 'Recently',
      isNew: false,
      reviewText: 'Write the client review or testimonial here...',
      ownerResponse: null,
      ownerResponseDate: null,
      reviewerImageUrl: null,
      reviewerInitials: 'N',
      avatarBgColor: '#0f2c59',
      reviewScreenshotUrl: null,
      sortOrder: newOrder,
      isVisible: true,
    };
    setReviews((prev) => ({
      ...prev,
      reviews: [...prev.reviews, newReview],
    }));
    setEditingReviewId(newId);
  };

  const handleDeleteReview = async (reviewId: string) => {
    const confirmDelete = window.confirm(
      'Are you sure you want to delete this review? This action cannot be undone.'
    );
    if (!confirmDelete) return;

    setReviews((prev) => ({
      ...prev,
      reviews: prev.reviews.filter((r) => r.id !== reviewId),
    }));

    try {
      const token = await auth.currentUser?.getIdToken();
      if (token) {
        await fetch(`/api/admin/reviews?id=${reviewId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch (err) {
      console.warn('Review delete API warning:', err);
    }
  };

  const handleMoveReview = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= reviews.reviews.length) return;

    const updated = [...reviews.reviews];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    const reordered = updated.map((rev, idx) => ({
      ...rev,
      sortOrder: idx + 1,
    }));

    setReviews((prev) => ({
      ...prev,
      reviews: reordered,
    }));
  };

  const handleReviewImageUpload = async (reviewId: string, file: File) => {
    setUploadingReviewImgId(reviewId);
    setReviewUploadProgress((prev) => ({ ...prev, [reviewId]: 0 }));
    setErrorMessage(null);

    try {
      const url = await uploadReviewImageFile(file, (p) => {
        setReviewUploadProgress((prev) => ({ ...prev, [reviewId]: p }));
      });
      setReviews((prev) => ({
        ...prev,
        reviews: prev.reviews.map((r) =>
          r.id === reviewId
            ? {
                ...r,
                reviewScreenshotUrl: url,
                reviewerImageUrl: r.reviewerImageUrl || url,
              }
            : r
        ),
      }));
      setSuccessMessage('Review image/screenshot uploaded successfully.');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      setErrorMessage(msg);
    } finally {
      setUploadingReviewImgId(null);
    }
  };

  const handleRemoveReviewImage = (reviewId: string) => {
    setReviews((prev) => ({
      ...prev,
      reviews: prev.reviews.map((r) =>
        r.id === reviewId
          ? {
              ...r,
              reviewScreenshotUrl: null,
              reviewerImageUrl: null,
            }
          : r
      ),
    }));
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
        case 'reviews':
          dataToSave = reviews;
          sectionTitle = 'Homepage Reviews & Testimonials';
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

      // If reviews section was saved, also sync individual docs in homepageReviews
      if (currentSectionKey === 'reviews') {
        try {
          await fetch('/api/admin/reviews', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ reviews: reviews.reviews }),
          });
        } catch (syncErr) {
          console.warn('[Reviews CMS] Collection batch sync warning:', syncErr);
        }
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
      case 'reviews':
        return reviews.enabled !== false
          ? {
              label: `Active (${reviews.reviews?.filter((r) => r.isVisible !== false).length || 0} Visible)`,
              color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            }
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
    if (activeCategory === 'reviews') return '/#reviews';
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
            {/* CATEGORY: HOMEPAGE REVIEWS & TESTIMONIALS                     */}
            {/* ------------------------------------------------------------- */}
            {activeCategory === 'reviews' && (
              <div className="space-y-6">
                {/* 1. Global Section Visibility & Google Reviews Config */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div>
                      <h3 className="text-base font-bold text-[#0f2c59] flex items-center gap-2">
                        <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                        <span>Homepage Reviews Carousel Settings</span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Enable or disable the carousel section and configure the Google Reviews badge and Maps link.
                      </p>
                    </div>

                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={reviews.enabled !== false}
                        onChange={(e) => setReviews({ ...reviews, enabled: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#138354]"></div>
                      <span className="text-xs font-semibold text-slate-700">
                        {reviews.enabled !== false ? 'Section Enabled' : 'Section Hidden'}
                      </span>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                        Section Heading
                      </label>
                      <input
                        type="text"
                        value={reviews.heading || ''}
                        onChange={(e) => setReviews({ ...reviews, heading: e.target.value })}
                        placeholder="What Our Clients Say"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#138354]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                        Carousel Auto-Advance (Seconds)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        min="2"
                        max="15"
                        value={reviews.autoAdvanceSeconds ?? 4.5}
                        onChange={(e) =>
                          setReviews({
                            ...reviews,
                            autoAdvanceSeconds: parseFloat(e.target.value) || 4.5,
                          })
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#138354]"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                        Section Subtitle
                      </label>
                      <textarea
                        rows={2}
                        value={reviews.subtitle || ''}
                        onChange={(e) => setReviews({ ...reviews, subtitle: e.target.value })}
                        placeholder="Trusted by our clients for reliable accounting, professional guidance, and hassle-free tax filing."
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#138354]"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-semibold text-slate-700 uppercase">
                          Finance with Geetha Google Maps Place URL
                        </label>
                        <a
                          href={reviews.googleMapsUrl || DEFAULT_GOOGLE_MAPS_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-[#138354] font-semibold hover:underline"
                        >
                          <span>Test Location Listing</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      <input
                        type="url"
                        value={reviews.googleMapsUrl || ''}
                        onChange={(e) => setReviews({ ...reviews, googleMapsUrl: e.target.value })}
                        placeholder={DEFAULT_GOOGLE_MAPS_URL}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#138354]"
                      />
                      <p className="text-[11px] text-slate-500 mt-1">
                        Used by the &ldquo;View All Google Reviews&rdquo; and &ldquo;Get Directions&rdquo; buttons on the homepage carousel.
                      </p>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <label className="inline-flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={reviews.showGoogleRatingBadge !== false}
                          onChange={(e) =>
                            setReviews({ ...reviews, showGoogleRatingBadge: e.target.checked })
                          }
                          className="w-4 h-4 text-[#138354] rounded border-slate-300 focus:ring-[#138354]"
                        />
                        <span className="text-xs font-semibold text-slate-700">
                          Show Google Reviews Rating Badge
                        </span>
                      </label>
                    </div>

                    <div className="flex items-center gap-4">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-0.5">
                          Average Rating
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="1"
                          max="5"
                          value={reviews.averageRating ?? 5.0}
                          onChange={(e) =>
                            setReviews({ ...reviews, averageRating: parseFloat(e.target.value) || 5.0 })
                          }
                          className="w-24 px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-mono text-center"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-0.5">
                          Total Reviews Count
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={reviews.totalReviewsCount ?? reviews.reviews.length}
                          onChange={(e) =>
                            setReviews({ ...reviews, totalReviewsCount: parseInt(e.target.value, 10) || 5 })
                          }
                          className="w-24 px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-mono text-center"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Reviews List Management */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                    <div>
                      <h3 className="text-base font-bold text-[#0f2c59] flex items-center gap-2">
                        <span>Individual Client Reviews ({reviews.reviews?.length || 0})</span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Add, reorder, edit, or upload screenshot proof for client Google reviews.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddReview}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#138354] hover:bg-[#0f2c59] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add New Review</span>
                    </button>
                  </div>

                  {/* List of reviews */}
                  <div className="space-y-4">
                    {reviews.reviews.map((rev, index) => {
                      const isEditing = editingReviewId === rev.id;
                      const uploadProgress = reviewUploadProgress[rev.id];
                      const isUploading = uploadingReviewImgId === rev.id;

                      return (
                        <div
                          key={rev.id}
                          className={`rounded-2xl border transition-all ${
                            rev.isVisible === false
                              ? 'bg-slate-50/80 border-slate-200 opacity-75'
                              : 'bg-white border-slate-200 shadow-xs hover:border-slate-300'
                          }`}
                        >
                          {/* Review Summary Bar */}
                          <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              {/* Reorder Up/Down */}
                              <div className="flex flex-col gap-1">
                                <button
                                  type="button"
                                  disabled={index === 0}
                                  onClick={() => handleMoveReview(index, 'up')}
                                  aria-label="Move review up"
                                  className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                                >
                                  <ArrowUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  disabled={index === reviews.reviews.length - 1}
                                  onClick={() => handleMoveReview(index, 'down')}
                                  aria-label="Move review down"
                                  className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                                >
                                  <ArrowDown className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {/* Reviewer Avatar thumbnail */}
                              {rev.reviewerImageUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={rev.reviewerImageUrl}
                                  alt={rev.reviewerName}
                                  className="w-10 h-10 rounded-full object-cover border border-slate-200 flex-shrink-0"
                                />
                              ) : (
                                <div
                                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 select-none"
                                  style={{ backgroundColor: rev.avatarBgColor || '#0f2c59' }}
                                >
                                  {rev.reviewerInitials || rev.reviewerName.charAt(0).toUpperCase()}
                                </div>
                              )}

                              {/* Name, rating & preview text */}
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-slate-900 text-sm truncate">
                                    {rev.reviewerName || 'Unnamed Reviewer'}
                                  </span>
                                  <div className="flex items-center text-amber-400">
                                    {[...Array(rev.rating || 5)].map((_, i) => (
                                      <Star key={i} className="w-3 h-3 fill-amber-400 stroke-amber-400" />
                                    ))}
                                  </div>
                                  <span className="text-xs text-slate-400">({rev.reviewDate})</span>
                                  {rev.isNew && (
                                    <span className="px-1.5 py-0.2 text-[9px] font-bold text-slate-600 border border-slate-300 rounded uppercase">
                                      NEW
                                    </span>
                                  )}
                                  {rev.isVisible === false && (
                                    <span className="px-2 py-0.5 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-full">
                                      Hidden on Website
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-slate-600 truncate max-w-md mt-0.5">
                                  {rev.reviewText}
                                </p>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 self-end md:self-auto flex-shrink-0">
                              {/* Toggle visibility */}
                              <button
                                type="button"
                                onClick={() =>
                                  handleReviewFieldChange(rev.id, 'isVisible', rev.isVisible === false)
                                }
                                title={rev.isVisible === false ? 'Click to show on website' : 'Click to hide'}
                                className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                                  rev.isVisible !== false
                                    ? 'text-[#138354] bg-emerald-50 hover:bg-emerald-100'
                                    : 'text-slate-400 bg-slate-100 hover:bg-slate-200'
                                }`}
                              >
                                {rev.isVisible !== false ? (
                                  <>
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>Visible</span>
                                  </>
                                ) : (
                                  <>
                                    <EyeOff className="w-3.5 h-3.5" />
                                    <span>Hidden</span>
                                  </>
                                )}
                              </button>

                              {/* Edit toggle */}
                              <button
                                type="button"
                                onClick={() => setEditingReviewId(isEditing ? null : rev.id)}
                                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                              >
                                {isEditing ? 'Close' : 'Edit Details'}
                              </button>

                              {/* Delete */}
                              <button
                                type="button"
                                onClick={() => handleDeleteReview(rev.id)}
                                aria-label="Delete review"
                                className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Expanded Edit Form */}
                          {isEditing && (
                            <div className="p-5 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl space-y-4 animate-in fade-in duration-150">
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                                <div className="sm:col-span-2">
                                  <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                                    Reviewer Name
                                  </label>
                                  <input
                                    type="text"
                                    value={rev.reviewerName}
                                    onChange={(e) =>
                                      handleReviewFieldChange(rev.id, 'reviewerName', e.target.value)
                                    }
                                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold bg-white"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                                    Review Count Text
                                  </label>
                                  <input
                                    type="text"
                                    value={rev.reviewCountText || '1 review'}
                                    onChange={(e) =>
                                      handleReviewFieldChange(rev.id, 'reviewCountText', e.target.value)
                                    }
                                    placeholder="1 review"
                                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                                    Star Rating
                                  </label>
                                  <select
                                    value={rev.rating || 5}
                                    onChange={(e) =>
                                      handleReviewFieldChange(
                                        rev.id,
                                        'rating',
                                        parseInt(e.target.value, 10) || 5
                                      )
                                    }
                                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold bg-white"
                                  >
                                    <option value={5}>★★★★★ (5 Stars)</option>
                                    <option value={4}>★★★★☆ (4 Stars)</option>
                                    <option value={3}>★★★☆☆ (3 Stars)</option>
                                    <option value={2}>★★☆☆☆ (2 Stars)</option>
                                    <option value={1}>★☆☆☆☆ (1 Star)</option>
                                  </select>
                                </div>

                                <div>
                                  <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                                    Review Date
                                  </label>
                                  <input
                                    type="text"
                                    value={rev.reviewDate}
                                    onChange={(e) =>
                                      handleReviewFieldChange(rev.id, 'reviewDate', e.target.value)
                                    }
                                    placeholder="4 days ago"
                                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                                    Initials (When no photo)
                                  </label>
                                  <input
                                    type="text"
                                    maxLength={2}
                                    value={rev.reviewerInitials || ''}
                                    onChange={(e) =>
                                      handleReviewFieldChange(
                                        rev.id,
                                        'reviewerInitials',
                                        e.target.value.toUpperCase()
                                      )
                                    }
                                    placeholder="S"
                                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono font-bold uppercase bg-white text-center"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                                    Avatar Color
                                  </label>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="color"
                                      value={rev.avatarBgColor || '#0f2c59'}
                                      onChange={(e) =>
                                        handleReviewFieldChange(rev.id, 'avatarBgColor', e.target.value)
                                      }
                                      className="w-8 h-8 rounded border border-slate-300 cursor-pointer"
                                    />
                                    <span className="text-xs font-mono text-slate-600">
                                      {rev.avatarBgColor || '#0f2c59'}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 pt-4">
                                  <label className="inline-flex items-center gap-1.5 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={Boolean(rev.isNew)}
                                      onChange={(e) =>
                                        handleReviewFieldChange(rev.id, 'isNew', e.target.checked)
                                      }
                                      className="w-4 h-4 text-[#138354] rounded border-slate-300 focus:ring-[#138354]"
                                    />
                                    <span className="text-xs font-semibold text-slate-700">
                                      Mark as &ldquo;NEW&rdquo;
                                    </span>
                                  </label>
                                </div>
                              </div>

                              {/* Review Text */}
                              <div>
                                <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                                  Client Review Text
                                </label>
                                <textarea
                                  rows={3}
                                  value={rev.reviewText}
                                  onChange={(e) =>
                                    handleReviewFieldChange(rev.id, 'reviewText', e.target.value)
                                  }
                                  placeholder="Full text of the Google review..."
                                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs leading-relaxed bg-white"
                                />
                              </div>

                              {/* Owner Response */}
                              <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                                <span className="block text-[11px] font-bold text-slate-800 uppercase">
                                  Owner Response (Optional)
                                </span>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                  <div className="md:col-span-2">
                                    <input
                                      type="text"
                                      value={rev.ownerResponse || ''}
                                      onChange={(e) =>
                                        handleReviewFieldChange(rev.id, 'ownerResponse', e.target.value)
                                      }
                                      placeholder="Thank you Kevin"
                                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                                    />
                                  </div>
                                  <div>
                                    <input
                                      type="text"
                                      value={rev.ownerResponseDate || ''}
                                      onChange={(e) =>
                                        handleReviewFieldChange(
                                          rev.id,
                                          'ownerResponseDate',
                                          e.target.value
                                        )
                                      }
                                      placeholder="2 years ago"
                                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Image & Screenshot Upload Section */}
                              <div className="p-4 bg-white rounded-xl border border-slate-200">
                                <label className="block text-[11px] font-bold text-slate-800 uppercase mb-2">
                                  Review Screenshot or Photo Proof
                                </label>

                                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                  {/* Preview */}
                                  {rev.reviewScreenshotUrl ? (
                                    <div className="relative group w-36 h-20 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center">
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img
                                        src={rev.reviewScreenshotUrl}
                                        alt="Review proof"
                                        className="w-full h-full object-contain"
                                      />
                                      <a
                                        href={rev.reviewScreenshotUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="absolute inset-0 bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs font-semibold"
                                      >
                                        <ExternalLink className="w-4 h-4 mr-1" />
                                        <span>View</span>
                                      </a>
                                    </div>
                                  ) : (
                                    <div className="w-36 h-20 rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-slate-400 text-[10px]">
                                      <Camera className="w-5 h-5 mb-1" />
                                      <span>No image uploaded</span>
                                    </div>
                                  )}

                                  {/* Upload Controls */}
                                  <div className="flex-1 space-y-2">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0f2c59] hover:bg-[#138354] text-white text-xs font-semibold cursor-pointer shadow-2xs transition-colors">
                                        <Upload className="w-3.5 h-3.5" />
                                        <span>{rev.reviewScreenshotUrl ? 'Replace Image' : 'Upload Image'}</span>
                                        <input
                                          type="file"
                                          accept="image/*"
                                          onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) handleReviewImageUpload(rev.id, file);
                                          }}
                                          className="sr-only"
                                        />
                                      </label>

                                      {rev.reviewScreenshotUrl && (
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveReviewImage(rev.id)}
                                          className="px-2.5 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold transition-colors cursor-pointer"
                                        >
                                          Remove Image
                                        </button>
                                      )}
                                    </div>

                                    {/* Upload Progress Bar */}
                                    {isUploading && (
                                      <div className="space-y-1">
                                        <div className="flex items-center justify-between text-[11px] text-slate-600 font-semibold">
                                          <span>Uploading to Firebase Storage...</span>
                                          <span className="font-mono">{uploadProgress || 0}%</span>
                                        </div>
                                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                                          <div
                                            className="h-full bg-[#138354] transition-all duration-200 rounded-full"
                                            style={{ width: `${uploadProgress || 5}%` }}
                                          />
                                        </div>
                                      </div>
                                    )}

                                    <p className="text-[11px] text-slate-500">
                                      Supports PNG, JPEG, WebP screenshots up to 10MB. Transferred safely with real upload progress tracking.
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
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
