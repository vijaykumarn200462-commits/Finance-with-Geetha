'use client';

export * from './content-defaults';
import { DEFAULT_PROFILE_IMAGE } from './content-defaults';

import { useState, useEffect, useMemo } from 'react';
import { db } from './client';
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  getDoc,
  onSnapshot,
} from 'firebase/firestore';
import { COLLECTIONS } from './collections';
import {
  HeroContent,
  StatsContent,
  TeachingContent,
  CommunityContent,
  CallStructureContent,
  BookSectionContent,
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
  BrandingContent,
} from '@/types/site-content';
import { DEFAULT_BRANDING_CONTENT } from './content-defaults';
import { SocialSettings, ContactSettings } from '@/types/settings';
import {
  BUSINESS_STATS,
  TEACHING_TOPICS,
  COMMUNITY_FEATURES,
  CALL_STEPS,
  BOOK_CHAPTERS,
  FAQ_ITEMS,
  PRODUCTS,
} from '@/lib/data';
import { Product as LocalProduct, ProductId } from '@/lib/types';
import { formatCurrency, formatPriceWithPeriod } from '@/lib/utils/currency';

export interface DynamicPricing {
  community: number;
  book: number;
  cheatsheets: number;
  workflow: number;
  call: number;
}

export const DEFAULT_PRICES: DynamicPricing = {
  community: 150,
  book: 29,
  cheatsheets: 40,
  workflow: 25,
  call: 150,
};

// ==========================================
// DEFAULT SITE CONTENT DEFINITIONS
// ==========================================

export const DEFAULT_HERO_CONTENT: HeroContent = {
  enabled: true,
  eyebrow: 'FINANCE & BOOKKEEPING COACHING',
  headline: 'Learn how to actually build a bookkeeping business.',
  supportingCopy:
    'Pricing. Discovery calls. Onboarding. The real work in software. How to talk to clients — and even how to build your website.',
  credibilityQuote:
    "I've run my own firm for five years. Now I teach other professionals exactly how I did it.",
  credibilityAuthor: 'Geetha, Founder of Finance with Geetha',
  primaryButtonText: 'Join the Community',
  secondaryButtonText: 'Start with the Book — ₹29',
  profileImageUrl: DEFAULT_PROFILE_IMAGE,
};

export const DEFAULT_STATS_CONTENT: StatsContent = {
  enabled: false,
  eyebrow: 'The Track Record',
  title: 'Real business. Real numbers.',
  subtitle: 'Not projections. My actual business.',
  stats: BUSINESS_STATS.map((s, idx) => ({
    id: `stat-${idx + 1}`,
    enabled: true,
    value: s.value,
    label: s.label,
    detail: s.detail,
  })),
};

export const DEFAULT_TEACHING_CONTENT: TeachingContent = {
  enabled: true,
  eyebrow: 'Practical Curriculum',
  title: 'The whole job — not just the pep talk.',
  description:
    "This isn't theory. These are the exact things I do in my own business every week, broken down so you can do them too.",
  topics: TEACHING_TOPICS.map((t, idx) => ({
    id: `topic-${idx + 1}`,
    enabled: true,
    number: t.number,
    title: t.title,
    tagline: t.tagline,
    description: t.description,
    takeaways: t.takeaways,
  })),
};

export const DEFAULT_COMMUNITY_CONTENT: CommunityContent = {
  enabled: true,
  eyebrow: 'Weekly Live Mentorship',
  title: 'The Community — Where it all happens',
  subtitle: 'This is where I do the actual coaching — every week.',
  description:
    'If you only do one thing, do this. The community is the center of everything — the calls, the answers, the templates, and direct access to me as you build.',
  price: 150,
  currency: 'INR',
  billingPeriod: 'month',
  callSchedule: 'Wednesdays & Fridays at noon',
  features: COMMUNITY_FEATURES.map((f) => f.title),
};

export const DEFAULT_CALL_STRUCTURE_CONTENT: CallStructureContent = {
  enabled: true,
  eyebrow: 'Format & Agenda',
  title: 'How our weekly calls run',
  description:
    'No rambling webinars. Every call follows a structured 60-minute agenda designed to solve specific operational roadblocks.',
  steps: CALL_STEPS.map((step, idx) => ({
    id: `step-${idx + 1}`,
    enabled: true,
    number: step.step,
    title: step.title,
    duration: '',
    description: step.description,
  })),
};

export const DEFAULT_BOOK_SECTION_CONTENT: BookSectionContent = {
  enabled: true,
  eyebrow: 'The Playbook',
  title: 'Start a Bookkeeping Business',
  subtitle: 'How to build one that pays you well — and leaves you alone.',
  description:
    'The entire playbook in one book. How Geetha built a calm, profitable firm from scratch — pricing, first clients, the monthly work, and getting your time back. Real numbers. Real mistakes. Real lessons.',
  format: 'PDF + EPUB (Instant Download)',
  compatibility: 'Kindle, Apple Books, Kobo, Any PDF Reader',
  primaryButtonText: 'Get the Book — ₹29',
  secondaryButtonText: 'Read Free Excerpt',
};

export const DEFAULT_STORE_SECTION_CONTENT: StoreSectionContent = {
  enabled: false,
  eyebrow: 'Plug & Play Operations',
  title: 'Templates & Cheat Sheets',
  description:
    'Battle-tested tools and checklists pulled directly from a working 60-client bookkeeping practice.',
  communityNote:
    'All templates are included free when you join The Community.',
};

export const DEFAULT_ONE_ON_ONE_CONTENT: OneOnOneContent = {
  enabled: true,
  eyebrow: 'Private Consultation',
  title: '1-on-1 Strategy Call',
  description:
    'A focused 30-minute working session with Geetha to review your pricing, proposal, complex cleanup, or software setup.',
  price: 150,
  currency: 'INR',
  duration: '30 Minutes via Google Meet',
  deliverables: [
    'One-on-one private review with Geetha',
    'Screen share and direct tear-down of your proposal or pricing',
    'Session recording and action checklist provided within 24 hours',
  ],
  buttonText: 'Book Strategy Call — ₹150',
};

export const DEFAULT_ABOUT_CONTENT: AboutContent = {
  enabled: false,
  eyebrow: 'Founder & Working Professional',
  title: "Hi, I'm Geetha.",
  subtitle: 'Firm owner, mentor, and coach.',
  paragraphs: [
    'I built this practice from the ground up. Five years later it runs around 60 clients — in about 30 hours a week.',
    'I built a business that fits around my life, not one that consumes it.',
    'Now I help other professionals build the same thing: a calm, profitable business, one client at a time.',
  ],
  faithTitle: 'Integrity first.',
  faithDescription: 'Rooted in clear principles, precision, and purpose.',
  familyTitle: 'Life balance second.',
  familyDescription: 'Being fully present for family and daily life beyond work.',
  businessTitle: 'Sustainable business third.',
  businessDescription: 'Serving clients excellently without letting work run your life.',
  signature: '— Geetha',
  location: 'Finance with Geetha',
};

export const DEFAULT_FINAL_CTA_CONTENT: FinalCTAContent = {
  enabled: true,
  eyebrow: 'Take the Next Step',
  headline: 'Ready to build yours?',
  text: "Start with the community. That's where the calls, the answers, and everything else lives.",
  primaryButtonText: 'Join the Community — ₹150/mo',
  secondaryButtonText: 'Start with the Book — ₹29',
};

export const DEFAULT_BOOK_PAGE_CONTENT: BookContent = {
  enabled: true,
  eyebrow: 'The Practical Guidebook',
  title: 'Start a Bookkeeping Business',
  subtitle: 'How to build one that pays you well — and leaves you alone.',
  description:
    'The entire playbook in one book. How Geetha went from zero clients to a calm, profitable firm — pricing, first clients, the monthly work, hiring, and getting your time back. Real numbers. Real mistakes. Real lessons. Read it in an afternoon, use it for years.',
  price: 29,
  currency: 'INR',
  format: 'PDF + EPUB (Instant Download)',
  compatibility: 'Kindle, Apple Books, Kobo, Any PDF Reader',
  excerptTitle: 'Chapter 1: The 15-Minute Diagnostic Call',
  excerptText:
    'Most bookkeepers make their first mistake on the discovery call: they spend forty minutes pitching services and trying to sound qualified. In Finance with Geetha, our discovery calls never exceed fifteen minutes. Here are the six questions that tell you everything...',
  coverImageUrl: '',
  pdfUrl: '',
  epubUrl: '',
  samplePdfUrl: '',
  chapters: BOOK_CHAPTERS.map((ch, idx) => ({
    id: `chap-${idx + 1}`,
    enabled: true,
    number: String(ch.number),
    title: ch.title,
    description: ch.summary,
  })),
  faq: FAQ_ITEMS.filter((f) => f.category === 'book').map((faq, idx) => ({
    id: `bfaq-${idx + 1}`,
    enabled: true,
    question: faq.question,
    answer: faq.answer,
  })),
};

export const DEFAULT_COMMUNITY_PAGE_CONTENT: CommunityPageContent = {
  enabled: true,
  hero: {
    enabled: true,
    eyebrow: 'Live Mentorship Community',
    title: 'The Community — Where it all happens',
    subtitle: 'Two weekly live calls, templates, member chat, and direct coaching with Geetha.',
  },
  pricing: {
    enabled: true,
    title: 'Simple, transparent membership',
    subtitle: 'Flat monthly access. Cancel anytime with a single click.',
  },
  benefits: {
    enabled: true,
    title: 'Everything included in your membership',
    items: COMMUNITY_FEATURES.map((feat, idx) => ({
      id: `ben-${idx + 1}`,
      enabled: true,
      title: feat.title,
      description: feat.description,
    })),
  },
  schedule: {
    enabled: true,
    title: 'Weekly Call Schedule',
    subtitle: 'Wednesdays & Fridays at noon',
    details: 'Calls are capped under 10 people on purpose so everyone gets their questions answered.',
  },
  coachingSteps: {
    enabled: true,
    title: 'How coaching works in the group',
    items: CALL_STEPS.map((s, idx) => ({
      id: `cs-${idx + 1}`,
      enabled: true,
      step: s.step,
      title: s.title,
      description: s.description,
    })),
  },
  faq: {
    enabled: true,
    title: 'Frequently Asked Questions',
    items: FAQ_ITEMS.filter((f) => f.category === 'community').map((faq, idx) => ({
      id: `cfaq-${idx + 1}`,
      enabled: true,
      question: faq.question,
      answer: faq.answer,
    })),
  },
  cta: {
    enabled: true,
    title: 'Ready to build a calm, profitable firm?',
    subtitle: 'Join today and get instant access to Wednesday & Friday live calls and all templates.',
    buttonText: 'Join the Community — ₹150/mo',
  },
};

export const DEFAULT_ABOUT_PAGE_CONTENT: AboutPageContent = {
  enabled: true,
  hero: {
    enabled: true,
    eyebrow: 'Founder & Working Professional',
    title: "Hi, I'm Geetha.",
    subtitle: 'Firm owner, mentor, and coach.',
  },
  story: {
    enabled: true,
    title: 'The Story Behind the Firm',
    paragraphs: [
      'I started Finance with Geetha after seeing professionals burn out from hourly billing and chaotic client management.',
      'Over five years, I built a calm, recurring client base of 60 businesses that generates ₹25L+ annually while working 30–35 hours a week.',
      'Now I teach others the exact same systems, pricing math, and client boundaries.',
    ],
  },
  values: {
    enabled: true,
    title: 'Core Principles',
    items: [
      { id: 'val-1', enabled: true, title: 'Integrity first', description: 'Clear principles, precision, and purpose.' },
      { id: 'val-2', enabled: true, title: 'Life balance second', description: 'Present for family and life outside of work.' },
      { id: 'val-3', enabled: true, title: 'Sustainable business third', description: 'Serving clients excellently without burnout.' },
    ],
  },
  cta: {
    enabled: true,
    title: 'Let’s work together',
    subtitle: 'Start with the community or get the book.',
    buttonText: 'Explore The Community',
  },
};

export const DEFAULT_CONTACT_PAGE_CONTENT: ContactPageContent = {
  enabled: true,
  title: 'Get in Touch',
  subtitle: 'Have a question about the community, book, or 1-on-1 coaching? Send a note directly to Geetha.',
  supportEmail: 'cageethanofficial@gmail.com',
  directCopy: 'Geetha reviews every inquiry personally and responds within 24–48 business hours.',
  formEnabled: true,
  availabilityNote: 'Coaching inquiries are open. Live calls run weekly.',
};

export const DEFAULT_STORE_PAGE_CONTENT: StorePageContent = {
  enabled: true,
  title: 'Tools & Reference Guides',
  subtitle: 'Plug-and-play checklists, pricing models, and workflow templates used in a working 60-client firm.',
  communityPromoEnabled: true,
};

export const DEFAULT_WHY_US_CONTENT = {
  enabled: true,
  eyebrow: 'Why Partner With Us',
  title: 'Excellence in Bookkeeping, Dedicated to Your Success',
  description:
    'With Finance with Geetha, you get more than just numbers on a spreadsheet. You gain a dedicated professional committed to keeping your financial foundation solid so you can focus on scaling your enterprise.',
  reasons: [
    {
      title: 'Transparent Pricing',
      description: 'Affordable packages designed to fit your business size without hidden fees.',
    },
    {
      title: '100% Data Confidentiality',
      description: 'Strict security measures and professional ethics protecting your sensitive financial records.',
    },
    {
      title: 'Responsive & Approachable',
      description: 'Direct communication with Geetha N. whenever you have questions about your accounts.',
    },
  ],
  ctaTitle: 'Ready for Stress-Free Accounting?',
  ctaPhone: '9538913912',
};

export const DEFAULT_SITE_CONTENT = {
  hero: DEFAULT_HERO_CONTENT,
  stats: DEFAULT_STATS_CONTENT,
  teaching: DEFAULT_TEACHING_CONTENT,
  community: DEFAULT_COMMUNITY_CONTENT,
  callStructure: DEFAULT_CALL_STRUCTURE_CONTENT,
  book: DEFAULT_BOOK_PAGE_CONTENT,
  store: DEFAULT_STORE_SECTION_CONTENT,
  oneOnOne: DEFAULT_ONE_ON_ONE_CONTENT,
  about: DEFAULT_ABOUT_CONTENT,
  finalCta: DEFAULT_FINAL_CTA_CONTENT,
  communityPage: DEFAULT_COMMUNITY_PAGE_CONTENT,
  aboutPage: DEFAULT_ABOUT_PAGE_CONTENT,
  contactPage: DEFAULT_CONTACT_PAGE_CONTENT,
  storePage: DEFAULT_STORE_PAGE_CONTENT,
  whyUs: DEFAULT_WHY_US_CONTENT,
  branding: DEFAULT_BRANDING_CONTENT,
};

// ==========================================
// REALTIME HOOKS & UTILITIES
// ==========================================

/**
 * Universal hook for loading any CMS section with realtime Firestore synchronization.
 * If the section document has `enabled: false`, isEnabled returns false.
 * Fallback values NEVER override an explicit enabled: false setting.
 */
export function useSectionContent<T extends object>(
  sectionKey: string,
  defaultContent: T,
  initialData?: T
) {
  const baseContent = initialData || defaultContent;
  const [content, setContent] = useState<T>(baseContent);
  const [isEnabled, setIsEnabled] = useState<boolean>(
    (baseContent as { enabled?: boolean }).enabled !== false
  );
  const [loading, setLoading] = useState<boolean>(!initialData);

  useEffect(() => {
    try {
      const docRef = doc(db, COLLECTIONS.SITE_CONTENT, sectionKey);
      const unsubscribe = onSnapshot(
        docRef,
        (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            const merged = { ...defaultContent, ...data } as T;
            setContent(merged);
            // If explicitly enabled: false, isEnabled is false
            setIsEnabled(data.enabled !== false);
          } else {
            setContent(defaultContent);
            setIsEnabled((defaultContent as { enabled?: boolean }).enabled !== false);
          }
          setLoading(false);
        },
        (error) => {
          console.warn(`[CMS] Realtime listener notice for site_content/${sectionKey}:`, error);
          setLoading(false);
        }
      );
      return () => unsubscribe();
    } catch {
      Promise.resolve().then(() => setLoading(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionKey]);

  return { content, isEnabled, loading };
}

/**
 * Server-safe helper to fetch all site_content sections from Firestore.
 */
export async function fetchAllSiteContent(): Promise<Record<string, Record<string, unknown>>> {
  try {
    const colRef = collection(db, COLLECTIONS.SITE_CONTENT);
    const snapshot = await getDocs(colRef);
    const map: Record<string, Record<string, unknown>> = {};
    snapshot.forEach((d) => {
      map[d.id] = d.data();
    });
    return map;
  } catch (err: unknown) {
    console.warn('[CMS] Failed to fetch site_content on server:', err);
    return {};
  }
}

export type InitialSiteContentInput =
  | Record<string, Record<string, unknown>>
  | {
      sections: Record<string, Record<string, unknown>>;
      loaded?: boolean;
      error?: string | null;
    };

/**
 * Hook for reading all site_content sections in realtime.
 * Can be seeded with server-rendered initialContent/initialSections to prevent SSR leaks and hydration flash.
 * Distinguishes explicit enabled: false, missing documents, and network/server failures.
 */
export function useAllSiteContent(initialInput?: InitialSiteContentInput) {
  const initialMap: Record<string, Record<string, unknown>> = useMemo(() => {
    if (!initialInput) return {};
    if ('sections' in initialInput && typeof initialInput.sections === 'object' && initialInput.sections !== null) {
      return initialInput.sections as Record<string, Record<string, unknown>>;
    }
    return initialInput as Record<string, Record<string, unknown>>;
  }, [initialInput]);

  const initialLoaded = useMemo(() => {
    if (!initialInput) return false;
    if ('loaded' in initialInput && typeof initialInput.loaded === 'boolean') {
      return initialInput.loaded;
    }
    return Object.keys(initialMap).length > 0;
  }, [initialInput, initialMap]);

  const [liveSections, setLiveSections] = useState<Record<string, Record<string, unknown>> | null>(null);
  const [loading, setLoading] = useState<boolean>(!initialLoaded);

  useEffect(() => {
    try {
      const colRef = collection(db, COLLECTIONS.SITE_CONTENT);
      const unsubscribe = onSnapshot(
        colRef,
        (snapshot) => {
          const map: Record<string, Record<string, unknown>> = {};
          snapshot.forEach((d) => {
            map[d.id] = d.data();
          });
          setLiveSections(map);
          setLoading(false);
        },
        (err) => {
          console.warn('[CMS] All sections realtime listener error:', err);
          setLoading(false);
        }
      );
      return () => unsubscribe();
    } catch {
      Promise.resolve().then(() => setLoading(false));
    }
  }, []);

  const sections = useMemo(() => {
    if (!liveSections) return initialMap;
    return { ...initialMap, ...liveSections };
  }, [initialMap, liveSections]);

  /**
   * Evaluates if a section is enabled:
   * 1. If explicit Firestore document exists: returns doc.enabled !== false.
   * 2. If data is still loading or server fetch failed: does not assume enabled.
   * 3. If document does not exist in Firestore: returns false unless fallback is explicitly permitted.
   */
  const isSectionEnabled = (sectionKey: string, fallbackEnabled = false): boolean => {
    const sec = sections[sectionKey];
    if (sec) {
      return sec.enabled !== false;
    }
    if (loading) {
      return false;
    }
    return fallbackEnabled;
  };

  const getSection = <T extends object>(sectionKey: string, fallback: T): T => {
    const sec = sections[sectionKey];
    if (!sec) return fallback;
    return { ...fallback, ...sec } as T;
  };

  return { sections, isSectionEnabled, getSection, loading };
}

/**
 * Hook for reading social settings from Firestore settings/social in realtime.
 * Hides YouTube or LinkedIn if invalid, empty, or pointing to obsolete @jakedemi accounts.
 */
export function useSocialSettings() {
  const [social, setSocial] = useState<{
    youtubeUrl: string | null;
    linkedinUrl: string | null;
    twitterUrl: string | null;
  }>({
    youtubeUrl: null,
    linkedinUrl: null,
    twitterUrl: null,
  });

  useEffect(() => {
    try {
      const docRef = doc(db, COLLECTIONS.SETTINGS, 'social');
      const unsubscribe = onSnapshot(
        docRef,
        (snap) => {
          if (snap.exists()) {
            const data = snap.data() as SocialSettings;
            let yt = data.youtubeUrl ? data.youtubeUrl.trim() : null;
            let li = data.linkedinUrl ? data.linkedinUrl.trim() : null;
            const tw = data.twitterUrl ? data.twitterUrl.trim() : null;

            // Filter out old @jakedemi placeholders
            if (yt && (yt.includes('@jakedemi') || !yt.startsWith('http'))) {
              yt = null;
            }
            if (li && (li.includes('in/jakedemi') || !li.startsWith('http'))) {
              li = null;
            }

            setSocial({
              youtubeUrl: yt || null,
              linkedinUrl: li || null,
              twitterUrl: tw && tw.startsWith('http') ? tw : null,
            });
          }
        },
        (err) => {
          console.warn('[Settings] Social settings listener:', err);
        }
      );
      return () => unsubscribe();
    } catch {
      // ignore
    }
  }, []);

  return social;
}

/**
 * Hook for reading contact settings from Firestore settings/contact in realtime.
 */
export function useContactSettings() {
  const [contact, setContact] = useState<ContactSettings>({
    supportEmail: 'cageethanofficial@gmail.com',
    notificationEmail: 'cageethanofficial@gmail.com',
    phone: '',
    address: 'Finance with Geetha',
  });

  useEffect(() => {
    try {
      const docRef = doc(db, COLLECTIONS.SETTINGS, 'contact');
      const unsubscribe = onSnapshot(
        docRef,
        (snap) => {
          if (snap.exists()) {
            setContact((prev) => ({ ...prev, ...snap.data() }));
          }
        },
        (err) => {
          console.warn('[Settings] Contact settings listener:', err);
        }
      );
      return () => unsubscribe();
    } catch {
      // ignore
    }
  }, []);

  return contact;
}

/**
 * Dynamic pricing synchronized in realtime from Firestore `products` collection.
 */
export function useDynamicPricing() {
  const [prices, setPrices] = useState<DynamicPricing>(DEFAULT_PRICES);

  useEffect(() => {
    try {
      const q = query(collection(db, COLLECTIONS.PRODUCTS));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const updated: DynamicPricing = { ...DEFAULT_PRICES };
            snapshot.forEach((docSnap) => {
              const data = docSnap.data();
              const id = docSnap.id.toLowerCase();
              if (typeof data.price === 'number') {
                if (id === 'community' || id === 'the-community') updated.community = data.price;
                if (id === 'book') updated.book = data.price;
                if (id === 'cheatsheets' || id === 'cheatsheet') updated.cheatsheets = data.price;
                if (id === 'workflow') updated.workflow = data.price;
                if (id === 'call') updated.call = data.price;
              }
            });
            setPrices(updated);
          }
        },
        (error) => {
          console.warn('Realtime price listener fallback to default:', error);
        }
      );

      return () => unsubscribe();
    } catch {
      // Fallback
    }
  }, []);

  return {
    ...prices,
    prices,
    communityPrice: prices.community,
    bookPrice: prices.book,
    cheatsheetsPrice: prices.cheatsheets,
    workflowPrice: prices.workflow,
    callPrice: prices.call,
    formatCurrency,
    formatPriceWithPeriod,
  };
}

/**
 * Fetch active products for the public /store page from Firestore `products` collection.
 */
export async function fetchPublicStoreProducts(): Promise<LocalProduct[]> {
  try {
    let snap;
    try {
      const q = query(
        collection(db, COLLECTIONS.PRODUCTS),
        where('active', '==', true),
        orderBy('sortOrder', 'asc')
      );
      snap = await getDocs(q);
    } catch (indexErr: unknown) {
      console.warn('Composite index query notice, using in-memory sort fallback:', indexErr);
      const fallbackQ = query(
        collection(db, COLLECTIONS.PRODUCTS),
        where('active', '==', true)
      );
      snap = await getDocs(fallbackQ);
    }

    if (snap.empty) {
      return [];
    }

    const docs = [...snap.docs];
    docs.sort((a, b) => {
      const aOrder = Number(a.data().sortOrder ?? 999);
      const bOrder = Number(b.data().sortOrder ?? 999);
      return aOrder - bOrder;
    });

    return docs.map((docSnap) => {
      const data = docSnap.data();
      const docId = docSnap.id as string;
      const slugId = String(data.slug || '');
      const validId: ProductId = (
        ['community', 'book', 'cheatsheets', 'workflow', 'call'].includes(docId)
          ? docId
          : ['community', 'book', 'cheatsheets', 'workflow', 'call'].includes(slugId)
          ? slugId
          : docId
      ) as ProductId;

      const numericPrice = Number(data.price || 0);

      return {
        id: validId,
        name: String(data.name || ''),
        subtitle: String(data.shortDescription || ''),
        description: String(data.description || ''),
        price: numericPrice,
        period: (data.type === 'other' ? 'month' : 'one-time') as 'month' | 'one-time',
        features: Array.isArray(data.features) ? data.features : [],
        ctaText: `Get ${data.name || 'Product'} — ${formatCurrency(numericPrice)}`,
        isPopular: Boolean(data.featured),
        format: data.type === 'book' ? 'PDF + EPUB' : data.type === 'cheatsheet' ? '5x PDF Guides' : 'Notion + PDF',
      };
    });
  } catch (err: unknown) {
    console.warn('Could not fetch products from Firestore, using default static products:', err);
    return PRODUCTS;
  }
}

/**
 * Fetch book content from Firestore site_content/book.
 */
export async function fetchPublicBookContent(): Promise<BookContent | null> {
  try {
    const ref = doc(db, COLLECTIONS.SITE_CONTENT, 'book');
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return snap.data() as BookContent;
    }
    return null;
  } catch (err: unknown) {
    console.warn('Could not fetch book content from Firestore:', err);
    return null;
  }
}

/**
 * Fetch general site content section from Firestore.
 */
export async function fetchSectionContent<T>(section: string, fallback: T): Promise<T> {
  try {
    const ref = doc(db, COLLECTIONS.SITE_CONTENT, section);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return { ...fallback, ...snap.data() };
    }
    return fallback;
  } catch {
    return fallback;
  }
}

/**
 * Hook for reading Geetha's profile photo in realtime from site_content/hero.
 * Falls back to initialUrl or DEFAULT_PROFILE_IMAGE.
 */
export function useProfilePhoto(initialUrl?: string): string {
  const [imageUrl, setImageUrl] = useState<string>(initialUrl || DEFAULT_PROFILE_IMAGE);

  useEffect(() => {
    try {
      const docRef = doc(db, COLLECTIONS.SITE_CONTENT, 'hero');
      const unsubscribe = onSnapshot(
        docRef,
        (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            const photo = data?.profileImageUrl;
            if (photo && typeof photo === 'string' && photo.trim()) {
              setImageUrl(photo.trim());
              return;
            }
          }
          if (initialUrl && initialUrl.trim()) {
            setImageUrl(initialUrl.trim());
          } else {
            setImageUrl(DEFAULT_PROFILE_IMAGE);
          }
        },
        (err) => {
          console.warn('[CMS] Realtime profile photo listener notice:', err);
        }
      );
      return () => unsubscribe();
    } catch {
      // Graceful fallback
    }
  }, [initialUrl]);

  return imageUrl;
}

/**
 * Realtime hook for reading dynamic branding configuration from Firestore site_content/branding.
 * Controls website logo, business name, tagline, sizing, and header visibility switches.
 */
export function useBranding(initial?: Partial<BrandingContent>): BrandingContent {
  const [branding, setBranding] = useState<BrandingContent>({
    ...DEFAULT_BRANDING_CONTENT,
    ...initial,
  });

  useEffect(() => {
    try {
      const docRef = doc(db, COLLECTIONS.SITE_CONTENT, 'branding');
      const unsubscribe = onSnapshot(
        docRef,
        (snap) => {
          if (snap.exists()) {
            const data = snap.data() as Partial<BrandingContent>;
            setBranding((prev) => ({
              ...prev,
              ...data,
              logoUrl: data.logoUrl || prev.logoUrl || DEFAULT_PROFILE_IMAGE,
            }));
          }
        },
        (err) => {
          console.warn('[CMS] Realtime branding listener notice:', err);
        }
      );
      return () => unsubscribe();
    } catch {
      // Graceful fallback
    }
  }, []);

  return branding;
}

export type { BrandingContent, WhyUsContent };
export { DEFAULT_BRANDING_CONTENT };

