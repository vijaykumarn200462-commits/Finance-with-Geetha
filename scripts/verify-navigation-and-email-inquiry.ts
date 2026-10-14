import { loadEnvConfig } from '@next/env';
import path from 'path';
loadEnvConfig(path.resolve(process.cwd()));

import { adminDb } from '../src/lib/firebase/admin';
import { COLLECTIONS } from '../src/lib/firebase/collections';
import { getContactNotificationRecipient, getContactNotificationSender } from '../src/lib/email/contact-notification';
import { ContactMessage } from '../src/types/message';

async function runComprehensiveVerification() {
  console.log('================================================================');
  console.log('   NAVIGATION CLEANUP & CONTACT EMAIL INQUIRY VERIFICATION      ');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName} ${detail ? `- ${detail}` : ''}`);
      failed++;
    }
  }

  // ================================================================
  // 1. NAVIGATION CLEANUP VERIFICATION
  // ================================================================
  console.log('\n--- 1. Navigation Cleanup & Visibility Checks ---');
  try {
    const res = await fetch('http://localhost:3000/');
    assert(res.status === 200, 'Homepage returns HTTP 200 OK');
    const html = await res.text();

    // Verify core links are visible in header/footer
    assert(html.includes('/#about') || html.includes('About'), 'Core link "About" is present');
    assert(html.includes('/#services') || html.includes('Services'), 'Core link "Services" is present');
    assert(html.includes('/#why-us') || html.includes('Why Us'), 'Core link "Why Us" is present');
    assert(html.includes('/#contact') || html.includes('Contact'), 'Core link "Contact" is present');

    // Verify hidden items do NOT appear in the navigation
    assert(!html.includes('What I Teach'), '"What I Teach" is hidden from public navigation');
    assert(!html.includes('The Community ('), '"The Community (₹300/mo)" is hidden from public navigation');
    assert(!html.includes('The Book ('), '"The Book (₹4,000)" is hidden from public navigation');
    assert(!html.includes('Templates &amp; Cheat Sheets') && !html.includes('Templates & Cheat Sheets'), '"Templates & Cheat Sheets" is hidden from public navigation');

    // Verify "More" dropdown button is removed
    // Looking for a nav button specifically labeled "More" with chevron
    const hasMoreButton = html.includes('>More<') && html.includes('aria-expanded');
    assert(!hasMoreButton, '"More" dropdown menu button is removed when no items are active');
  } catch (err) {
    console.error('Failed to fetch homepage from dev server:', err);
    failed++;
  }

  // Verify dedicated pages remain active and intact
  console.log('\n--- 2. Dedicated Pages Functionality Preservation ---');
  for (const route of ['/about', '/store', '/book', '/community', '/contact']) {
    try {
      const pageRes = await fetch(`http://localhost:3000${route}`);
      assert(pageRes.status === 200, `Dedicated route "${route}" returns HTTP 200 OK`);
    } catch {
      assert(false, `Dedicated route "${route}" accessible`);
    }
  }

  // ================================================================
  // 3. CONTACT INQUIRY API & EMAIL NOTIFICATION RECIPIENT
  // ================================================================
  console.log('\n--- 3. Contact Email Configuration ---');
  const recipient = getContactNotificationRecipient();
  assert(recipient === 'cageethanofficial@gmail.com', 'Recipient is configured as cageethanofficial@gmail.com', recipient);

  const sender = getContactNotificationSender();
  assert(Boolean(sender), 'Sender is configured', sender);

  // ================================================================
  // 4. CONTACT FORM SUBMISSION TO FIRESTORE
  // ================================================================
  console.log('\n--- 4. Contact Form Submission Flow ---');
  const testPayload = {
    name: 'Priya Sundaram',
    email: 'priya.sundaram@testcompany.in',
    phone: '9845012345',
    topic: 'Small Business Bookkeeping & Tax Services',
    message: 'Hello Geetha, we run an engineering consultancy and need monthly bookkeeping and P&L statements.',
  };

  let createdMessageId: string | null = null;

  try {
    const postRes = await fetch('http://localhost:3000/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPayload),
    });

    assert(postRes.status === 200, 'POST /api/contact returns HTTP 200 OK');
    const postData = await postRes.json();
    assert(postData.success === true, 'Response returns success: true');
    assert(postData.inquirySaved === true, 'Response confirms inquirySaved: true');
    assert(postData.emailRecipient === 'cageethanofficial@gmail.com', 'Response confirms recipient is cageethanofficial@gmail.com');
    assert(Boolean(postData.messageId), 'Response returns generated messageId', postData.messageId);
    assert(typeof postData.emailDelivered === 'boolean', 'Response returns emailDelivered boolean flag');
    assert(typeof postData.emailDeliveryStatus === 'string', 'Response returns accurate emailDeliveryStatus', postData.emailDeliveryStatus);

    createdMessageId = postData.messageId;
  } catch (err) {
    console.error('Failed to submit test inquiry:', err);
    failed++;
  }

  // Verify saved document directly in Firestore
  if (createdMessageId) {
    console.log('\n--- 5. Firestore Message Document Verification ---');
    const docSnap = await adminDb.collection(COLLECTIONS.MESSAGES).doc(createdMessageId).get();
    assert(docSnap.exists, 'Inquiry document exists in Firestore "messages" collection');

    const data = docSnap.data() as ContactMessage;
    assert(data.name === testPayload.name, 'Document name matches submitted name', data.name);
    assert(data.email === testPayload.email, 'Document email matches submitted email', data.email);
    assert(data.phone === testPayload.phone, 'Document phone is saved as distinct field', data.phone || '');
    assert(data.topic === testPayload.topic, 'Document topic matches', data.topic);
    assert(data.message === testPayload.message, 'Document message matches', data.message);
    assert(data.status === 'unread', 'Document status initialized to "unread"');
    assert(data.emailRecipient === 'cageethanofficial@gmail.com', 'Document emailRecipient is cageethanofficial@gmail.com');
    assert(Boolean(data.emailDeliveryStatus), 'Document records emailDeliveryStatus', data.emailDeliveryStatus);
    assert(Boolean(data.createdAt), 'Document records createdAt timestamp');
  }

  // ================================================================
  // 6. VALIDATION CHECKS
  // ================================================================
  console.log('\n--- 6. Server-Side Validation Edge Cases ---');
  // Short name
  const shortNameRes = await fetch('http://localhost:3000/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'A', email: 'valid@example.com', message: 'This is a long enough message.' }),
  });
  assert(shortNameRes.status === 400, 'Rejects name under 2 characters with HTTP 400');

  // Invalid email
  const badEmailRes = await fetch('http://localhost:3000/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'John Doe', email: 'notanemail', message: 'This is a long enough message.' }),
  });
  assert(badEmailRes.status === 400, 'Rejects invalid email format with HTTP 400');

  // Short message
  const shortMsgRes = await fetch('http://localhost:3000/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'John Doe', email: 'valid@example.com', message: 'Too short' }),
  });
  assert(shortMsgRes.status === 400, 'Rejects message under 10 characters with HTTP 400');

  // ================================================================
  // 7. ADMIN MESSAGES ENDPOINT ACCESS PROTECTION
  // ================================================================
  console.log('\n--- 7. Admin Inquiries Security Check ---');
  const unauthAdminRes = await fetch('http://localhost:3000/api/admin/messages');
  assert(
    unauthAdminRes.status === 401 || unauthAdminRes.status === 403,
    'Unauthenticated access to /api/admin/messages is rejected',
    `Status: ${unauthAdminRes.status}`
  );

  console.log('\n================================================================');
  console.log(`Verification Complete: ${passed} PASSED, ${failed} FAILED.`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runComprehensiveVerification().catch((err) => {
  console.error('Fatal verification error:', err);
  process.exit(1);
});
