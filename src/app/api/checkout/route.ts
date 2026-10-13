import { NextResponse } from 'next/server';
import { isStripeConfigured, stripe, PRODUCT_NAMES } from '@/lib/stripe';
import { ProductId } from '@/lib/types';
import { isFirebaseAdminValid, adminDb } from '@/lib/firebase/admin';
import { isCurrencySupported, CurrencyCode, BASE_CURRENCY } from '@/lib/geo/country-currency';
import { getExchangeRates, convertInrToTargetCurrency } from '@/lib/currency/exchange-service';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const productId = body.productId as ProductId;
    const requestedCurrencyRaw = (body.currency || 'INR') as string;

    if (!productId || !PRODUCT_NAMES[productId]) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    // Validate requested currency; default to base currency (INR) if invalid
    const currency: CurrencyCode = isCurrencySupported(requestedCurrencyRaw)
      ? (requestedCurrencyRaw.toUpperCase() as CurrencyCode)
      : BASE_CURRENCY;

    const productInfo = PRODUCT_NAMES[productId];
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    // 1. Read authoritative product record from server-side Firestore
    let basePriceInr = productInfo.amount / 100; // Baseline Rupees
    let isProductActive = true;
    let resolvedProductName = productInfo.name;

    try {
      if (isFirebaseAdminValid() && adminDb) {
        const prodSnap = await adminDb.collection('products').doc(productId).get();
        if (prodSnap.exists) {
          const pData = prodSnap.data();
          if (pData?.active === false) {
            isProductActive = false;
          }
          if (pData?.name) {
            resolvedProductName = pData.name;
          }
          if (typeof pData?.price === 'number') {
            basePriceInr = pData.price;
          }
        }
      }
    } catch (dbErr) {
      console.warn('Could not read Firestore product price for checkout:', dbErr);
    }

    // Reject disabled products from purchase
    if (!isProductActive) {
      return NextResponse.json(
        { error: 'This product is currently disabled and not available for purchase.' },
        { status: 400 }
      );
    }

    // 2. Obtain authoritative server exchange rates & calculate target amount
    const ratesData = await getExchangeRates();
    const conversion = convertInrToTargetCurrency(basePriceInr, currency, ratesData.rates);

    const chargeAmountMajor = conversion.amount;
    const chargeAmountMinor = conversion.minorUnits;
    const exchangeRateUsed = conversion.rateUsed;

    // 3. Fallback when Stripe credentials are not configured in test/dev
    if (!isStripeConfigured || !stripe) {
      return NextResponse.json({
        isConfigured: false,
        product: {
          ...productInfo,
          name: resolvedProductName,
          amount: chargeAmountMinor,
          displayAmount: chargeAmountMajor,
          currency,
          basePriceInr,
          exchangeRate: exchangeRateUsed,
        },
        productId,
        currency,
        envKeyRequired: `NEXT_PUBLIC_STRIPE_${productId.toUpperCase()}_PRICE_ID`,
        message: 'Payment setup notice: Stripe secret key or price IDs are not configured yet in .env.local.',
      });
    }

    // 4. Create Stripe Checkout Session with dynamic price data in the validated currency
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: resolvedProductName,
            },
            unit_amount: chargeAmountMinor,
            recurring: productInfo.mode === 'subscription' ? { interval: 'month' } : undefined,
          },
          quantity: 1,
        },
      ],
      mode: productInfo.mode,
      metadata: {
        productId,
        productName: resolvedProductName,
        basePriceInr: String(basePriceInr),
        baseCurrency: 'INR',
        chargedCurrency: currency,
        chargedAmount: String(chargeAmountMajor),
        exchangeRate: String(exchangeRateUsed),
        exchangeRateTimestamp: ratesData.timestamp,
      },
      success_url: `${siteUrl}/thank-you?session_id={CHECKOUT_SESSION_ID}&product=${productId}`,
      cancel_url: `${siteUrl}/store`,
    });

    return NextResponse.json({
      isConfigured: true,
      url: session.url,
      currency,
      amount: chargeAmountMajor,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('Stripe checkout error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
