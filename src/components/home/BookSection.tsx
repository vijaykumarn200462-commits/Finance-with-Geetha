'use client';

import React from 'react';
import { ArrowRight, BookOpen, Check, Download, Tablet } from 'lucide-react';
import { Button } from '../ui/Button';
import { BookMockup } from '../ui/BookMockup';
import { useDynamicPricing } from '@/lib/firebase/content';
import { useCurrency } from '@/lib/context/CurrencyContext';

import { BookSectionContent } from '@/types/site-content';

interface BookSectionProps {
  onBuyBook: () => void;
  onReadSample: () => void;
  content?: BookSectionContent;
}

export function BookSection({ onBuyBook, onReadSample, content }: BookSectionProps) {
  const pricing = useDynamicPricing();
  const { formatPrice } = useCurrency();

  if (content && content.enabled === false) {
    return null;
  }

  const eyebrow = content?.eyebrow || 'The Playbook';
  const title = content?.title || 'Start a Bookkeeping Business';
  const subtitle = content?.subtitle || 'How to build one that pays you well — and leaves you alone.';
  const description =
    content?.description ||
    'The entire playbook in one book. How I went from zero clients to a calm, profitable firm — pricing, first clients, the monthly work, hiring, and getting your time back. Real numbers. Real mistakes. Real lessons. Read it in an afternoon, use it for years.';
  const formatText = content?.format || 'PDF + EPUB (Instant Download)';
  const compatibilityText = content?.compatibility || 'Reads on Kindle, Apple Books, and Kobo';
  const primaryButtonText =
    content?.primaryButtonText && !content.primaryButtonText.includes('₹')
      ? content.primaryButtonText
      : `Get the Book — ${formatPrice(pricing.book)}`;
  const secondaryButtonText = content?.secondaryButtonText || 'Read a Free Sample';

  return (
    <section id="book" className="py-20 sm:py-28 bg-[#F4EFE6]/70 border-y border-[#E8E2D7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left: Book Mockup */}
          <div className="lg:col-span-5 flex justify-center order-2 lg:order-1">
            <BookMockup size="lg" />
          </div>

          {/* Right: Copy & CTAs */}
          <div className="lg:col-span-7 space-y-6 order-1 lg:order-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EAF0EC] border border-[#C5D8CC] text-[#244634] text-xs font-semibold tracking-wider uppercase font-mono">
              {eyebrow}
            </div>

            <h2 className="font-editorial text-3xl sm:text-4xl lg:text-5xl text-[#181918] leading-[1.1] font-normal tracking-tight">
              {title}
            </h2>

            <p className="font-editorial text-xl sm:text-2xl text-[#244634]">
              {subtitle}
            </p>

            <p className="text-base sm:text-lg text-[#5C5E5B] leading-relaxed">
              {description}
            </p>

            {/* Price & Format specs */}
            <div className="flex flex-wrap items-center gap-6 py-4 border-y border-[#E2DBD0]">
              <div>
                <span className="text-xs uppercase font-mono text-[#706E69] block">Price</span>
                <span className="font-editorial text-3xl text-[#181918]">{formatPrice(pricing.book)}</span>
                <span className="text-xs text-[#5C5E5B] ml-1">one-time</span>
              </div>

              <div className="h-10 w-px bg-[#E2DBD0] hidden sm:block" />

              <div>
                <span className="text-xs uppercase font-mono text-[#706E69] block">Format</span>
                <span className="text-sm font-semibold text-[#181918] flex items-center gap-1.5 mt-1">
                  <Download className="w-4 h-4 text-[#244634]" />
                  {formatText}
                </span>
              </div>

              <div className="h-10 w-px bg-[#E2DBD0] hidden sm:block" />

              <div>
                <span className="text-xs uppercase font-mono text-[#706E69] block">Compatibility</span>
                <span className="text-sm text-[#5C5E5B] flex items-center gap-1.5 mt-1">
                  <Tablet className="w-4 h-4 text-[#244634]" />
                  {compatibilityText}
                </span>
              </div>
            </div>

            {/* Feature Bullets */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-[#484A46]">
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#244634] shrink-0" />
                <span>Zero fluff — 180 pages of real operational workflows</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#244634] shrink-0" />
                <span>Exact discovery call diagnostic question list</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#244634] shrink-0" />
                <span>Monthly retainer pricing calculator & formula</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#244634] shrink-0" />
                <span>Client boundary templates for calm evenings</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
              <Button
                variant="primary"
                size="lg"
                onClick={onBuyBook}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="w-full sm:w-auto"
              >
                {primaryButtonText}
              </Button>

              <Button
                variant="outline"
                size="lg"
                onClick={onReadSample}
                leftIcon={<BookOpen className="w-4 h-4 text-[#244634]" />}
                className="w-full sm:w-auto"
              >
                {secondaryButtonText}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
