import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { COLLECTIONS } from '@/lib/firebase/collections';
import { sendContactInquiryNotification } from '@/lib/email/contact-notification';
import { EmailDeliveryStatus } from '@/types/message';

// In-memory rate limiter for public inquiry protection (max 5 requests per 10 minutes per IP)
const ipRateLimitMap = new Map<string, { count: number; firstRequestTime: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 10 * 60 * 1000;
  const maxRequests = 5;

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

export async function POST(request: Request) {
  try {
    // 1. Check optional Firebase ID token
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
        console.warn('[Contact API] Bearer token invalid or expired:', msg);
        return NextResponse.json(
          { error: 'Your session has expired. Please log in again or submit as a guest.' },
          { status: 401 }
        );
      }
    } else {
      // Unauthenticated visitor: apply IP rate limiting
      const forwardedFor = request.headers.get('x-forwarded-for') || '127.0.0.1';
      const clientIp = forwardedFor.split(',')[0].trim();

      if (!checkRateLimit(clientIp)) {
        return NextResponse.json(
          { error: 'Too many inquiries sent from this network. Please wait a few minutes before submitting again.' },
          { status: 429 }
        );
      }
    }

    // 2. Validate request body
    const body = await request.json().catch(() => ({}));
    const { name, email, phone, message, topic, subject } = body;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json(
        { error: 'Please provide your full name (at least 2 characters).' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const contactEmail = (email && typeof email === 'string' && email.trim()) || verifiedEmail;
    if (!contactEmail || !emailRegex.test(contactEmail)) {
      return NextResponse.json(
        { error: 'Please provide a valid email address.' },
        { status: 400 }
      );
    }

    if (!message || typeof message !== 'string' || message.trim().length < 10) {
      return NextResponse.json(
        { error: 'Please provide a message with at least 10 characters detailing your bookkeeping needs.' },
        { status: 400 }
      );
    }

    const contactPhone = typeof phone === 'string' && phone.trim() ? phone.trim() : null;
    const inquiryTopic = (topic && typeof topic === 'string' && topic.trim()) ||
      (subject && typeof subject === 'string' && subject.trim()) ||
      'Bookkeeping & Accounting Inquiry';

    const submissionTime = new Date().toISOString();

    // 3. Dispatch Email Notification to cageethanofficial@gmail.com
    const emailResult = await sendContactInquiryNotification({
      name: name.trim(),
      email: contactEmail.trim(),
      phone: contactPhone,
      topic: inquiryTopic,
      message: message.trim(),
      submittedAt: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    });

    const deliveryStatus: EmailDeliveryStatus = emailResult.status;

    // 4. Save Inquiry to Firestore (messages collection)
    const docRef = await adminDb.collection(COLLECTIONS.MESSAGES).add({
      userId: verifiedUserId,
      name: name.trim(),
      email: contactEmail.trim(),
      phone: contactPhone,
      topic: inquiryTopic,
      message: message.trim(),
      status: 'unread',
      isPublic: verifiedUserId === 'public_inquiry',
      emailDeliveryStatus: deliveryStatus,
      emailDeliveryError: emailResult.error || null,
      emailDeliveryId: emailResult.id || null,
      emailRecipient: emailResult.recipient,
      emailSentAt: emailResult.success ? submissionTime : null,
      createdAt: submissionTime,
      updatedAt: submissionTime,
    });

    const messageId = docRef.id;

    console.log('[Contact Message Stored in Firestore]', {
      id: messageId,
      userId: verifiedUserId,
      name: name.trim(),
      email: contactEmail.trim(),
      phone: contactPhone,
      emailDeliveryStatus: deliveryStatus,
      recipient: emailResult.recipient,
    });

    // 5. Construct accurate response message
    let responseMessage: string;
    if (emailResult.success) {
      responseMessage = `Thank you for reaching out! Your inquiry has been delivered directly to Geetha N. (${emailResult.recipient}). You will receive a response within 24–48 business hours.`;
    } else if (emailResult.status === 'not_configured') {
      responseMessage = `Thank you! Your inquiry has been safely stored in our system. Email notifications are currently being configured by our administrator. Geetha can view your message in the admin console, or you may call directly at 9538913912.`;
    } else {
      responseMessage = `Your inquiry has been saved in our system! However, direct email delivery reported: "${emailResult.error || 'Delivery issue'}". Geetha has access to your inquiry in the admin portal, and you may also call directly at 9538913912.`;
    }

    return NextResponse.json({
      success: true,
      inquirySaved: true,
      messageId,
      emailDelivered: emailResult.success,
      emailDeliveryStatus: deliveryStatus,
      emailDeliveryError: emailResult.error || null,
      emailRecipient: emailResult.recipient,
      message: responseMessage,
    });
  } catch (error: unknown) {
    console.error('Contact route error:', error);
    return NextResponse.json(
      { error: 'Something went wrong while processing your inquiry. Please try again or reach out directly by phone.' },
      { status: 500 }
    );
  }
}
