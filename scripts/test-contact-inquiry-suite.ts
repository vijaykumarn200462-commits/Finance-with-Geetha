import { adminDb, adminAuth } from '../src/lib/firebase/admin';
import { COLLECTIONS } from '../src/lib/firebase/collections';
import {
  sendContactInquiryNotification,
  getContactNotificationRecipient,
  getContactNotificationSender,
} from '../src/lib/email/contact-notification';
import { ContactMessage } from '../src/types/message';

interface ContactApiResponse {
  success?: boolean;
  inquirySaved?: boolean;
  messageId?: string;
  idempotencyKey?: string;
  emailDelivered?: boolean;
  emailDeliveryStatus?: string;
  emailRecipient?: string;
  duplicatePrevented?: boolean;
  error?: string;
  message?: string;
}

interface RetryApiResponse {
  success?: boolean;
  inquiryId?: string;
  status?: string;
  emailDeliveryStatus?: string;
  alreadySent?: boolean;
  error?: string;
  message?: string;
}

async function runInquiryTestSuite() {
  console.log('================================================================');
  console.log('   DEEP CONTACT INQUIRY & RETRY NOTIFICATION TEST SUITE         ');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function record(name: string, ok: boolean, msg?: string) {
    if (ok) {
      console.log(`[PASS] ${name}`);
      passed++;
    } else {
      console.error(`[FAIL] ${name} ${msg ? `: ${msg}` : ''}`);
      failed++;
    }
  }

  const createdDocIds: string[] = [];

  try {
    // --- 1. Notification Configuration & Helper Verification ---
    console.log('--- 1. Notification Configuration & Helper Verification ---');
    const recipient = getContactNotificationRecipient();
    record(
      'Recipient email resolves to cageethanofficial@gmail.com',
      recipient === 'cageethanofficial@gmail.com',
      `Expected cageethanofficial@gmail.com, got ${recipient}`
    );

    const sender = getContactNotificationSender();
    record(
      'Configured sender address is formatted cleanly',
      Boolean(sender && sender.includes('@')),
      `Sender: ${sender}`
    );

    // Test email notification dispatcher safely
    const testPayload = {
      inquiryId: 'test_ref_123',
      name: 'Priya Sharma',
      email: 'priya.sharma@example.com',
      phone: '+91 98765 43210',
      topic: 'Monthly Bookkeeping & GST Filing',
      message: 'Hello Geetha, I need monthly bookkeeping for my consultancy firm.',
      submittedAt: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    };

    const notificationResult = await sendContactInquiryNotification(testPayload);
    record(
      'sendContactInquiryNotification executes safely without crashing',
      Boolean(notificationResult && typeof notificationResult === 'object')
    );
    record(
      'Result status is one of valid statuses: sent | failed | not_configured',
      ['sent', 'failed', 'not_configured'].includes(notificationResult.status),
      `Status: ${notificationResult.status}`
    );
    record(
      'Recipient in notification result matches cageethanofficial@gmail.com',
      notificationResult.recipient === 'cageethanofficial@gmail.com'
    );

    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey || resendApiKey.includes('placeholder')) {
      record(
        'Returns honest not_configured status when provider credentials are placeholders',
        notificationResult.status === 'not_configured'
      );
    }

    // --- 2. Contact API: Valid Inquiry & Firestore Persistence ---
    console.log('\n--- 2. Contact API: Valid Inquiry & Firestore Persistence ---');

    const testEmail = `client.${Date.now()}@consulting.in`;
    const initialIdempotencyKey = `inq_test_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const inquiryData = {
      idempotencyKey: initialIdempotencyKey,
      name: 'Suresh Menon',
      email: testEmail,
      phone: '+91 95389 12345',
      topic: 'Annual Tax Returns & Bookkeeping',
      message: 'We run a boutique retail company and need end-to-end bookkeeping and compliance assistance.',
    };

    const submitRes = await fetch('http://localhost:3000/api/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': initialIdempotencyKey,
      },
      body: JSON.stringify(inquiryData),
    });

    const submitJson = (await submitRes.json()) as ContactApiResponse;
    record('POST /api/contact returns HTTP 200 OK for valid inquiry', submitRes.status === 200);
    record('Response confirms inquirySaved === true', submitJson.inquirySaved === true);
    record(
      'Response returns a valid non-empty messageId',
      typeof submitJson.messageId === 'string' && submitJson.messageId.length > 0,
      `messageId: ${submitJson.messageId}`
    );
    record(
      'Response returns accurate emailDeliveryStatus',
      ['sent', 'failed', 'not_configured'].includes(submitJson.emailDeliveryStatus || '')
    );
    record(
      'Response specifies recipient cageethanofficial@gmail.com',
      submitJson.emailRecipient === 'cageethanofficial@gmail.com'
    );

    const firstMessageId = submitJson.messageId!;
    createdDocIds.push(firstMessageId);

    // Verify Firestore Record
    const snap = await adminDb.collection(COLLECTIONS.MESSAGES).doc(firstMessageId).get();
    record('Inquiry document exists in Firestore messages collection', snap.exists);
    if (snap.exists) {
      const doc = snap.data() as ContactMessage;
      record('Firestore record has correct client name', doc.name === inquiryData.name);
      record('Firestore record has correct customer email', doc.email === inquiryData.email.toLowerCase());
      record('Firestore record has customer phone number', doc.phone === inquiryData.phone);
      record('Firestore record has customer message verbatim', doc.message === inquiryData.message);
      record('Firestore record has status "unread"', doc.status === 'unread');
      record('Firestore record has valid createdAt ISO timestamp', typeof doc.createdAt === 'string');
      record('Firestore record has emailRecipient cageethanofficial@gmail.com', doc.emailRecipient === 'cageethanofficial@gmail.com');
      record(
        'Firestore record has valid emailDeliveryStatus',
        ['sent', 'failed', 'not_configured', 'pending'].includes(doc.emailDeliveryStatus || '')
      );
    }

    // --- 3. Idempotency & Concurrency Verification ---
    console.log('\n--- 3. Idempotency & Concurrency Verification ---');

    // Repeat with identical idempotency key
    const replayRes = await fetch('http://localhost:3000/api/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': initialIdempotencyKey,
      },
      body: JSON.stringify(inquiryData),
    });
    const replayJson = (await replayRes.json()) as ContactApiResponse;
    record('Replaying identical idempotency key returns HTTP 200', replayRes.status === 200);
    record(
      'Replay detects idempotency and reuses existing messageId',
      replayJson.duplicatePrevented === true && replayJson.messageId === firstMessageId
    );

    // Concurrent requests with identical idempotency key
    const concurrentKey = `inq_conc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const concurrentPayload = {
      idempotencyKey: concurrentKey,
      name: 'Rohan Varma',
      email: `rohan.${Date.now()}@varma.co`,
      phone: '+91 99887 76655',
      message: 'Concurrent submission test for race-condition prevention in Firestore.',
    };

    const [concRes1, concRes2] = await Promise.all([
      fetch('http://localhost:3000/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': concurrentKey },
        body: JSON.stringify(concurrentPayload),
      }),
      fetch('http://localhost:3000/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': concurrentKey },
        body: JSON.stringify(concurrentPayload),
      }),
    ]);

    const concJson1 = (await concRes1.json()) as ContactApiResponse;
    const concJson2 = (await concRes2.json()) as ContactApiResponse;

    record('Concurrent request 1 returns HTTP 200', concRes1.status === 200);
    record('Concurrent request 2 returns HTTP 200', concRes2.status === 200);
    record(
      'Concurrent requests resolve to the identical messageId',
      Boolean(concJson1.messageId && concJson1.messageId === concJson2.messageId)
    );

    if (concJson1.messageId) createdDocIds.push(concJson1.messageId);

    // Idempotency key reused with DIFFERENT content returns 409 Conflict
    const conflictRes = await fetch('http://localhost:3000/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Idempotency-Key': concurrentKey },
      body: JSON.stringify({
        idempotencyKey: concurrentKey,
        name: 'Completely Different Name',
        email: 'different@example.com',
        message: 'A completely different message body with the same key.',
      }),
    });
    record('Reusing idempotency key with conflicting payload returns HTTP 409 Conflict', conflictRes.status === 409);

    // Legitimate new inquiry from the SAME email creates a distinct inquiry
    const legitimateSecondPayload = {
      idempotencyKey: `inq_legit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name: inquiryData.name,
      email: inquiryData.email,
      phone: inquiryData.phone,
      topic: 'GST Filing Followup',
      message: 'Also, can you please let me know if your monthly package covers quarterly TDS returns?',
    };

    const legitSecondRes = await fetch('http://localhost:3000/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(legitimateSecondPayload),
    });
    const legitSecondJson = (await legitSecondRes.json()) as ContactApiResponse;
    record('Legitimate second inquiry with new question returns HTTP 200', legitSecondRes.status === 200);
    record(
      'Legitimate second inquiry creates distinct messageId (not falsely blocked as spam)',
      Boolean(legitSecondJson.messageId && legitSecondJson.messageId !== firstMessageId)
    );
    if (legitSecondJson.messageId) createdDocIds.push(legitSecondJson.messageId);

    // --- 4. Input Validation & Edge Cases ---
    console.log('\n--- 4. Input Validation & Edge Cases ---');

    // Short name (<2 chars)
    const shortNameRes = await fetch('http://localhost:3000/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'A', email: 'test@example.com', message: 'Valid message for testing.' }),
    });
    record('Rejects short name (<2 chars) with HTTP 400', shortNameRes.status === 400);

    // Invalid email format
    const badEmailRes = await fetch('http://localhost:3000/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Valid Name', email: 'not-an-email', message: 'Valid message for testing.' }),
    });
    record('Rejects invalid email format with HTTP 400', badEmailRes.status === 400);

    // Short message (<10 chars)
    const shortMsgRes = await fetch('http://localhost:3000/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Valid Name', email: 'test@example.com', message: 'Short' }),
    });
    record('Rejects short message (<10 chars) with HTTP 400', shortMsgRes.status === 400);

    // Invalid idempotency key format
    const badKeyRes = await fetch('http://localhost:3000/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idempotencyKey: 'bad key with spaces!@#$',
        name: 'Valid Name',
        email: 'test@example.com',
        message: 'Valid message for testing.',
      }),
    });
    record('Rejects invalid idempotency key format with HTTP 400', badKeyRes.status === 400);

    // --- 5. Admin API Authorization & Retry Safety ---
    console.log('\n--- 5. Admin API Authorization & Retry Safety ---');

    // Unauthenticated retry returns 401
    const unauthRetryRes = await fetch('http://localhost:3000/api/admin/messages/retry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: firstMessageId }),
    });
    record('Unauthenticated retry request returns HTTP 401', unauthRetryRes.status === 401);

    // Authenticate as active admin
    const adminUser = await adminAuth.getUserByEmail('cageethanofficial@gmail.com');
    const customToken = await adminAuth.createCustomToken(adminUser.uid);

    const { initializeApp, getApps, getApp } = await import('firebase/app');
    const { getAuth, signInWithCustomToken } = await import('firebase/auth');
    const { firebaseConfig } = await import('../src/lib/firebase/config');

    const clientApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig, 'inquiry-test');
    const clientAuth = getAuth(clientApp);
    const userCredential = await signInWithCustomToken(clientAuth, customToken);
    const adminIdToken = await userCredential.user.getIdToken();

    // Authenticated admin retrying inquiry
    const authRetryRes = await fetch('http://localhost:3000/api/admin/messages/retry', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminIdToken}`,
      },
      body: JSON.stringify({ id: firstMessageId }),
    });
    const authRetryJson = (await authRetryRes.json()) as RetryApiResponse;

    // If provider is not configured, returns HTTP 503 Service Unavailable (not a false 200!)
    if (resendApiKey?.includes('placeholder') || !resendApiKey) {
      record(
        'Unconfigured email provider returns HTTP 503 Service Unavailable (not false 200)',
        authRetryRes.status === 503
      );
      record(
        'Retry response accurately reports status "not_configured"',
        authRetryJson.status === 'not_configured'
      );
    } else {
      record('Configured email retry returns HTTP 200 OK', authRetryRes.status === 200);
      record('Configured email retry reports status "sent"', authRetryJson.status === 'sent');
    }

    // Retrying with missing ID returns 400
    const missingIdRes = await fetch('http://localhost:3000/api/admin/messages/retry', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminIdToken}`,
      },
      body: JSON.stringify({}),
    });
    record('Retry with missing ID returns HTTP 400', missingIdRes.status === 400);

    // Retrying non-existent inquiry returns 404
    const notFoundRes = await fetch('http://localhost:3000/api/admin/messages/retry', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminIdToken}`,
      },
      body: JSON.stringify({ id: 'non_existent_doc_id_99999' }),
    });
    record('Retry with non-existent inquiry returns HTTP 404', notFoundRes.status === 404);

    // Retrying already-sent notification returns 409 Conflict
    await adminDb.collection(COLLECTIONS.MESSAGES).doc(firstMessageId).update({
      emailDeliveryStatus: 'sent',
      emailSentAt: new Date().toISOString(),
    });

    const alreadySentRes = await fetch('http://localhost:3000/api/admin/messages/retry', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminIdToken}`,
      },
      body: JSON.stringify({ id: firstMessageId }),
    });
    const alreadySentJson = (await alreadySentRes.json()) as RetryApiResponse;
    record('Retrying already-sent notification returns HTTP 409 Conflict', alreadySentRes.status === 409);
    record('Already-sent response specifies alreadySent === true', alreadySentJson.alreadySent === true);

    // Verify retry did NOT create any extra inquiry documents in messages
    const postRetryDocSnap = await adminDb.collection(COLLECTIONS.MESSAGES).doc(firstMessageId).get();
    record('Original inquiry document remains intact after retries', postRetryDocSnap.exists);

    // Admin message list endpoint retrieves the inquiries
    const getMessagesRes = await fetch('http://localhost:3000/api/admin/messages', {
      headers: { Authorization: `Bearer ${adminIdToken}` },
    });
    const getMessagesJson = await getMessagesRes.json();
    record('Admin messages endpoint returns list of inquiries', Array.isArray(getMessagesJson.messages));
    const foundDoc = (getMessagesJson.messages || []).some((m: ContactMessage) => m.id === firstMessageId);
    record('Submitted inquiry appears in admin messages list', foundDoc);

    console.log('\n--- Cleaning up test documents ---');
    for (const docId of createdDocIds) {
      await adminDb.collection(COLLECTIONS.MESSAGES).doc(docId).delete().catch(() => {});
    }
  } catch (err: unknown) {
    console.error('Fatal error during test run:', err);
    failed++;
  }

  console.log('\n================================================================');
  console.log(`TOTAL: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runInquiryTestSuite().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
