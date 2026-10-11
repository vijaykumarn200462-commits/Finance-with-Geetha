import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { adminDb } from '@/lib/firebase/admin';
import { COLLECTIONS } from '@/lib/firebase/firestore';

export async function POST(request: Request) {
  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret || webhookSecret.includes('placeholder')) {
      console.warn('Stripe webhook received but STRIPE_WEBHOOK_SECRET is not configured.');
      return NextResponse.json({ message: 'Webhook received (unconfigured mode)' });
    }

    if (!stripe) {
      return NextResponse.json({ error: 'Stripe client unavailable' }, { status: 500 });
    }

    const payload = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid signature';
      console.error('Webhook signature verification failed:', msg);
      return NextResponse.json({ error: `Webhook Error: ${msg}` }, { status: 400 });
    }

    const nowIso = new Date().toISOString();

    // 1. Checkout session completed
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const customerEmail = session.customer_details?.email || session.customer_email || 'unknown@example.com';
      const customerName = session.customer_details?.name || 'Customer';
      const productId = session.metadata?.productId || 'unknown';
      const productName = session.metadata?.productName || 'Bookkeeping Coaching Product';
      const amount = (session.amount_total || 0) / 100;
      const currency = (session.currency || 'inr').toUpperCase();
      const paymentId = session.payment_intent || session.id;

      // Save Order into Firestore with multi-currency audit trail
      const orderRef = adminDb.collection(COLLECTIONS.ORDERS).doc(session.id);
      await orderRef.set({
        id: session.id,
        customerName,
        customerEmail,
        productId,
        productName,
        amount,
        currency,
        originalBaseAmount: session.metadata?.basePriceInr ? Number(session.metadata.basePriceInr) : amount,
        baseCurrency: session.metadata?.baseCurrency || 'INR',
        chargedAmount: session.metadata?.chargedAmount ? Number(session.metadata.chargedAmount) : amount,
        chargedCurrency: session.metadata?.chargedCurrency || currency,
        exchangeRate: session.metadata?.exchangeRate ? Number(session.metadata.exchangeRate) : 1,
        exchangeRateTimestamp: session.metadata?.exchangeRateTimestamp || nowIso,
        stripeSessionId: session.id,
        paymentProvider: 'stripe',
        paymentId,
        status: 'paid',
        createdAt: nowIso,
        updatedAt: nowIso,
      });

      // Update or create User in users collection
      const userQuery = await adminDb
        .collection(COLLECTIONS.USERS)
        .where('email', '==', customerEmail)
        .limit(1)
        .get();

      if (!userQuery.empty) {
        const userDoc = userQuery.docs[0];
        const existingData = userDoc.data();
        await userDoc.ref.update({
          orderCount: (existingData.orderCount || 0) + 1,
          totalSpent: (existingData.totalSpent || 0) + amount,
          updatedAt: nowIso,
        });
      } else {
        await adminDb.collection(COLLECTIONS.USERS).add({
          name: customerName,
          email: customerEmail,
          role: 'customer',
          orderCount: 1,
          totalSpent: amount,
          communityStatus: productId === 'community' ? 'active' : 'none',
          createdAt: nowIso,
          updatedAt: nowIso,
        });
      }

      // If Community membership, add to community_members collection
      if (productId === 'community' || session.mode === 'subscription') {
        const customerId =
          typeof session.customer === 'string'
            ? session.customer
            : session.customer && 'id' in session.customer
            ? session.customer.id
            : customerEmail;

        const subscriptionId =
          typeof session.subscription === 'string'
            ? session.subscription
            : session.subscription && 'id' in session.subscription
            ? (session.subscription as { id: string }).id
            : undefined;

        const memberRef = adminDb
          .collection(COLLECTIONS.COMMUNITY_MEMBERS)
          .doc(customerId);

        await memberRef.set({
          userId: customerId,
          name: customerName,
          email: customerEmail,
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId,
          status: 'active',
          plan: 'Monthly Community Membership',
          amount,
          currency,
          startDate: nowIso,
          renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: nowIso,
          updatedAt: nowIso,
        });
      }
    }

    // 2. Subscription cancelled / deleted
    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription;
      const memberQuery = await adminDb
        .collection(COLLECTIONS.COMMUNITY_MEMBERS)
        .where('stripeSubscriptionId', '==', subscription.id)
        .limit(1)
        .get();

      if (!memberQuery.empty) {
        await memberQuery.docs[0].ref.update({
          status: 'cancelled',
          cancelledAt: nowIso,
          updatedAt: nowIso,
        });
      }
    }

    // 3. Subscription updated
    if (event.type === 'customer.subscription.updated') {
      const subscription = event.data.object as Stripe.Subscription;
      const memberQuery = await adminDb
        .collection(COLLECTIONS.COMMUNITY_MEMBERS)
        .where('stripeSubscriptionId', '==', subscription.id)
        .limit(1)
        .get();

      if (!memberQuery.empty) {
        const subStatus = subscription.status; // active, past_due, canceled
        const mappedStatus =
          subStatus === 'active'
            ? 'active'
            : subStatus === 'past_due'
            ? 'past_due'
            : 'cancelled';

        const periodEnd = (subscription as unknown as { current_period_end?: number }).current_period_end;
        await memberQuery.docs[0].ref.update({
          status: mappedStatus,
          renewalDate: periodEnd
            ? new Date(periodEnd * 1000).toISOString()
            : undefined,
          updatedAt: nowIso,
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: unknown) {
    console.error('Webhook processing error:', err);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
