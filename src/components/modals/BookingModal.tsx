'use client';

import React, { useState } from 'react';
import { X, Calendar, Clock, CheckCircle2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { useDynamicPricing } from '@/lib/firebase/content';
import { useCurrency } from '@/lib/context/CurrencyContext';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceedToPayment: () => void;
}

export function BookingModal({
  isOpen,
  onClose,
  onProceedToPayment,
}: BookingModalProps) {
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [topic, setTopic] = useState('Pricing & Quoting Strategy');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const pricing = useDynamicPricing();
  const { formatPrice } = useCurrency();

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setStep('success');
    }, 700);
  };

  const calendlyUrl = process.env.NEXT_PUBLIC_CALENDLY_URL;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-[#FAF7F2] rounded-xl border border-[#E2DBD0] shadow-2xl p-6 sm:p-8 text-[#181918] max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-modal-title"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-lg text-[#5C5E5B] hover:text-[#181918] hover:bg-[#EAE4D9]"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {step === 'form' ? (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#EAF0EC] border border-[#C5D8CC] flex items-center justify-center text-[#244634]">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-[#244634] font-semibold">
                  1-on-1 Strategy Session
                </span>
                <h3 id="booking-modal-title" className="font-editorial text-2xl font-normal text-[#181918]">
                  Book 30 Minutes with Geetha
                </h3>
              </div>
            </div>

            <p className="text-sm text-[#5C5E5B] mb-5 leading-relaxed">
              Bring your specific pricing proposal, client friction, or operational bottleneck.
              We diagnose the issue on screen and build a concrete solution.
            </p>

            <div className="flex items-center gap-4 bg-[#FFFFFF] border border-[#E8E2D7] rounded-lg p-3.5 mb-6 text-xs text-[#5C5E5B]">
              <div className="flex items-center gap-1.5 font-medium text-[#181918]">
                <Clock className="w-4 h-4 text-[#244634]" />
                30 Minutes
              </div>
              <div className="h-3 w-px bg-[#E2DBD0]" />
              <div className="font-editorial text-base text-[#181918]">{formatPrice(pricing.call)} One-time</div>
              <div className="h-3 w-px bg-[#E2DBD0]" />
              <div>Video Call (Recorded)</div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#181918] mb-1.5">
                  Your Full Name <span className="text-[#9A6B2F]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sarah Miller"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#D5CDC0] bg-[#FFFFFF] text-sm focus:outline-none focus:ring-2 focus:ring-[#244634]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#181918] mb-1.5">
                  Your Email Address <span className="text-[#9A6B2F]">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. sarah@example.com"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#D5CDC0] bg-[#FFFFFF] text-sm focus:outline-none focus:ring-2 focus:ring-[#244634]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#181918] mb-1.5">
                  Primary Focus for the Call
                </label>
                <select
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#D5CDC0] bg-[#FFFFFF] text-sm focus:outline-none focus:ring-2 focus:ring-[#244634]"
                >
                  <option value="Pricing & Quoting Strategy">Pricing & Quoting Strategy</option>
                  <option value="First Clients & Discovery Call">First Clients & Discovery Call</option>
                  <option value="QuickBooks Month-End Workflow">QuickBooks Month-End Workflow</option>
                  <option value="Client Boundaries & Scope Creep">Client Boundaries & Scope Creep</option>
                  <option value="Website & Positioning Audit">Website & Positioning Audit</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#181918] mb-1.5">
                  What is the biggest question you want answered?
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Share a few bullet points about your current situation..."
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#D5CDC0] bg-[#FFFFFF] text-sm focus:outline-none focus:ring-2 focus:ring-[#244634] resize-none"
                />
              </div>

              <div className="pt-2 space-y-2.5">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full justify-center"
                  isLoading={isSubmitting}
                >
                  Continue to Secure Confirmation — {formatPrice(pricing.call)}
                </Button>
                {calendlyUrl && !calendlyUrl.includes('placeholder') && (
                  <a
                    href={calendlyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-center text-xs text-[#244634] underline hover:text-[#1B3527]"
                  >
                    Or open Calendly directly in a new tab →
                  </a>
                )}
              </div>
            </form>
          </div>
        ) : (
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-full bg-[#EAF0EC] text-[#244634] flex items-center justify-center mx-auto mb-4 border border-[#C5D8CC]">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="font-editorial text-2xl text-[#181918] mb-2">
              Request Received
            </h3>
            <p className="text-sm text-[#5C5E5B] max-w-sm mx-auto mb-6 leading-relaxed">
              Thanks {name || 'there'}! Your strategy session request on &ldquo;{topic}&rdquo; has been logged.
              Geetha will follow up within 24 hours to finalize your calendar time and Google Meet link.
            </p>
            <div className="space-y-2">
              <Button
                variant="primary"
                size="md"
                className="w-full justify-center"
                onClick={() => {
                  onClose();
                  onProceedToPayment();
                }}
              >
                Proceed to Payment Checkout ({formatPrice(pricing.call)})
              </Button>
              <Button
                variant="outline"
                size="md"
                className="w-full justify-center"
                onClick={onClose}
              >
                Return to Site
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
