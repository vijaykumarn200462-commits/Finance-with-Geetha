'use client';

import React, { useState } from 'react';
import { X, AlertCircle, ArrowRight, ShieldCheck, CreditCard } from 'lucide-react';
import { Button } from '../ui/Button';
import { ProductId } from '@/lib/types';
import { PRODUCT_NAMES } from '@/lib/stripe';
import { useRouter } from 'next/navigation';
import { useDynamicPricing } from '@/lib/firebase/content';
import { useCurrency } from '@/lib/context/CurrencyContext';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: ProductId | null;
  envKeyRequired?: string;
}

export function CheckoutModal({
  isOpen,
  onClose,
  productId,
  envKeyRequired,
}: CheckoutModalProps) {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const pricing = useDynamicPricing();
  const { formatPrice, selectedCurrency, currencySymbol } = useCurrency();

  if (!isOpen || !productId) return null;

  const product = PRODUCT_NAMES[productId];
  const dynamicNumericPrice =
    productId === 'community'
      ? pricing.community
      : productId === 'book'
      ? pricing.book
      : productId === 'cheatsheets'
      ? pricing.cheatsheets
      : productId === 'workflow'
      ? pricing.workflow
      : productId === 'call'
      ? pricing.call
      : product.amount / 100;

  const priceFormatted = formatPrice(
    dynamicNumericPrice,
    product.mode === 'subscription' ? 'mo' : undefined
  );

  const handleStripeCheckout = async () => {
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          currency: selectedCurrency,
        }),
      });

      const data = await res.json();

      if (data.isConfigured && data.url) {
        window.location.href = data.url;
        return;
      }

      if (!data.isConfigured) {
        // Stripe credentials unconfigured in dev/test, keep modal open with notice
        setIsProcessing(false);
        return;
      }

      if (data.error) {
        setErrorMessage(data.error);
        setIsProcessing(false);
      }
    } catch (err: unknown) {
      console.error('Checkout error:', err);
      setErrorMessage('Could not initiate checkout session. Please try again.');
      setIsProcessing(false);
    }
  };

  const handleSimulatePurchase = () => {
    setIsSimulating(true);
    setTimeout(() => {
      onClose();
      router.push(`/thank-you?product=${productId}&simulated=true&currency=${selectedCurrency}`);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-[#FAF7F2] rounded-xl border border-[#E2DBD0] shadow-2xl p-6 sm:p-8 text-[#181918] max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkout-modal-title"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-lg text-[#5C5E5B] hover:text-[#181918] hover:bg-[#EAE4D9] transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-[#EAF0EC] border border-[#C5D8CC] flex items-center justify-center text-[#244634]">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-[#244634] font-semibold">
              Checkout & Payment Layer
            </span>
            <h3 id="checkout-modal-title" className="font-editorial text-2xl font-normal text-[#181918]">
              {product.name}
            </h3>
          </div>
        </div>

        {/* Price tag */}
        <div className="bg-[#FFFFFF] border border-[#E8E2D7] rounded-lg p-4 mb-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-[#5C5E5B] uppercase tracking-wide font-mono">
              Total ({selectedCurrency})
            </p>
            <p className="font-editorial text-2xl text-[#181918]">{priceFormatted}</p>
          </div>
          <div className="text-right">
            <span className="text-xs font-medium px-2.5 py-1 rounded bg-[#F3EFE8] text-[#244634] border border-[#E2DBD0] inline-block mb-1">
              {product.mode === 'subscription' ? 'Monthly billing' : 'Instant digital access'}
            </span>
            <p className="text-[10px] text-[#706E69] font-mono">
              Base: ₹{dynamicNumericPrice} INR
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
            {errorMessage}
          </div>
        )}

        {/* Integration Status Notice */}
        <div className="bg-[#FFFDF7] border border-[#E8DFCC] rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#9A6B2F] shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-[#181918] mb-1">
                Stripe Multi-Currency Checkout
              </p>
              <p className="text-[#5C5E5B] leading-relaxed mb-3">
                This project has a live-ready Stripe Checkout integration charging in{' '}
                <strong className="text-[#181918] font-mono">{selectedCurrency} ({currencySymbol})</strong>.
                To process live customer cards, ensure Stripe keys are active in{' '}
                <code className="bg-[#EAE4D9] px-1 py-0.5 rounded text-xs font-mono">.env.local</code>:
              </p>
              <ul className="space-y-1 font-mono text-xs text-[#181918] bg-[#F4EFE6] p-2.5 rounded border border-[#E2DBD0]">
                <li>• STRIPE_SECRET_KEY=sk_...</li>
                <li>• {envKeyRequired || `NEXT_PUBLIC_STRIPE_${productId.toUpperCase()}_PRICE_ID`}=price_...</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            variant="primary"
            size="lg"
            className="w-full justify-center"
            onClick={handleStripeCheckout}
            isLoading={isProcessing}
            leftIcon={<CreditCard className="w-4 h-4" />}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Pay with Stripe ({selectedCurrency})
          </Button>

          <Button
            variant="outline"
            size="md"
            className="w-full justify-center text-xs font-mono"
            onClick={handleSimulatePurchase}
            isLoading={isSimulating}
          >
            Test Order Completion Flow ({selectedCurrency})
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-center text-xs text-[#706E69]"
            onClick={onClose}
          >
            Back to Site
          </Button>
        </div>

        <p className="text-center text-xs text-[#858783] mt-4">
          Direct SSL Encrypted. No fake claims or hidden subscriptions.
        </p>
      </div>
    </div>
  );
}
