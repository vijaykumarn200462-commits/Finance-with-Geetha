'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import {
  CurrencyCode,
  CurrencyConfig,
  SUPPORTED_CURRENCIES,
  BASE_CURRENCY,
  formatCurrency,
  formatPriceWithPeriod,
  isCurrencySupported,
} from '@/lib/utils/currency';

interface ConnectionInfo {
  countryCode: string;
  countryName: string;
  suggestedCurrency: CurrencyCode;
  currencySymbol: string;
  ipAddress: string | null;
  ipAvailable: boolean;
}

interface ConvertedPriceResult {
  amount: number;
  formatted: string;
  currency: CurrencyCode;
  rateUsed: number;
}

interface CurrencyContextType {
  detectedCountry: string;
  countryName: string;
  selectedCurrency: CurrencyCode;
  currencySymbol: string;
  rates: Record<CurrencyCode, number>;
  supportedCurrencies: CurrencyConfig[];
  loading: boolean;
  isManualSelection: boolean;
  connectionInfo: ConnectionInfo | null;
  isSelectorVisible: boolean;
  isIpDisplayEnabled: boolean;
  setCurrency: (code: CurrencyCode) => void;
  resetToDetected: () => void;
  formatPrice: (amountInInr: number, period?: 'month' | 'mo' | 'one-time' | string) => string;
  convertPrice: (amountInInr: number) => ConvertedPriceResult;
  refreshGeo: () => Promise<void>;
}

const STORAGE_KEY = 'fwg_currency_pref';
const COOKIE_KEY = 'fwg_currency';

const DEFAULT_RATES: Record<CurrencyCode, number> = {
  INR: 1,
  USD: 0.0118,
  GBP: 0.0093,
  EUR: 0.0110,
  CAD: 0.0163,
  AUD: 0.0182,
  SGD: 0.0158,
};

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

// Helper to read cookie
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
  return match ? decodeURIComponent(match[3]) : null;
}

function setCookie(name: string, value: string, days = 365) {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function deleteCookie(name: string) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  // Initialize state lazily from client storage to prevent cascading renders
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>(() => {
    if (typeof window === 'undefined') return BASE_CURRENCY;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && isCurrencySupported(saved)) return saved as CurrencyCode;
    } catch {
      // ignore
    }
    const cookie = getCookie(COOKIE_KEY);
    if (cookie && isCurrencySupported(cookie)) return cookie as CurrencyCode;
    return BASE_CURRENCY;
  });

  const [isManualSelection, setIsManualSelection] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && isCurrencySupported(saved)) return true;
    } catch {
      // ignore
    }
    const cookie = getCookie(COOKIE_KEY);
    return Boolean(cookie && isCurrencySupported(cookie));
  });

  const [detectedCountry, setDetectedCountry] = useState<string>('IN');
  const [countryName, setCountryName] = useState<string>('India');
  const [suggestedCurrency, setSuggestedCurrency] = useState<CurrencyCode>(BASE_CURRENCY);
  const [rates, setRates] = useState<Record<CurrencyCode, number>>(DEFAULT_RATES);
  const [loading, setLoading] = useState<boolean>(true);
  const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo | null>(null);
  const [isSelectorVisible, setIsSelectorVisible] = useState<boolean>(true);
  const [isIpDisplayEnabled, setIsIpDisplayEnabled] = useState<boolean>(true);

  // Fetch server geo detection & live exchange rates
  const fetchGeoData = useCallback(async () => {
    try {
      const res = await fetch('/api/geo', {
        headers: { Accept: 'application/json' },
      });

      if (res.ok) {
        const data = await res.json();

        setDetectedCountry(data.countryCode || 'IN');
        setCountryName(data.countryName || 'India');
        const suggested = isCurrencySupported(data.suggestedCurrency)
          ? (data.suggestedCurrency as CurrencyCode)
          : BASE_CURRENCY;
        setSuggestedCurrency(suggested);

        if (data.rates && typeof data.rates === 'object') {
          setRates((prev) => ({ ...prev, ...data.rates }));
        }

        setIsSelectorVisible(data.selectorVisible !== false);
        setIsIpDisplayEnabled(data.ipDisplayEnabled !== false);

        setConnectionInfo({
          countryCode: data.countryCode || 'IN',
          countryName: data.countryName || 'India',
          suggestedCurrency: suggested,
          currencySymbol: data.currencySymbol || '₹',
          ipAddress: data.ipAddress || null,
          ipAvailable: Boolean(data.ipAvailable),
        });

        // CRITICAL REQUIREMENT:
        // Only adopt suggested currency if the visitor has NOT already chosen a manual currency
        let currentSaved: string | null = null;
        try {
          currentSaved = localStorage.getItem(STORAGE_KEY);
        } catch {
          // ignore
        }
        if (!currentSaved) {
          currentSaved = getCookie(COOKIE_KEY);
        }

        if (!currentSaved && !isManualSelection) {
          setSelectedCurrency(suggested);
        }
      }
    } catch (err) {
      console.warn('[CurrencyContext] Could not load geo detection:', err);
    } finally {
      setLoading(false);
    }
  }, [isManualSelection]);

  useEffect(() => {
    let ignore = false;

    async function initGeo() {
      try {
        const res = await fetch('/api/geo', {
          headers: { Accept: 'application/json' },
        });

        if (!res.ok) return;
        const data = await res.json();
        if (ignore) return;

        setDetectedCountry(data.countryCode || 'IN');
        setCountryName(data.countryName || 'India');
        const suggested = isCurrencySupported(data.suggestedCurrency)
          ? (data.suggestedCurrency as CurrencyCode)
          : BASE_CURRENCY;
        setSuggestedCurrency(suggested);

        if (data.rates && typeof data.rates === 'object') {
          setRates((prev) => ({ ...prev, ...data.rates }));
        }

        setIsSelectorVisible(data.selectorVisible !== false);
        setIsIpDisplayEnabled(data.ipDisplayEnabled !== false);

        setConnectionInfo({
          countryCode: data.countryCode || 'IN',
          countryName: data.countryName || 'India',
          suggestedCurrency: suggested,
          currencySymbol: data.currencySymbol || '₹',
          ipAddress: data.ipAddress || null,
          ipAvailable: Boolean(data.ipAvailable),
        });

        let currentSaved: string | null = null;
        try {
          currentSaved = localStorage.getItem(STORAGE_KEY);
        } catch {
          // ignore
        }
        if (!currentSaved) {
          currentSaved = getCookie(COOKIE_KEY);
        }

        if (!currentSaved && !isManualSelection) {
          setSelectedCurrency(suggested);
        }
      } catch (err) {
        console.warn('[CurrencyContext] Could not load geo detection:', err);
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    initGeo();

    return () => {
      ignore = true;
    };
  }, [isManualSelection]);

  // Manual currency change handler
  const setCurrency = useCallback((code: CurrencyCode) => {
    if (!isCurrencySupported(code)) return;

    setSelectedCurrency(code);
    setIsManualSelection(true);

    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {
      // ignore
    }
    setCookie(COOKIE_KEY, code);
  }, []);

  // Reset to auto-detected currency
  const resetToDetected = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    deleteCookie(COOKIE_KEY);

    setIsManualSelection(false);
    setSelectedCurrency(suggestedCurrency);
  }, [suggestedCurrency]);

  // Convert an INR price into the currently selected currency
  const convertPrice = useCallback(
    (amountInInr: number): ConvertedPriceResult => {
      const validAmount = Number(amountInInr) || 0;
      const rate = rates[selectedCurrency] || 1;

      if (selectedCurrency === 'INR' || rate <= 0) {
        const rounded = Math.round(validAmount);
        return {
          amount: rounded,
          formatted: formatCurrency(rounded, 'INR'),
          currency: 'INR',
          rateUsed: 1,
        };
      }

      const raw = validAmount * rate;
      const decimals = SUPPORTED_CURRENCIES[selectedCurrency]?.decimals ?? 2;
      const multiplier = Math.pow(10, decimals);
      const rounded = Math.round(raw * multiplier) / multiplier;

      return {
        amount: rounded,
        formatted: formatCurrency(rounded, selectedCurrency),
        currency: selectedCurrency,
        rateUsed: rate,
      };
    },
    [rates, selectedCurrency]
  );

  // Format an INR price with period for UI components
  const formatPrice = useCallback(
    (amountInInr: number, period?: 'month' | 'mo' | 'one-time' | string): string => {
      const converted = convertPrice(amountInInr);
      return formatPriceWithPeriod(converted.amount, period, converted.currency);
    },
    [convertPrice]
  );

  const currencySymbol = useMemo(() => {
    return SUPPORTED_CURRENCIES[selectedCurrency]?.symbol || '₹';
  }, [selectedCurrency]);

  const supportedCurrenciesList = useMemo(() => {
    return Object.values(SUPPORTED_CURRENCIES);
  }, []);

  const value = useMemo(
    () => ({
      detectedCountry,
      countryName,
      selectedCurrency,
      currencySymbol,
      rates,
      supportedCurrencies: supportedCurrenciesList,
      loading,
      isManualSelection,
      connectionInfo,
      isSelectorVisible,
      isIpDisplayEnabled,
      setCurrency,
      resetToDetected,
      formatPrice,
      convertPrice,
      refreshGeo: fetchGeoData,
    }),
    [
      detectedCountry,
      countryName,
      selectedCurrency,
      currencySymbol,
      rates,
      supportedCurrenciesList,
      loading,
      isManualSelection,
      connectionInfo,
      isSelectorVisible,
      isIpDisplayEnabled,
      setCurrency,
      resetToDetected,
      formatPrice,
      convertPrice,
      fetchGeoData,
    ]
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency(): CurrencyContextType {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
