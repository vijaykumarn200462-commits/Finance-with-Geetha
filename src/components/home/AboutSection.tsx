import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { AboutContent } from '@/types/site-content';

interface AboutSectionProps {
  content?: AboutContent;
}

export function AboutSection({ content }: AboutSectionProps) {
  if (content && content.enabled === false) {
    return null;
  }

  const eyebrow = content?.eyebrow || 'The Story';
  const title = content?.title || "Hi, I'm Geetha.";
  const paragraphs = content?.paragraphs || [
    'I started Finance with Geetha to build a sustainable, calm bookkeeping and finance practice. Five years later it runs around 60 clients and ₹25L+ a year — in about 30 hours a week.',
    'I built this practice to fit around real life, family, and financial peace, not run it.',
    'Having autonomy taught me a clear lesson: we need real systems, solid pricing, and calm workflows that protect our energy while delivering exceptional value to clients.',
  ];
  const faithTitle = content?.faithTitle || 'Faith first.';
  const familyTitle = content?.familyTitle || 'Family second.';
  const businessTitle = content?.businessTitle || 'Business third.';

  return (
    <section id="about" className="py-20 sm:py-28 bg-[#FFFFFF] border-y border-[#E8E2D7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Portrait & Personal Identity Badge */}
          <div className="lg:col-span-5">
            <div className="relative mx-auto max-w-md">
              {/* Decorative Frame */}
              <div className="relative rounded-2xl bg-[#FAF7F2] border border-[#E2DBD0] p-6 sm:p-8 shadow-sm space-y-6">
                <div className="aspect-square w-full rounded-xl bg-gradient-to-br from-[#1E3B2C] to-[#12231A] text-[#FAF7F2] flex flex-col items-center justify-center p-8 text-center relative overflow-hidden border border-[#2F4D3C]">
                  {/* Subtle grain/ambient overlay */}
                  <div className="absolute inset-0 bg-[radial-gradient(#FAF7F2_1px,transparent_1px)] [background-size:16px_16px] opacity-10" />

                  <div className="w-24 h-24 rounded-full bg-[#FAF7F2]/10 border-2 border-[#84A98C] flex items-center justify-center text-3xl font-editorial font-bold text-[#FAF7F2] mb-4 shadow-inner">
                    G
                  </div>

                  <p className="font-editorial text-2xl text-[#FAF7F2] font-normal">
                    Geetha
                  </p>
                  <p className="text-xs uppercase font-mono tracking-widest text-[#A5C8AF] mt-1">
                    Finance Coach & Mentor
                  </p>
                  <div className="w-10 h-0.5 bg-[#C9A96E] my-3" />
                  <p className="text-xs text-[#D8E4DC] max-w-[220px] leading-relaxed">
                    Founder of Finance with Geetha
                  </p>
                </div>

                {/* Values Priority Block */}
                <div className="space-y-3 pt-2">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#706E69] block text-center">
                    Operating Priority Hierarchy
                  </span>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2.5 rounded-lg bg-[#FFFFFF] border border-[#E8E2D7]">
                      <span className="text-xs font-mono font-bold text-[#244634] block">1st</span>
                      <span className="text-xs font-semibold text-[#181918]">Faith</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#FFFFFF] border border-[#E8E2D7]">
                      <span className="text-xs font-mono font-bold text-[#244634] block">2nd</span>
                      <span className="text-xs font-semibold text-[#181918]">Family</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#FFFFFF] border border-[#E8E2D7]">
                      <span className="text-xs font-mono font-bold text-[#244634] block">3rd</span>
                      <span className="text-xs font-semibold text-[#181918]">Business</span>
                    </div>
                  </div>
                </div>

                <div className="text-center text-xs text-[#5C5E5B] border-t border-[#EFECE6] pt-4">
                  Finance with Geetha · Calm, Profitable Practices
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Authentic Story Copy */}
          <div className="lg:col-span-7 space-y-6">
            <span className="text-xs font-mono uppercase tracking-widest text-[#244634] font-semibold">
              {eyebrow}
            </span>

            <h2 className="font-editorial text-4xl sm:text-5xl text-[#181918] font-normal tracking-tight">
              {title}
            </h2>

            <div className="space-y-4 text-base sm:text-lg text-[#3A3C39] leading-relaxed font-sans">
              {paragraphs.map((p, idx) => (
                <p key={idx}>{p}</p>
              ))}
            </div>

            {/* Visual Priority Callout */}
            <div className="my-6 p-6 rounded-xl bg-[#FAF7F2] border border-[#E2DBD0] space-y-3">
              <p className="text-xs font-mono uppercase tracking-widest text-[#706E69] font-bold">
                My North Star:
              </p>
              <div className="space-y-2">
                <p className="font-editorial text-2xl text-[#181918] flex items-center gap-2">
                  <span className="text-[#244634] font-serif font-bold">•</span>
                  {faithTitle}
                </p>
                <p className="font-editorial text-2xl text-[#181918] flex items-center gap-2">
                  <span className="text-[#244634] font-serif font-bold">•</span>
                  {familyTitle}
                </p>
                <p className="font-editorial text-2xl text-[#181918] flex items-center gap-2">
                  <span className="text-[#244634] font-serif font-bold">•</span>
                  {businessTitle}
                </p>
              </div>
            </div>

            <p className="text-base sm:text-lg text-[#3A3C39] leading-relaxed">
              Now I help other bookkeepers build the same thing: a calm, profitable business, one
              client at a time.
            </p>

            <div className="pt-2">
              <p className="font-editorial text-2xl text-[#244634] italic font-normal">
                — Geetha
              </p>
            </div>

            <div className="pt-4">
              <Link
                href="/about"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#244634] hover:text-[#1B3527] underline underline-offset-4"
              >
                <span>Read more about my background and firm philosophies</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
