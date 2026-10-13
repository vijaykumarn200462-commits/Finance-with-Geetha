import {
  BUSINESS_STATS,
  TEACHING_TOPICS,
  COMMUNITY_FEATURES,
  CALL_STEPS,
  BOOK_CHAPTERS,
  FAQ_ITEMS,
} from '@/lib/data';
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
} from '@/types/site-content';

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
};

export const DEFAULT_STATS_CONTENT: StatsContent = {
  enabled: true,
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
  enabled: true,
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
  enabled: true,
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

export const DEFAULT_WHY_US_CONTENT: WhyUsContent = {
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
};

