'use client';

import React from 'react';
import Link from 'next/link';
import { Check, Calendar } from 'lucide-react';
import { HeroContent } from '@/types/site-content';

interface HeroProps {
  onJoinCommunity?: () => void;
  onGetBook?: () => void;
  content?: HeroContent;
}

export function Hero({ content }: HeroProps) {
  if (content && content.enabled === false) {
    return null;
  }

  const eyebrow = content?.eyebrow || 'Professional Accounting & Bookkeeping';
  const headline = content?.headline || 'Take Control of Your Business Finances';
  const supportingCopy =
    content?.supportingCopy ||
    'Accurate, reliable, and stress-free bookkeeping services tailored for businesses. Let Geetha N. manage your books so you can focus on growing your business.';

  return (
    <section id="hero" className="relative bg-gradient-to-br from-slate-900 via-[#0f2c59] to-slate-800 text-white pt-32 pb-20 sm:pt-40 sm:pb-28 overflow-hidden">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Headlines & Call to Actions */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <span className="inline-block bg-[#138354]/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold px-3.5 py-1.5 rounded-full uppercase tracking-wider">
              {eyebrow}
            </span>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold leading-tight tracking-tight text-white">
              {headline}
            </h1>

            <p className="text-lg text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
              {supportingCopy}
            </p>

            <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4 pt-4">
              <Link
                href="/#contact"
                className="bg-[#138354] text-white font-semibold px-8 py-3.5 rounded-xl shadow-lg hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                <span>Schedule Consultation</span>
              </Link>
              <Link
                href="/#services"
                className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-semibold px-8 py-3.5 rounded-xl transition-colors flex items-center justify-center"
              >
                View Services
              </Link>
            </div>

            <div className="pt-4 flex items-center justify-center lg:justify-start space-x-6 text-sm text-slate-300">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#138354]" />
                <span>100% Confidential</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#138354]" />
                <span>Tailored Solutions</span>
              </div>
            </div>
          </div>

          {/* Right Column: Profile Card with Geetha N. Portrait */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-sm">
              <div className="absolute -inset-1.5 bg-gradient-to-r from-[#138354] to-amber-500 rounded-3xl blur opacity-30" />
              <div className="relative bg-white p-6 sm:p-8 rounded-3xl shadow-2xl text-slate-800 text-center border border-slate-100">
                <div className="w-36 h-36 mx-auto rounded-2xl overflow-hidden shadow-md mb-4 border-2 border-[#0f2c59] bg-slate-100">
                  <img
                    src="https://lh3.googleusercontent.com/gg/AJWXcNc5cFZUdc92Hgns-UUZuRCxQf45gOAiCPRspBVSwOxCVcfEYcsdaPP7rAveA9hbc3jpIfNmlut7sA62tE4LRqKaRzVheSAEiH8dWJOP_EW3N53PIJlvf5SKh6bWKlM607xVHSN9jjV6zjlQrp2tK06iHMWw9HeRSqoYikRWMrWH5zEVpZKtrpaSies_kLBWxmfTic87YfLyTYPi3HoqfknTjTwYRLKROmWzhWy_4ZZazdjKWt4jxTPm_q58n0vPkrEXTE6IJYTJKEkmFcqoApcdvQk0UBSaxk8=s0"
                    alt="Geetha N."
                    className="w-full h-full object-cover"
                  />
                </div>

                <h3 className="text-xl font-bold font-serif text-[#0f2c59]">
                  Geetha N.
                </h3>
                <p className="text-sm text-[#138354] font-semibold mt-0.5">
                  Independent Bookkeeper & Accountant
                </p>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Dedicated financial partner helping you maintain clean books and clear financial insights.
                </p>

                <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col items-center gap-2 text-xs text-slate-600">
                  <a
                    href="tel:9538913912"
                    className="font-bold text-[#0f2c59] hover:underline flex items-center gap-1.5"
                  >
                    <span>📞</span>
                    <span>9538913912</span>
                  </a>
                  <a
                    href="mailto:Cageethanofficail@gmail.com"
                    className="text-xs text-slate-500 hover:text-[#0f2c59]"
                  >
                    Cageethanofficail@gmail.com
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
