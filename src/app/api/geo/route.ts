import { NextRequest, NextResponse } from 'next/server';
import { detectVisitorCountry } from '@/lib/geo/detect-country';
import { getExchangeRates } from '@/lib/currency/exchange-service';
import { SUPPORTED_CURRENCIES, CurrencyCode } from '@/lib/geo/country-currency';
import { isFirebaseAdminConfigured, adminDb } from '@/lib/firebase/admin';
import { RegionalSettings } from '@/types/settings';

const DEFAULT_REGIONAL_SETTINGS: RegionalSettings = {
  baseCurrency: 'INR',
  autoDetectCountry: true,
  showCurrencySelector: true,
  defaultFallbackCountry: 'IN',
  defaultFallbackCurrency: 'INR',
  supportedCurrencies: ['INR', 'USD', 'GBP', 'EUR', 'CAD', 'AUD', 'SGD'],
  showIpInformation: true,
  rateCacheTtlMinutes: 60,
};

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // 1. Fetch admin regional settings from Firestore if configured
    let regionalSettings = DEFAULT_REGIONAL_SETTINGS;

    if (isFirebaseAdminConfigured && adminDb) {
      try {
        const doc = await adminDb.collection('settings').doc('regional').get();
        if (doc.exists) {
          const data = doc.data() as Partial<RegionalSettings>;
          regionalSettings = {
            ...DEFAULT_REGIONAL_SETTINGS,
            ...data,
          };
        }
      } catch (err) {
        console.warn('Could not read settings/regional from Firestore, using defaults:', err);
      }
    }

    // 2. Perform server-side country detection
    const geo = await detectVisitorCountry(request.headers, {
      autoDetectEnabled: regionalSettings.autoDetectCountry,
      defaultFallbackCountry: regionalSettings.defaultFallbackCountry,
      defaultFallbackCurrency: regionalSettings.defaultFallbackCurrency,
    });

    // 3. Obtain authoritative exchange rates
    const ratesData = await getExchangeRates(regionalSettings.rateCacheTtlMinutes);

    // 4. Privacy compliance: Respect admin setting for IP visibility
    const isIpDisplayAllowed = regionalSettings.showIpInformation;
    const clientIp = isIpDisplayAllowed ? geo.clientIp : null;
    const ipAvailable = isIpDisplayAllowed && geo.ipAvailable;

    // Filter rates to only supported currencies
    const allowedCurrencies = (
      regionalSettings.supportedCurrencies && regionalSettings.supportedCurrencies.length > 0
        ? regionalSettings.supportedCurrencies
        : ['INR', 'USD', 'GBP', 'EUR', 'CAD', 'AUD', 'SGD']
    ) as CurrencyCode[];

    const filteredRates: Record<string, number> = {};
    for (const code of allowedCurrencies) {
      filteredRates[code] = ratesData.rates[code] || 1;
    }

    const responsePayload = {
      countryCode: geo.countryCode,
      countryName: geo.countryName,
      suggestedCurrency: geo.suggestedCurrency,
      currencySymbol: geo.currencySymbol,
      supportedCurrencies: allowedCurrencies.map((c) => ({
        code: c,
        name: SUPPORTED_CURRENCIES[c]?.name || c,
        symbol: SUPPORTED_CURRENCIES[c]?.symbol || c,
        flag: SUPPORTED_CURRENCIES[c]?.flag || '🌐',
      })),
      rates: filteredRates,
      ratesTimestamp: ratesData.timestamp,
      ratesSource: ratesData.source,
      ipAddress: clientIp,
      ipAvailable,
      autoDetectEnabled: regionalSettings.autoDetectCountry,
      selectorVisible: regionalSettings.showCurrencySelector,
      ipDisplayEnabled: regionalSettings.showIpInformation,
    };

    return NextResponse.json(responsePayload, {
      headers: {
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
      },
    });
  } catch (error: unknown) {
    if ((error as { digest?: string })?.digest?.startsWith?.('NEXT_')) {
      throw error;
    }
    console.error('Geo detection route error:', error);

    // Return resilient fallback
    return NextResponse.json(
      {
        countryCode: 'IN',
        countryName: 'India',
        suggestedCurrency: 'INR',
        currencySymbol: '₹',
        supportedCurrencies: Object.values(SUPPORTED_CURRENCIES),
        rates: { INR: 1 },
        ratesTimestamp: new Date().toISOString(),
        ratesSource: 'fallback',
        ipAddress: null,
        ipAvailable: false,
        autoDetectEnabled: true,
        selectorVisible: true,
        ipDisplayEnabled: true,
      },
      {
        headers: {
          'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        },
      }
    );
  }
}
