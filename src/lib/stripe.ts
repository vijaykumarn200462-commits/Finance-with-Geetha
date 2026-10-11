import Stripe from 'stripe';
import { ProductId } from './types';

export const isStripeConfigured = Boolean(
  process.env.STRIPE_SECRET_KEY &&
  !process.env.STRIPE_SECRET_KEY.includes('placeholder')
);

// Server-side Stripe client singleton
export const stripe = isStripeConfigured
  ? new Stripe(process.env.STRIPE_SECRET_KEY as string)
  : null;

export const PRODUCT_PRICE_ENV_MAP: Record<ProductId, string | undefined> = {
  community: process.env.NEXT_PUBLIC_STRIPE_COMMUNITY_PRICE_ID,
  book: process.env.NEXT_PUBLIC_STRIPE_BOOK_PRICE_ID,
  cheatsheets: process.env.NEXT_PUBLIC_STRIPE_CHEATSHEETS_PRICE_ID,
  workflow: process.env.NEXT_PUBLIC_STRIPE_WORKFLOW_PRICE_ID,
  call: process.env.NEXT_PUBLIC_STRIPE_CALL_PRICE_ID,
};

export const PRODUCT_NAMES: Record<ProductId, { name: string; amount: number; mode: 'subscription' | 'payment' }> = {
  community: {
    name: 'The Community (Monthly Membership)',
    amount: 15000,
    mode: 'subscription',
  },
  book: {
    name: 'Start a Bookkeeping Business (Book)',
    amount: 2900,
    mode: 'payment',
  },
  cheatsheets: {
    name: "The Bookkeeper's Cheat Sheets (5-Pack)",
    amount: 4000,
    mode: 'payment',
  },
  workflow: {
    name: 'Bookkeeping Monthly Workflow Template',
    amount: 2500,
    mode: 'payment',
  },
  call: {
    name: '1-on-1 Strategy Call (30 Minutes)',
    amount: 15000,
    mode: 'payment',
  },
};
