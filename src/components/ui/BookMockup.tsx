'use client';

import React from 'react';

interface BookMockupProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function BookMockup({ className = '', size = 'md' }: BookMockupProps) {
  const dimensions = {
    sm: 'w-48 h-64 text-xs',
    md: 'w-64 h-88 sm:w-72 sm:h-96 text-sm',
    lg: 'w-72 h-96 sm:w-84 sm:h-[460px] text-base',
  };

  return (
    <div className={`relative perspective-1000 flex items-center justify-center ${className}`}>
      {/* Outer ambient drop shadow */}
      <div className="absolute inset-x-6 -bottom-6 h-8 bg-black/25 blur-xl rounded-full transform -rotate-1 pointer-events-none" />

      {/* Book Container with 3D tilt */}
      <div
        className={`relative ${dimensions[size]} rounded-r-lg rounded-l-xs bg-[#192A20] text-[#FAF7F2] p-6 sm:p-8 flex flex-col justify-between shadow-2xl transition-transform duration-300 hover:rotate-0 hover:scale-[1.02] transform -rotate-2 select-none border-l-8 border-l-[#111C15] border-t border-r border-b border-[#2C4A37]/50`}
        style={{
          boxShadow:
            '14px 18px 30px -4px rgba(0, 0, 0, 0.4), 6px 8px 12px -2px rgba(0, 0, 0, 0.25), inset 4px 0 10px rgba(255, 255, 255, 0.08), inset -3px 0 8px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Book spine highlight gradient overlay */}
        <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-white/15 to-transparent pointer-events-none" />

        {/* Subtle cloth/paper texture overlay */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none rounded-r-lg"
          style={{
            backgroundImage:
              'radial-gradient(#FAF7F2 1px, transparent 1px), radial-gradient(#FAF7F2 1px, #192A20 1px)',
            backgroundSize: '16px 16px',
            backgroundPosition: '0 0, 8px 8px',
          }}
        />

        {/* Top Header / Category */}
        <div className="relative z-10 border-b border-[#FAF7F2]/20 pb-3">
          <p className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.25em] text-[#A5C8AF]">
            The Blueprint & Playbook
          </p>
        </div>

        {/* Book Title & Subtitle */}
        <div className="relative z-10 my-auto py-4">
          <h3 className="font-editorial text-2xl sm:text-3xl lg:text-4xl leading-[1.1] font-normal tracking-tight text-[#FAF7F2]">
            Start a Bookkeeping Business
          </h3>
          <div className="w-12 h-0.5 bg-[#C9A96E] my-3.5" />
          <p className="text-xs sm:text-sm text-[#D7DFD9] leading-relaxed font-sans max-w-[220px]">
            How to build one that pays you well — and leaves you alone.
          </p>
        </div>

        {/* Author & Footer */}
        <div className="relative z-10 pt-3 border-t border-[#FAF7F2]/20 flex items-center justify-between">
          <div>
            <p className="text-[9px] uppercase tracking-wider text-[#98B2A1]">Written by</p>
            <p className="font-editorial text-sm sm:text-base text-[#FAF7F2] font-medium tracking-wide">
              Geetha
            </p>
          </div>
          <div className="text-right">
            <span className="inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-[#FAF7F2]/10 text-[#E2EBE5]">
              PDF + EPUB
            </span>
          </div>
        </div>

        {/* Pages edging effect on right */}
        <div
          className="absolute -right-2 top-2 bottom-2 w-2 rounded-r bg-[#E8E2D7] border-r border-[#D2C8BA] shadow-inner pointer-events-none"
          style={{
            backgroundImage:
              'repeating-linear-gradient(to bottom, #FAF7F2, #FAF7F2 1px, #D2C8BA 1px, #D2C8BA 2px)',
          }}
        />
      </div>
    </div>
  );
}
