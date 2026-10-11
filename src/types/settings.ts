import { CurrencyCode } from '@/lib/geo/country-currency';

export interface GeneralSettings {
  businessName: string;
  websiteUrl: string;
  timezone: string;
  currency: string;
}

export interface ContactSettings {
  supportEmail: string;
  notificationEmail: string;
  phone?: string;
  address?: string;
}

export interface SocialSettings {
  youtubeUrl: string;
  linkedinUrl: string;
  twitterUrl?: string;
}

export interface PaymentSettings {
  stripeMode: 'test' | 'live';
  communityPriceId?: string;
  bookPriceId?: string;
  cheatsheetsPriceId?: string;
  workflowPriceId?: string;
  callPriceId?: string;
  calendlyUrl?: string;
}

export interface RegionalSettings {
  baseCurrency: CurrencyCode;
  autoDetectCountry: boolean;
  showCurrencySelector: boolean;
  defaultFallbackCountry: string;
  defaultFallbackCurrency: CurrencyCode;
  supportedCurrencies: CurrencyCode[];
  showIpInformation: boolean;
  rateCacheTtlMinutes: number;
}

export interface AppSettings {
  general: GeneralSettings;
  contact: ContactSettings;
  social: SocialSettings;
  payments: PaymentSettings;
  regional?: RegionalSettings;
}
