import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { COLLECTIONS } from '@/lib/firebase/collections';

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
          { error: 'Too many inquiries sent. Please wait a few minutes before submitting again.' },
          { status: 429 }
        );
      }
    }

    // 2. Validate request body
    const body = await request.json().catch(() => ({}));
    const { name, email, phone, message, topic } = body;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json({ error: 'Please provide your full name (at least 2 characters).' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const contactEmail = (email && typeof email === 'string' && email.trim()) || verifiedEmail;
    if (!contactEmail || !emailRegex.test(contactEmail)) {
      return NextResponse.json({ error: 'Please provide a valid email address.' }, { status: 400 });
    }

    if (!message || typeof message !== 'string' || message.trim().length < 10) {
      return NextResponse.json(
        { error: 'Please provide a message with at least 10 characters.' },
        { status: 400 }
      );
    }

    const contactPhone = typeof phone === 'string' && phone.trim() ? phone.trim() : null;

    // 3. Save directly to Firestore messages collection
    const docRef = await adminDb.collection(COLLECTIONS.MESSAGES).add({
      userId: verifiedUserId,
      name: name.trim(),
      email: contactEmail.trim(),
      phone: contactPhone,
      topic: (topic && typeof topic === 'string') ? topic.trim() : 'Bookkeeping Services',
      message: message.trim(),
      status: 'unread',
      isPublic: verifiedUserId === 'public_inquiry',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const messageId = docRef.id;

    console.log('[Contact Message Stored]', {
      id: messageId,
      userId: verifiedUserId,
      name: name.trim(),
      email: contactEmail.trim(),
      phone: contactPhone,
      timestamp: new Date().toISOString(),
    });

    // 4. Send email notification via Resend if key is available
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey && !resendKey.includes('placeholder')) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${resendKey}`,
          },
          body: JSON.stringify({
            from: 'Finance with Geetha <cageethanofficial@gmail.com>',
            to: process.env.CONTACT_NOTIFICATION_EMAIL || 'cageethanofficial@gmail.com',
            reply_to: contactEmail.trim(),
            subject: `New Coaching Inquiry from ${name.trim()} [${topic || 'General'}]`,
            text: `Name: ${name.trim()}\nEmail: ${contactEmail.trim()}\nUser ID: ${verifiedUserId}\nTopic: ${topic || 'General'}\n\nMessage:\n${message.trim()}`,
          }),
        });
      } catch (err) {
        console.warn('Resend notification dispatch failed:', err);
      }
    }

    return NextResponse.json({
      success: true,
      messageId,
      message: 'Thank you for reaching out. Geetha reviews all inquiries personally and will respond within 24–48 business hours.',
    });
  } catch (error: unknown) {
    console.error('Contact route error:', error);
    return NextResponse.json(
      { error: 'Something went wrong while processing your message. Please try again.' },
      { status: 500 }
    );
  }
}
