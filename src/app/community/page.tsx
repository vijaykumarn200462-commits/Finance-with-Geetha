'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { CallStructure } from '@/components/home/CallStructure';
import { CheckoutModal } from '@/components/modals/CheckoutModal';
import { COMMUNITY_FEATURES, FAQ_ITEMS } from '@/lib/data';
import { Check, Calendar, Users, Video, Sparkles, ArrowRight } from 'lucide-react';
import { MobileStickyBar } from '@/components/layout/MobileStickyBar';
import {
  useDynamicPricing,
  useSectionContent,
  DEFAULT_COMMUNITY_PAGE_CONTENT,
  DEFAULT_CALL_STRUCTURE_CONTENT,
} from '@/lib/firebase/content';
import { useCurrency } from '@/lib/context/CurrencyContext';

import { CommunityPageContent, CallStructureContent } from '@/types/site-content';

export default function CommunityPage() {
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const pricing = useDynamicPricing();
  const { formatPrice } = useCurrency();

  const { content: commPage } = useSectionContent<CommunityPageContent>(
    'communityPage',
    DEFAULT_COMMUNITY_PAGE_CONTENT
  );
  const { content: callContent } = useSectionContent<CallStructureContent>(
    'callStructure',
    DEFAULT_CALL_STRUCTURE_CONTENT
  );

  const handleCheckout = () => {
    setIsCheckoutOpen(true);
  };

  // Resolve dynamic benefits or fallback to COMMUNITY_FEATURES
  const benefitsList = commPage.benefits?.items
    ? commPage.benefits.items.filter(
        (b: { id?: string; enabled?: boolean; title: string; description: string }) =>
          b.enabled !== false
      )
    : COMMUNITY_FEATURES.map((f) => ({
        id: f.title,
        enabled: true,
        title: f.title,
        description: f.description,
      }));

  // Resolve dynamic FAQ items or fallback
  const faqList = commPage.faq?.items
    ? commPage.faq.items.filter(
        (f: { id?: string; enabled?: boolean; question: string; answer: string }) =>
          f.enabled !== false
      )
    : FAQ_ITEMS.filter((f) => f.category === 'community' || f.category === 'general').map(
        (f, idx: number) => ({
          id: `faq-${idx}`,
          enabled: true,
          question: f.question,
          answer: f.answer,
        })
      );

  return (
    <>
      <Navbar onOpenCommunityCheckout={handleCheckout} />

      <main className="flex-1 pt-32 pb-20 sm:pt-40 sm:pb-28">
        {/* Header Hero */}
        {commPage.hero?.enabled !== false && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-4xl mx-auto mb-16">
            <span className="text-xs font-mono uppercase tracking-widest text-[#244634] font-semibold block mb-3">
              {commPage.hero.eyebrow || 'Weekly Live Mentorship'}
            </span>
            <h1 className="font-editorial text-4xl sm:text-5xl lg:text-6xl text-[#181918] leading-[1.1] font-normal tracking-tight">
              {commPage.hero.title || 'The Community — Where it all happens'}
            </h1>
            <p className="font-editorial text-2xl sm:text-3xl text-[#244634] mt-3 mb-6">
              {commPage.hero.subtitle || 'This is where I do the actual coaching — every week.'}
            </p>
            <p className="text-lg text-[#5C5E5B] max-w-2xl mx-auto leading-relaxed">
              If you only do one thing, do this. The community is the center of everything — the
              calls, the answers, the templates, and direct access to me as you build.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                variant="primary"
                size="lg"
                onClick={handleCheckout}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Join the Community — {formatPrice(pricing.community, 'mo')}
              </Button>
              <span className="text-xs text-[#706E69]">
                Cancel anytime · No long-term contracts
              </span>
            </div>
          </section>
        )}

        {/* Schedule & Live Format Callout */}
        {commPage.schedule?.enabled !== false && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
            <div className="bg-[#FFFFFF] border border-[#E2DBD0] rounded-2xl p-8 sm:p-12 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#EAF0EC] text-[#244634] flex items-center justify-center shrink-0">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-editorial text-xl text-[#181918]">Wednesdays & Fridays</h3>
                  <p className="text-sm font-semibold text-[#244634] mt-0.5">
                    {commPage.schedule.subtitle || '12:00 PM Eastern Time'}
                  </p>
                  <p className="text-xs text-[#5C5E5B] mt-2 leading-relaxed">
                    Two scheduled sessions every single week. Ask your urgent questions before submitting a proposal.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#EAF0EC] text-[#244634] flex items-center justify-center shrink-0">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-editorial text-xl text-[#181918]">Capped Under 10</h3>
                  <p className="text-sm font-semibold text-[#244634] mt-0.5">Real Personal Attention</p>
                  <p className="text-xs text-[#5C5E5B] mt-2 leading-relaxed">
                    {commPage.schedule.details ||
                      "We don't do 150-person Zoom lectures. You talk directly with Geetha and get eyes on your business."}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#EAF0EC] text-[#244634] flex items-center justify-center shrink-0">
                  <Video className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-editorial text-xl text-[#181918]">Searchable Recordings</h3>
                  <p className="text-sm font-semibold text-[#244634] mt-0.5">Indexed Video Vault</p>
                  <p className="text-xs text-[#5C5E5B] mt-2 leading-relaxed">
                    Missed a call? Every session is tagged with topic timestamps so you can quickly find relevant answers.
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Detailed Inside Every Call Component */}
        <CallStructure content={callContent} />

        {/* Full Features Breakdown */}
        {commPage.benefits?.enabled !== false && benefitsList.length > 0 && (
          <section className="py-20 bg-[#F4EFE6]/70 border-y border-[#E8E2D7]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-2xl mx-auto mb-14">
                <span className="text-xs font-mono uppercase tracking-widest text-[#244634] font-semibold block mb-2">
                  Total Access
                </span>
                <h2 className="font-editorial text-3xl sm:text-4xl text-[#181918]">
                  {commPage.benefits.title || 'Everything Included in Your Membership'}
                </h2>
                <p className="text-sm text-[#5C5E5B] mt-2">
                  One flat price. Zero upsells. Instant access to Geetha and the entire operational system.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {benefitsList.map(
                  (
                    feat: { id?: string; enabled?: boolean; title: string; description: string },
                    idx: number
                  ) => (
                  <div
                    key={feat.id || idx}
                    className="bg-[#FFFFFF] border border-[#E2DBD0] rounded-xl p-6 flex flex-col justify-between shadow-xs hover:border-[#244634] transition-colors"
                  >
                    <div>
                      <div className="w-8 h-8 rounded-lg bg-[#EAF0EC] text-[#244634] flex items-center justify-center mb-4">
                        <Check className="w-4 h-4" />
                      </div>
                      <h4 className="font-semibold text-[#181918] text-base leading-snug">
                        {feat.title}
                      </h4>
                      <p className="text-xs text-[#5C5E5B] mt-2 leading-relaxed">
                        {feat.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Template Perk Highlight */}
              <div className="mt-12 bg-[#FFFFFF] border-2 border-[#244634] rounded-2xl p-8 max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
                <div>
                  <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-[#244634] uppercase tracking-wider mb-1">
                    <Sparkles className="w-4 h-4 text-[#9A6B2F]" />
                    All Templates Included Free
                  </span>
                  <h3 className="font-editorial text-2xl text-[#181918]">
                    All Cheat Sheets & Workflows Are Unlocked
                  </h3>
                  <p className="text-xs text-[#5C5E5B] mt-1 leading-relaxed">
                    Never buy templates separately. Members receive instant access to discovery scripts, engagement agreements, and QuickBooks checklists.
                  </p>
                </div>

                <Button
                  variant="primary"
                  size="md"
                  onClick={handleCheckout}
                  className="whitespace-nowrap shrink-0"
                >
                  Join for {formatPrice(pricing.community, 'mo')}
                </Button>
              </div>
            </div>
          </section>
        )}

        {/* Pricing Card Section */}
        {commPage.pricing?.enabled !== false && (
          <section className="py-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-[#FFFFFF] border-2 border-[#244634] rounded-3xl p-8 sm:p-14 text-center shadow-lg">
              <span className="text-xs font-mono uppercase tracking-widest text-[#244634] font-semibold block mb-2">
                {commPage.pricing.title || 'Transparent Membership'}
              </span>
              <h2 className="font-editorial text-4xl sm:text-5xl text-[#181918] font-normal">
                {formatPrice(pricing.community, 'mo')}
              </h2>
              <p className="text-sm text-[#5C5E5B] mt-2 mb-8">
                {commPage.pricing.subtitle || 'Cancel anytime. No contracts. No hidden fees.'}
              </p>

              <div className="max-w-md mx-auto text-left space-y-3 mb-10 text-sm text-[#3A3C39]">
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#244634] shrink-0 mt-0.5" />
                  <span>Twice-weekly live small-group calls (Wed & Fri at noon ET)</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#244634] shrink-0 mt-0.5" />
                  <span>Capped under 10 members per call for real airtime</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#244634] shrink-0 mt-0.5" />
                  <span>Live member chat for questions between sessions</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#244634] shrink-0 mt-0.5" />
                  <span>Direct access to Geetha</span>
                </div>
              </div>

              <Button
                variant="primary"
                size="lg"
                onClick={handleCheckout}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="w-full sm:w-auto shadow-md"
              >
                Join The Community Now — {formatPrice(pricing.community, 'mo')}
              </Button>
            </div>
          </section>
        )}

        {/* FAQ Section */}
        {commPage.faq?.enabled !== false && faqList.length > 0 && (
          <section className="py-20 bg-[#FAF7F2] border-t border-[#E8E2D7]">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <span className="text-xs font-mono uppercase tracking-widest text-[#244634] font-semibold block mb-2">
                  Frequently Asked Questions
                </span>
                <h2 className="font-editorial text-3xl sm:text-4xl text-[#181918]">
                  Everything you need to know
                </h2>
              </div>

              <div className="space-y-4">
                {faqList.map(
                  (
                    faq: { id?: string; enabled?: boolean; question: string; answer: string },
                    idx: number
                  ) => (
                  <div
                    key={faq.id || idx}
                    className="p-6 rounded-2xl bg-[#FFFFFF] border border-[#E2DBD0] shadow-2xs"
                  >
                    <h3 className="font-editorial text-xl text-[#181918] mb-2 font-normal">
                      {faq.question}
                    </h3>
                    <p className="text-sm text-[#5C5E5B] leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Final CTA */}
        {commPage.cta?.enabled !== false && (
          <section className="py-20 bg-[#181918] text-[#FAF7F2] text-center">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
              <h2 className="font-editorial text-3xl sm:text-4xl lg:text-5xl text-[#FAF7F2]">
                {commPage.cta.title || 'Ready to build a calm, profitable firm?'}
              </h2>
              <p className="text-sm sm:text-base text-[#D0C9BD] max-w-xl mx-auto">
                {commPage.cta.subtitle ||
                  'Join today and get instant access to Wednesday & Friday live calls and all templates.'}
              </p>
              <div className="pt-2">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleCheckout}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  {commPage.cta.buttonText ||
                    `Join the Community — ${formatPrice(pricing.community, 'mo')}`}
                </Button>
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />

      <MobileStickyBar onJoinClick={handleCheckout} />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        productId="community"
      />
    </>
  );
}
