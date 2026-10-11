'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { BookMockup } from '@/components/ui/BookMockup';
import { SampleChapterModal } from '@/components/modals/SampleChapterModal';
import { CheckoutModal } from '@/components/modals/CheckoutModal';
import { BOOK_CHAPTERS, FAQ_ITEMS } from '@/lib/data';
import { BookOpen, Download, Tablet, ArrowRight, ShieldCheck } from 'lucide-react';
import { MobileStickyBar } from '@/components/layout/MobileStickyBar';
import { fetchPublicBookContent, useDynamicPricing } from '@/lib/firebase/content';
import { BookContent } from '@/types/site-content';
import { useCurrency } from '@/lib/context/CurrencyContext';

export default function BookPage() {
  const [isSampleOpen, setIsSampleOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const pricing = useDynamicPricing();
  const { formatPrice } = useCurrency();
  const [bookData, setBookData] = useState<Partial<BookContent>>({
    title: 'Start a Bookkeeping Business',
    subtitle: 'How to build one that pays you well — and leaves you alone.',
    description:
      'The entire playbook in one book. How I went from zero clients to a calm, profitable firm — pricing, first clients, the monthly work, hiring, and getting your time back. Real numbers. Real mistakes. Real lessons. Read it in an afternoon, use it for years.',
    price: 29,
    format: 'PDF + EPUB (Instant Download)',
    compatibility: 'Kindle, Apple Books, Kobo',
    eyebrow: 'The Practical Guidebook',
  });

  React.useEffect(() => {
    fetchPublicBookContent().then((data) => {
      if (data) {
        setBookData((prev) => ({ ...prev, ...data }));
      }
    });
  }, []);

  const handleBuy = () => {
    setIsCheckoutOpen(true);
  };

  const currentBookPrice = pricing.book || bookData.price || 29;
  const chaptersList = bookData.chapters
    ? bookData.chapters.filter((c) => c.enabled !== false)
    : BOOK_CHAPTERS.map((c) => ({
        id: `chap-${c.number}`,
        number: String(c.number),
        title: c.title,
        description: c.summary,
      }));

  const defaultBookFaqs = FAQ_ITEMS.filter(
    (f) => f.category === 'book' || f.category === 'general'
  );

  const faqList = bookData.faq
    ? bookData.faq.filter((f) => f.enabled !== false)
    : defaultBookFaqs.map((f, idx: number) => ({
        id: `faq-${idx}`,
        question: f.question,
        answer: f.answer,
      }));

  return (
    <>
      <Navbar onOpenCommunityCheckout={() => setIsCheckoutOpen(true)} />

      <main className="flex-1 pt-32 pb-20 sm:pt-40 sm:pb-28">
        {/* Book Hero */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Left Mockup */}
            <div className="lg:col-span-5 flex justify-center order-2 lg:order-1">
              <BookMockup size="lg" />
            </div>

            {/* Right Information */}
            <div className="lg:col-span-7 space-y-6 order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EAF0EC] border border-[#C5D8CC] text-[#244634] text-xs font-semibold tracking-wider uppercase font-mono">
                {bookData.eyebrow || 'The Practical Guidebook'}
              </div>

              <h1 className="font-editorial text-4xl sm:text-5xl lg:text-6xl text-[#181918] leading-[1.08] font-normal tracking-tight">
                {bookData.title || 'Start a Bookkeeping Business'}
              </h1>

              <p className="font-editorial text-2xl sm:text-3xl text-[#244634]">
                {bookData.subtitle || 'How to build one that pays you well — and leaves you alone.'}
              </p>

              <p className="text-base sm:text-lg text-[#5C5E5B] leading-relaxed">
                {bookData.description ||
                  'The entire playbook in one book. How I went from zero clients to a calm, profitable firm — pricing, first clients, the monthly work, hiring, and getting your time back. Real numbers. Real mistakes. Real lessons. Read it in an afternoon, use it for years.'}
              </p>

              {/* Price & specs */}
              <div className="flex flex-wrap items-center gap-6 py-4 border-y border-[#E2DBD0]">
                <div>
                  <span className="text-xs uppercase font-mono text-[#706E69] block">Price</span>
                  <span className="font-editorial text-3xl text-[#181918]">{formatPrice(currentBookPrice)}</span>
                  <span className="text-xs text-[#5C5E5B] ml-1">one-time</span>
                </div>

                <div className="h-10 w-px bg-[#E2DBD0] hidden sm:block" />

                <div>
                  <span className="text-xs uppercase font-mono text-[#706E69] block">Formats</span>
                  <span className="text-sm font-semibold text-[#181918] flex items-center gap-1.5 mt-1">
                    <Download className="w-4 h-4 text-[#244634]" />
                    {bookData.format || 'PDF + EPUB (Instant Download)'}
                  </span>
                </div>

                <div className="h-10 w-px bg-[#E2DBD0] hidden sm:block" />

                <div>
                  <span className="text-xs uppercase font-mono text-[#706E69] block">Reading Device</span>
                  <span className="text-sm text-[#5C5E5B] flex items-center gap-1.5 mt-1">
                    <Tablet className="w-4 h-4 text-[#244634]" />
                    {bookData.compatibility || 'Kindle, Apple Books, Kobo'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleBuy}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                  className="w-full sm:w-auto"
                >
                  Get the Book — {formatPrice(currentBookPrice)}
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setIsSampleOpen(true)}
                  leftIcon={<BookOpen className="w-4 h-4 text-[#244634]" />}
                  className="w-full sm:w-auto"
                >
                  Read a Free Sample
                </Button>
              </div>

              <p className="text-xs text-[#706E69] flex items-center gap-1.5 pt-1">
                <ShieldCheck className="w-4 h-4 text-[#244634]" />
                Instant access. Download links sent to your inbox immediately upon checkout.
              </p>
            </div>
          </div>
        </section>

        {/* Table of Contents / Chapter Breakdown */}
        {chaptersList.length > 0 && (
          <section className="py-20 bg-[#F4EFE6]/70 border-y border-[#E8E2D7]">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-2xl mx-auto mb-14">
                <span className="text-xs font-mono uppercase tracking-widest text-[#244634] font-semibold block mb-2">
                  What&apos;s Inside
                </span>
                <h2 className="font-editorial text-3xl sm:text-4xl text-[#181918]">
                  Table of Contents (180 Pages)
                </h2>
                <p className="text-sm text-[#5C5E5B] mt-2">
                  Every chapter covers a distinct operational milestone in the life of a bookkeeping business.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {chaptersList.map((chapter, idx) => (
                  <div
                    key={chapter.id || idx}
                    className="bg-[#FFFFFF] border border-[#E2DBD0] rounded-xl p-6 shadow-xs flex items-start gap-4"
                  >
                    <span className="w-8 h-8 rounded-full bg-[#EAF0EC] text-[#244634] font-mono font-bold text-xs flex items-center justify-center shrink-0">
                      {chapter.number}
                    </span>
                    <div>
                      <h3 className="font-semibold text-base text-[#181918]">
                        {chapter.title}
                      </h3>
                      <p className="text-xs text-[#5C5E5B] mt-1.5 leading-relaxed">
                        {chapter.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-12 text-center">
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleBuy}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Purchase Book & Instant Downloads ({formatPrice(currentBookPrice)})
                </Button>
              </div>
            </div>
          </section>
        )}

        {/* FAQs */}
        {faqList.length > 0 && (
          <section className="py-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-editorial text-3xl text-center text-[#181918] mb-10">
              Book Questions & Answers
            </h2>
            <div className="space-y-6">
              {faqList.map((faq: { id?: string; question: string; answer: string }, idx: number) => (
                <div key={faq.id || idx} className="bg-[#FFFFFF] border border-[#E2DBD0] rounded-xl p-6">
                  <h3 className="font-semibold text-base text-[#181918] mb-2">
                    {faq.question}
                  </h3>
                  <p className="text-sm text-[#5C5E5B] leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
      <MobileStickyBar onJoinClick={() => setIsCheckoutOpen(true)} />

      <SampleChapterModal
        isOpen={isSampleOpen}
        onClose={() => setIsSampleOpen(false)}
        onBuyBook={handleBuy}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        productId="book"
        envKeyRequired="NEXT_PUBLIC_STRIPE_BOOK_PRICE_ID"
      />
    </>
  );
}
