'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { PRODUCT_NAMES } from '@/lib/stripe';
import { ProductId } from '@/lib/types';
import { CheckCircle2, ArrowRight, Download, Mail, Calendar } from 'lucide-react';
import { useCurrency } from '@/lib/context/CurrencyContext';

function ThankYouContent() {
  const searchParams = useSearchParams();
  const productKey = (searchParams.get('product') as ProductId) || 'community';
  const isSimulated = searchParams.get('simulated') === 'true';
  const { formatPrice } = useCurrency();

  const productInfo = PRODUCT_NAMES[productKey] || PRODUCT_NAMES.community;

  return (
    <main className="flex-1 pt-32 pb-20 sm:pt-40 sm:pb-28">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Success Icon */}
        <div className="w-16 h-16 rounded-full bg-[#EAF0EC] text-[#244634] flex items-center justify-center mx-auto mb-6 border border-[#C5D8CC] shadow-xs">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <span className="text-xs font-mono uppercase tracking-widest text-[#244634] font-semibold block mb-2">
          Order Confirmed
        </span>

        <h1 className="font-editorial text-4xl sm:text-5xl text-[#181918] font-normal tracking-tight">
          Thank you for your order!
        </h1>

        <p className="font-editorial text-2xl text-[#244634] mt-2 mb-4">
          You are now set up with {productInfo.name}
        </p>

        {isSimulated && (
          <div className="inline-block bg-[#F4EFE6] border border-[#E2DBD0] rounded-lg px-3.5 py-1.5 text-xs text-[#706E69] font-mono mb-6">
            ✓ Simulated Checkout Test Mode Active
          </div>
        )}

        {/* Details Card */}
        <div className="bg-[#FFFFFF] border border-[#E2DBD0] rounded-2xl p-8 text-left shadow-sm my-8 space-y-6">
          <div className="border-b border-[#F0EBE1] pb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-mono uppercase tracking-wider text-[#706E69]">Selected Product</p>
              <h3 className="font-editorial text-xl text-[#181918]">{productInfo.name}</h3>
            </div>
            <span className="font-editorial text-2xl text-[#181918]">
              {formatPrice(productInfo.amount / 100, productInfo.mode === 'subscription' ? 'mo' : undefined)}
            </span>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-[#181918] uppercase font-mono tracking-wider">
              Immediate Next Steps:
            </h4>

            <div className="flex items-start gap-3 text-sm text-[#5C5E5B]">
              <div className="w-6 h-6 rounded-md bg-[#EAF0EC] text-[#244634] flex items-center justify-center shrink-0 mt-0.5">
                <Mail className="w-3.5 h-3.5" />
              </div>
              <div>
                <strong className="text-[#181918] block">Check Your Inbox</strong>
                <span>
                  A receipt and your direct access link have been dispatched. Check your spam folder if it doesn&apos;t arrive within 5 minutes.
                </span>
              </div>
            </div>

            {productKey === 'community' && (
              <div className="flex items-start gap-3 text-sm text-[#5C5E5B]">
                <div className="w-6 h-6 rounded-md bg-[#EAF0EC] text-[#244634] flex items-center justify-center shrink-0 mt-0.5">
                  <Calendar className="w-3.5 h-3.5" />
                </div>
                <div>
                  <strong className="text-[#181918] block">Add the Live Calls to Your Calendar</strong>
                  <span>
                    Our next small-group live call is this Wednesday at 12:00 PM Eastern. The Zoom link is in your confirmation email.
                  </span>
                </div>
              </div>
            )}

            {productKey === 'book' && (
              <div className="flex items-start gap-3 text-sm text-[#5C5E5B]">
                <div className="w-6 h-6 rounded-md bg-[#EAF0EC] text-[#244634] flex items-center justify-center shrink-0 mt-0.5">
                  <Download className="w-3.5 h-3.5" />
                </div>
                <div>
                  <strong className="text-[#181918] block">Download PDF & EPUB Files</strong>
                  <span>
                    Your download bundle link is ready in your email. You can sync the EPUB directly to Apple Books or your Kindle app.
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button variant="primary" size="lg" href="/" rightIcon={<ArrowRight className="w-4 h-4" />}>
            Return to Homepage
          </Button>
          <Button variant="outline" size="lg" href="/community">
            Explore Community Details
          </Button>
        </div>
      </div>
    </main>
  );
}

export default function ThankYouPage() {
  return (
    <>
      <Navbar />
      <Suspense fallback={<div className="min-h-screen pt-40 text-center">Loading confirmation...</div>}>
        <ThankYouContent />
      </Suspense>
      <Footer />
    </>
  );
}
