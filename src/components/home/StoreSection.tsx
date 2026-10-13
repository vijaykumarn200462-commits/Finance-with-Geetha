'use client';

import React from 'react';
import Link from 'next/link';
import { SectionHeading } from '../ui/SectionHeading';
import { ProductCard } from './ProductCard';
import { PRODUCTS } from '@/lib/data';
import { Product } from '@/lib/types';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useDynamicPricing } from '@/lib/firebase/content';
import { formatPriceWithPeriod } from '@/lib/utils/currency';

import { StoreSectionContent } from '@/types/site-content';
import { fetchPublicStoreProducts } from '@/lib/firebase/content';

interface StoreSectionProps {
  onBuyProduct: (product: Product) => void;
  content?: StoreSectionContent;
}

export function StoreSection({ onBuyProduct, content }: StoreSectionProps) {
  const pricing = useDynamicPricing();
  const [liveProducts, setLiveProducts] = React.useState<Product[]>(PRODUCTS);

  React.useEffect(() => {
    fetchPublicStoreProducts().then((res) => {
      if (Array.isArray(res)) {
        setLiveProducts(res);
      }
    });
  }, []);

  if (content && content.enabled === false) {
    return null;
  }

  const eyebrow = content?.eyebrow || 'Firm Systems & Templates';
  const title = content?.title || 'Templates & Cheat Sheets';
  const description =
    content?.description ||
    'Plug-and-play references and templates from my own firm. Buy them on their own — or get every one of them free inside the community.';
  const communityNote =
    content?.communityNote || 'Everything here is free with community membership.';

  // Grab active featured products (cheatsheets & workflow or any other active ones)
  const storeFeaturedProducts = liveProducts
    .filter((p) => p.id === 'cheatsheets' || p.id === 'workflow')
    .slice(0, 2);

  if (storeFeaturedProducts.length === 0) {
    return null;
  }

  return (
    <section id="store" className="py-20 sm:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <SectionHeading
        eyebrow={eyebrow}
        title={title}
        description={description}
      />

      <p className="text-center font-editorial text-xl sm:text-2xl text-[#244634] mt-2 mb-14">
        The exact documents I use.
      </p>

      {/* 2-Column Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        {storeFeaturedProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onBuy={onBuyProduct}
          />
        ))}
      </div>

      {/* Bottom CTA Banner */}
      <div className="mt-14 max-w-3xl mx-auto bg-[#F4EFE6] border border-[#E2DBD0] rounded-xl p-6 sm:p-8 text-center flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-center sm:text-left">
          <p className="flex items-center justify-center sm:justify-start gap-1.5 font-semibold text-[#181918] text-sm">
            <Sparkles className="w-4 h-4 text-[#9A6B2F]" />
            {communityNote}
          </p>
          <p className="text-xs text-[#5C5E5B] mt-0.5">
            Join the community for {formatPriceWithPeriod(pricing.community, 'mo')} and download all templates instantly.
          </p>
        </div>

        <Link
          href="/store"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#244634] hover:text-[#1B3527] transition-colors whitespace-nowrap"
        >
          <span>Browse the whole store</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}
