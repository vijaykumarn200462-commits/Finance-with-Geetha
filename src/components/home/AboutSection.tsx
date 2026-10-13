import React from 'react';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, Clock, Handshake } from 'lucide-react';
import { AboutContent } from '@/types/site-content';

interface AboutSectionProps {
  content?: AboutContent;
}

export function AboutSection({ content }: AboutSectionProps) {
  if (content && content.enabled === false) {
    return null;
  }

  const eyebrow = content?.eyebrow || 'About Geetha N.';
  const title = content?.title || 'Your Trusted Financial Partner';
  const paragraphs = content?.paragraphs || [
    'Running a business is demanding enough without the added stress of messy receipts, untracked expenses, and end-of-year tax scrambles. As an experienced bookkeeping and accounting professional, I provide meticulous record-keeping, accurate reconciliations, and clear financial reporting designed to give you absolute peace of mind.',
  ];

  const benefits = [
    {
      title: 'Absolute Accuracy',
      desc: 'Every entry, ledger, and reconciliation is handled with precision to eliminate discrepancies and errors.',
      icon: ShieldCheck,
    },
    {
      title: 'Save Time & Energy',
      desc: 'Delegate tedious paperwork and financial tracking so you can focus entirely on core business operations.',
      icon: Clock,
    },
    {
      title: 'Personalized Approach',
      desc: 'Tailored financial packages and customized reporting that fit your unique business requirements.',
      icon: Handshake,
    },
  ];

  return (
    <section id="about" className="py-20 sm:py-24 bg-white border-y border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <span className="text-xs font-semibold text-[#138354] uppercase tracking-widest inline-block bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
            {eyebrow}
          </span>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#0f2c59] tracking-tight">
            {title}
          </h2>
          <div className="w-20 h-1 bg-[#138354] mx-auto rounded-full my-2" />
          <div className="space-y-4 text-slate-600 text-base sm:text-lg leading-relaxed pt-2">
            {paragraphs.map((p, idx) => (
              <p key={idx}>{p}</p>
            ))}
          </div>
        </div>

        {/* 3 Benefit Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
          {benefits.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="bg-[#f8fafc] p-8 rounded-2xl border border-slate-200 text-center hover:shadow-lg transition-all duration-200 group hover:-translate-y-0.5"
              >
                <div className="w-14 h-14 bg-[#0f2c59]/10 text-[#0f2c59] rounded-2xl flex items-center justify-center mx-auto mb-6 text-xl group-hover:bg-[#138354] group-hover:text-white transition-colors">
                  <Icon className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-[#0f2c59] mb-2 font-serif">
                  {item.title}
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>

        <div className="text-center pt-12">
          <Link
            href="/about"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#0f2c59] hover:text-[#138354] underline underline-offset-4 transition-colors"
          >
            <span>Read more about my background, philosophy, and approach</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

