import { adminDb } from './admin';
import { COLLECTIONS } from './collections';
import {
  DEFAULT_REVIEWS_SECTION_CONTENT,
  INITIAL_REVIEWS,
} from './reviews-defaults';

export const DEFAULT_SEED_PRODUCTS = [
  {
    id: 'community',
    name: 'The Community',
    slug: 'the-community',
    type: 'other',
    shortDescription: 'Weekly live coaching, templates, and accountability',
    description:
      'The primary place to build your firm. Two weekly live calls (capped under 10), direct access to Geetha, member chat, and every template included.',
    price: 150,
    currency: 'INR',
    active: true,
    featured: true,
    sortOrder: 1,
    features: [
      'Weekly live calls (Wednesdays & Fridays at noon)',
      'Calls capped under 10 people on purpose',
      'Every call recorded and searchable',
      'Live member chat for questions between calls',
      'Member-only video library (workflows & how-tos)',
      'All templates & cheat sheets included free',
      'Weekly accountability check-ins',
      'Direct access to Geetha',
      'Cancel anytime with one click — no contracts',
    ],
  },
  {
    id: 'book',
    name: 'Start a Bookkeeping Business',
    slug: 'start-a-bookkeeping-business',
    type: 'book',
    shortDescription: 'How to build one that pays you well — and leaves you alone.',
    description:
      'The entire playbook in one book. How Geetha built a calm, profitable firm from scratch — pricing, first clients, the monthly work, and getting your time back.',
    price: 29,
    currency: 'INR',
    active: true,
    featured: true,
    sortOrder: 2,
    features: [
      '180 pages of practical, battle-tested operational guidance',
      'Real numbers, real mistakes, and exact pricing math',
      'The 15-minute discovery call blueprint',
      'How to price flat retainers without guessing',
      'Month-end closing routine & checklist',
      'PDF + EPUB formats for Kindle, Apple Books, Kobo',
    ],
  },
  {
    id: 'cheatsheets',
    name: "The Bookkeeper's Cheat Sheets (5-Pack)",
    slug: 'the-bookkeepers-cheat-sheets',
    type: 'cheatsheet',
    shortDescription: 'Five printable, plug-and-play references from a 60-client firm',
    description:
      'Keep these five reference guides on your desk when quoting clients, running calls, and executing monthly books. ₹50 of value included.',
    price: 40,
    currency: 'INR',
    active: true,
    featured: false,
    sortOrder: 3,
    features: [
      'Discovery Call 6-Question Diagnostic Sheet',
      'New Client Onboarding 48-Hour Protocol',
      'Recommended Software & Tech Stack Matrix',
      'Core Sales & Compliance Reference',
      'Quoting & Scoping from Financial History',
      'Printable PDF format + editable DOCX',
    ],
  },
  {
    id: 'workflow',
    name: 'Monthly Bookkeeping Workflow',
    slug: 'bookkeeping-monthly-workflow',
    type: 'workflow',
    shortDescription: 'The step-by-step system for delivering consistent, high-quality books',
    description:
      'The exact operational checklist Geetha uses to service 60 recurring clients without dropping balls or missing month-end deadlines.',
    price: 25,
    currency: 'INR',
    active: true,
    featured: false,
    sortOrder: 4,
    features: [
      'Monthly 5-phase closing timeline (Days 1–15)',
      'Bank & credit card reconciliation balance cross-checks',
      'Pre-closing suspense/uncategorized audit protocol',
      'Monthly management report delivery email templates',
      'Ready to import into Notion, ClickUp, or Excel',
    ],
  },
  {
    id: 'call',
    name: '1-on-1 Strategy Call',
    slug: 'strategy-call-30min',
    type: 'other',
    shortDescription: '30-minute private consultation with Geetha',
    description:
      'Deep dive into your pricing, proposal, or stuck client with Geetha. Actionable next steps delivered after the session.',
    price: 150,
    currency: 'INR',
    active: true,
    featured: false,
    sortOrder: 5,
    features: [
      '30 minutes dedicated exclusively to your business',
      'Deep dive into your pricing, proposal, or stuck client',
      'Screen share review of your setup or website',
      'Actionable plan and recording delivered after call',
    ],
  },
];

export const DEFAULT_SITE_CONTENT = {
  hero: {
    eyebrow: 'FINANCE & BOOKKEEPING COACHING',
    headline: 'Learn how to actually build a bookkeeping business.',
    supportingCopy:
      'Pricing. Discovery calls. Onboarding. The real work in software. How to talk to clients — and even how to build your website.',
    credibilityQuote:
      "I've run my own firm for five years. Now I teach other professionals exactly how I did it.",
    credibilityAuthor: 'Geetha, Founder of Finance with Geetha',
    primaryButtonText: 'Join the Community',
    secondaryButtonText: 'Start with the Book — ₹29',
  },
  stats: {
    eyebrow: 'The Track Record',
    title: 'Real business. Real numbers.',
    subtitle: 'Not projections. My actual business.',
    stats: [
      { value: '~60', label: 'Recurring clients', detail: 'Maintained consistently month after month without chaos.' },
      { value: '₹25L+', label: 'Annual revenue', detail: 'Gross annual revenue from standard monthly bookkeeping retainers.' },
      { value: '30–35', label: 'Hours a week', detail: 'Total working hours, leaving real time for family and life.' },
      { value: '5', label: 'Years, from scratch', detail: 'Built from the ground up starting with zero clients.' },
    ],
  },
  community: {
    eyebrow: 'Weekly Live Mentorship',
    title: 'The Community — Where it all happens',
    subtitle: 'This is where I do the actual coaching — every week.',
    description:
      'If you only do one thing, do this. The community is the center of everything — the calls, the answers, the templates, and direct access to me as you build.',
    price: 150,
    currency: 'INR',
    billingPeriod: 'month',
    callSchedule: 'Wednesdays & Fridays at noon',
    features: [
      'Weekly live calls (Wednesdays & Fridays at noon)',
      'Calls capped under 10 people on purpose',
      'Every call recorded and searchable',
      'Live member chat for questions between calls',
      'Member-only video library (workflows & how-tos)',
      'All templates & cheat sheets included free',
      'Weekly accountability check-ins',
      'Direct access to Geetha',
    ],
  },
  about: {
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
  },
  finalCta: {
    eyebrow: 'Take the Next Step',
    headline: 'Ready to build yours?',
    text: "Start with the community. That's where the calls, the answers, and everything else lives.",
    primaryButtonText: 'Join the Community — ₹150/mo',
    secondaryButtonText: 'Start with the Book — ₹29',
  },
  reviews: DEFAULT_REVIEWS_SECTION_CONTENT,
};

export const DEFAULT_SETTINGS = {
  general: {
    businessName: 'Finance with Geetha',
    websiteUrl: 'https://financewithgeetha.com',
    timezone: 'Asia/Kolkata',
    currency: 'INR',
  },
  contact: {
    supportEmail: 'cageethanofficial@gmail.com',
    notificationEmail: 'cageethanofficial@gmail.com',
    address: 'Finance with Geetha',
  },
  social: {
    youtubeUrl: 'https://www.youtube.com/@financewithgeetha',
    linkedinUrl: 'https://www.linkedin.com/in/financewithgeetha',
  },
  payments: {
    stripeMode: 'test',
    calendlyUrl: 'https://calendly.com/geetha/30min-strategy',
  },
};

/**
 * Seed initial website data into Firestore.
 * Updates records to ensure current branding, currency, and pricing.
 */
export async function seedInitialFirestoreData(): Promise<{
  productsCreated: number;
  productsSkipped: number;
  contentCreated: string[];
  settingsCreated: string[];
  reviewsCreated: number;
}> {
  let productsCreated = 0;
  const productsSkipped = 0;
  const contentCreated: string[] = [];
  const settingsCreated: string[] = [];
  let reviewsCreated = 0;

  // 1. Seed or update Products
  for (const product of DEFAULT_SEED_PRODUCTS) {
    const docRef = adminDb.collection(COLLECTIONS.PRODUCTS).doc(product.id);
    await docRef.set(
      {
        ...product,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    productsCreated++;
  }

  // 2. Seed or update Site Content
  for (const [sectionKey, contentData] of Object.entries(DEFAULT_SITE_CONTENT)) {
    const docRef = adminDb.collection(COLLECTIONS.SITE_CONTENT).doc(sectionKey);
    await docRef.set(
      {
        ...contentData,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    contentCreated.push(sectionKey);
  }

  // 3. Seed or update Settings
  for (const [settingsKey, settingsData] of Object.entries(DEFAULT_SETTINGS)) {
    const docRef = adminDb.collection(COLLECTIONS.SETTINGS).doc(settingsKey);
    await docRef.set(
      {
        ...settingsData,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    settingsCreated.push(settingsKey);
  }

  // 4. Seed or update Reviews in homepageReviews collection
  for (const rev of INITIAL_REVIEWS) {
    const docRef = adminDb.collection(COLLECTIONS.HOMEPAGE_REVIEWS).doc(rev.id);
    await docRef.set(
      {
        ...rev,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    reviewsCreated++;
  }

  return {
    productsCreated,
    productsSkipped,
    contentCreated,
    settingsCreated,
    reviewsCreated,
  };
}
