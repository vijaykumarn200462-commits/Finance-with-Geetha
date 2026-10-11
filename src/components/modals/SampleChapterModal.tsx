'use client';

import React, { useState } from 'react';
import { X, BookOpen, ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';
import { useDynamicPricing } from '@/lib/firebase/content';
import { useCurrency } from '@/lib/context/CurrencyContext';

interface SampleChapterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBuyBook: () => void;
}

export function SampleChapterModal({
  isOpen,
  onClose,
  onBuyBook,
}: SampleChapterModalProps) {
  const [fontSize, setFontSize] = useState<'normal' | 'large'>('normal');
  const pricing = useDynamicPricing();
  const { formatPrice } = useCurrency();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl bg-[#FAF7F2] rounded-xl border border-[#E2DBD0] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sample-modal-title"
      >
        {/* Top bar */}
        <div className="px-6 py-4 border-b border-[#E8E2D7] bg-[#FFFFFF] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-[#244634]" />
            <div>
              <p className="text-[11px] font-mono uppercase tracking-wider text-[#244634] font-semibold">
                Free Reader Preview
              </p>
              <h3 id="sample-modal-title" className="font-editorial text-lg text-[#181918] font-normal">
                Start a Bookkeeping Business
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center border border-[#E2DBD0] rounded-md overflow-hidden text-xs">
              <button
                onClick={() => setFontSize('normal')}
                className={`px-2 py-1 ${fontSize === 'normal' ? 'bg-[#244634] text-[#FAF7F2]' : 'bg-[#FAF7F2] text-[#5C5E5B]'}`}
              >
                A
              </button>
              <button
                onClick={() => setFontSize('large')}
                className={`px-2 py-1 font-bold ${fontSize === 'large' ? 'bg-[#244634] text-[#FAF7F2]' : 'bg-[#FAF7F2] text-[#5C5E5B]'}`}
              >
                A+
              </button>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#5C5E5B] hover:text-[#181918] hover:bg-[#EAE4D9]"
              aria-label="Close reader"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Reader Content */}
        <div className="flex-1 overflow-y-auto px-6 sm:px-10 py-8 bg-[#FAF7F2]">
          <div className="max-w-prose mx-auto">
            <div className="text-center mb-8 pb-6 border-b border-[#E8E2D7]">
              <span className="text-xs font-mono uppercase tracking-widest text-[#858783]">
                Chapter 1 Excerpt
              </span>
              <h2 className="font-editorial text-2xl sm:text-3xl text-[#181918] mt-1 mb-2">
                The Myth of Hourly Billing
              </h2>
              <p className="text-xs text-[#5C5E5B] italic">
                By Geetha — Founder of Finance with Geetha
              </p>
            </div>

            <div
              className={`space-y-5 text-[#181918] leading-relaxed font-sans ${
                fontSize === 'large' ? 'text-lg' : 'text-base'
              }`}
            >
              <p>
                When I started Finance with Geetha, the first piece of advice I received was
                predictable: <em>&ldquo;Charge hourly until you get a few clients under your belt,
                then raise your rate.&rdquo;</em>
              </p>

              <p>
                It took me about four months to realize that hourly billing is the single greatest trap
                in the bookkeeping industry. Here is why:
              </p>

              <div className="p-4 rounded-lg bg-[#FFFFFF] border border-[#E8E2D7] space-y-3 my-6">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#EAF0EC] text-[#244634] flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                    1
                  </div>
                  <div>
                    <strong className="block text-[#181918]">It directly punishes your efficiency</strong>
                    <span className="text-sm text-[#5C5E5B]">
                      If a client&apos;s monthly reconciliation takes you 10 hours in month one, you make a set amount.
                      In month six, after automating bank feeds and streamlining rules, it takes you 2 hours.
                      Under hourly billing, your reward for becoming world-class is an unfair pay cut.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#EAF0EC] text-[#244634] flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                    2
                  </div>
                  <div>
                    <strong className="block text-[#181918]">It creates client micromanagement</strong>
                    <span className="text-sm text-[#5C5E5B]">
                      When business owners receive an itemized invoice detailing 12 minutes for
                      &ldquo;following up on credit card receipts,&rdquo; they argue about minutes. They stop
                      valuing the financial clarity you provide.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#EAF0EC] text-[#244634] flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                    3
                  </div>
                  <div>
                    <strong className="block text-[#181918]">It creates financial anxiety for you</strong>
                    <span className="text-sm text-[#5C5E5B]">
                      You can never predict what your income will be next month. One slow week throws
                      off your family&apos;s personal budget.
                    </span>
                  </div>
                </div>
              </div>

              <h4 className="font-editorial text-xl text-[#181918] pt-2">
                The Calm Alternative: Flat Monthly Retainers
              </h4>

              <p>
                Instead of selling your time, you sell a guaranteed outcome:
              </p>

              <blockquote className="border-l-3 border-[#244634] pl-4 italic text-[#244634] font-medium my-4">
                &ldquo;Every month, your accounts are reconciled to the penny, your taxes are prepared on time,
                and an executive summary report is delivered to your inbox by the 10th of the month.&rdquo;
              </blockquote>

              <p>
                To a small business owner, that peace of mind is worth predictable flat retainers
                every month without hesitation.
              </p>

              <p>
                Once you switch to flat retainers, your business stabilizes. When you get faster, your
                effective earning power climbs. You work fewer hours, make more
                money, and sleep better at night.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom CTA Bar */}
        <div className="px-6 py-4 bg-[#FFFFFF] border-t border-[#E8E2D7] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-center sm:text-left">
            <p className="text-xs text-[#5C5E5B]">
              Ready for the rest of the playbook? (180 pages · PDF + EPUB)
            </p>
            <p className="font-editorial text-lg text-[#181918]">
              {formatPrice(pricing.book)} one-time · Instant download
            </p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="flex-1 sm:flex-none"
            >
              Close
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                onClose();
                onBuyBook();
              }}
              rightIcon={<ArrowRight className="w-4 h-4" />}
              className="flex-1 sm:flex-none"
            >
              Get the Full Book — {formatPrice(pricing.book)}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
