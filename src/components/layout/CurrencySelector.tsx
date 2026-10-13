'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useCurrency } from '@/lib/context/CurrencyContext';
import { CurrencyCode } from '@/lib/utils/currency';
import { ChevronDown, Globe, Check, RotateCcw } from 'lucide-react';

interface CurrencySelectorProps {
  variant?: 'navbar' | 'footer' | 'mobile';
  className?: string;
}

export function CurrencySelector({ variant = 'navbar', className = '' }: CurrencySelectorProps) {
  const {
    selectedCurrency,
    currencySymbol,
    supportedCurrencies,
    setCurrency,
    resetToDetected,
    isManualSelection,
    countryName,
    connectionInfo,
    isSelectorVisible,
  } = useCurrency();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isSelectorVisible) {
    return null;
  }

  const currentConfig = supportedCurrencies.find((c) => c.code === selectedCurrency);

  // Variants styling
  const isNavbar = variant === 'navbar';
  const isFooter = variant === 'footer';

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={`Currency selector: Currently ${selectedCurrency} (${currencySymbol})`}
        className={
          isNavbar
            ? 'flex items-center gap-1 px-2 py-1 text-xs font-mono font-medium rounded-lg text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#138354] whitespace-nowrap'
            : isFooter
            ? 'flex items-center gap-2 px-3 py-2 text-xs font-mono text-[#D5D5CF] bg-[#222421] hover:bg-[#2B2E2A] border border-[#3A3D38] rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#84A98C]'
            : 'w-full flex items-center justify-between px-3 py-2.5 text-sm font-mono text-[#181918] bg-[#FAF8F5] border border-[#E2DBD0] rounded-xl hover:bg-[#F2ECE2] transition-colors'
        }
      >
        <span className="flex items-center gap-1">
          <span className="text-xs leading-none" aria-hidden="true">
            {currentConfig?.flag || '🌐'}
          </span>
          <span className="font-semibold">{selectedCurrency}</span>
          {!isNavbar && (
            <span className={isFooter ? 'text-[#84A98C]' : 'text-[#706E69]'}>({currencySymbol})</span>
          )}
        </span>
        <ChevronDown
          className={`w-3 h-3 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          } ${isFooter ? 'text-[#A8A8A2]' : 'text-slate-500'}`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          role="listbox"
          tabIndex={-1}
          className={`absolute z-50 mt-1.5 w-64 rounded-xl shadow-xl border overflow-hidden animate-in fade-in zoom-in-95 duration-150 ${
            isFooter
              ? 'bottom-full mb-2 right-0 sm:right-auto sm:left-0 bg-[#1D1E1C] border-[#363934] text-[#FAF7F2]'
              : 'right-0 bg-white border-[#E2DBD0] text-[#181918]'
          }`}
        >
          {/* Header */}
          <div
            className={`px-3 py-2.5 border-b text-[11px] font-mono flex items-center justify-between ${
              isFooter ? 'border-[#2C2E2A] text-[#84A98C]' : 'border-[#EAE4D9] text-[#706E69] bg-[#FAF8F5]'
            }`}
          >
            <span className="flex items-center gap-1 uppercase tracking-wider font-semibold">
              <Globe className="w-3 h-3" />
              Display Currency
            </span>
            {isManualSelection && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#244634]/10 text-[#244634] font-medium">
                Custom
              </span>
            )}
          </div>

          {/* Currency List */}
          <div className="py-1 max-h-60 overflow-y-auto">
            {supportedCurrencies.map((c) => {
              const isSelected = c.code === selectedCurrency;
              return (
                <button
                  key={c.code}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    setCurrency(c.code as CurrencyCode);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between transition-colors ${
                    isSelected
                      ? isFooter
                        ? 'bg-[#2B2E29] text-white font-semibold'
                        : 'bg-[#EAF0EC] text-[#244634] font-semibold'
                      : isFooter
                      ? 'text-[#D5D5CF] hover:bg-[#252824] hover:text-white'
                      : 'text-[#323431] hover:bg-[#FAF8F5] hover:text-[#181918]'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-base" aria-hidden="true">
                      {c.flag}
                    </span>
                    <span className="font-mono font-medium">
                      {c.code} — {c.name} ({c.symbol})
                    </span>
                  </span>
                  {isSelected && <Check className="w-3.5 h-3.5 shrink-0 text-[#244634]" />}
                </button>
              );
            })}
          </div>

          {/* Reset to detected option if manual selection active */}
          {isManualSelection && connectionInfo && (
            <div
              className={`p-2 border-t ${
                isFooter ? 'border-[#2C2E2A] bg-[#181918]' : 'border-[#EAE4D9] bg-[#FAF8F5]'
              }`}
            >
              <button
                type="button"
                onClick={() => {
                  resetToDetected();
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-mono transition-colors ${
                  isFooter
                    ? 'text-[#84A98C] hover:bg-[#252824] hover:text-white'
                    : 'text-[#244634] hover:bg-[#EAF0EC]'
                }`}
              >
                <RotateCcw className="w-3 h-3" />
                <span>
                  Reset to detected ({countryName} · {connectionInfo.suggestedCurrency})
                </span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
