import React from 'react';
import { CALL_STEPS } from '@/lib/data';
import { Users, Clock } from 'lucide-react';

import { CallStructureContent } from '@/types/site-content';

interface CallStructureProps {
  content?: CallStructureContent;
}

export function CallStructure({ content }: CallStructureProps) {
  if (!content || content.enabled === false) {
    return null;
  }

  const eyebrow = content?.eyebrow || 'Call Structure';
  const title = content?.title || 'Inside Every Call';
  const description =
    content?.description ||
    'Capped under 10 people on purpose. Everyone gets airtime. No lurking in a 200-person Zoom.';

  const stepsList = content?.steps
    ? content.steps
        .filter((s) => s.enabled !== false)
        .map((s) => ({
          step: s.number,
          title: s.title,
          description: s.description,
          takeaway: s.duration || '',
        }))
    : CALL_STEPS;

  if (stepsList.length === 0) {
    return null;
  }

  return (
    <section className="py-20 sm:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <span className="text-xs font-mono uppercase tracking-widest text-[#244634] font-semibold block mb-2">
          {eyebrow}
        </span>
        <h2 className="font-editorial text-3xl sm:text-4xl md:text-5xl text-[#181918] font-normal tracking-tight">
          {title}
        </h2>
        <p className="font-editorial text-xl sm:text-2xl text-[#244634] mt-2 mb-3">
          How the weekly calls actually work
        </p>
        <p className="text-sm sm:text-base text-[#5C5E5B] max-w-2xl mx-auto leading-relaxed">
          {description}
        </p>

        {/* Small meta indicators */}
        <div className="mt-6 inline-flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-[#484A46] bg-[#FFFFFF] px-4 py-2 rounded-full border border-[#E2DBD0]">
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#244634]" />
            Wednesdays & Fridays at noon ET
          </span>
          <span className="text-[#D2C8BA]">•</span>
          <span className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-[#244634]" />
            Strictly limited to &lt; 10 attendees
          </span>
        </div>
      </div>

      {/* Three Step Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {stepsList.map((step) => (
          <div
            key={step.step}
            className="bg-[#FFFFFF] border border-[#E2DBD0] rounded-2xl p-8 flex flex-col justify-between shadow-xs hover:border-[#244634] transition-all duration-300 relative group"
          >
            <div>
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#F0EBE1]">
                <span className="font-mono text-xs font-bold px-3 py-1 rounded bg-[#EAF0EC] text-[#244634] border border-[#C5D8CC]">
                  {step.step}
                </span>
                <span className="text-xs font-mono text-[#858783] uppercase">
                  Agenda Segment
                </span>
              </div>

              <h3 className="font-editorial text-2xl text-[#181918] group-hover:text-[#244634] transition-colors mb-3">
                {step.title}
              </h3>

              <p className="text-sm text-[#5C5E5B] leading-relaxed mb-6">
                {step.description}
              </p>
            </div>

            <div className="pt-4 border-t border-[#F0EBE1] bg-[#FAF7F2] -mx-8 -mb-8 p-6 rounded-b-2xl">
              <p className="text-[11px] font-mono uppercase tracking-wider text-[#706E69] font-semibold mb-1">
                The Outcome:
              </p>
              <p className="text-xs text-[#244634] font-medium leading-snug">
                {step.takeaway}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
