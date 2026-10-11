'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { CheckoutModal } from '@/components/modals/CheckoutModal';
import { ArrowRight } from 'lucide-react';
import { MobileStickyBar } from '@/components/layout/MobileStickyBar';
import {
  useSectionContent,
  DEFAULT_ABOUT_PAGE_CONTENT,
} from '@/lib/firebase/content';

export default function AboutPage() {
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const { content: aboutData } = useSectionContent(
    'aboutPage',
    DEFAULT_ABOUT_PAGE_CONTENT
  );

  const hero = aboutData.hero || DEFAULT_ABOUT_PAGE_CONTENT.hero;
  const story = aboutData.story || DEFAULT_ABOUT_PAGE_CONTENT.story;
  const values = aboutData.values || DEFAULT_ABOUT_PAGE_CONTENT.values;
  const cta = aboutData.cta || DEFAULT_ABOUT_PAGE_CONTENT.cta;

  const activeValues = values.items ? values.items.filter((v) => v.enabled !== false) : [];

  return (
    <>
      <Navbar onOpenCommunityCheckout={() => setIsCheckoutOpen(true)} />

      <main className="flex-1 pt-32 pb-20 sm:pt-40 sm:pb-28">
        {/* Header Hero */}
        {hero.enabled !== false && (
          <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-16 text-center">
            <span className="text-xs font-mono uppercase tracking-widest text-[#244634] font-semibold block mb-3">
              {hero.eyebrow || 'Founder & Working Professional'}
            </span>
            <h1 className="font-editorial text-4xl sm:text-5xl lg:text-6xl text-[#181918] leading-[1.1] font-normal tracking-tight">
              {hero.title || "Hi, I'm Geetha."}
            </h1>
            <p className="font-editorial text-2xl sm:text-3xl text-[#244634] mt-3 mb-6">
              {hero.subtitle || 'Firm owner, mentor, and coach.'}
            </p>
          </section>
        )}

        {/* Narrative & Principles */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Main Portrait & Story Block */}
          {story.enabled !== false && (
            <div className="bg-[#FFFFFF] border border-[#E2DBD0] rounded-2xl p-8 sm:p-12 shadow-sm space-y-8">
              <div className="flex flex-col sm:flex-row items-center gap-6 pb-8 border-b border-[#F0EBE1]">
                <div className="w-24 h-24 rounded-full bg-[#181918] text-[#FAF7F2] font-editorial text-3xl font-bold flex items-center justify-center shrink-0 border-2 border-[#84A98C]">
                  G
                </div>
                <div className="text-center sm:text-left">
                  <h2 className="font-editorial text-2xl text-[#181918]">Geetha</h2>
                  <p className="text-sm text-[#244634] font-medium">Founder of Finance with Geetha</p>
                  <p className="text-xs text-[#5C5E5B] mt-1">Dedicated to building calm, profitable financial practices</p>
                </div>
              </div>

              <div className="space-y-5 text-base sm:text-lg text-[#3A3C39] leading-relaxed font-sans">
                {story.paragraphs.map((p: string, idx: number) => (
                  <p key={idx}>{p}</p>
                ))}
              </div>

              {/* Operating Priority Hierarchy */}
              {values.enabled !== false && activeValues.length > 0 && (
                <div className="p-8 rounded-xl bg-[#FAF7F2] border border-[#E2DBD0] space-y-4">
                  <p className="text-xs font-mono uppercase tracking-widest text-[#706E69] font-bold text-center sm:text-left">
                    {values.title || 'How I Make Every Decision in Life & Business:'}
                  </p>

                  <div className="space-y-3">
                    {activeValues.map(
                      (
                        val: { id?: string; enabled?: boolean; title: string; description: string },
                        idx: number
                      ) => (
                      <div key={val.id || idx} className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full bg-[#EAF0EC] text-[#244634] flex items-center justify-center font-mono text-xs font-bold shrink-0">
                          {idx < 9 ? `0${idx + 1}` : idx + 1}
                        </span>
                        <div>
                          <h3 className="font-editorial text-2xl text-[#181918]">{val.title}</h3>
                          <p className="text-xs text-[#5C5E5B]">{val.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Bottom Community CTA Card */}
          {cta.enabled !== false && (
            <div className="bg-[#181918] text-[#FAF7F2] rounded-2xl p-8 sm:p-12 text-center space-y-6">
              <h2 className="font-editorial text-3xl sm:text-4xl text-[#FAF7F2]">
                {cta.title || 'Ready to build a calm, profitable firm?'}
              </h2>
              <p className="text-sm text-[#D0C9BD] max-w-xl mx-auto">
                {cta.subtitle ||
                  'The exact roadmap, Discovery scripts, QuickBooks workflows, and weekly live coaching.'}
              </p>
              <div>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => setIsCheckoutOpen(true)}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  {cta.buttonText || 'Join The Community'}
                </Button>
              </div>
            </div>
          )}
        </section>
      </main>

      <Footer />
      <MobileStickyBar onJoinClick={() => setIsCheckoutOpen(true)} />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        productId="community"
      />
    </>
  );
}
