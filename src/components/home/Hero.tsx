'use client';

import React from 'react';
import { ArrowRight, BookOpen, Check, ShieldCheck, Users, Calendar } from 'lucide-react';
import { Button } from '../ui/Button';
import { useDynamicPricing } from '@/lib/firebase/content';
import { useCurrency } from '@/lib/context/CurrencyContext';

import { HeroContent } from '@/types/site-content';

interface HeroProps {
  onJoinCommunity: () => void;
  onGetBook: () => void;
  content?: HeroContent;
}

export function Hero({ onJoinCommunity, onGetBook, content }: HeroProps) {
  const pricing = useDynamicPricing();
  const { formatPrice } = useCurrency();

  const eyebrow = content?.eyebrow || 'Bookkeeping Coaching';
  const headline = content?.headline || 'Learn how to actually build a bookkeeping business.';
  const supportingCopy =
    content?.supportingCopy ||
    'Pricing. Discovery calls. Onboarding. The real work in QuickBooks. How to talk to clients — and even how to build your website.';
  const credibilityQuote =
    content?.credibilityQuote ||
    "I've run my own firm for five years. Now I teach other bookkeepers exactly how I did it.";
  const credibilityAuthor =
    content?.credibilityAuthor || 'Geetha, Founder of Finance with Geetha';
  const primaryButtonText = content?.primaryButtonText || 'Join the Community';
  const secondaryButtonText =
    content?.secondaryButtonText && !content.secondaryButtonText.includes('₹')
      ? content.secondaryButtonText
      : `Start with the Book — ${formatPrice(pricing.book)}`;

  return (
    <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 overflow-hidden">
      {/* Subtle background atmosphere */}
      <div className="absolute inset-0 bg-radial from-[#F5EFE4]/80 via-transparent to-transparent pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Editorial Headline & Copy */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EAF0EC] border border-[#C5D8CC] text-[#244634] text-xs font-semibold tracking-wider uppercase font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-[#244634]" />
              {eyebrow}
            </div>

            <h1 className="font-editorial text-4xl sm:text-5xl lg:text-6xl text-[#181918] leading-[1.08] font-normal tracking-tight">
              {headline}
            </h1>

            <p className="text-lg sm:text-xl text-[#3A3C39] leading-relaxed max-w-2xl font-normal">
              {supportingCopy}
            </p>

            <div className="p-4 rounded-xl bg-[#F4EFE6] border border-[#E6DFD3] text-sm text-[#484A46] leading-relaxed max-w-xl">
              <p className="font-medium text-[#181918]">
                &ldquo;{credibilityQuote}&rdquo;
              </p>
              <p className="text-xs text-[#706E69] mt-1">— {credibilityAuthor}</p>
            </div>

            {/* CTAs */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
              <Button
                variant="primary"
                size="lg"
                onClick={onJoinCommunity}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="w-full sm:w-auto shadow-sm"
              >
                {primaryButtonText}
              </Button>

              <Button
                variant="secondary"
                size="lg"
                onClick={onGetBook}
                leftIcon={<BookOpen className="w-4 h-4 text-[#244634]" />}
                className="w-full sm:w-auto"
              >
                {secondaryButtonText}
              </Button>
            </div>

            {/* Trust points */}
            <div className="pt-4 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-[#5C5E5B]">
              <div className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-[#244634]" />
                <span>{formatPrice(pricing.community, 'mo')} · Cancel anytime</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#244634]" />
                <span>Calls capped under 10 people</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#244634]" />
                <span>No hype · Real operations</span>
              </div>
            </div>
          </div>

          {/* Right Column: Editorial Credibility & Operations Panel */}
          <div className="lg:col-span-5">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Outer decorative border */}
              <div className="relative rounded-2xl bg-[#FFFFFF] border border-[#E2DBD0] shadow-xl p-6 sm:p-8 space-y-6">
                {/* Header card badge */}
                <div className="flex items-center justify-between pb-4 border-b border-[#EFECE6]">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-[#181918] text-[#FAF7F2] font-editorial text-xl flex items-center justify-center font-bold">
                      G
                    </div>
                    <div>
                      <h3 className="font-editorial text-lg text-[#181918]">Geetha</h3>
                      <p className="text-xs text-[#5C5E5B]">Finance with Geetha</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono font-medium px-2.5 py-1 rounded bg-[#EAF0EC] text-[#244634] border border-[#C5D8CC]">
                    Active Firm
                  </span>
                </div>

                {/* Core Live Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-lg bg-[#FAF7F2] border border-[#EAE4D9]">
                    <span className="text-[11px] uppercase tracking-wider text-[#706E69] block font-mono">
                      Current Firm
                    </span>
                    <span className="font-editorial text-2xl font-normal text-[#181918]">
                      ~60 Clients
                    </span>
                    <span className="text-[11px] text-[#5C5E5B] block mt-0.5">Recurring monthly</span>
                  </div>

                  <div className="p-3.5 rounded-lg bg-[#FAF7F2] border border-[#EAE4D9]">
                    <span className="text-[11px] uppercase tracking-wider text-[#706E69] block font-mono">
                      Gross Revenue
                    </span>
                    <span className="font-editorial text-2xl font-normal text-[#181918]">
                      ₹25L+ / yr
                    </span>
                    <span className="text-[11px] text-[#5C5E5B] block mt-0.5">Predictable retainers</span>
                  </div>

                  <div className="p-3.5 rounded-lg bg-[#FAF7F2] border border-[#EAE4D9]">
                    <span className="text-[11px] uppercase tracking-wider text-[#706E69] block font-mono">
                      Weekly Work
                    </span>
                    <span className="font-editorial text-2xl font-normal text-[#181918]">
                      30–35 hrs
                    </span>
                    <span className="text-[11px] text-[#5C5E5B] block mt-0.5">Calm, sustainable</span>
                  </div>

                  <div className="p-3.5 rounded-lg bg-[#FAF7F2] border border-[#EAE4D9]">
                    <span className="text-[11px] uppercase tracking-wider text-[#706E69] block font-mono">
                      Experience
                    </span>
                    <span className="font-editorial text-2xl font-normal text-[#181918]">
                      5 Years
                    </span>
                    <span className="text-[11px] text-[#5C5E5B] block mt-0.5">Built from scratch</span>
                  </div>
                </div>

                {/* Upcoming Live Call Badge */}
                <div className="p-3.5 rounded-lg bg-[#FAF7F2] border border-[#E2DBD0] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Calendar className="w-4 h-4 text-[#244634]" />
                    <div>
                      <p className="text-xs font-semibold text-[#181918]">
                        Community Live Calls
                      </p>
                      <p className="text-[11px] text-[#5C5E5B]">
                        Wednesdays & Fridays at 12:00 PM ET
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[#FAF7F2] text-[#244634] font-bold border border-[#C5D8CC]">
                    Live
                  </span>
                </div>

                {/* Family & Life Principle Bar */}
                <div className="pt-2 border-t border-[#EFECE6] text-center">
                  <p className="font-mono text-xs text-[#706E69] tracking-wider uppercase">
                    Faith first · Family second · Business third
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
