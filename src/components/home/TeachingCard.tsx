import React from 'react';
import { TeachingTopic } from '@/lib/types';
import { Check } from 'lucide-react';

interface TeachingCardProps {
  topic: TeachingTopic;
}

export function TeachingCard({ topic }: TeachingCardProps) {
  return (
    <div className="group relative bg-[#FFFFFF] border border-[#E2DBD0] rounded-xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 hover:border-[#244634] hover:shadow-md">
      <div>
        {/* Number Badge */}
        <div className="flex items-center justify-between mb-4">
          <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-[#FAF7F2] text-[#244634] border border-[#E2DBD0] group-hover:bg-[#244634] group-hover:text-[#FAF7F2] group-hover:border-[#244634] transition-colors">
            {topic.number}
          </span>
          <span className="text-[11px] font-mono text-[#858783] uppercase tracking-wider">
            Operational Skill
          </span>
        </div>

        {/* Title */}
        <h3 className="font-editorial text-2xl text-[#181918] group-hover:text-[#244634] transition-colors">
          {topic.title}
        </h3>

        {/* Tagline */}
        <p className="mt-2 text-sm font-medium text-[#244634] leading-snug">
          {topic.tagline}
        </p>

        {/* Description */}
        <p className="mt-3 text-sm text-[#5C5E5B] leading-relaxed">
          {topic.description}
        </p>
      </div>

      {/* Takeaway Bullets */}
      <div className="mt-6 pt-5 border-t border-[#F0EBE1] space-y-2">
        <p className="text-[11px] uppercase tracking-wider text-[#706E69] font-mono font-semibold">
          What you master:
        </p>
        <ul className="space-y-1.5">
          {topic.takeaways.map((bullet, idx) => (
            <li key={idx} className="flex items-start gap-2 text-xs text-[#424440] leading-snug">
              <Check className="w-3.5 h-3.5 text-[#244634] shrink-0 mt-0.5" />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
