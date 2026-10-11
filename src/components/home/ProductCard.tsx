'use client';

import React from 'react';
import { Product } from '@/lib/types';
import { Check, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '../ui/Button';
import { useDynamicPricing } from '@/lib/firebase/content';
import { useCurrency } from '@/lib/context/CurrencyContext';

interface ProductCardProps {
  product: Product;
  onBuy: (product: Product) => void;
}

export function ProductCard({ product, onBuy }: ProductCardProps) {
  const pricing = useDynamicPricing();
  const { formatPrice } = useCurrency();

  const displayPrice =
    product.id === 'community'
      ? pricing.community
      : product.id === 'book'
      ? pricing.book
      : product.id === 'cheatsheets'
      ? pricing.cheatsheets
      : product.id === 'workflow'
      ? pricing.workflow
      : product.id === 'call'
      ? pricing.call
      : product.price;

  const ctaLabel =
    product.id === 'call'
      ? `Book a Strategy Call — ${formatPrice(displayPrice)}`
      : product.id === 'community' || product.period === 'month'
      ? `Join the Community — ${formatPrice(displayPrice, 'mo')}`
      : `Get ${product.name} — ${formatPrice(displayPrice)}`;

  return (
    <div className="bg-[#FFFFFF] border border-[#E2DBD0] rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-xs hover:border-[#244634] hover:shadow-md transition-all duration-300">
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded bg-[#EAF0EC] text-[#244634] border border-[#C5D8CC]">
            {product.format || 'Digital Tool'}
          </span>
          {product.freeWithCommunity && (
            <span className="text-[11px] font-mono text-[#84A98C] bg-[#181918] px-2 py-0.5 rounded flex items-center gap-1 font-medium">
              <Sparkles className="w-3 h-3 text-[#C9A96E]" />
              Free in Community
            </span>
          )}
        </div>

        {/* Name & Subtitle */}
        <h3 className="font-editorial text-2xl text-[#181918]">
          {product.name}
        </h3>
        <p className="text-xs font-medium text-[#244634] mt-1">
          {product.subtitle}
        </p>

        {/* Description */}
        <p className="text-sm text-[#5C5E5B] mt-3 leading-relaxed">
          {product.description}
        </p>

        {/* Price display */}
        <div className="my-6 py-4 border-y border-[#F0EBE1] flex items-baseline gap-2">
          <span className="font-editorial text-4xl text-[#181918] font-normal">
            {formatPrice(displayPrice)}
          </span>
          {product.valueComparison && (
            <span className="text-xs text-[#706E69] line-through">
              {product.valueComparison}
            </span>
          )}
          <span className="text-xs text-[#706E69]">
            {product.period === 'month' ? '/month' : 'one-time'}
          </span>
        </div>

        {/* Included items */}
        <div className="space-y-2 mb-6">
          <p className="text-[11px] font-mono uppercase tracking-wider text-[#706E69] font-semibold">
            Included in bundle:
          </p>
          <ul className="space-y-1.5 text-xs text-[#484A46]">
            {product.features.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-[#244634] shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div>
        <Button
          variant="primary"
          size="md"
          className="w-full justify-center"
          onClick={() => onBuy({ ...product, price: displayPrice })}
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          {ctaLabel}
        </Button>
      </div>
    </div>
  );
}
