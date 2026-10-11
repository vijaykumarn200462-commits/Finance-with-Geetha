import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { COLLECTIONS } from '@/lib/firebase/firestore';

export async function POST(request: Request) {
  try {
    // 1. Verify Authentication Token using Firebase Admin SDK
    let idToken: string | undefined;
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      idToken = authHeader.split('Bearer ')[1].trim();
    }

    if (!idToken) {
      return NextResponse.json(
        { error: 'Authentication required. Please log in before submitting a message.' },
        { status: 401 }
      );
    }

    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch (tokenErr: unknown) {
      const msg = tokenErr instanceof Error ? tokenErr.message : 'Invalid or expired token';
      console.warn('[Contact API] Token verification failed:', msg);
      return NextResponse.json(
        { error: 'Authentication session expired or invalid. Please sign in again.' },
        { status: 401 }
      );
    }

    // Verified Firebase UID from Admin SDK token verification
    const verifiedUserId = decodedToken.uid;
    const verifiedEmail = decodedToken.email;

    // 2. Validate request body
    const body = await request.json();
    const { name, email, message, topic } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Please provide your name.' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const contactEmail = (email && typeof email === 'string' && email.trim()) || verifiedEmail;
    if (!contactEmail || !emailRegex.test(contactEmail)) {
      return NextResponse.json({ error: 'Please provide a valid email address.' }, { status: 400 });
    }

    if (!message || typeof message !== 'string' || message.trim().length < 10) {
      return NextResponse.json(
        { error: 'Please enter a message with at least 10 characters.' },
        { status: 400 }
      );
    }

    // 3. Save directly to Firestore messages collection with verified userId
    const docRef = await adminDb.collection(COLLECTIONS.MESSAGES).add({
      userId: verifiedUserId,
      name: name.trim(),
      email: contactEmail.trim(),
      topic: topic || 'General Inquiry',
      message: message.trim(),
      status: 'unread',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const messageId = docRef.id;

    // Server-side logging for development & audit
    console.log('[Contact Message Stored]', {
      id: messageId,
      userId: verifiedUserId,
      name: name.trim(),
      email: contactEmail.trim(),
      topic: topic || 'General Inquiry',
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
