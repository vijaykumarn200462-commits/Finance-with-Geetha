/**
 * Server-Side Exchange Rate Service
 * Finance with Geetha
 *
 * Base Currency: INR (Indian Rupee - ₹)
 * Authoritative source of product pricing in Firestore is ALWAYS INR.
 *
 * Features:
 * - Server-side fetching from configurable exchange rate provider
 * - In-memory server caching with TTL to prevent excessive external calls
 * - Authoritative rate locking for checkout calculations
 * - Graceful fallback to verified baseline rates if provider is unreachable
 * - Zero exposure of private API credentials to the browser
 */

import { CurrencyCode, BASE_CURRENCY, SUPPORTED_CURRENCIES, isCurrencySupported } from '../geo/country-currency';

export interface ExchangeRatesData {
  base: CurrencyCode;
  rates: Record<CurrencyCode, number>;
  timestamp: string;
  source: 'provider_api' | 'curated_fallback';
  providerName: string;
}

/**
 * Curated Baseline Rates (INR Base: 1 INR = X Foreign Currency)
 * Updated benchmark rates used strictly as fallback when live network is offline.
 */
export const CURATED_BASELINE_INR_RATES: Record<CurrencyCode, number> = {
  INR: 1,
  USD: 0.0118, // 1 USD ≈ 84.75 INR
  GBP: 0.0093, // 1 GBP ≈ 107.50 INR
  EUR: 0.0110, // 1 EUR ≈ 90.90 INR
  CAD: 0.0163, // 1 CAD ≈ 61.35 INR
  AUD: 0.0182, // 1 AUD ≈ 54.95 INR
  SGD: 0.0158, // 1 SGD ≈ 63.30 INR
};

interface CacheEntry {
  data: ExchangeRatesData;
  expiresAt: number;
}

let ratesCache: CacheEntry | null = null;

/**
 * Fetch exchange rates from configured provider or live fallback
 */
async function fetchLiveRatesFromProvider(): Promise<ExchangeRatesData | null> {
  const apiKey = process.env.EXCHANGE_RATE_API_KEY;
  const customUrl = process.env.EXCHANGE_RATE_API_URL;

  let url = 'https://open.er-api.com/v6/latest/INR';
  let providerName = 'Open Exchange Rates (er-api)';

  if (customUrl) {
    url = customUrl;
    providerName = 'Custom Configured Provider';
  } else if (apiKey && !apiKey.includes('placeholder')) {
    url = `https://v6.exchangerate-api.com/v6/${apiKey}/latest/INR`;
    providerName = 'ExchangeRate-API (Pro)';
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3-second timeout

    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
      next: { revalidate: 3600 }, // Next.js cache hints where supported
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      console.warn(`[ExchangeRate] Provider returned status ${res.status}`);
      return null;
    }

    const json = await res.json();
    const rawRates = json.rates || json.conversion_rates;

    if (!rawRates || typeof rawRates !== 'object') {
      return null;
    }

    const validatedRates: Record<CurrencyCode, number> = {
      INR: 1,
      USD: typeof rawRates.USD === 'number' ? rawRates.USD : CURATED_BASELINE_INR_RATES.USD,
      GBP: typeof rawRates.GBP === 'number' ? rawRates.GBP : CURATED_BASELINE_INR_RATES.GBP,
      EUR: typeof rawRates.EUR === 'number' ? rawRates.EUR : CURATED_BASELINE_INR_RATES.EUR,
      CAD: typeof rawRates.CAD === 'number' ? rawRates.CAD : CURATED_BASELINE_INR_RATES.CAD,
      AUD: typeof rawRates.AUD === 'number' ? rawRates.AUD : CURATED_BASELINE_INR_RATES.AUD,
      SGD: typeof rawRates.SGD === 'number' ? rawRates.SGD : CURATED_BASELINE_INR_RATES.SGD,
    };

    return {
      base: BASE_CURRENCY,
      rates: validatedRates,
      timestamp: new Date().toISOString(),
      source: 'provider_api',
      providerName,
    };
  } catch (err: unknown) {
    console.warn('[ExchangeRate] Live provider unreachable, falling back safely:', err);
    return null;
  }
}

/**
 * Get Authoritative Exchange Rates with in-memory caching
 *
 * @param ttlMinutes - Cache duration in minutes (default 60)
 */
export async function getExchangeRates(ttlMinutes: number = 60): Promise<ExchangeRatesData> {
  const now = Date.now();

  // Return from active cache if valid
  if (ratesCache && ratesCache.expiresAt > now) {
    return ratesCache.data;
  }

  // Attempt live provider
  const liveData = await fetchLiveRatesFromProvider();
  if (liveData) {
    ratesCache = {
      data: liveData,
      expiresAt: now + ttlMinutes * 60 * 1000,
    };
    return liveData;
  }

  // Fallback to verified baseline table
  const fallbackData: ExchangeRatesData = {
    base: BASE_CURRENCY,
    rates: CURATED_BASELINE_INR_RATES,
    timestamp: new Date().toISOString(),
    source: 'curated_fallback',
    providerName: 'Curated Benchmark Rates (Fallback)',
  };

  ratesCache = {
    data: fallbackData,
    expiresAt: now + Math.min(ttlMinutes, 15) * 60 * 1000, // shorter retry for fallback
  };

  return fallbackData;
}

/**
 * Convert an amount from INR to a target supported currency
 *
 * @param amountInInr - Base price in Rupees
 * @param targetCurrency - Target currency code
 * @param rates - Rate dictionary
 * @returns Object with converted decimal amount, minor units (for Stripe), and formatted display
 */
export function convertInrToTargetCurrency(
  amountInInr: number,
  targetCurrency: CurrencyCode = 'INR',
  rates?: Record<CurrencyCode, number>
): {
  amount: number;
  minorUnits: number;
  rateUsed: number;
  currency: CurrencyCode;
} {
  const activeRates = rates || CURATED_BASELINE_INR_RATES;
  const rate = activeRates[targetCurrency] || 1;

  if (!targetCurrency || !isCurrencySupported(targetCurrency) || targetCurrency === 'INR' || rate <= 0) {
    const roundedInr = Math.round(amountInInr);
    return {
      amount: roundedInr,
      minorUnits: roundedInr * 100, // 1 INR = 100 Paise
      rateUsed: 1,
      currency: 'INR',
    };
  }

  const rawConverted = amountInInr * rate;
  const decimals = SUPPORTED_CURRENCIES[targetCurrency]?.decimals ?? 2;

  // Round to appropriate decimal places
  const multiplier = Math.pow(10, decimals);
  const rounded = Math.round(rawConverted * multiplier) / multiplier;

  // Stripe minor units (e.g. cents / pence)
  const minorUnits = Math.round(rounded * 100);

  return {
    amount: rounded,
    minorUnits,
    rateUsed: rate,
    currency: targetCurrency,
  };
}
