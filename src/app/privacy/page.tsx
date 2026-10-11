import React from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export const metadata = {
  title: 'Privacy Policy',
  description: 'Privacy Policy and data protection terms for Finance with Geetha.',
};

export default function PrivacyPage() {
  return (
    <>
      <Navbar />

      <main className="flex-1 pt-32 pb-20 sm:pt-40 sm:pb-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="text-xs font-mono uppercase tracking-widest text-[#244634] font-semibold block mb-2">
            Legal & Compliance
          </span>
          <h1 className="font-editorial text-4xl sm:text-5xl text-[#181918] mb-4">
            Privacy Policy
          </h1>
          <p className="text-xs text-[#706E69] font-mono mb-12">
            Effective Date: January 1, 2026 · Last Updated: October 2026
          </p>

          <div className="prose prose-neutral max-w-none text-sm text-[#484A46] space-y-8 leading-relaxed">
            <section className="space-y-3">
              <h2 className="font-editorial text-2xl text-[#181918]">1. Introduction</h2>
              <p>
                Finance with Geetha (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) respects your privacy and is
                committed to protecting personal data collected through our website, coaching community,
                digital products, and email communications.
              </p>
              <p>
                We do not sell, rent, or trade your personal information with third-party advertisers. Ever.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-editorial text-2xl text-[#181918]">2. Information We Collect</h2>
              <p>We collect information you directly provide when you:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Join <strong>The Community</strong> membership</li>
                <li>Purchase <strong>Start a Bookkeeping Business</strong> (book) or store templates</li>
                <li>Submit an inquiry through our contact form</li>
                <li>Book a 1-on-1 strategy call session</li>
              </ul>
              <p>
                This information may include your name, email address, payment details (processed directly
                by our secure third-party payment gateway, Stripe), and information about your business.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-editorial text-2xl text-[#181918]">3. Payment Processing & Security</h2>
              <p>
                All financial transactions are conducted through <strong>Stripe, Inc.</strong> We do not store,
                view, or process your credit card numbers or banking passwords on our servers. Stripe complies
                strictly with PCI-DSS requirements to safeguard your financial data.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-editorial text-2xl text-[#181918]">4. How We Use Your Data</h2>
              <p>Your information is used strictly to:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Deliver digital product downloads, ebooks, and template spreadsheets</li>
                <li>Provide calendar invites and links to live weekly coaching calls</li>
                <li>Manage community access, billing, and membership status</li>
                <li>Respond to direct customer service inquiries</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="font-editorial text-2xl text-[#181918]">5. Country Detection, Currency Preferences & IP Privacy</h2>
              <p>
                To provide a seamless international browsing experience, our servers automatically detect your
                approximate country of origin using trusted hosting headers provided by our infrastructure partners
                (such as Vercel and Cloudflare) to suggest an appropriate display currency.
              </p>
              <p>
                <strong>Privacy Commitment:</strong> We do <em>not</em> store your public IP address in Cloud Firestore,
                customer profiles, or analytics databases. IP address data is processed strictly in-memory by the server
                to determine the suggested country and exchange rates. If you choose to view your connection details via the
                optional footer panel, that information is rendered exclusively for your active browser session and is never
                accessible to other visitors.
              </p>
              <p>
                Your manual currency selection is stored locally in your browser (via local storage and cookies) so your
                preference persists across pages. You may change or reset this preference at any time without creating an account.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-editorial text-2xl text-[#181918]">6. Cancellation and Data Deletion</h2>
              <p>
                You may request complete deletion of your account and email data at any time by sending a
                written request to <a href="mailto:cageethanofficial@gmail.com" className="text-[#244634] underline">cageethanofficial@gmail.com</a>.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-editorial text-2xl text-[#181918]">7. Contact Information</h2>
              <p>
                For questions regarding this Privacy Policy or your data, please contact:
              </p>
              <p className="font-mono text-xs bg-[#FFFFFF] p-4 rounded-lg border border-[#E2DBD0]">
                Finance with Geetha<br />
                Attn: Privacy Officer<br />
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
