import React from 'react';
import { BookOpen, TrendingUp, Receipt, Calculator, Check } from 'lucide-react';
import { TeachingContent } from '@/types/site-content';

interface ServicesSectionProps {
  content?: TeachingContent;
  enabled?: boolean;
}

const DEFAULT_SERVICE_CARDS = [
  {
    title: 'Bookkeeping & Daily Ledger Maintenance',
    description:
      'Accurate daily transaction recording, bank and credit card reconciliations, and expense categorization. Keep your accounts current and error-free.',
    icon: BookOpen,
    deliverables: ['Expense categorization', 'General ledger management'],
  },
  {
    title: 'Financial Reporting & P&L Statements',
    description:
      'Clear, concise profit & loss statements and balance sheets. Understand your cash flow, revenue trends, and overall financial health at a glance.',
    icon: TrendingUp,
    deliverables: ['Monthly Profit & Loss statements', 'Balance sheet preparation'],
  },
  {
    title: 'Accounts Payable & Receivable',
    description:
      'Streamline your cash flow cycles. Manage vendor bills efficiently and track customer invoices to ensure prompt payments and healthy liquidity.',
    icon: Receipt,
    deliverables: ['Invoice tracking & follow-ups', 'Vendor bill management'],
  },
  {
    title: 'Tax Preparation Support & Compliance',
    description:
      'Say goodbye to tax season stress. All financial documents and records are organized, verified, and ready for effortless tax filing.',
    icon: Calculator,
    deliverables: ['Clean year-end record handover', 'Bank & credit card reconciliations'],
  },
];

export function ServicesSection({ content, enabled = true }: ServicesSectionProps) {
  if (enabled === false || (content && content.enabled === false)) {
    return null;
  }

  const eyebrow = content?.eyebrow || 'Expertise & Offerings';
  const title = content?.title || 'Professional Bookkeeping & Accounting Services';
  const description =
    content?.description ||
    'Comprehensive financial solutions to keep your business organized, compliant, and profitable.';

  const icons = [BookOpen, TrendingUp, Receipt, Calculator];

  const services = content?.topics && content.topics.length > 0
    ? content.topics
        .filter((t) => t.enabled !== false)
        .map((t, idx) => {
          let deliverables = t.takeaways || [];
          if (t.description && t.description.includes('✔')) {
            deliverables = t.description
              .split('\n')
              .map((line) => line.replace(/^✔\s*/, '').trim())
              .filter(Boolean);
          }
          return {
            title: t.title,
            description: t.tagline || (t.description?.includes('✔') ? '' : t.description),
            icon: icons[idx % icons.length],
            deliverables: deliverables.length > 0 ? deliverables : ['Detailed monthly record keeping'],
          };
        })
    : DEFAULT_SERVICE_CARDS;

  if (services.length === 0) {
    return null;
  }

  return (
    <section id="services" className="py-20 bg-[#f8fafc] border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-semibold text-[#138354] uppercase tracking-widest inline-block bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
            {eyebrow}
          </span>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#0f2c59] mt-3 tracking-tight">
            {title}
          </h2>
          <div className="w-20 h-1 bg-[#138354] mx-auto rounded-full my-3" />
          <p className="text-slate-600 text-base leading-relaxed">
            {description}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {services.map((service, idx) => {
            const Icon = service.icon;
            return (
              <div
                key={idx}
                className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-all duration-200 flex flex-col justify-between group hover:border-slate-300"
              >
                <div>
                  <div className="w-12 h-12 bg-emerald-50 text-[#138354] rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#138354] group-hover:text-white transition-colors">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold font-serif text-[#0f2c59] mb-3">
                    {service.title}
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed mb-6">
                    {service.description}
                  </p>
                </div>

                <ul className="space-y-2.5 text-sm text-slate-700 border-t border-slate-100 pt-5">
                  {service.deliverables.map((item, itemIdx) => (
                    <li key={itemIdx} className="flex items-center">
                      <Check className="w-4 h-4 text-[#138354] mr-2.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
