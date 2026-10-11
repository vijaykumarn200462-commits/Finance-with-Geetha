'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Hero } from '@/components/home/Hero';
import { Stats } from '@/components/home/Stats';
import { TeachingSection } from '@/components/home/TeachingSection';
import { CommunitySection } from '@/components/home/CommunitySection';
import { CallStructure } from '@/components/home/CallStructure';
import { BookSection } from '@/components/home/BookSection';
import { StoreSection } from '@/components/home/StoreSection';
import { OneOnOneSection } from '@/components/home/OneOnOneSection';
import { AboutSection } from '@/components/home/AboutSection';
import { FinalCTA } from '@/components/home/FinalCTA';
import { Footer } from '@/components/layout/Footer';
import { MobileStickyBar } from '@/components/layout/MobileStickyBar';
import { CheckoutModal } from '@/components/modals/CheckoutModal';
import { SampleChapterModal } from '@/components/modals/SampleChapterModal';
import { BookingModal } from '@/components/modals/BookingModal';
import { Product, ProductId } from '@/lib/types';
import { useCurrency } from '@/lib/context/CurrencyContext';

import {
  useAllSiteContent,
  DEFAULT_HERO_CONTENT,
  DEFAULT_STATS_CONTENT,
  DEFAULT_TEACHING_CONTENT,
  DEFAULT_COMMUNITY_CONTENT,
  DEFAULT_CALL_STRUCTURE_CONTENT,
  DEFAULT_BOOK_SECTION_CONTENT,
  DEFAULT_STORE_SECTION_CONTENT,
  DEFAULT_ONE_ON_ONE_CONTENT,
  DEFAULT_ABOUT_CONTENT,
  DEFAULT_FINAL_CTA_CONTENT,
} from '@/lib/firebase/content';
import {
  HeroContent,
  StatsContent,
  TeachingContent,
  CommunityContent,
  CallStructureContent,
  BookSectionContent,
  StoreSectionContent,
  OneOnOneContent,
  AboutContent,
  FinalCTAContent,
} from '@/types/site-content';

export default function HomePage() {
  const [selectedProductId, setSelectedProductId] = useState<ProductId | null>(null);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isSampleModalOpen, setIsSampleModalOpen] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [envKeyRequired, setEnvKeyRequired] = useState<string | undefined>();
  const { selectedCurrency } = useCurrency();

  const { isSectionEnabled, getSection } = useAllSiteContent();

  const heroContent = getSection<HeroContent>('hero', DEFAULT_HERO_CONTENT);
  const statsContent = getSection<StatsContent>('stats', DEFAULT_STATS_CONTENT);
  const teachingContent = getSection<TeachingContent>('teaching', DEFAULT_TEACHING_CONTENT);
  const communityContent = getSection<CommunityContent>('community', DEFAULT_COMMUNITY_CONTENT);
  const callStructureContent = getSection<CallStructureContent>('callStructure', DEFAULT_CALL_STRUCTURE_CONTENT);
  const bookContent = getSection<BookSectionContent>('book', DEFAULT_BOOK_SECTION_CONTENT);
  const storeContent = getSection<StoreSectionContent>('store', DEFAULT_STORE_SECTION_CONTENT);
  const oneOnOneContent = getSection<OneOnOneContent>('oneOnOne', DEFAULT_ONE_ON_ONE_CONTENT);
  const aboutContent = getSection<AboutContent>('about', DEFAULT_ABOUT_CONTENT);
  const finalCtaContent = getSection<FinalCTAContent>('finalCta', DEFAULT_FINAL_CTA_CONTENT);

  // Universal handler for product checkouts
  const handleCheckout = async (productId: ProductId) => {
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, currency: selectedCurrency }),
      });

      const data = await res.json();

      if (data.isConfigured && data.url) {
        window.location.href = data.url;
      } else {
        setSelectedProductId(productId);
        setEnvKeyRequired(data.envKeyRequired);
        setIsCheckoutModalOpen(true);
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setSelectedProductId(productId);
      setIsCheckoutModalOpen(true);
    }
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Person',
        name: 'Geetha',
        jobTitle: 'Finance Coach & Firm Founder',
        worksFor: {
          '@type': 'Organization',
          name: 'Finance with Geetha',
        },
        description:
          'Runs a calm, profitable 60-client bookkeeping firm and coaches other bookkeepers on pricing, discovery calls, and workflows.',
        url: 'https://financewithgeetha.com',
      },
      {
        '@type': 'WebSite',
        name: 'Finance with Geetha',
        url: 'https://financewithgeetha.com',
        description:
          'Learn how to actually build a bookkeeping business. Flat pricing, discovery calls, QuickBooks workflow, and client retention.',
      },
      {
        '@type': 'Book',
        name: 'Start a Bookkeeping Business',
        author: {
          '@type': 'Person',
          name: 'Geetha',
        },
        bookFormat: 'EBook',
        numberOfPages: 180,
        offers: {
          '@type': 'Offer',
          price: '29.00',
          priceCurrency: 'INR',
          availability: 'https://schema.org/InStock',
        },
      },
    ],
  };

  return (
    <>
      {/* Structured Data JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Navbar onOpenCommunityCheckout={() => handleCheckout('community')} />

      <main className="flex-1">
        {isSectionEnabled('hero') && (
          <Hero
            content={heroContent}
            onJoinCommunity={() => handleCheckout('community')}
            onGetBook={() => handleCheckout('book')}
          />
        )}

        {isSectionEnabled('stats') && <Stats content={statsContent} />}

        {isSectionEnabled('teaching') && <TeachingSection content={teachingContent} />}

        {isSectionEnabled('community') && (
          <CommunitySection
            content={communityContent}
            onJoinClick={() => handleCheckout('community')}
          />
        )}

        {isSectionEnabled('callStructure') && <CallStructure content={callStructureContent} />}

        {isSectionEnabled('book') && (
          <BookSection
            content={bookContent}
            onBuyBook={() => handleCheckout('book')}
            onReadSample={() => setIsSampleModalOpen(true)}
          />
        )}

        {isSectionEnabled('store') && (
          <StoreSection
            content={storeContent}
            onBuyProduct={(prod: Product) => handleCheckout(prod.id)}
          />
        )}

        {isSectionEnabled('oneOnOne') && (
          <OneOnOneSection
            content={oneOnOneContent}
            onBookCall={() => setIsBookingModalOpen(true)}
          />
        )}

        {isSectionEnabled('about') && <AboutSection content={aboutContent} />}

        {isSectionEnabled('finalCta') && (
          <FinalCTA
            content={finalCtaContent}
            onJoinCommunity={() => handleCheckout('community')}
            onGetBook={() => handleCheckout('book')}
          />
        )}
      </main>

      <Footer />

      {/* Mobile Sticky Floating CTA */}
      <MobileStickyBar onJoinClick={() => handleCheckout('community')} />

      {/* Interactive Modals */}
      <CheckoutModal
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
        productId={selectedProductId}
        envKeyRequired={envKeyRequired}
      />

      <SampleChapterModal
        isOpen={isSampleModalOpen}
        onClose={() => setIsSampleModalOpen(false)}
        onBuyBook={() => handleCheckout('book')}
      />

      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        onProceedToPayment={() => handleCheckout('call')}
      />
    </>
  );
}
