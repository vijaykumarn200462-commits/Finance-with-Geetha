'use client';

import React from 'react';
import { useCurrency } from '@/lib/context/CurrencyContext';
import { X, ShieldCheck, Globe, Wifi } from 'lucide-react';
import { CurrencyCode } from '@/lib/utils/currency';

interface ConnectionInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ConnectionInfoModal({ isOpen, onClose }: ConnectionInfoModalProps) {
  const {
    detectedCountry,
    countryName,
    selectedCurrency,
    currencySymbol,
    supportedCurrencies,
    setCurrency,
    resetToDetected,
    isManualSelection,
    connectionInfo,
  } = useCurrency();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-[#FAF7F2] rounded-2xl border border-[#E2DBD0] shadow-2xl p-6 sm:p-7 text-[#181918]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="connection-info-title"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-lg text-[#5C5E5B] hover:text-[#181918] hover:bg-[#EAE4D9] transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-[#EAF0EC] border border-[#C5D8CC] flex items-center justify-center text-[#244634]">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-mono uppercase tracking-widest text-[#244634] font-semibold">
              Network & Regional Settings
            </span>
            <h3 id="connection-info-title" className="font-editorial text-2xl font-normal text-[#181918]">
              Connection Information
            </h3>
          </div>
        </div>

        {/* Connection Details Card */}
        <div className="bg-white rounded-xl border border-[#E2DBD0] p-4.5 space-y-3.5 mb-5 shadow-xs">
          <div className="flex items-center justify-between py-1 border-b border-[#F2ECE2]">
            <span className="text-xs text-[#706E69] font-mono uppercase">Detected Country</span>
            <span className="text-sm font-semibold text-[#181918] flex items-center gap-1.5">
              <span>{countryName}</span>
              <span className="text-xs font-mono text-[#706E69]">({detectedCountry})</span>
            </span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-[#F2ECE2]">
            <span className="text-xs text-[#706E69] font-mono uppercase">Suggested Currency</span>
            <span className="text-sm font-mono font-semibold text-[#244634]">
              {connectionInfo?.suggestedCurrency || 'INR'} — {connectionInfo?.currencySymbol || '₹'}
            </span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-[#F2ECE2]">
            <span className="text-xs text-[#706E69] font-mono uppercase">Active Display</span>
            <span className="text-sm font-mono font-semibold text-[#181918] flex items-center gap-1">
              <span>{selectedCurrency}</span>
              <span>({currencySymbol})</span>
              {isManualSelection && (
                <span className="text-[10px] ml-1 px-1.5 py-0.5 rounded bg-[#EAF0EC] text-[#244634] font-sans font-medium">
                  Custom
                </span>
              )}
            </span>
          </div>

          <div className="flex items-center justify-between py-1">
            <span className="text-xs text-[#706E69] font-mono uppercase flex items-center gap-1">
              <Wifi className="w-3 h-3" />
              Public IP Address
            </span>
            <span className="text-xs font-mono text-[#181918]">
              {connectionInfo?.ipAddress ? (
                <span className="bg-[#FAF8F5] px-2 py-0.5 rounded border border-[#E2DBD0]">
                  {connectionInfo.ipAddress}
                </span>
              ) : (
                <span className="text-[#858783] italic">Private / Unavailable</span>
              )}
            </span>
          </div>
        </div>

        {/* Currency Override Selector */}
        <div className="mb-5 space-y-2">
          <label className="block text-xs font-mono uppercase tracking-wider text-[#706E69]">
            Change Display Currency
          </label>
          <div className="grid grid-cols-2 gap-2">
            {supportedCurrencies.map((c) => {
              const isSelected = c.code === selectedCurrency;
              return (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => setCurrency(c.code as CurrencyCode)}
                  className={`px-3 py-2 rounded-lg text-xs font-mono flex items-center justify-between border transition-colors ${
                    isSelected
                      ? 'bg-[#EAF0EC] border-[#244634] text-[#244634] font-semibold'
                      : 'bg-white border-[#E2DBD0] text-[#424440] hover:bg-[#FAF8F5]'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <span>{c.flag}</span>
                    <span>{c.code}</span>
                  </span>
                  <span>{c.symbol}</span>
                </button>
              );
            })}
          </div>

          {isManualSelection && (
            <button
              type="button"
              onClick={resetToDetected}
              className="text-xs font-mono text-[#244634] hover:underline pt-1 block"
            >
              Reset to detected ({countryName} · {connectionInfo?.suggestedCurrency})
            </button>
          )}
        </div>

        {/* Privacy Assurance Notice */}
        <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E8E2D7] text-xs text-[#5C5E5B] flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-[#244634] shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <p className="font-semibold text-[#181918] mb-0.5">Privacy First</p>
            <p>
              Connection info is generated solely for your active browser session. Your IP address
              is never stored in our database, tracked across visits, or shared with third parties.
            </p>
          </div>
        </div>

        {/* Done Button */}
        <div className="mt-5">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-[#244634] text-[#FAF7F2] text-xs font-medium uppercase tracking-wider rounded-xl hover:bg-[#1B3527] transition-colors"
          >
            Close & Continue Browsing
          </button>
        </div>
      </div>
    </div>
  );
}
