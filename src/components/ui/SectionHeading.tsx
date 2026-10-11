import React from 'react';

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
  isLight?: boolean;
  className?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'center',
  isLight = false,
  className = '',
}: SectionHeadingProps) {
  const isCentered = align === 'center';

  return (
    <div
      className={`max-w-3xl ${isCentered ? 'mx-auto text-center' : 'text-left'} ${className}`}
    >
      {eyebrow && (
        <span
          className={`inline-block text-xs uppercase tracking-widest font-semibold mb-3 ${
            isLight ? 'text-[#84A98C]' : 'text-[#244634]'
          }`}
        >
          {eyebrow}
        </span>
      )}
      <h2
        className={`font-editorial text-3xl sm:text-4xl md:text-5xl tracking-tight leading-[1.15] font-normal ${
          isLight ? 'text-[#FAF7F2]' : 'text-[#181918]'
        }`}
      >
        {title}
      </h2>
      {description && (
        <p
          className={`mt-4 text-base sm:text-lg leading-relaxed ${
            isLight ? 'text-[#D0C9BD]' : 'text-[#5C5E5B]'
          } ${isCentered ? 'mx-auto max-w-2xl' : 'max-w-2xl'}`}
        >
          {description}
        </p>
      )}
    </div>
  );
}
