/**
 * Server-Side Country Detection Service
 * Finance with Geetha
 *
 * Privacy Notice:
 * - IP addresses are used solely on the server in-memory to detect country/currency.
 * - Raw IP addresses are NEVER stored in Firestore or customer databases.
 * - IP is returned in /api/geo solely for the current visitor's optional connection view.
 */

import {
  CurrencyCode,
  BASE_CURRENCY,
  SUPPORTED_CURRENCIES,
  getSuggestedCurrency,
  getCountryName,
} from './country-currency';

export interface GeoDetectionResult {
  countryCode: string;
  countryName: string;
  suggestedCurrency: CurrencyCode;
  currencySymbol: string;
  clientIp: string | null;
  ipAvailable: boolean;
  source: 'vercel' | 'cloudflare' | 'cloudfront' | 'geoip_provider' | 'header' | 'default_fallback';
}

/**
 * Check if an IP address is a private, loopback, or local network address
 */
export function isPrivateOrLocalIp(ip?: string | null): boolean {
  if (!ip) return true;
  const cleanIp = ip.trim();

  // IPv6 loopback
  if (cleanIp === '::1' || cleanIp === '::' || cleanIp.startsWith('fe80:')) return true;

  // IPv4 loopback & local
  if (
    cleanIp === '127.0.0.1' ||
    cleanIp === 'localhost' ||
    cleanIp.startsWith('10.') ||
    cleanIp.startsWith('192.168.') ||
    cleanIp.startsWith('169.254.')
  ) {
    return true;
  }

  // 172.16.0.0 - 172.31.255.255
  const match172 = cleanIp.match(/^172\.(\d+)\./);
  if (match172) {
    const secondOctet = parseInt(match172[1], 10);
    if (secondOctet >= 16 && secondOctet <= 31) return true;
  }

  return false;
}

/**
 * Extract trusted client IP from incoming request headers
 */
export function extractClientIp(headers: Headers): string | null {
  // 1. Cloudflare connecting IP
  const cfIp = headers.get('cf-connecting-ip');
  if (cfIp && !isPrivateOrLocalIp(cfIp)) {
    return cfIp.trim();
  }

  // 2. Vercel / Standard Forwarded For (first IP in chain is client)
  const xForwardedFor = headers.get('x-forwarded-for');
  if (xForwardedFor) {
    const firstIp = xForwardedFor.split(',')[0].trim();
    if (firstIp && !isPrivateOrLocalIp(firstIp)) {
      return firstIp;
    }
  }

  // 3. X-Real-IP
  const xRealIp = headers.get('x-real-ip');
  if (xRealIp && !isPrivateOrLocalIp(xRealIp)) {
    return xRealIp.trim();
  }

  // 4. Fastly / True-Client-IP
  const trueClientIp = headers.get('true-client-ip') || headers.get('fastly-client-ip');
  if (trueClientIp && !isPrivateOrLocalIp(trueClientIp)) {
    return trueClientIp.trim();
  }

  return null;
}

/**
 * Detect Country Code from trusted hosting headers
 */
export function detectCountryFromHeaders(headers: Headers): {
  countryCode: string | null;
  source: GeoDetectionResult['source'];
} {
  // 1. Vercel country header
  const vercelCountry = headers.get('x-vercel-ip-country');
  if (vercelCountry && vercelCountry.length === 2) {
    return { countryCode: vercelCountry.toUpperCase(), source: 'vercel' };
  }

  // 2. Cloudflare country header
  const cfCountry = headers.get('cf-ipcountry');
  if (cfCountry && cfCountry.length === 2 && cfCountry !== 'XX' && cfCountry !== 'T1') {
    return { countryCode: cfCountry.toUpperCase(), source: 'cloudflare' };
  }

  // 3. AWS CloudFront country header
  const cloudfrontCountry = headers.get('cloudfront-viewer-country');
  if (cloudfrontCountry && cloudfrontCountry.length === 2) {
    return { countryCode: cloudfrontCountry.toUpperCase(), source: 'cloudfront' };
  }

  // 4. Generic X-Country-Code
  const genericCountry = headers.get('x-country-code');
  if (genericCountry && genericCountry.length === 2) {
    return { countryCode: genericCountry.toUpperCase(), source: 'header' };
  }

  return { countryCode: null, source: 'default_fallback' };
}

/**
 * Fallback server-side IP Geolocation provider query
 * Uses a safe short timeout (2s) so requests never hang.
 */
async function queryIpGeolocationProvider(ip: string): Promise<string | null> {
  if (isPrivateOrLocalIp(ip)) return null;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    // Free IP API (CORS enabled, HTTPS, high availability)
    const res = await fetch(`https://freeipapi.com/api/json/${encodeURIComponent(ip)}`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && typeof data.countryCode === 'string' && data.countryCode.length === 2) {
        return data.countryCode.toUpperCase();
      }
    }
  } catch {
    // Gracefully handle timeout or network failure
  }

  return null;
}

/**
 * Main Country Detection Entrypoint
 *
 * @param headers - HTTP Headers from Next.js request
 * @param options - Optional configuration (e.g. from Admin Settings)
 */
export async function detectVisitorCountry(
  headers: Headers,
  options?: {
    autoDetectEnabled?: boolean;
    defaultFallbackCountry?: string;
    defaultFallbackCurrency?: CurrencyCode;
  }
): Promise<GeoDetectionResult> {
  const defaultCountry = (options?.defaultFallbackCountry || 'IN').toUpperCase();
  const defaultCurrency = options?.defaultFallbackCurrency || BASE_CURRENCY;

  const clientIp = extractClientIp(headers);
  const ipAvailable = Boolean(clientIp);

  // If auto-detection is disabled in admin settings, return configured fallback immediately
  if (options?.autoDetectEnabled === false) {
    return {
      countryCode: defaultCountry,
      countryName: getCountryName(defaultCountry),
      suggestedCurrency: defaultCurrency,
      currencySymbol: SUPPORTED_CURRENCIES[defaultCurrency]?.symbol || '₹',
      clientIp,
      ipAvailable,
      source: 'default_fallback',
    };
  }

  // 1. Try trusted hosting headers first (Vercel, Cloudflare, CloudFront)
  const headerResult = detectCountryFromHeaders(headers);
  if (headerResult.countryCode) {
    const suggested = getSuggestedCurrency(headerResult.countryCode);
    return {
      countryCode: headerResult.countryCode,
      countryName: getCountryName(headerResult.countryCode),
      suggestedCurrency: suggested,
      currencySymbol: SUPPORTED_CURRENCIES[suggested]?.symbol || '₹',
      clientIp,
      ipAvailable,
      source: headerResult.source,
    };
  }

  // 2. If no hosting header and a public IP is available, query server-side geoip provider
  if (clientIp) {
    const providerCountry = await queryIpGeolocationProvider(clientIp);
    if (providerCountry) {
      const suggested = getSuggestedCurrency(providerCountry);
      return {
        countryCode: providerCountry,
        countryName: getCountryName(providerCountry),
        suggestedCurrency: suggested,
        currencySymbol: SUPPORTED_CURRENCIES[suggested]?.symbol || '₹',
        clientIp,
        ipAvailable,
        source: 'geoip_provider',
      };
    }
  }

  // 3. Default fallback (India / INR)
  return {
    countryCode: defaultCountry,
    countryName: getCountryName(defaultCountry),
    suggestedCurrency: defaultCurrency,
    currencySymbol: SUPPORTED_CURRENCIES[defaultCurrency]?.symbol || '₹',
    clientIp,
    ipAvailable,
    source: 'default_fallback',
  };
}
