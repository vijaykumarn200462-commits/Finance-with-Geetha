import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { COLLECTIONS } from '@/lib/firebase/collections';
import {
  sendContactInquiryNotification,
  getContactNotificationRecipient,
} from '@/lib/email/contact-notification';
import { ContactMessage, EmailDeliveryStatus } from '@/types/message';

// In-memory rate limiter for public inquiry protection (max 30 requests per 10 minutes per IP)
const ipRateLimitMap = new Map<string, { count: number; firstRequestTime: number }>();

function checkRateLimit(ip: string): boolean {
  // Allow loopback during local development / testing without hitting 429
  if (process.env.NODE_ENV !== 'production' && (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost')) {
    return true;
  }

  const now = Date.now();
  const windowMs = 10 * 60 * 1000;
  const maxRequests = 30;

  const record = ipRateLimitMap.get(ip);
  if (!record || now - record.firstRequestTime > windowMs) {
    ipRateLimitMap.set(ip, { count: 1, firstRequestTime: now });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count += 1;
  return true;
}

/**
 * Sanitizes input text to prevent script injection and normalize whitespace.
 */
function sanitizeText(input: unknown, maxLength = 2000): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/<[^>]*>?/gm, '') // Strip HTML tags
    .replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\uD800-\uDFFF]/g, '') // Strip control chars
    .trim()
    .slice(0, maxLength);
}

/**
 * Sanitizes phone numbers, keeping only digits, spaces, plus, hyphens, and parentheses.
 */
function sanitizePhone(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const cleaned = input.replace(/[^\d+()\-\s]/g, '').trim();
  return cleaned.length >= 6 ? cleaned.slice(0, 30) : null;
}

export async function POST(request: Request) {
  const correlationId = 'req_' + Math.random().toString(36).slice(2, 10);

  try {
    // 1. Verify optional Firebase ID token
    let idToken: string | undefined;
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      idToken = authHeader.split('Bearer ')[1].trim();
    }

    let verifiedUserId = 'public_inquiry';
    let verifiedEmail: string | undefined;

    if (idToken) {
      try {
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        verifiedUserId = decodedToken.uid;
        verifiedEmail = decodedToken.email;
      } catch (tokenErr: unknown) {
        const msg = tokenErr instanceof Error ? tokenErr.message : 'Invalid token';
        console.warn('[Contact API - Auth Warning]', { correlationId, error: msg });
        return NextResponse.json(
          { error: 'Your session has expired. Please submit as a guest or log in again.' },
          { status: 401 }
        );
      }
    } else {
      // Unauthenticated visitor: apply IP rate limiting
      const forwardedFor = request.headers.get('x-forwarded-for') || '127.0.0.1';
      const clientIp = forwardedFor.split(',')[0].trim();

      if (!checkRateLimit(clientIp)) {
        console.warn('[Contact API - Rate Limited]', { correlationId, clientIp });
        return NextResponse.json(
          { error: 'Too many inquiries sent from this network. Please wait a few minutes before submitting again.' },
          { status: 429 }
        );
      }
    }

    // 2. Parse and validate request body
    const body = await request.json().catch(() => ({}));
    const rawName = body.name;
    const rawEmail = body.email;
    const rawPhone = body.phone;
    const rawMessage = body.message;
    const rawTopic = body.topic || body.subject;
    const rawIdempotencyKey =
      body.idempotencyKey ||
      request.headers.get('idempotency-key') ||
      request.headers.get('x-idempotency-key');

    const sanitizedName = sanitizeText(rawName, 100);
    if (!sanitizedName || sanitizedName.length < 2) {
      return NextResponse.json(
        { error: 'Please provide your full name (at least 2 characters).' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const inputEmail = typeof rawEmail === 'string' ? rawEmail.trim().toLowerCase() : '';
    const contactEmail = inputEmail || (verifiedEmail ? verifiedEmail.toLowerCase() : '');

    if (!contactEmail || !emailRegex.test(contactEmail) || contactEmail.length > 150) {
      return NextResponse.json(
        { error: 'Please provide a valid email address.' },
        { status: 400 }
      );
    }

    const sanitizedMessage = sanitizeText(rawMessage, 4000);
    if (!sanitizedMessage || sanitizedMessage.length < 10) {
      return NextResponse.json(
        { error: 'Please provide a message with at least 10 characters detailing your bookkeeping needs.' },
        { status: 400 }
      );
    }

    const sanitizedPhone = sanitizePhone(rawPhone);
    const sanitizedTopic = sanitizeText(rawTopic, 120) || 'Bookkeeping & Accounting Inquiry';
    const submissionTime = new Date().toISOString();
    const recipient = getContactNotificationRecipient();

    // 3. Resolve Idempotency Key
    let idempotencyKey: string;
    if (typeof rawIdempotencyKey === 'string' && rawIdempotencyKey.trim().length > 0) {
      const trimmed = rawIdempotencyKey.trim();
      if (!/^[a-zA-Z0-9_\-:.]{8,128}$/.test(trimmed)) {
        return NextResponse.json(
          { error: 'Invalid idempotency key format. Must be 8-128 alphanumeric characters, hyphens, colons, or underscores.' },
          { status: 400 }
        );
      }
      idempotencyKey = trimmed;
    } else {
      // Deterministic fallback based on content and 5-minute bucket window
      const timeBucket = Math.floor(Date.now() / (5 * 60 * 1000));
      const hashContent = `${contactEmail}|${sanitizedPhone || ''}|${sanitizedTopic}|${sanitizedMessage}|${timeBucket}`;
      idempotencyKey = 'auto_' + crypto.createHash('sha256').update(hashContent).digest('hex').slice(0, 32);
    }

    // Fingerprint of the exact payload content
    const requestHash = crypto
      .createHash('sha256')
      .update(`${contactEmail}|${sanitizedName}|${sanitizedPhone || ''}|${sanitizedMessage}`)
      .digest('hex');

    // 4. Primary Protection: Atomic Idempotency via Firestore Transaction
    const idemRef = adminDb.collection(COLLECTIONS.INQUIRY_IDEMPOTENCY).doc(idempotencyKey);
    let targetInquiryId = '';

    try {
      const txResult = await adminDb.runTransaction(async (transaction) => {
        const idemSnap = await transaction.get(idemRef);

        if (idemSnap.exists) {
          const data = idemSnap.data();

          // Reject if same idempotency key was reused with different payload contents
          if (data?.requestHash && data.requestHash !== requestHash) {
            return { conflict: true as const };
          }

          return {
            exists: true as const,
            inquiryId: data?.inquiryId as string,
            status: data?.status as string,
            response: data?.response,
          };
        }

        // Allocate a new inquiry message document
        const newMessageRef = adminDb.collection(COLLECTIONS.MESSAGES).doc();
        const newId = newMessageRef.id;

        const initialDocData: ContactMessage = {
          id: newId,
          userId: verifiedUserId,
          idempotencyKey,
          name: sanitizedName,
          email: contactEmail,
          phone: sanitizedPhone,
          topic: sanitizedTopic,
          message: sanitizedMessage,
          status: 'unread',
          isPublic: verifiedUserId === 'public_inquiry',
          emailDeliveryStatus: 'pending',
          emailDeliveryError: null,
          emailDeliveryId: null,
          emailRecipient: recipient,
          emailSentAt: null,
          createdAt: submissionTime,
          updatedAt: submissionTime,
        };

        transaction.set(newMessageRef, initialDocData);
        transaction.set(idemRef, {
          idempotencyKey,
          inquiryId: newId,
          status: 'processing',
          requestHash,
          createdAt: submissionTime,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        });

        return { exists: false as const, inquiryId: newId };
      });

      if (txResult.conflict) {
        console.warn('[Contact API - Idempotency Conflict]', { correlationId, idempotencyKey });
        return NextResponse.json(
          { error: 'Idempotency key was previously used with different submission contents.' },
          { status: 409 }
        );
      }

      if (txResult.exists) {
        targetInquiryId = txResult.inquiryId;
        const prevResp = txResult.response;

        console.log('[Contact API - Duplicate Prevented (Idempotent Replay)]', {
          correlationId,
          idempotencyKey,
          inquiryId: targetInquiryId,
        });

        return NextResponse.json({
          success: true,
          inquirySaved: true,
          duplicatePrevented: true,
          messageId: targetInquiryId,
          idempotencyKey,
          emailDelivered: prevResp?.emailDelivered ?? false,
          emailDeliveryStatus: prevResp?.emailDeliveryStatus ?? 'pending',
          emailRecipient: recipient,
          message: 'Your inquiry has already been received! We will be in touch with you shortly.',
        });
      }

      targetInquiryId = txResult.inquiryId;
    } catch (txErr: unknown) {
      console.error('[Contact API - Firestore Idempotency Transaction Error]', { correlationId, error: txErr });
      return NextResponse.json(
        { error: 'Database service unavailable while initiating inquiry. Please retry.' },
        { status: 503 }
      );
    }

    // 5. Secondary Check: 60-second duplicate protection for identical content
    // Prevents duplicate documents when different keys are randomly generated for identical content
    try {
      const sixtySecondsAgo = new Date(Date.now() - 60 * 1000).toISOString();
      let duplicateDocId: string | null = null;
      let duplicateDeliveryStatus: EmailDeliveryStatus = 'pending';

      try {
        const recentSnap = await adminDb
          .collection(COLLECTIONS.MESSAGES)
          .where('email', '==', contactEmail)
          .where('createdAt', '>=', sixtySecondsAgo)
          .orderBy('createdAt', 'asc')
          .get();

        const match = recentSnap.docs.find((d) => {
          if (d.id === targetInquiryId) return false;
          const data = d.data();
          return (
            data.name === sanitizedName &&
            data.message === sanitizedMessage &&
            data.phone === sanitizedPhone
          );
        });

        if (match) {
          duplicateDocId = match.id;
          duplicateDeliveryStatus = match.data().emailDeliveryStatus || 'pending';
        }
      } catch (indexErr: unknown) {
        const errObj = indexErr as { code?: number; message?: string };
        const isIndexErr = errObj?.code === 9 || errObj?.message?.includes('requires an index');

        if (isIndexErr) {
          console.warn('[Contact API - Index Warning]', {
            correlationId,
            message: 'Firestore composite index on (messages: email ASC, createdAt ASC) is missing or building. Falling back to in-memory check.',
            adminAction: 'Deploy firestore.indexes.json using: firebase deploy --only firestore:indexes --project geetha-coaching',
          });

          // Fallback: Query by email and filter in memory so deduplication is NOT skipped
          const fallbackSnap = await adminDb
            .collection(COLLECTIONS.MESSAGES)
            .where('email', '==', contactEmail)
            .get();

          const match = fallbackSnap.docs.find((d) => {
            if (d.id === targetInquiryId) return false;
            const data = d.data();
            return (
              data.createdAt &&
              data.createdAt >= sixtySecondsAgo &&
              data.name === sanitizedName &&
              data.message === sanitizedMessage &&
              data.phone === sanitizedPhone
            );
          });

          if (match) {
            duplicateDocId = match.id;
            duplicateDeliveryStatus = match.data().emailDeliveryStatus || 'pending';
          }
        } else {
          console.error('[Contact API - Recent Inquiries Check Error]', { correlationId, error: indexErr });
        }
      }

      if (duplicateDocId) {
        console.log('[Contact API - Duplicate Prevented (Recent Message Window)]', {
          correlationId,
          reusedInquiryId: duplicateDocId,
          abortedNewId: targetInquiryId,
        });

        // Clean up the newly staged empty document since we are reusing the existing one
        await adminDb.collection(COLLECTIONS.MESSAGES).doc(targetInquiryId).delete().catch(() => {});
        await idemRef.set({
          idempotencyKey,
          inquiryId: duplicateDocId,
          status: 'completed',
          requestHash,
          createdAt: submissionTime,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          response: {
            inquirySaved: true,
            emailDelivered: duplicateDeliveryStatus === 'sent',
            emailDeliveryStatus: duplicateDeliveryStatus,
            emailRecipient: recipient,
          },
        });

        return NextResponse.json({
          success: true,
          inquirySaved: true,
          duplicatePrevented: true,
          messageId: duplicateDocId,
          idempotencyKey,
          emailDelivered: duplicateDeliveryStatus === 'sent',
          emailDeliveryStatus: duplicateDeliveryStatus,
          emailRecipient: recipient,
          message: 'Your inquiry has already been received! We will be in touch with you shortly.',
        });
      }
    } catch (dedupErr) {
      console.warn('[Contact API - Deduplication Secondary Check Skipped]', { correlationId, error: dedupErr });
    }

    // 6. ATTEMPT EMAIL DELIVERY TO cageethanofficial@gmail.com
    let deliveryStatus: EmailDeliveryStatus = 'pending';
    let deliveryError: string | null = null;
    let deliveryId: string | null = null;

    try {
      const emailResult = await sendContactInquiryNotification({
        inquiryId: targetInquiryId,
        name: sanitizedName,
        email: contactEmail,
        phone: sanitizedPhone,
        topic: sanitizedTopic,
        message: sanitizedMessage,
        submittedAt: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      });

      deliveryStatus = emailResult.status;
      deliveryError = emailResult.error || null;
      deliveryId = emailResult.id || null;

      const now = new Date().toISOString();

      // Update Firestore message document
      await adminDb.collection(COLLECTIONS.MESSAGES).doc(targetInquiryId).update({
        emailDeliveryStatus: deliveryStatus,
        emailDeliveryError: deliveryError,
        emailDeliveryId: deliveryId,
        emailSentAt: emailResult.success ? now : null,
        updatedAt: now,
      });

      // Update idempotency cache
      await idemRef.update({
        status: 'completed',
        response: {
          inquirySaved: true,
          emailDelivered: emailResult.success,
          emailDeliveryStatus: deliveryStatus,
          emailRecipient: recipient,
        },
        updatedAt: now,
      });

      if (deliveryStatus === 'sent') {
        console.log('[Contact API - Inquiry Saved & Email Sent]', {
          correlationId,
          inquiryId: targetInquiryId,
          deliveryId,
          recipient,
        });
      } else if (deliveryStatus === 'not_configured') {
        console.log('[Contact API - Inquiry Saved & Provider Not Configured]', {
          correlationId,
          inquiryId: targetInquiryId,
          recipient,
          diagnostic: deliveryError,
        });
      } else {
        console.warn('[Contact API - Inquiry Saved & Email Failed]', {
          correlationId,
          inquiryId: targetInquiryId,
          recipient,
          error: deliveryError,
        });
      }
    } catch (emailErr: unknown) {
      deliveryStatus = 'failed';
      deliveryError =
        emailErr instanceof Error
          ? emailErr.message
          : 'Unexpected exception during email notification dispatch';

      await adminDb.collection(COLLECTIONS.MESSAGES).doc(targetInquiryId).update({
        emailDeliveryStatus: 'failed',
        emailDeliveryError: deliveryError,
        updatedAt: new Date().toISOString(),
      });

      await idemRef.update({
        status: 'completed',
        response: {
          inquirySaved: true,
          emailDelivered: false,
          emailDeliveryStatus: 'failed',
          emailRecipient: recipient,
        },
        updatedAt: new Date().toISOString(),
      });

      console.error('[Contact API - Email Dispatch Exception]', { correlationId, inquiryId: targetInquiryId, error: emailErr });
    }

    // 7. Return honest customer response
    let responseMessage: string;
    if (deliveryStatus === 'sent') {
      responseMessage = `Thank you for reaching out! Your inquiry has been delivered directly to Geetha N. (${recipient}). You will receive a response within 24–48 business hours.`;
    } else if (deliveryStatus === 'not_configured') {
      responseMessage = `Thank you! Your inquiry has been safely received and stored in our system. Geetha can view your inquiry in the admin console, or you may call directly at 9538913912.`;
    } else {
      responseMessage = `Thank you! Your inquiry was safely recorded in our system. Geetha will review your message in the admin console, and you may also call directly at 9538913912.`;
    }

    return NextResponse.json({
      success: true,
      inquirySaved: true,
      messageId: targetInquiryId,
      idempotencyKey,
      emailDelivered: deliveryStatus === 'sent',
      emailDeliveryStatus: deliveryStatus,
      emailDeliveryError: deliveryError,
      emailRecipient: recipient,
      message: responseMessage,
    });
  } catch (error: unknown) {
    console.error('[Contact API Fatal Error]', { correlationId, error });
    return NextResponse.json(
      { error: 'Something went wrong while processing your inquiry. Please try again or reach out directly by phone.' },
      { status: 500 }
    );
  }
}
