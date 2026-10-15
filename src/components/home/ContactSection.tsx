'use client';

import React, { useState } from 'react';
import { User, Phone, Mail, Clock, Send, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useUserAuth } from '@/lib/firebase/user-auth';

import { ContactPageContent } from '@/types/site-content';

interface ContactSectionProps {
  content?: ContactPageContent;
  enabled?: boolean;
}

export function ContactSection({ content, enabled = true }: ContactSectionProps) {
  const { currentUser } = useUserAuth();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState(
    () => 'inq_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10)
  );

  if (enabled === false || (content && content.enabled === false)) {
    return null;
  }

  const title = content?.title || 'Let’s Discuss Your Business Accounting';
  const subtitle = content?.subtitle || 'Reach out directly via phone or email, or drop a message using the form below.';
  const supportEmail = content?.supportEmail || 'cageethanofficial@gmail.com';
  const supportPhone = content?.phone || '9538913912';
  const workingHours = content?.workingHours || 'Monday – Saturday: 9:00 AM – 6:00 PM';
  const isFormEnabled = content?.formEnabled !== false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return; // Guard against double-clicks
    setIsSubmitting(true);
    setSuccessMessage(null);
    setInfoMessage(null);
    setErrorMessage(null);

    // Client-side validation
    if (name.trim().length < 2) {
      setErrorMessage('Please enter your full name (at least 2 characters).');
      setIsSubmitting(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMessage('Please enter a valid email address.');
      setIsSubmitting(false);
      return;
    }

    if (message.trim().length < 10) {
      setErrorMessage('Please provide a message with at least 10 characters detailing your bookkeeping needs.');
      setIsSubmitting(false);
      return;
    }

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
      };

      if (currentUser) {
        const token = await currentUser.getIdToken();
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/contact', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          idempotencyKey,
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          message: message.trim(),
          topic: 'Bookkeeping & Accounting Inquiry',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit inquiry. Please try again or call directly.');
      }

      if (data.emailDelivered) {
        setSuccessMessage(data.message || 'Thank you! Your inquiry has been sent to Geetha N.');
      } else {
        setInfoMessage(data.message || 'Your inquiry was saved successfully to our system.');
      }

      // Reset form fields after successful save and regenerate key
      setName('');
      setPhone('');
      setEmail('');
      setMessage('');
      setIdempotencyKey('inq_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="py-20 bg-white border-t border-slate-200 scroll-mt-24 sm:scroll-mt-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-semibold text-[#138354] uppercase tracking-widest inline-block bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
            Get in Touch
          </span>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#0f2c59] mt-3 tracking-tight">
            {title}
          </h2>
          <div className="w-20 h-1 bg-[#138354] mx-auto rounded-full my-3" />
          <p className="text-slate-600 text-base leading-relaxed">
            {subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Contact Details Column */}
          <div className="lg:col-span-5 space-y-8 bg-[#f8fafc] p-8 sm:p-10 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="space-y-6">
              <h3 className="text-xl font-bold font-serif text-[#0f2c59]">Contact Details</h3>
              <div className="space-y-5">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-[#0f2c59] text-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                    <User className="w-5 h-5 text-emerald-300" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Professional</p>
                    <p className="text-base font-bold text-slate-800">Geetha N.</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-[#0f2c59] text-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Phone className="w-5 h-5 text-emerald-300" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Phone Number</p>
                    <a href={`tel:${supportPhone.replace(/\D/g, '')}`} className="text-base font-bold text-[#0f2c59] hover:text-[#138354] transition-colors">
                      {supportPhone}
                    </a>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-[#0f2c59] text-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Mail className="w-5 h-5 text-emerald-300" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Email Address</p>
                    <a
                      href={`mailto:${supportEmail}`}
                      className="text-base font-bold text-[#0f2c59] hover:text-[#138354] transition-colors break-all"
                    >
                      {supportEmail}
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-200">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-[#138354] flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm text-[#0f2c59] mb-1">Working Hours</h4>
                  <p className="text-sm text-slate-600">{workingHours}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Inquiry Form */}
          <div className="lg:col-span-7 bg-[#f8fafc] p-8 sm:p-10 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-xl font-bold font-serif text-[#0f2c59] mb-6">Send a Quick Inquiry</h3>

            {!isFormEnabled ? (
              <div className="p-6 bg-amber-50/80 border border-amber-200 rounded-xl text-center">
                <p className="text-sm font-medium text-amber-900 mb-2">
                  Direct Inquiries Preferred
                </p>
                <p className="text-xs text-amber-800">
                  Online submissions are currently paused. Please reach out directly by calling{' '}
                  <a href={`tel:${supportPhone}`} className="font-semibold underline">
                    {supportPhone}
                  </a>{' '}
                  or emailing{' '}
                  <a href={`mailto:${supportEmail}`} className="font-semibold underline">
                    {supportEmail}
                  </a>.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="inquiry-name" className="block text-xs font-semibold text-slate-700 uppercase mb-1.5 tracking-wider">
                    Your Name
                  </label>
                  <input
                    type="text"
                    id="inquiry-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0f2c59] focus:border-transparent bg-white text-slate-800 text-sm"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label htmlFor="inquiry-phone" className="block text-xs font-semibold text-slate-700 uppercase mb-1.5 tracking-wider">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="inquiry-phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0f2c59] focus:border-transparent bg-white text-slate-800 text-sm"
                    placeholder="9876543210"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="inquiry-email" className="block text-xs font-semibold text-slate-700 uppercase mb-1.5 tracking-wider">
                  Email Address
                </label>
                <input
                  type="email"
                  id="inquiry-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0f2c59] focus:border-transparent bg-white text-slate-800 text-sm"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label htmlFor="inquiry-message" className="block text-xs font-semibold text-slate-700 uppercase mb-1.5 tracking-wider">
                  Message / Service Needed
                </label>
                <textarea
                  id="inquiry-message"
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0f2c59] focus:border-transparent bg-white text-slate-800 text-sm"
                  placeholder="Tell me about your business and bookkeeping requirements..."
                />
              </div>

              {errorMessage && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-sm flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-[#138354] flex-shrink-0 mt-0.5" />
                  <span>{successMessage}</span>
                </div>
              )}

              {infoMessage && (
                <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-sm flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <span>{infoMessage}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#0f2c59] hover:bg-[#138354] disabled:opacity-60 text-white font-bold py-3.5 rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting Inquiry...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit Inquiry</span>
                  </>
                )}
              </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
