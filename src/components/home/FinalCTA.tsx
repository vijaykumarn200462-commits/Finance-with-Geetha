'use client';

import React from 'react';
import { ArrowRight, BookOpen, ShieldCheck } from 'lucide-react';
import { Button } from '../ui/Button';
import { useDynamicPricing } from '@/lib/firebase/content';
import { useCurrency } from '@/lib/context/CurrencyContext';

import { FinalCTAContent } from '@/types/site-content';

interface FinalCTAProps {
  onJoinCommunity: () => void;
  onGetBook: () => void;
  content?: FinalCTAContent;
}

export function FinalCTA({ onJoinCommunity, onGetBook, content }: FinalCTAProps) {
  const pricing = useDynamicPricing();
  const { formatPrice } = useCurrency();

  if (content && content.enabled === false) {
    return null;
  }

  const eyebrow = content?.eyebrow || 'Take the Next Step';
  const headline = content?.headline || 'Ready to build yours?';
  const text =
    content?.text ||
    "Start with the community. That's where the calls, the answers, and everything else lives.";
  const primaryButtonText =
    content?.primaryButtonText && !content.primaryButtonText.includes('₹')
      ? content.primaryButtonText
      : `Join the Community — ${formatPrice(pricing.community, 'mo')}`;
  const secondaryButtonText =
    content?.secondaryButtonText && !content.secondaryButtonText.includes('₹')
      ? content.secondaryButtonText
      : `Start with the Book — ${formatPrice(pricing.book)}`;

  return (
    <section className="py-24 sm:py-32 bg-[#181918] text-[#FAF7F2] relative overflow-hidden text-center">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#244634]/25 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <span className="text-xs font-mono uppercase tracking-widest text-[#84A98C] font-semibold block mb-3">
          {eyebrow}
        </span>

        <h2 className="font-editorial text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-[#FAF7F2] leading-[1.1]">
          {headline}
        </h2>

        <p className="mt-5 text-lg sm:text-xl text-[#D0C9BD] max-w-2xl mx-auto leading-relaxed">
          {text}
        </p>

        {/* Action Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            variant="primary"
            size="lg"
            onClick={onJoinCommunity}
            rightIcon={<ArrowRight className="w-4 h-4" />}
            className="w-full sm:w-auto shadow-lg text-base"
          >
            {primaryButtonText}
          </Button>

          <Button
            variant="secondary"
            size="lg"
            onClick={onGetBook}
            leftIcon={<BookOpen className="w-4 h-4 text-[#244634]" />}
            className="w-full sm:w-auto text-base"
          >
            {secondaryButtonText}
          </Button>
        </div>

        {/* Reassurance text */}
        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-[#8E8E87]">
          <ShieldCheck className="w-4 h-4 text-[#84A98C]" />
          <span>Cancel anytime with one click. No long-term commitments or lock-in.</span>
        </div>
      </div>
    </section>
  );
}
