/**
 * Central Currency Formatter & Helper Utilities
 * Finance with Geetha
 *
 * Base Currency: INR (Indian Rupee - ₹)
 * Supports International Display: INR, USD, GBP, EUR, CAD, AUD, SGD
 */

import {
  CurrencyCode,
  CurrencyConfig,
  SUPPORTED_CURRENCIES,
  BASE_CURRENCY,
  getSuggestedCurrency,
  getCountryName,
  isCurrencySupported,
} from '../geo/country-currency';

export {
  type CurrencyCode,
  type CurrencyConfig,
  SUPPORTED_CURRENCIES,
  BASE_CURRENCY,
  getSuggestedCurrency,
  getCountryName,
  isCurrencySupported,
};

export const CURRENCY_SYMBOL = '₹';
export const CURRENCY_CODE = 'INR';

/**
 * Locale mapping for Intl.NumberFormat per currency
 */
const CURRENCY_LOCALES: Record<CurrencyCode, string> = {
  INR: 'en-IN',
  USD: 'en-US',
  GBP: 'en-GB',
  EUR: 'de-DE', // or en-IE
  CAD: 'en-CA',
  AUD: 'en-AU',
  SGD: 'en-SG',
};

/**
 * Format an amount in a specific currency with Intl.NumberFormat
 *
 * @param amount - Numeric amount in target currency
 * @param currencyCode - Target currency (default INR)
 * @param options - Optional formatting options
 */
export function formatCurrency(
  amount: number | string | undefined | null,
  currencyCode: CurrencyCode = 'INR',
  options?: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    showCode?: boolean;
  }
): string {
  if (amount === undefined || amount === null || amount === '') {
    const symbol = SUPPORTED_CURRENCIES[currencyCode]?.symbol || '₹';
    return `${symbol}0`;
  }

  const numeric = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numeric)) {
    const symbol = SUPPORTED_CURRENCIES[currencyCode]?.symbol || '₹';
    return `${symbol}0`;
  }

  const validCode: CurrencyCode = isCurrencySupported(currencyCode)
    ? (currencyCode.toUpperCase() as CurrencyCode)
    : 'INR';

  const config = SUPPORTED_CURRENCIES[validCode];
  const locale = CURRENCY_LOCALES[validCode] || 'en-US';

  // For INR, whole numbers don't need decimal zeros (e.g. ₹150 instead of ₹150.00)
  // For international currencies, show 2 decimal places if there is a fraction or per config
  const defaultMinDigits =
    options?.minimumFractionDigits !== undefined
      ? options.minimumFractionDigits
      : validCode === 'INR'
      ? Number.isInteger(numeric)
        ? 0
        : 2
      : 2;

  const defaultMaxDigits =
    options?.maximumFractionDigits !== undefined
      ? options.maximumFractionDigits
      : validCode === 'INR'
      ? Number.isInteger(numeric)
        ? 0
        : 2
      : 2;

  try {
    const formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: validCode,
      currencyDisplay: 'narrowSymbol',
      minimumFractionDigits: defaultMinDigits,
      maximumFractionDigits: defaultMaxDigits,
    });

    let formatted = formatter.format(numeric);

    // Explicit prefix for CAD/AUD/SGD to avoid ambiguous "$"
    if (validCode === 'CAD' && !formatted.includes('CA$')) {
      formatted = formatted.replace('$', 'CA$');
    } else if (validCode === 'AUD' && !formatted.includes('A$')) {
      formatted = formatted.replace('$', 'A$');
    } else if (validCode === 'SGD' && !formatted.includes('S$')) {
      formatted = formatted.replace('$', 'S$');
    }

    if (options?.showCode) {
      return `${formatted} ${validCode}`;
    }

    return formatted;
  } catch {
    // Graceful fallback
    const symbol = config?.symbol || '₹';
    return `${symbol}${numeric.toLocaleString(locale)}`;
  }
}

/**
 * Format price with billing period (e.g. ₹150/mo or $1.99/mo)
 */
export function formatPriceWithPeriod(
  amount: number | string | undefined | null,
  period?: 'month' | 'mo' | 'one-time' | string,
  currencyCode: CurrencyCode = 'INR'
): string {
  const formatted = formatCurrency(amount, currencyCode);
  if (period === 'month' || period === 'mo') {
    return `${formatted}/mo`;
  }
  return formatted;
}

/**
 * Get display symbol for a currency
 */
export function getCurrencySymbol(currencyCode: CurrencyCode = 'INR'): string {
  return SUPPORTED_CURRENCIES[currencyCode]?.symbol || '₹';
}

/**
 * Return all available currencies as array
 */
export function getAvailableCurrencies(): CurrencyConfig[] {
  return Object.values(SUPPORTED_CURRENCIES);
}
