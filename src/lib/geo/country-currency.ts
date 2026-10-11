/**
 * Global Country-to-Currency Mapping & Supported Currencies
 * Finance with Geetha
 *
 * Base Currency: INR (Indian Rupee - ₹)
 */

export type CurrencyCode = 'INR' | 'USD' | 'GBP' | 'EUR' | 'CAD' | 'AUD' | 'SGD';

export interface CurrencyConfig {
  code: CurrencyCode;
  name: string;
  symbol: string;
  flag: string;
  decimals: number;
  stripeSupported: boolean;
}

export const SUPPORTED_CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  INR: {
    code: 'INR',
    name: 'Indian Rupee',
    symbol: '₹',
    flag: '🇮🇳',
    decimals: 0, // In Indian context, pricing is typically shown in whole Rupees (e.g. ₹150)
    stripeSupported: true,
  },
  USD: {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    flag: '🇺🇸',
    decimals: 2,
    stripeSupported: true,
  },
  GBP: {
    code: 'GBP',
    name: 'British Pound',
    symbol: '£',
    flag: '🇬🇧',
    decimals: 2,
    stripeSupported: true,
  },
  EUR: {
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    flag: '🇪🇺',
    decimals: 2,
    stripeSupported: true,
  },
  CAD: {
    code: 'CAD',
    name: 'Canadian Dollar',
    symbol: 'CA$',
    flag: '🇨🇦',
    decimals: 2,
    stripeSupported: true,
  },
  AUD: {
    code: 'AUD',
    name: 'Australian Dollar',
    symbol: 'A$',
    flag: '🇦🇺',
    decimals: 2,
    stripeSupported: true,
  },
  SGD: {
    code: 'SGD',
    name: 'Singapore Dollar',
    symbol: 'S$',
    flag: '🇸🇬',
    decimals: 2,
    stripeSupported: true,
  },
};

export const BASE_CURRENCY: CurrencyCode = 'INR';

/**
 * Mapping of ISO 3166-1 alpha-2 country codes to suggested display currency
 */
export const COUNTRY_TO_CURRENCY_MAP: Record<string, CurrencyCode> = {
  // India
  IN: 'INR',

  // United States & territories
  US: 'USD',
  PR: 'USD',
  GU: 'USD',
  VI: 'USD',
  AS: 'USD',

  // United Kingdom & territories
  GB: 'GBP',
  IM: 'GBP',
  JE: 'GBP',
  GG: 'GBP',
  GI: 'GBP',

  // Eurozone countries
  DE: 'EUR', // Germany
  FR: 'EUR', // France
  IT: 'EUR', // Italy
  ES: 'EUR', // Spain
  NL: 'EUR', // Netherlands
  BE: 'EUR', // Belgium
  AT: 'EUR', // Austria
  IE: 'EUR', // Ireland
  FI: 'EUR', // Finland
  PT: 'EUR', // Portugal
  GR: 'EUR', // Greece
  LU: 'EUR', // Luxembourg
  CY: 'EUR', // Cyprus
  MT: 'EUR', // Malta
  SK: 'EUR', // Slovakia
  SI: 'EUR', // Slovenia
  EE: 'EUR', // Estonia
  LV: 'EUR', // Latvia
  LT: 'EUR', // Lithuania
  HR: 'EUR', // Croatia
  AD: 'EUR', // Andorra
  MC: 'EUR', // Monaco
  SM: 'EUR', // San Marino
  VA: 'EUR', // Vatican City
  ME: 'EUR', // Montenegro
  XK: 'EUR', // Kosovo

  // Canada
  CA: 'CAD',

  // Australia & New Zealand
  AU: 'AUD',
  NZ: 'AUD',

  // Singapore
  SG: 'SGD',

  // Americas / International default to USD
  MX: 'USD',
  BR: 'USD',
  AR: 'USD',
  CL: 'USD',
  CO: 'USD',
  PE: 'USD',
  PA: 'USD',
  CR: 'USD',

  // Middle East (commonly denominated in USD for international trade)
  AE: 'USD',
  SA: 'USD',
  QA: 'USD',
  KW: 'USD',
  OM: 'USD',
  BH: 'USD',
  IL: 'USD',

  // Asia / Pacific
  JP: 'USD',
  KR: 'USD',
  HK: 'USD',
  TW: 'USD',
  MY: 'USD',
  TH: 'USD',
  PH: 'USD',
  ID: 'USD',
  VN: 'USD',

  // Rest of Europe default
  CH: 'EUR',
  NO: 'EUR',
  SE: 'EUR',
  DK: 'EUR',
  PL: 'EUR',
  CZ: 'EUR',
  HU: 'EUR',
  RO: 'EUR',
  BG: 'EUR',

  // South Asia neighbor default to INR
  NP: 'INR', // Nepal
  BT: 'INR', // Bhutan
  LK: 'INR', // Sri Lanka
  BD: 'INR', // Bangladesh
};

/**
 * Common Country Names Mapping for UI Display
 */
export const COUNTRY_NAMES: Record<string, string> = {
  IN: 'India',
  US: 'United States',
  GB: 'United Kingdom',
  DE: 'Germany',
  FR: 'France',
  IT: 'Italy',
  ES: 'Spain',
  NL: 'Netherlands',
  BE: 'Belgium',
  AT: 'Austria',
  IE: 'Ireland',
  FI: 'Finland',
  PT: 'Portugal',
  GR: 'Greece',
  CA: 'Canada',
  AU: 'Australia',
  NZ: 'New Zealand',
  SG: 'Singapore',
  AE: 'United Arab Emirates',
  SA: 'Saudi Arabia',
  JP: 'Japan',
  NP: 'Nepal',
  LK: 'Sri Lanka',
  BD: 'Bangladesh',
};

/**
 * Determine the suggested currency for an ISO country code
 */
export function getSuggestedCurrency(countryCode?: string | null): CurrencyCode {
  if (!countryCode) return BASE_CURRENCY;
  const upper = countryCode.trim().toUpperCase();
  return COUNTRY_TO_CURRENCY_MAP[upper] || BASE_CURRENCY;
}

/**
 * Retrieve country name for ISO country code
 */
export function getCountryName(countryCode?: string | null): string {
  if (!countryCode) return 'Unknown';
  const upper = countryCode.trim().toUpperCase();
  return COUNTRY_NAMES[upper] || upper;
}

/**
 * Check if a currency code is supported
 */
export function isCurrencySupported(code: string): code is CurrencyCode {
  return Object.prototype.hasOwnProperty.call(SUPPORTED_CURRENCIES, code.toUpperCase());
}
