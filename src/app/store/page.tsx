'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ProductCard } from '@/components/home/ProductCard';
import { CheckoutModal } from '@/components/modals/CheckoutModal';
import { BookingModal } from '@/components/modals/BookingModal';
import { PRODUCTS } from '@/lib/data';
import { Product, ProductId } from '@/lib/types';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { MobileStickyBar } from '@/components/layout/MobileStickyBar';
import {
  fetchPublicStoreProducts,
  useDynamicPricing,
  useSectionContent,
  DEFAULT_STORE_PAGE_CONTENT,
} from '@/lib/firebase/content';
import { useCurrency } from '@/lib/context/CurrencyContext';

export default function StorePage() {
  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  const [selectedProductId, setSelectedProductId] = useState<ProductId | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const pricing = useDynamicPricing();
  const { formatPrice } = useCurrency();

  const { content: storePage } = useSectionContent(
    'storePage',
    DEFAULT_STORE_PAGE_CONTENT
  );

  React.useEffect(() => {
    fetchPublicStoreProducts().then((liveProducts) => {
      if (liveProducts && liveProducts.length > 0) {
        setProducts(liveProducts);
      }
    });
  }, []);

  const handleBuy = (product: Product) => {
    if (product.id === 'call') {
      setIsBookingOpen(true);
      return;
    }
    setSelectedProductId(product.id);
    setIsCheckoutOpen(true);
  };

  if (storePage.enabled === false) {
    return (
      <>
        <Navbar
          onOpenCommunityCheckout={() => {
            setSelectedProductId('community');
            setIsCheckoutOpen(true);
          }}
        />
        <main className="flex-1 pt-32 pb-20 sm:pt-40 sm:pb-28">
          <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
            <h1 className="font-editorial text-3xl sm:text-4xl text-[#181918]">Digital Toolkits & Operational References</h1>
            <p className="mt-4 text-base text-[#5C5E5B] max-w-lg mx-auto leading-relaxed">
              The store is currently undergoing updates. Please check back soon or visit our community.
            </p>
          </section>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar
        onOpenCommunityCheckout={() => {
          setSelectedProductId('community');
          setIsCheckoutOpen(true);
        }}
      />

      <main className="flex-1 pt-32 pb-20 sm:pt-40 sm:pb-28">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-4xl mx-auto mb-14">
          <span className="text-xs font-mono uppercase tracking-widest text-[#244634] font-semibold block mb-3">
            Digital Toolkits & Operational References
          </span>
          <h1 className="font-editorial text-4xl sm:text-5xl lg:text-6xl text-[#181918] leading-[1.1] font-normal tracking-tight">
            {storePage.title || 'Templates & Cheat Sheets'}
          </h1>
          <p className="font-editorial text-2xl sm:text-3xl text-[#244634] mt-3 mb-6">
            The exact documents I use.
          </p>
          <p className="text-lg text-[#5C5E5B] max-w-2xl mx-auto leading-relaxed">
            {storePage.subtitle ||
              'Plug-and-play references and templates from my own firm. Buy them on their own — or get every one of them free inside the community.'}
          </p>
        </section>

        {/* Member Perk Banner */}
        {storePage.communityPromoEnabled !== false && (
          <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
            <div className="bg-[#181918] text-[#FAF7F2] rounded-2xl p-8 sm:p-10 border border-[#2F322D] flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
              <div className="space-y-2 text-center md:text-left">
                <span className="inline-flex items-center gap-1.5 text-xs font-mono text-[#84A98C] uppercase tracking-wider font-semibold">
                  <Sparkles className="w-4 h-4 text-[#C9A96E]" />
                  Best Value Recommendation
                </span>
                <h2 className="font-editorial text-2xl sm:text-3xl font-normal text-[#FAF7F2]">
                  Everything here is free with community membership.
                </h2>
                <p className="text-sm text-[#A8A8A2] max-w-xl">
                  Instead of buying individual templates, join the community for{' '}
                  {formatPrice(pricing.community, 'mo')}. You get every file on this
                  page immediately, plus 2 weekly small-group calls with Geetha.
                </p>
              </div>

              <Button
                variant="primary"
                size="lg"
                onClick={() => {
                  setSelectedProductId('community');
                  setIsCheckoutOpen(true);
                }}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="whitespace-nowrap shrink-0"
              >
                Join the Community — {formatPrice(pricing.community, 'mo')}
              </Button>
            </div>
          </section>
        )}

        {/* Product Grid */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {products.map((prod) => (
              <ProductCard key={prod.id} product={prod} onBuy={handleBuy} />
            ))}
          </div>
        </section>
      </main>

      <Footer />
      <MobileStickyBar
        onJoinClick={() => {
          setSelectedProductId('community');
          setIsCheckoutOpen(true);
        }}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        productId={selectedProductId}
      />

      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        onProceedToPayment={() => {
          setSelectedProductId('call');
          setIsCheckoutOpen(true);
        }}
      />
    </>
  );
}
