'use client';

import React from 'react';
import { Check, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { Button } from '../ui/Button';
import { SectionHeading } from '../ui/SectionHeading';
import { COMMUNITY_FEATURES } from '@/lib/data';
import { useDynamicPricing } from '@/lib/firebase/content';
import { useCurrency } from '@/lib/context/CurrencyContext';

import { CommunityContent } from '@/types/site-content';

interface CommunitySectionProps {
  onJoinClick: () => void;
  content?: CommunityContent;
}

export function CommunitySection({ onJoinClick, content }: CommunitySectionProps) {
  const pricing = useDynamicPricing();
  const { formatPrice } = useCurrency();

  if (content && content.enabled === false) {
    return null;
  }

  const eyebrow = content?.eyebrow || 'The Primary Hub';
  const title = content?.title || 'The Community — Where it all happens';
  const subtitle = content?.subtitle || 'This is where I do the actual coaching — every week.';
  const description =
    content?.description ||
    'If you only do one thing, do this. The community is the center of everything — the calls, the answers, the templates, and direct access to me as you build.';

  return (
    <section id="community" className="py-20 sm:py-28 bg-[#181918] text-[#FAF7F2] relative overflow-hidden">
      {/* Subtle organic light accent */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#244634]/30 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <SectionHeading
          isLight
          eyebrow={eyebrow}
          title={title}
          description={description}
        />

        <p className="text-center font-editorial text-xl sm:text-2xl text-[#84A98C] mt-2 mb-14">
          {subtitle}
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          {/* Features Column (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <h3 className="text-sm font-mono uppercase tracking-widest text-[#A8A8A2] font-semibold">
              Everything included inside membership:
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {COMMUNITY_FEATURES.map((feature, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-[#222421] border border-[#31332F] hover:border-[#84A98C]/40 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-md bg-[#244634] text-[#84A98C] flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-[#FAF7F2] leading-snug">
                        {feature.title}
                      </h4>
                      <p className="mt-1 text-xs text-[#A8A8A2] leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Included Templates Callout */}
            <div className="p-5 rounded-xl bg-[#244634]/30 border border-[#3A5C47] text-xs text-[#D0C9BD] space-y-2">
              <span className="font-mono text-xs uppercase tracking-wider text-[#84A98C] font-semibold block">
                Bonus: Free access to the entire template library
              </span>
              <p className="text-sm text-[#FAF7F2]">
                Contracts, workflows, billing forms, and cheat sheets — everything sold in our store is 100% unlocked for community members at zero extra charge.
              </p>
            </div>
          </div>

          {/* Pricing Card Column (5 cols) */}
          <div className="lg:col-span-5">
            <div className="sticky top-28 bg-[#FFFFFF] text-[#181918] rounded-2xl border-2 border-[#84A98C] p-8 sm:p-10 shadow-2xl relative">
              {/* Badge */}
              <div className="absolute -top-3.5 right-8 bg-[#244634] text-[#FAF7F2] text-xs font-mono font-semibold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#C9A96E]" />
                Primary Community Tier
              </div>

              <div>
                <span className="text-xs font-mono uppercase tracking-widest text-[#244634] font-semibold">
                  Monthly Membership
                </span>
                <h3 className="font-editorial text-3xl font-normal text-[#181918] mt-1">
                  The Full Community
                </h3>
                <p className="text-sm text-[#5C5E5B] mt-2 leading-relaxed">
                  Direct weekly access to Geetha, live coaching hot-seats, and the peer group of real working bookkeepers.
                </p>
              </div>

              {/* Price */}
              <div className="my-8 py-6 border-y border-[#E8E2D7]">
                <div className="flex items-baseline gap-2">
                  <span className="font-editorial text-5xl sm:text-6xl text-[#181918] font-normal tracking-tight">
                    {formatPrice(pricing.community)}
                  </span>
                  <span className="text-base text-[#5C5E5B] font-medium">/ month</span>
                </div>
                <p className="text-xs text-[#244634] font-medium mt-2 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#244634]" />
                  Cancel anytime. No contracts. No lock-in.
                </p>
              </div>

              {/* Bullet highlights */}
              <ul className="space-y-3 mb-8 text-sm text-[#3A3C39]">
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-[#244634] shrink-0 mt-0.5" />
                  <span>2 live calls/week (Wed & Fri at noon ET)</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-[#244634] shrink-0 mt-0.5" />
                  <span>Capped under 10 people per call</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-[#244634] shrink-0 mt-0.5" />
                  <span>Every template & cheat sheet included ({formatPrice(115)}+ value)</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-[#244634] shrink-0 mt-0.5" />
                  <span>Member chat + QuickBooks video walkthroughs</span>
                </li>
              </ul>

              {/* CTA Button */}
              <Button
                variant="primary"
                size="lg"
                onClick={onJoinClick}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="w-full justify-center shadow-md text-base"
              >
                Join the Community
              </Button>

              <div className="mt-4 text-center">
                <span className="text-xs text-[#706E69]">
                  Instant access to member portal upon signup.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
