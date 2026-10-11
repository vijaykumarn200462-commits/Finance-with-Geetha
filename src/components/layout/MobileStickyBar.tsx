'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, X } from 'lucide-react';
import { useDynamicPricing } from '@/lib/firebase/content';
import { useCurrency } from '@/lib/context/CurrencyContext';

interface MobileStickyBarProps {
  onJoinClick?: () => void;
}

export function MobileStickyBar({ onJoinClick }: MobileStickyBarProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const pricing = useDynamicPricing();
  const { formatPrice } = useCurrency();

  useEffect(() => {
    const handleScroll = () => {
      // Show only after scrolling past typical hero height (~450px)
      if (window.scrollY > 450 && !isDismissed) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isDismissed]);

  if (!isVisible || isDismissed) return null;

  return (
    <aside
      aria-label="Community offer banner"
      className="fixed bottom-0 left-0 right-0 z-30 lg:hidden p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-[#FAF7F2]/95 backdrop-blur-md border-t border-[#E8E2D7] shadow-lg animate-in slide-in-from-bottom-4 duration-300"
    >
      <div className="max-w-md mx-auto flex items-center gap-2">
        {onJoinClick ? (
          <button
            onClick={onJoinClick}
            className="flex-1 flex items-center justify-center gap-2 bg-[#244634] text-[#FAF7F2] hover:bg-[#1B3527] py-3 px-4 rounded-lg font-medium text-sm shadow-xs transition-colors"
          >
            <span>Join the Community — {formatPrice(pricing.community, 'mo')}</span>
            <ArrowRight className="w-4 h-4 shrink-0" />
          </button>
        ) : (
          <Link
            href="/community"
            className="flex-1 flex items-center justify-center gap-2 bg-[#244634] text-[#FAF7F2] hover:bg-[#1B3527] py-3 px-4 rounded-lg font-medium text-sm shadow-xs transition-colors"
          >
            <span>Join the Community — {formatPrice(pricing.community, 'mo')}</span>
            <ArrowRight className="w-4 h-4 shrink-0" />
          </Link>
        )}

        <button
          onClick={() => setIsDismissed(true)}
          className="p-2.5 rounded-lg text-[#5C5E5B] hover:text-[#181918] hover:bg-[#EAE4D9]"
          aria-label="Dismiss bottom bar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
