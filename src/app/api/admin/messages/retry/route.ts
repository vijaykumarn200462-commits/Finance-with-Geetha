import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { COLLECTIONS } from '@/lib/firebase/collections';
import { verifyAdminRequest } from '@/lib/firebase/admin-verify';
import { sendContactInquiryNotification } from '@/lib/email/contact-notification';
import { ContactMessage } from '@/types/message';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const correlationId = 'retry_' + Math.random().toString(36).slice(2, 10);

  try {
    // 1. Authorize Admin Request
    const authCheck = await verifyAdminRequest(request);
    if (!authCheck.authorized) {
      const statusCode = authCheck.status === 403 ? 403 : 401;
      console.warn('[Admin Retry - Unauthorized]', {
        correlationId,
        statusCode,
        error: authCheck.error,
        hasAuthHeader: Boolean(request.headers.get('authorization')),
      });

      return NextResponse.json(
        {
          success: false,
          error: authCheck.error || 'Authentication required.',
          message: statusCode === 403
            ? 'Access denied. Account lacks active administrator privileges.'
            : 'Authentication required. No session or valid bearer token provided.',
        },
        { status: statusCode }
      );
    }

    // 2. Validate Request Body
    const body = await request.json().catch(() => ({}));
    const { id, force } = body;

    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Inquiry ID is required and must be a valid string.' },
        { status: 400 }
      );
    }

    const messageId = id.trim();
    const docRef = adminDb.collection(COLLECTIONS.MESSAGES).doc(messageId);

    // 3. Concurrency Protection & Document Verification via Transaction
    const lockResult = await adminDb.runTransaction(async (transaction) => {
      const snap = await transaction.get(docRef);
      if (!snap.exists) {
        return { notFound: true as const };
      }

      const data = snap.data() as ContactMessage;

      // Prevent duplicate sends if already delivered unless explicitly forced
      if (data.emailDeliveryStatus === 'sent' && !force) {
        return { alreadySent: true as const, data };
      }

      // Concurrency lock: prevent parallel requests from sending duplicate notifications
      if (data.emailDeliveryStatus === 'sending') {
        return { inProgress: true as const, data };
      }

      // Acquire lock by setting status to 'sending'
      transaction.update(docRef, {
        emailDeliveryStatus: 'sending',
        updatedAt: new Date().toISOString(),
      });

      return { acquired: true as const, data };
    });

    if (lockResult.notFound) {
      console.warn('[Admin Retry - Not Found]', { correlationId, inquiryId: messageId });
      return NextResponse.json(
        { success: false, inquiryId: messageId, error: 'Inquiry message not found in database.' },
        { status: 404 }
      );
    }

    if (lockResult.alreadySent) {
      console.log('[Admin Retry - Already Sent]', { correlationId, inquiryId: messageId });
      return NextResponse.json(
        {
          success: false,
          inquiryId: messageId,
          status: 'sent',
          alreadySent: true,
          emailDeliveryStatus: 'sent',
          emailSentAt: lockResult.data?.emailSentAt,
          message: 'Notification email has already been delivered to the recipient.',
        },
        { status: 409 }
      );
    }

    if (lockResult.inProgress) {
      console.warn('[Admin Retry - In Progress]', { correlationId, inquiryId: messageId });
      return NextResponse.json(
        {
          success: false,
          inquiryId: messageId,
          status: 'sending',
          emailDeliveryStatus: 'sending',
          message: 'Email delivery is already in progress for this inquiry. Please wait a moment.',
        },
        { status: 409 }
      );
    }

    const msg = lockResult.data!;

    // 4. Attempt Email Delivery
    const result = await sendContactInquiryNotification({
      inquiryId: messageId,
      name: msg.name,
      email: msg.email,
      phone: msg.phone,
      topic: msg.topic,
      message: msg.message,
      submittedAt: msg.createdAt || new Date().toISOString(),
    });

    const now = new Date().toISOString();

    // 5. Update Firestore record with delivery result
    await docRef.update({
      emailDeliveryStatus: result.status,
      emailDeliveryError: result.error || null,
      emailDeliveryId: result.id || null,
      emailSentAt: result.success ? now : msg.emailSentAt || null,
      updatedAt: now,
    });

    // 6. Return Accurate HTTP Status Code & Response Structure
    if (result.success) {
      console.log('[Admin Retry - Succeeded]', {
        correlationId,
        inquiryId: messageId,
        status: result.status,
        deliveryId: result.id,
        recipient: result.recipient,
      });

      return NextResponse.json(
        {
          success: true,
          inquiryId: messageId,
          status: 'sent',
          emailDeliveryStatus: 'sent',
          emailDeliveryId: result.id,
          recipient: result.recipient,
          message: `Notification email successfully delivered to ${result.recipient}.`,
        },
        { status: 200 }
      );
    }

    if (result.status === 'not_configured') {
      console.warn('[Admin Retry - Provider Not Configured]', {
        correlationId,
        inquiryId: messageId,
        recipient: result.recipient,
        diagnostic: result.error,
      });

      return NextResponse.json(
        {
          success: false,
          inquiryId: messageId,
          status: 'not_configured',
          emailDeliveryStatus: 'not_configured',
          emailDeliveryError: result.error,
          message: 'Email provider is not configured. Please set RESEND_API_KEY in server environment.',
        },
        { status: 503 }
      );
    }

    console.error('[Admin Retry - Provider Failed]', {
      correlationId,
      inquiryId: messageId,
      status: result.status,
      error: result.error,
    });

    return NextResponse.json(
      {
        success: false,
        inquiryId: messageId,
        status: 'failed',
        emailDeliveryStatus: 'failed',
        emailDeliveryError: result.error,
        message: `Email delivery attempt failed: ${result.error || 'Provider rejected request.'}`,
      },
      { status: 502 }
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Internal error retrying email delivery.';
    console.error('[Admin Retry - Fatal Exception]', { correlationId, error: err });
    return NextResponse.json(
      { success: false, error: errorMsg, message: 'Internal server error while retrying email delivery.' },
      { status: 500 }
    );
  }
}
