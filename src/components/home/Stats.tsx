import React from 'react';
import { BUSINESS_STATS } from '@/lib/data';
import { StatsContent } from '@/types/site-content';

interface StatsProps {
  content?: StatsContent;
}

export function Stats({ content }: StatsProps) {
  if (content && content.enabled === false) {
    return null;
  }

  const eyebrow = content?.eyebrow || 'The Track Record';
  const title = content?.title || 'Real business. Real numbers.';
  const subtitle = content?.subtitle || 'Not projections. My actual business.';

  // If content has custom stats, use those that are enabled; otherwise fallback to BUSINESS_STATS
  const statsList = content?.stats
    ? content.stats.filter((s) => s.enabled !== false)
    : BUSINESS_STATS;

  if (statsList.length === 0) {
    return null;
  }

  return (
    <section className="py-16 sm:py-20 border-y border-[#E8E2D7] bg-[#F4EFE6]/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <span className="text-xs font-mono uppercase tracking-widest text-[#244634] font-semibold block mb-2">
            {eyebrow}
          </span>
          <h2 className="font-editorial text-3xl sm:text-4xl text-[#181918] font-normal tracking-tight">
            {title}
          </h2>
          <p className="mt-3 text-sm sm:text-base text-[#5C5E5B] italic font-serif">
            {subtitle}
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {statsList.map((stat, idx) => (
            <div
              key={idx}
              className="bg-[#FFFFFF] border border-[#E2DBD0] rounded-xl p-6 sm:p-8 text-center flex flex-col justify-between shadow-xs hover:border-[#244634]/40 transition-colors"
            >
              <div>
                <p className="font-editorial text-4xl sm:text-5xl lg:text-6xl text-[#181918] font-normal tracking-tight">
                  {stat.value}
                </p>
                <p className="mt-2 text-base sm:text-lg font-medium text-[#181918]">
                  {stat.label}
                </p>
              </div>
              <p className="mt-4 pt-4 border-t border-[#F0EBE1] text-xs text-[#706E69] leading-relaxed">
                {stat.detail}
              </p>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-[#858783] mt-8 max-w-lg mx-auto leading-relaxed">
          * These reflect Geetha&apos;s real operational figures from Finance with Geetha. No business result is guaranteed; your outcome depends on your effort, local market, and execution.
        </p>
      </div>
    </section>
  );
}
