'use client';

import React, { useState } from 'react';
import { User, Phone, Mail, Clock, Send, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useUserAuth } from '@/lib/firebase/user-auth';

interface ContactSectionProps {
  enabled?: boolean;
}

export function ContactSection({ enabled = true }: ContactSectionProps) {
  const { currentUser } = useUserAuth();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (enabled === false) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (currentUser) {
        const token = await currentUser.getIdToken();
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Combine phone into message or subject for context if needed
      const fullMessage = phone ? `[Phone: ${phone}]\n\n${message}` : message;

      const res = await fetch('/api/contact', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          message: fullMessage.trim(),
          subject: `Consultation Inquiry from ${name.trim()}`,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send message. Please try again or call directly.');
      }

      setSuccessMessage('Thank you! Your inquiry has been sent to Geetha N. We will get back to you soon.');
      setName('');
      setPhone('');
      setEmail('');
      setMessage('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="py-20 bg-white border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-semibold text-[#138354] uppercase tracking-widest inline-block bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
            Get in Touch
          </span>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#0f2c59] mt-3 tracking-tight">
            Let’s Discuss Your Business Accounting
          </h2>
          <div className="w-20 h-1 bg-[#138354] mx-auto rounded-full my-3" />
          <p className="text-slate-600 text-base leading-relaxed">
            Reach out directly via phone or email, or drop a message using the form below.
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
                    <a href="tel:9538913912" className="text-base font-bold text-[#0f2c59] hover:text-[#138354] transition-colors">
                      9538913912
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
                      href="mailto:Cageethanofficail@gmail.com"
                      className="text-base font-bold text-[#0f2c59] hover:text-[#138354] transition-colors break-all"
                    >
                      Cageethanofficail@gmail.com
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
                  <p className="text-sm text-slate-600">Monday – Saturday: 9:00 AM – 6:00 PM</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Inquiry Form */}
          <div className="lg:col-span-7 bg-[#f8fafc] p-8 sm:p-10 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-xl font-bold font-serif text-[#0f2c59] mb-6">Send a Quick Inquiry</h3>

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
          </div>
        </div>
      </div>
    </section>
  );
}
