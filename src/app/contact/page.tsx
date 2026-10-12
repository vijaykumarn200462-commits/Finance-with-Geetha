'use client';

import React, { useState } from 'react';
import Link from 'next/link';

import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { useUserAuth } from '@/lib/firebase/user-auth';
import {
  Mail,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Clock,
  MapPin,
  Lock,
  UserCheck,
  Loader2,
} from 'lucide-react';
import {
  useSectionContent,
  useContactSettings,
  DEFAULT_CONTACT_PAGE_CONTENT,
} from '@/lib/firebase/content';

export default function ContactPage() {
  const { currentUser, userProfile, isAuthenticated, loading, getIdToken } = useUserAuth();
  const { content: contactPageData } = useSectionContent(
    'contactPage',
    DEFAULT_CONTACT_PAGE_CONTENT
  );
  const contactSettings = useContactSettings();

  const defaultName = userProfile?.name || currentUser?.displayName || '';
  const defaultEmail = currentUser?.email || userProfile?.email || '';

  const [customName, setCustomName] = useState<string | null>(null);
  const [customEmail, setCustomEmail] = useState<string | null>(null);

  const name = customName !== null ? customName : defaultName;
  const email = customEmail !== null ? customEmail : defaultEmail;

  const [topic, setTopic] = useState('General Question');
  const [message, setMessage] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (message.trim().length < 10) {
      setErrorMessage('Please provide a message with at least 10 characters.');
      return;
    }

    setIsLoading(true);

    try {
      // Fetch verified Firebase ID token for Authorization header
      const idToken = await getIdToken();
      if (!idToken) {
        throw new Error('Your session has expired. Please sign in again before submitting.');
      }

      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          topic,
          message: message.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit message.');
      }

      setIsSuccess(true);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Something went wrong. Please try again or email directly.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  if (contactPageData.enabled === false) {
    return (
      <>
        <Navbar />
        <main className="flex-1 pt-32 pb-20 sm:pt-40 sm:pb-28">
          <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
            <h1 className="font-editorial text-3xl sm:text-4xl text-[#181918]">Get in Touch</h1>
            <p className="mt-4 text-base text-[#5C5E5B] max-w-lg mx-auto leading-relaxed">
              Inquiries are currently closed. Please email us directly at{' '}
              <a
                href={`mailto:${contactSettings.supportEmail || 'cageethanofficial@gmail.com'}`}
                className="underline text-[#244634]"
              >
                {contactSettings.supportEmail || 'cageethanofficial@gmail.com'}
              </a>
              .
            </p>
          </section>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />

      <main className="flex-1 pt-32 pb-20 sm:pt-40 sm:pb-28">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16 text-center max-w-3xl mx-auto">
          <span className="text-xs font-mono uppercase tracking-widest text-[#244634] font-semibold block mb-3">
            Direct Communication
          </span>
          <h1 className="font-editorial text-4xl sm:text-5xl lg:text-6xl text-[#181918] leading-[1.1] font-normal tracking-tight">
            {contactPageData.title || 'Get in Touch'}
          </h1>
          <p className="font-editorial text-2xl text-[#244634] mt-2 mb-4">
            {contactPageData.subtitle || 'Have a question about the community, the book, or coaching?'}
          </p>
          <p className="text-base text-[#5C5E5B] max-w-xl mx-auto leading-relaxed">
            {contactPageData.directCopy ||
              'I review every message personally. If you have a specific question about whether the community fits your stage, send a note below.'}
          </p>
        </section>

        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Contact Form / Gate Column (7 cols) */}
            <div className="lg:col-span-7 bg-[#FFFFFF] border border-[#E2DBD0] rounded-2xl p-8 sm:p-10 shadow-sm">
              {contactPageData.formEnabled === false ? (
                /* Form Disabled / Closed State */
                <div className="text-center py-12 space-y-4">
                  <div className="w-14 h-14 rounded-full bg-[#FAF7F2] text-[#244634] flex items-center justify-center mx-auto border border-[#E2DBD0]">
                    <Clock className="w-7 h-7" />
                  </div>
                  <h3 className="font-editorial text-2xl text-[#181918]">
                    Inquiries Currently Paused
                  </h3>
                  <p className="text-sm text-[#5C5E5B] max-w-md mx-auto leading-relaxed">
                    {contactPageData.availabilityNote ||
                      'The web contact form is temporarily paused. Please reach Geetha directly via email.'}
                  </p>
                  <p className="text-sm font-semibold text-[#244634] pt-2">
                    <a
                      href={`mailto:${contactSettings.supportEmail || 'cageethanofficial@gmail.com'}`}
                      className="hover:underline"
                    >
                      {contactSettings.supportEmail || 'cageethanofficial@gmail.com'}
                    </a>
                  </p>
                </div>
              ) : loading ? (
                /* Auth Loading State */
                <div className="text-center py-16 space-y-4">
                  <Loader2 className="w-8 h-8 text-[#244634] animate-spin mx-auto" />
                  <p className="text-sm text-[#706E69] font-mono">
                    Verifying customer session...
                  </p>
                </div>
              ) : !isAuthenticated ? (
                /* Gated: Unauthenticated Visitor Flow */
                <div className="text-center py-8 space-y-6">
                  <div className="w-14 h-14 rounded-full bg-[#FAF7F2] text-[#244634] flex items-center justify-center mx-auto border border-[#E2DBD0] shadow-2xs">
                    <Lock className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-xs font-mono uppercase tracking-widest text-[#244634] font-semibold block mb-2">
                      Authentication Required
                    </span>
                    <h3 className="font-editorial text-3xl text-[#181918]">
                      Please Log In to Contact Us
                    </h3>
                    <p className="text-sm text-[#5C5E5B] max-w-md mx-auto mt-3 leading-relaxed">
                      Geetha personally reviews every inquiry. To protect our community and provide
                      direct, verified replies, please sign in or create an account before sending
                      a message.
                    </p>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Button
                      variant="primary"
                      size="md"
                      href="/login?redirect=/contact"
                      className="w-full sm:w-auto justify-center"
                      rightIcon={<ArrowRight className="w-4 h-4" />}
                    >
                      Log In to Contact Geetha
                    </Button>
                    <Button
                      variant="outline"
                      size="md"
                      href="/register?redirect=/contact"
                      className="w-full sm:w-auto justify-center"
                    >
                      Create Account
                    </Button>
                  </div>

                  <p className="text-xs text-[#706E69] pt-2">
                    Already a customer or community member? Use your existing credentials.
                  </p>
                </div>
              ) : isSuccess ? (
                /* Form Success State */
                <div className="text-center py-8 space-y-4">
                  <div className="w-14 h-14 rounded-full bg-[#EAF0EC] text-[#244634] flex items-center justify-center mx-auto border border-[#C5D8CC]">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="font-editorial text-3xl text-[#181918]">
                    Message Sent
                  </h3>
                  <p className="text-sm text-[#5C5E5B] max-w-md mx-auto leading-relaxed">
                    Thank you, {name}! Your message has been received. Geetha reads all notes personally
                    and will reply to <strong>{email}</strong> within 24–48 business hours.
                  </p>
                  <div className="pt-4">
                    <Button
                      variant="outline"
                      size="md"
                      onClick={() => {
                        setIsSuccess(false);
                        setMessage('');
                        setCustomName(null);
                        setCustomEmail(null);
                      }}
                    >
                      Send Another Note
                    </Button>

                  </div>
                </div>
              ) : (
                /* Authenticated Contact Form */
                <div>
                  <div className="flex items-center justify-between pb-4 mb-5 border-b border-[#E8E2D7]">
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-[#244634]" />
                      <span className="text-xs font-mono text-[#244634] font-medium">
                        Verified Customer: {currentUser?.email}
                      </span>
                    </div>
                    <Link
                      href="/account"
                      className="text-xs text-[#706E69] hover:text-[#244634] underline font-mono"
                    >
                      Profile
                    </Link>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                    {errorMessage && (
                      <div className="p-4 rounded-lg bg-[#FFF2F0] border border-[#F5C2BC] text-sm text-[#992218] flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <div>{errorMessage}</div>
                      </div>
                    )}

                    <div>
                      <label
                        htmlFor="contact-name"
                        className="block text-xs font-semibold text-[#181918] uppercase tracking-wider mb-2 font-mono"
                      >
                        Your Name <span className="text-[#9A6B2F]">*</span>
                      </label>
                      <input
                        id="contact-name"
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setCustomName(e.target.value)}
                        placeholder="e.g. Rachel Thomas"
                        className="w-full px-4 py-3 rounded-lg border border-[#D5CDC0] bg-[#FAF7F2] text-sm text-[#181918] focus:bg-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#244634] transition-all"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="contact-email"
                        className="block text-xs font-semibold text-[#181918] uppercase tracking-wider mb-2 font-mono"
                      >
                        Your Email Address <span className="text-[#9A6B2F]">*</span>
                      </label>
                      <input
                        id="contact-email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setCustomEmail(e.target.value)}
                        placeholder="e.g. rachel@thomasbookkeeping.com"
                        className="w-full px-4 py-3 rounded-lg border border-[#D5CDC0] bg-[#FAF7F2] text-sm text-[#181918] focus:bg-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#244634] transition-all"
                      />
                    </div>


                    <div>
                      <label
                        htmlFor="contact-topic"
                        className="block text-xs font-semibold text-[#181918] uppercase tracking-wider mb-2 font-mono"
                      >
                        Topic
                      </label>
                      <select
                        id="contact-topic"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-[#D5CDC0] bg-[#FAF7F2] text-sm text-[#181918] focus:bg-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#244634] transition-all"
                      >
                        <option value="Community Questions">Community Questions</option>
                        <option value="Book Purchase or Format">Book Purchase or Format</option>
                        <option value="1-on-1 Strategy Call">1-on-1 Strategy Call</option>
                        <option value="Templates & Store Inquiry">Templates & Store Inquiry</option>
                        <option value="Podcast / Speaking / General">Podcast / Speaking / General</option>
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="contact-message"
                        className="block text-xs font-semibold text-[#181918] uppercase tracking-wider mb-2 font-mono"
                      >
                        Message <span className="text-[#9A6B2F]">*</span>
                      </label>
                      <textarea
                        id="contact-message"
                        required
                        rows={5}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Tell me a bit about where you are in your bookkeeping business and what you're wondering about..."
                        className="w-full px-4 py-3 rounded-lg border border-[#D5CDC0] bg-[#FAF7F2] text-sm text-[#181918] focus:bg-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#244634] transition-all resize-none"
                      />
                    </div>

                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      isLoading={isLoading}
                      className="w-full justify-center text-base"
                      rightIcon={<ArrowRight className="w-4 h-4" />}
                    >
                      Send Message
                    </Button>
                  </form>
                </div>
              )}
            </div>

            {/* Sidebar Details (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-[#FFFFFF] border border-[#E2DBD0] rounded-2xl p-6 sm:p-8 space-y-5">
                <h3 className="font-editorial text-2xl text-[#181918]">
                  Direct Contact Information
                </h3>

                <div className="space-y-4 text-sm text-[#5C5E5B]">
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-[#244634] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-[#181918]">Email</p>
                      <a
                        href={`mailto:${contactSettings.supportEmail || 'cageethanofficial@gmail.com'}`}
                        className="text-[#244634] hover:underline"
                      >
                        {contactSettings.supportEmail || 'cageethanofficial@gmail.com'}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-[#244634] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-[#181918]">Response Time</p>
                      <p className="text-xs text-[#706E69]">
                        Within 24–48 business hours (Mon–Fri). I don&apos;t check coaching emails on weekends.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-[#244634] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-[#181918]">Firm Location</p>
                      <p className="text-xs text-[#706E69]">
                        Finance with Geetha
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* No-BS promise card */}
              <div className="bg-[#FAF7F2] border border-[#E2DBD0] rounded-2xl p-6 space-y-2 text-xs text-[#5C5E5B]">
                <p className="font-mono uppercase tracking-wider text-[#244634] font-semibold">
                  Zero Spam Guarantee
                </p>
                <p className="leading-relaxed">
                  Your email is never shared, sold, or added to high-pressure sales sequences. You will receive an honest, human reply from Geetha.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
