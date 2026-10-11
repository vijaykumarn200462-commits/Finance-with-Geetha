'use client';

import React from 'react';
import { Video, ArrowRight, Check } from 'lucide-react';
import { Button } from '../ui/Button';
import { useDynamicPricing } from '@/lib/firebase/content';
import { useCurrency } from '@/lib/context/CurrencyContext';

import { OneOnOneContent } from '@/types/site-content';

interface OneOnOneSectionProps {
  onBookCall: () => void;
  content?: OneOnOneContent;
}

export function OneOnOneSection({ onBookCall, content }: OneOnOneSectionProps) {
  const pricing = useDynamicPricing();
  const { formatPrice } = useCurrency();

  if (content && content.enabled === false) {
    return null;
  }

  const eyebrow = content?.eyebrow || 'Private Consultation';
  const title = content?.title || 'Want 1-on-1 time?';
  const description =
    content?.description ||
    'The community works for most people. But if you want to talk through your specific situation, book a 30-minute strategy call. Bring your biggest question, leave with a plan.';
  const deliverables = content?.deliverables || [
    'Proposal & pricing audit',
    'Difficult client diagnosis',
    'Full recording provided',
  ];
  const buttonText = content?.buttonText || 'Book a Call';

  return (
    <section className="py-16 sm:py-24 bg-[#FAF7F2] border-t border-[#E8E2D7]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#FFFFFF] border border-[#E2DBD0] rounded-2xl p-8 sm:p-12 shadow-sm relative overflow-hidden">
          {/* Subtle accent ribbon */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#EAF0EC] rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            {/* Left 7 cols */}
            <div className="md:col-span-8 space-y-4">
              <span className="text-xs font-mono uppercase tracking-widest text-[#244634] font-semibold">
                {eyebrow}
              </span>

              <h2 className="font-editorial text-3xl sm:text-4xl text-[#181918] font-normal tracking-tight">
                {title}
              </h2>

              <p className="text-base text-[#5C5E5B] leading-relaxed">
                {description}
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-y-2 gap-x-5 text-xs text-[#484A46]">
                {deliverables.map((deliv, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-[#244634]" />
                    <span>{deliv}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right 4 cols: Card CTA */}
            <div className="md:col-span-4 bg-[#FAF7F2] border border-[#E2DBD0] rounded-xl p-6 text-center space-y-4">
              <div>
                <span className="font-editorial text-4xl text-[#181918] block">{formatPrice(pricing.call)}</span>
                <span className="text-xs font-mono text-[#706E69] block mt-1">
                  One-time · 30 min
                </span>
              </div>

              <div className="flex items-center justify-center gap-2 text-xs text-[#5C5E5B]">
                <Video className="w-3.5 h-3.5 text-[#244634]" />
                <span>Zoom or Google Meet</span>
              </div>

              <Button
                variant="primary"
                size="md"
                onClick={onBookCall}
                className="w-full justify-center"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                {buttonText}
              </Button>

              <p className="text-[11px] text-[#858783] leading-tight">
                Integrates directly with Calendly
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
