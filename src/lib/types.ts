export type ProductId = 'community' | 'book' | 'cheatsheets' | 'workflow' | 'call';

export interface Product {
  id: ProductId;
  name: string;
  subtitle: string;
  description: string;
  price: number;
  period?: 'month' | 'one-time';
  valueComparison?: string;
  features: string[];
  ctaText: string;
  isPopular?: boolean;
  freeWithCommunity?: boolean;
  format?: string;
}

export interface TeachingTopic {
  number: string;
  title: string;
  tagline: string;
  description: string;
  takeaways: string[];
}

export interface CommunityFeature {
  title: string;
  description: string;
  iconName: string;
}

export interface CallStep {
  step: string;
  title: string;
  description: string;
  takeaway: string;
}

export interface BusinessStat {
  value: string;
  label: string;
  detail: string;
}

export interface FAQItem {
  question: string;
  answer: string;
  category?: 'community' | 'book' | 'workflow' | 'general';
}

export interface BookChapter {
  number: number;
  title: string;
  summary: string;
}
