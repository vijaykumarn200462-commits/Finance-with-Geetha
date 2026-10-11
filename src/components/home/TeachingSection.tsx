import React from 'react';
import { TEACHING_TOPICS } from '@/lib/data';
import { TeachingCard } from './TeachingCard';
import { SectionHeading } from '../ui/SectionHeading';
import { TeachingContent } from '@/types/site-content';

interface TeachingSectionProps {
  content?: TeachingContent;
}

export function TeachingSection({ content }: TeachingSectionProps) {
  if (content && content.enabled === false) {
    return null;
  }

  const eyebrow = content?.eyebrow || 'Practical Curriculum';
  const title = content?.title || 'The whole job — not just the pep talk.';
  const description =
    content?.description ||
    "This isn't theory. These are the exact things I do in my own business every week, broken down so you can do them too.";

  const topicsList = content?.topics
    ? content.topics.filter((t) => t.enabled !== false)
    : TEACHING_TOPICS;

  if (topicsList.length === 0) {
    return null;
  }

  return (
    <section id="what-i-teach" className="py-20 sm:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <SectionHeading
        eyebrow={eyebrow}
        title={title}
        description={description}
      />

      <div className="mt-14 sm:mt-18 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {topicsList.map((topic) => (
          <TeachingCard key={topic.number} topic={topic} />
        ))}
      </div>
    </section>
  );
}
