import React from 'react';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, Clock, Handshake, CheckCircle2 } from 'lucide-react';
import { AboutContent } from '@/types/site-content';

interface AboutSectionProps {
  content?: AboutContent;
  id?: string;
}

function getCardIcon(title: string, index: number) {
  const normalized = (title || '').toLowerCase();
  if (
    normalized.includes('accura') ||
    normalized.includes('precision') ||
    normalized.includes('shield')
  ) {
    return ShieldCheck;
  }
  if (
    normalized.includes('time') ||
    normalized.includes('energy') ||
    normalized.includes('clock') ||
    normalized.includes('save')
  ) {
    return Clock;
  }
  if (
    normalized.includes('person') ||
    normalized.includes('approach') ||
    normalized.includes('tailor') ||
    normalized.includes('partner') ||
    normalized.includes('handshake')
  ) {
    return Handshake;
  }
  if (index === 0) return ShieldCheck;
  if (index === 1) return Clock;
  if (index === 2) return Handshake;
  return CheckCircle2;
}

export function AboutSection({ content, id = 'about' }: AboutSectionProps) {
  if (content && content.enabled === false) {
    return null;
  }

  const eyebrow = content?.eyebrow || 'ABOUT GEETHA N.';
  const title = content?.title || 'Your Trusted Financial Partner';
  const descriptionText =
    content?.description ||
    content?.subtitle ||
    (content?.paragraphs && content.paragraphs.length > 0 ? content.paragraphs[0] : null) ||
    'Running a business is demanding enough without the added stress of messy receipts, untracked expenses, and end-of-year tax scrambles. As an experienced bookkeeping and accounting professional, I provide meticulous record-keeping, accurate reconciliations, and clear financial reporting designed to give you absolute peace of mind.';

  // Resolve feature cards from CMS content (cards or stats array) with fallback to default 3 cards
  const rawCards =
    content?.cards && content.cards.length > 0
      ? content.cards
      : content?.stats && content.stats.length > 0
      ? content.stats.map((s, idx) => ({
          id: s.id || `card-${idx + 1}`,
          enabled: s.enabled !== false,
          title: s.label || s.value || '',
          description: s.detail || '',
        }))
      : null;

  const cards = rawCards && rawCards.length > 0
    ? rawCards.filter((c) => c.enabled !== false)
    : [
        {
          id: 'card-1',
          title: 'Absolute Accuracy',
          description:
            'Every entry, ledger, and reconciliation is handled with precision to eliminate discrepancies and errors.',
        },
        {
          id: 'card-2',
          title: 'Save Time & Energy',
          description:
            'Delegate tedious paperwork and financial tracking so you can focus entirely on core business operations.',
        },
        {
          id: 'card-3',
          title: 'Personalized Approach',
          description:
            'Tailored financial packages and customized reporting that fit your unique business requirements.',
        },
      ];

  const gridColsClass =
    cards.length === 3
      ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
      : cards.length === 2
      ? 'grid-cols-1 md:grid-cols-2'
      : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4';

  return (
    <section
      id={id}
      className="py-16 sm:py-24 border-y border-[#E8E2D7] bg-[#F4EFE6]/70 scroll-mt-24 sm:scroll-mt-28"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading & Intro */}
        <div className="max-w-3xl mx-auto text-center mb-12 sm:mb-16">
          <span className="inline-block bg-emerald-50 text-[#138354] border border-emerald-100 uppercase tracking-widest font-mono text-xs px-3.5 py-1.5 rounded-full font-semibold">
            {eyebrow}
          </span>
          <h2 className="font-serif font-bold text-3xl sm:text-4xl lg:text-5xl text-[#0f2c59] mt-3.5 tracking-tight">
            {title}
          </h2>
          <div className="w-20 h-1 bg-[#138354] mx-auto rounded-full my-3.5" />
          <p className="text-slate-600 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto font-normal mt-4">
            {descriptionText}
          </p>
        </div>

        {/* Responsive Grid with Even Widths, Equal Heights & Consistent Gaps */}
        <div className={`grid ${gridColsClass} gap-6 sm:gap-8 max-w-6xl mx-auto items-stretch`}>
          {cards.map((item, idx) => {
            const Icon = getCardIcon(item.title, idx);
            const isThirdCardInThree = cards.length === 3 && idx === 2;

            return (
              <div
                key={item.id || idx}
                className={`bg-white border border-[#E2DBD0] rounded-2xl p-6 sm:p-8 text-center flex flex-col justify-between shadow-xs hover:shadow-md hover:border-[#138354]/40 transition-all duration-300 group hover:-translate-y-0.5 h-full ${
                  isThirdCardInThree
                    ? 'md:col-span-2 lg:col-span-1 md:max-w-md md:mx-auto md:w-full lg:max-w-none'
                    : ''
                }`}
              >
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    {/* Icon Container */}
                    <div className="w-14 h-14 rounded-2xl bg-[#EAF0EC] text-[#138354] flex items-center justify-center mx-auto mb-6 group-hover:bg-[#138354] group-hover:text-white transition-colors duration-200">
                      <Icon className="w-7 h-7" />
                    </div>

                    {/* Card Heading */}
                    <h3 className="font-serif font-bold text-xl sm:text-2xl text-[#0f2c59] tracking-tight mb-3">
                      {item.title}
                    </h3>

                    {/* Subtle Card Divider */}
                    <div className="w-12 h-0.5 bg-[#E8E2D7] mx-auto my-3.5 group-hover:bg-[#138354]/50 transition-colors" />
                  </div>

                  {/* Card Description */}
                  <p className="text-sm text-[#5C5E5B] leading-relaxed pt-1">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Link to Dedicated About Page */}
        <div className="text-center pt-10 sm:pt-12">
          <Link
            href="/about"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#0f2c59] hover:text-[#138354] underline underline-offset-4 transition-colors"
          >
            <span>Read more about my background, philosophy, and firm history</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

