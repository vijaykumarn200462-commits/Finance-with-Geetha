import React from 'react';
import Link from 'next/link';
import { Check, Phone, ArrowRight } from 'lucide-react';
import { WhyUsContent } from '@/types/site-content';

interface WhyUsSectionProps {
  content?: WhyUsContent;
  enabled?: boolean;
}

const DEFAULT_REASONS = [
  {
    title: 'Transparent Pricing',
    description: 'Affordable packages designed to fit your business size without hidden fees.',
  },
  {
    title: '100% Data Confidentiality',
    description: 'Strict security measures and professional ethics protecting your sensitive financial records.',
  },
  {
    title: 'Responsive & Approachable',
    description: 'Direct communication with Geetha N. whenever you have questions about your accounts.',
  },
];

export function WhyUsSection({ content, enabled = true }: WhyUsSectionProps) {
  if (enabled === false || (content && content.enabled === false)) {
    return null;
  }

  const eyebrow = content?.eyebrow || 'Why Partner With Us';
  const title = content?.title || 'Excellence in Bookkeeping, Dedicated to Your Success';
  const description =
    content?.description ||
    'With Finance with Geetha, you get more than just numbers on a spreadsheet. You gain a dedicated professional committed to keeping your financial foundation solid so you can focus on scaling your enterprise.';
  const reasons = content?.reasons && content.reasons.length > 0 ? content.reasons : DEFAULT_REASONS;
  const ctaTitle = content?.ctaTitle || 'Ready to Clean Up Your Books?';
  const ctaPhone = content?.ctaPhone || '9538913912';

  return (
    <section id="why-us" className="py-20 bg-[#0f2c59] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Column: Why Partner With Us */}
          <div className="space-y-6">
            <span className="text-emerald-400 font-semibold text-xs uppercase tracking-widest bg-white/10 px-3.5 py-1.5 rounded-full inline-block border border-white/10">
              {eyebrow}
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold leading-tight">
              {title}
            </h2>
            <p className="text-slate-300 leading-relaxed">
              {description}
            </p>
            <div className="space-y-5 pt-2">
              {reasons.map((reason, idx) => (
                <div key={idx} className="flex items-start space-x-4">
                  <div className="w-8 h-8 rounded-full bg-[#138354] text-white flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
                    <Check className="w-4 h-4 text-white stroke-[2.5]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-white font-serif">{reason.title}</h3>
                    <p className="text-sm text-slate-300 leading-relaxed mt-0.5">{reason.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: CTA Box */}
          <div className="bg-white/10 backdrop-blur-md p-8 sm:p-10 rounded-3xl border border-white/20 text-center shadow-2xl">
            <h3 className="text-2xl sm:text-3xl font-serif font-bold mb-3 text-white">
              {ctaTitle}
            </h3>
            <p className="text-slate-300 mb-8 text-sm sm:text-base leading-relaxed max-w-md mx-auto">
              Take the first step toward hassle-free accounting. Contact today for an initial consultation.
            </p>
            <div className="space-y-3.5 max-w-sm mx-auto">
              <a
                href={`tel:${ctaPhone.replace(/\D/g, '')}`}
                className="w-full bg-[#138354] hover:bg-emerald-600 text-white font-bold py-3.5 px-6 rounded-xl transition shadow-lg flex items-center justify-center gap-2.5"
              >
                <Phone className="w-4 h-4" />
                <span>Call Now: {ctaPhone}</span>
              </a>
              <Link
                href="/#contact"
                className="w-full bg-white/15 hover:bg-white/25 text-white font-semibold py-3.5 px-6 rounded-xl transition border border-white/20 flex items-center justify-center gap-2"
              >
                <span>Send Online Inquiry</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
