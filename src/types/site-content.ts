export interface HeroContent {
  enabled?: boolean;
  eyebrow: string;
  headline: string;
  supportingCopy: string;
  credibilityQuote: string;
  credibilityAuthor: string;
  primaryButtonText: string;
  secondaryButtonText: string;
}

export interface StatItem {
  id?: string;
  enabled?: boolean;
  value: string;
  label: string;
  detail: string;
}

export interface StatsContent {
  enabled?: boolean;
  eyebrow: string;
  title: string;
  subtitle: string;
  stats: StatItem[];
}

export interface TeachingTopicItem {
  id?: string;
  enabled?: boolean;
  number: string;
  title: string;
  tagline: string;
  description: string;
  takeaways: string[];
}

export interface TeachingContent {
  enabled?: boolean;
  eyebrow: string;
  title: string;
  description: string;
  topics: TeachingTopicItem[];
}

export interface CommunityContent {
  enabled?: boolean;
  eyebrow: string;
  title: string;
  subtitle: string;
  description: string;
  price: number;
  currency: string;
  billingPeriod: string;
  callSchedule: string;
  features: string[];
}

export interface CallStepItem {
  id?: string;
  enabled?: boolean;
  number: string;
  title: string;
  duration: string;
  description: string;
}

export interface CallStructureContent {
  enabled?: boolean;
  eyebrow: string;
  title: string;
  description: string;
  steps: CallStepItem[];
}

export interface BookSectionContent {
  enabled?: boolean;
  eyebrow: string;
  title: string;
  subtitle: string;
  description: string;
  format: string;
  compatibility: string;
  primaryButtonText: string;
  secondaryButtonText: string;
}

export interface StoreSectionContent {
  enabled?: boolean;
  eyebrow: string;
  title: string;
  description: string;
  communityNote: string;
}

export interface OneOnOneContent {
  enabled?: boolean;
  eyebrow: string;
  title: string;
  description: string;
  price?: number;
  currency?: string;
  duration: string;
  deliverables: string[];
  buttonText: string;
}

export interface AboutContent {
  enabled?: boolean;
  eyebrow: string;
  title: string;
  subtitle: string;
  paragraphs: string[];
  faithTitle: string;
  faithDescription: string;
  familyTitle: string;
  familyDescription: string;
  businessTitle: string;
  businessDescription: string;
  signature: string;
  location: string;
  updatedAt?: string;
}

export interface FinalCTAContent {
  enabled?: boolean;
  eyebrow: string;
  headline: string;
  text: string;
  primaryButtonText: string;
  secondaryButtonText: string;
}

export interface ChapterItem {
  id?: string;
  enabled?: boolean;
  number: string;
  title: string;
  description: string;
}

export interface FAQContentItem {
  id?: string;
  enabled?: boolean;
  question: string;
  answer: string;
}

export interface BookContent {
  enabled?: boolean;
  eyebrow: string;
  title: string;
  subtitle: string;
  description: string;
  price: number;
  currency?: string;
  format: string;
  compatibility: string;
  excerptTitle: string;
  excerptText: string;
  coverImageUrl?: string;
  pdfUrl?: string;
  epubUrl?: string;
  samplePdfUrl?: string;
  chapters?: ChapterItem[];
  faq?: FAQContentItem[];
}

export interface CommunityPageContent {
  enabled?: boolean;
  hero: { enabled?: boolean; eyebrow: string; title: string; subtitle: string };
  pricing: { enabled?: boolean; title: string; subtitle: string };
  benefits: { enabled?: boolean; title: string; items: Array<{ id?: string; enabled?: boolean; title: string; description: string }> };
  schedule: { enabled?: boolean; title: string; subtitle: string; details: string };
  coachingSteps: { enabled?: boolean; title: string; items: Array<{ id?: string; enabled?: boolean; step: string; title: string; description: string }> };
  faq: { enabled?: boolean; title: string; items: Array<{ id?: string; enabled?: boolean; question: string; answer: string }> };
  cta: { enabled?: boolean; title: string; subtitle: string; buttonText: string };
}

export interface AboutPageContent {
  enabled?: boolean;
  hero: { enabled?: boolean; eyebrow: string; title: string; subtitle: string };
  story: { enabled?: boolean; title: string; paragraphs: string[] };
  values: { enabled?: boolean; title: string; items: Array<{ id?: string; enabled?: boolean; title: string; description: string }> };
  cta: { enabled?: boolean; title: string; subtitle: string; buttonText: string };
}

export interface ContactPageContent {
  enabled?: boolean;
  title: string;
  subtitle: string;
  supportEmail: string;
  directCopy: string;
  formEnabled: boolean;
  availabilityNote: string;
}

export interface StorePageContent {
  enabled?: boolean;
  title: string;
  subtitle: string;
  communityPromoEnabled: boolean;
}

export interface WhyUsReason {
  title: string;
  description: string;
}

export interface WhyUsContent {
  enabled?: boolean;
  eyebrow: string;
  title: string;
  description: string;
  reasons: WhyUsReason[];
  ctaTitle?: string;
  ctaPhone?: string;
}

export interface SiteContentMap {
  hero: HeroContent;
  stats: StatsContent;
  teaching: TeachingContent;
  community: CommunityContent;
  callStructure: CallStructureContent;
  bookSection: BookSectionContent;
  storeSection: StoreSectionContent;
  oneOnOne: OneOnOneContent;
  about: AboutContent;
  finalCta: FinalCTAContent;
  book: BookContent;
  communityPage: CommunityPageContent;
  aboutPage: AboutPageContent;
  contactPage: ContactPageContent;
  storePage: StorePageContent;
  whyUs?: WhyUsContent;
  services?: TeachingContent;
}

