import React from 'react';
import { ShieldCheck, Clock, Handshake, CheckCircle2 } from 'lucide-react';
import { BUSINESS_STATS } from '@/lib/data';
import { StatsContent } from '@/types/site-content';

interface StatsProps {
  content?: StatsContent;
  id?: string;
}

function getCardIcon(label: string, index: number) {
  const normalized = label.toLowerCase();
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
  // Default fallbacks based on index
  if (index === 0) return ShieldCheck;
  if (index === 1) return Clock;
  if (index === 2) return Handshake;
  return CheckCircle2;
}

export function Stats({ content, id = 'about' }: StatsProps) {
  if (content && content.enabled === false) {
    return null;
  }

  const eyebrow = content?.eyebrow || 'ABOUT GEETHA N.';
  const title = content?.title || 'Your Trusted Financial Partner';
  const subtitle =
    content?.subtitle ||
    'Running a business is demanding enough without the added stress of messy receipts, untracked expenses, and end-of-year tax scrambles. As an experienced bookkeeping and accounting professional, I provide meticulous record-keeping, accurate reconciliations, and clear financial reporting designed to give you absolute peace of mind.';

  // If content has custom stats, use those that are enabled; otherwise fallback to BUSINESS_STATS
  const statsList = content?.stats
    ? content.stats.filter((s) => s.enabled !== false)
    : BUSINESS_STATS;

  if (statsList.length === 0) {
    return null;
  }

  const gridColsClass =
    statsList.length === 3
      ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
      : statsList.length === 2
      ? 'grid-cols-1 md:grid-cols-2'
      : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4';

  return (
    <section
      id={id}
      className="py-16 sm:py-24 border-y border-[#E8E2D7] bg-[#F4EFE6]/70 scroll-mt-24 sm:scroll-mt-28"
    >
      <span id="stats" className="sr-only" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading & Intro */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <span className="inline-block bg-emerald-50 text-[#138354] border border-emerald-100 uppercase tracking-widest font-mono text-xs px-3.5 py-1.5 rounded-full font-semibold">
            {eyebrow}
          </span>
          <h2 className="font-serif font-bold text-3xl sm:text-4xl lg:text-5xl text-[#0f2c59] mt-3.5 tracking-tight">
            {title}
          </h2>
          <div className="w-20 h-1 bg-[#138354] mx-auto rounded-full my-3.5" />
          <p className="mt-4 text-slate-600 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto font-normal">
            {subtitle}
          </p>
        </div>

        {/* Responsive Grid with Equal Widths & Aligned Heights */}
        <div className={`grid ${gridColsClass} gap-6 sm:gap-8 max-w-6xl mx-auto items-stretch`}>
          {statsList.map((stat, idx) => {
            const Icon = getCardIcon(stat.label, idx);
            const isThirdCardInThree = statsList.length === 3 && idx === 2;
            const hasValue = Boolean(stat.value && stat.value.trim());

            return (
              <div
                key={'id' in stat && stat.id ? (stat.id as string) : `${stat.label}-${idx}`}
                className={`bg-white border border-[#E2DBD0] rounded-2xl p-6 sm:p-8 text-center flex flex-col justify-between shadow-xs hover:shadow-md hover:border-[#138354]/40 transition-all duration-300 group hover:-translate-y-0.5 h-full ${
                  isThirdCardInThree ? 'md:col-span-2 lg:col-span-1 md:max-w-md md:mx-auto md:w-full' : ''
                }`}
              >
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    {/* Icon Container */}
                    <div className="w-14 h-14 rounded-2xl bg-[#EAF0EC] text-[#138354] flex items-center justify-center mx-auto mb-6 group-hover:bg-[#138354] group-hover:text-white transition-colors duration-200">
                      <Icon className="w-7 h-7" />
                    </div>

                    {/* Optional Numeric Metric (only if non-empty) */}
                    {hasValue ? (
                      <p className="font-serif text-3xl sm:text-4xl font-bold text-[#0f2c59] tracking-tight mb-2">
                        {stat.value}
                      </p>
                    ) : null}

                    {/* Card Heading */}
                    <h3 className="font-serif font-bold text-xl sm:text-2xl text-[#0f2c59] tracking-tight mb-3">
                      {stat.label}
                    </h3>

                    {/* Subtle Card Divider */}
                    <div className="w-12 h-0.5 bg-[#E8E2D7] mx-auto my-3.5 group-hover:bg-[#138354]/50 transition-colors" />
                  </div>

                  {/* Card Description */}
                  <p className="text-sm text-[#5C5E5B] leading-relaxed pt-1">
                    {stat.detail}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Centered Disclaimer */}
        <p className="text-center text-xs text-[#858783] mt-10 sm:mt-12 max-w-2xl mx-auto leading-relaxed">
          * These reflect Geetha&apos;s real operational figures from Finance with Geetha. No business result is guaranteed; your outcome depends on your effort, local market, and execution.
        </p>
      </div>
    </section>
  );
}
