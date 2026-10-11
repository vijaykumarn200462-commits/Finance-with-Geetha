import React from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export const metadata = {
  title: 'Terms of Service',
  description: 'Terms of Service, community guidelines, and educational coaching terms for Finance with Geetha.',
};

export default function TermsPage() {
  return (
    <>
      <Navbar />

      <main className="flex-1 pt-32 pb-20 sm:pt-40 sm:pb-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="text-xs font-mono uppercase tracking-widest text-[#244634] font-semibold block mb-2">
            Legal & Terms
          </span>
          <h1 className="font-editorial text-4xl sm:text-5xl text-[#181918] mb-4">
            Terms of Service
          </h1>
          <p className="text-xs text-[#706E69] font-mono mb-12">
            Effective Date: January 1, 2026 · Last Updated: October 2026
          </p>

          <div className="prose prose-neutral max-w-none text-sm text-[#484A46] space-y-8 leading-relaxed">
            <section className="space-y-3">
              <h2 className="font-editorial text-2xl text-[#181918]">1. Agreement to Terms</h2>
              <p>
                By accessing or using the website, purchasing digital products, or participating in
                The Community coaching program operated by Finance with Geetha (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;),
                you agree to be bound by these Terms of Service. If you disagree with any part of these terms, please do not use our services.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-editorial text-2xl text-[#181918]">2. Educational Purpose & No Income Guarantees</h2>
              <p>
                All content, coaching sessions, live calls, templates, workflows, books, and resources provided by Geetha and Finance with Geetha are for educational and operational training purposes only.
              </p>
              <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#E2DBD0] text-[#181918] font-medium">
                We make no earnings claims, income representations, or guarantees of any specific financial results. Geetha shares actual operational workflows and insights from Finance with Geetha. Your results depend on your effort, execution, local market dynamics, pricing choices, and business acumen.
              </div>
              <p>
                We do not provide certified formal legal counsel. Always consult qualified tax and legal professionals for your specific entity.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-editorial text-2xl text-[#181918]">3. Community Membership & Cancellation</h2>
              <p>
                Membership in <strong>The Community</strong> is billed as a recurring monthly subscription (₹150/month).
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li><strong>No long-term contracts:</strong> You may cancel your subscription at any time with one click inside your Stripe customer billing portal.</li>
                <li><strong>Access upon cancellation:</strong> If you cancel, your access continues through the end of your current paid billing period.</li>
                <li><strong>Community standards:</strong> All members agree to maintain professionalism, mutual respect, and client confidentiality. Derogatory conduct or harassment will result in immediate removal without refund.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="font-editorial text-2xl text-[#181918]">4. Digital Products & Licensing</h2>
              <p>
                Upon purchasing <em>Start a Bookkeeping Business</em> (book), cheat sheets, or workflow templates:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>You receive a single-user, non-exclusive license to use and adapt these materials for your own bookkeeping practice.</li>
                <li>You may not resell, redistribute, publicly upload, or syndicate the templates or book files to third parties or other coaches.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="font-editorial text-2xl text-[#181918]">5. 1-on-1 Strategy Calls</h2>
              <p>
                Private 30-minute strategy calls must be rescheduled with at least 24 hours&apos; prior notice. Calls cancelled with less than 24 hours&apos; notice are non-refundable.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-editorial text-2xl text-[#181918]">6. Contact Information</h2>
              <p>
                For questions regarding these Terms, please contact:
              </p>
              <p className="font-mono text-xs bg-[#FFFFFF] p-4 rounded-lg border border-[#E2DBD0]">
                Finance with Geetha<br />
                Attn: Legal & Operations<br />
                Email: cageethanofficial@gmail.com<br />
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
