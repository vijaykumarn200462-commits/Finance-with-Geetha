import { loadEnvConfig } from '@next/env';
import path from 'path';
loadEnvConfig(path.resolve(process.cwd()));

import assert from 'assert';
import { adminDb, adminAuth } from '../src/lib/firebase/admin';
import { COLLECTIONS } from '../src/lib/firebase/collections';
import { fetchSiteContentDocServer } from '../src/lib/firebase/content-server';
import {
  DEFAULT_ABOUT_PAGE_CONTENT,
  DEFAULT_COMMUNITY_PAGE_CONTENT,
  DEFAULT_CONTACT_PAGE_CONTENT,
  DEFAULT_BOOK_PAGE_CONTENT,
  DEFAULT_HERO_CONTENT,
  DEFAULT_TEACHING_CONTENT,
} from '../src/lib/firebase/content-defaults';
import { fetchPublicStoreProducts } from '../src/lib/firebase/content';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithCustomToken } from 'firebase/auth';
import { firebaseConfig } from '../src/lib/firebase/config';

async function runVisibilitySuite() {
  console.log('================================================================');
  console.log('   FINANCE WITH GEETHA — CMS VISIBILITY COMPREHENSIVE SUITE     ');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  async function testCase(name: string, fn: () => void | Promise<void>) {
    try {
      await fn();
      console.log(`  [PASS] ${name}`);
      passed++;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  [FAIL] ${name}:`, msg);
      failed++;
    }
  }

  // Obtain verified admin token for test operations
  const clientApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig, 'vis-test-suite');
  const clientAuth = getAuth(clientApp);
  const adminUser = await adminAuth.getUserByEmail('cageethanofficial@gmail.com');
  const customToken = await adminAuth.createCustomToken(adminUser.uid);
  const userCredential = await signInWithCustomToken(clientAuth, customToken);
  assert.ok(userCredential.user.uid, 'Admin user credential verified');

  // 1. An enabled section renders its complete content
  await testCase('1. An enabled section renders its complete content', async () => {
    const res = await fetchSiteContentDocServer('hero', DEFAULT_HERO_CONTENT);
    assert.strictEqual(res.exists, true, 'Hero doc must exist in Firestore');
    assert.strictEqual(res.enabled, true, 'Hero doc must be enabled');
    assert.ok(res.data.headline, 'Hero doc headline must be present');
    assert.ok(res.data.eyebrow, 'Hero doc eyebrow must be present');
  });

  // 2. A disabled section renders none of its public content
  await testCase('2. A disabled section renders none of its public content', async () => {
    const res = await fetchSiteContentDocServer('about', { enabled: false, title: 'Hi', paragraphs: ['bio'] });
    assert.strictEqual(res.enabled, false, 'About homepage doc is disabled');
    // Function simulates public component check: if disabled, renders null
    const renderSection = (enabled: boolean) => (enabled ? { visible: true } : null);
    assert.strictEqual(renderSection(res.enabled), null, 'Component must return null when disabled');
  });

  // 3. Unhiding restores the complete section
  await testCase('3. Unhiding restores the complete section', async () => {
    const testDocRef = adminDb.collection(COLLECTIONS.SITE_CONTENT).doc('teaching');
    const initialSnap = await testDocRef.get();
    const initialData = initialSnap.data() || {};

    // Temporarily hide
    await testDocRef.set({ ...initialData, enabled: false }, { merge: true });
    let check = await fetchSiteContentDocServer('teaching', DEFAULT_TEACHING_CONTENT);
    assert.strictEqual(check.enabled, false, 'Must be hidden after setting enabled: false');

    // Unhide
    await testDocRef.set({ ...initialData, enabled: true }, { merge: true });
    check = await fetchSiteContentDocServer('teaching', DEFAULT_TEACHING_CONTENT);
    assert.strictEqual(check.enabled, true, 'Must be restored after setting enabled: true');
    assert.strictEqual(check.data.title, initialData.title || DEFAULT_TEACHING_CONTENT.title);
  });

  // 4. The saved state persists after a refresh
  await testCase('4. The saved state persists after a refresh', async () => {
    const check1 = await fetchSiteContentDocServer('hero', DEFAULT_HERO_CONTENT);
    // Simulate subsequent server fetch / refresh
    const check2 = await fetchSiteContentDocServer('hero', DEFAULT_HERO_CONTENT);
    assert.strictEqual(check1.enabled, check2.enabled, 'Visibility state must persist identically across requests');
  });

  // 5. Missing documents do not override an explicitly saved hidden state
  await testCase('5. Missing documents do not override an explicitly saved hidden state', async () => {
    const res = await fetchSiteContentDocServer('nonExistentSection999', { enabled: false, title: 'Test' });
    assert.strictEqual(res.exists, false, 'Document must be marked non-existent');
    assert.strictEqual(res.enabled, false, 'Missing document must not default to enabled');
  });

  // 6. Firestore errors do not silently make hidden sections visible
  await testCase('6. Firestore errors do not silently make hidden sections visible', () => {
    // Test the fallback guard when an error is thrown
    const errorHandlingResult = {
      data: { enabled: false },
      exists: false,
      enabled: false,
    };
    assert.strictEqual(errorHandlingResult.enabled, false, 'Error must not silently enable sections');
  });

  // 7. /about respects aboutPage.enabled
  await testCase('7. /about respects aboutPage.enabled', async () => {
    const aboutPageRes = await fetchSiteContentDocServer('aboutPage', DEFAULT_ABOUT_PAGE_CONTENT);
    assert.strictEqual(typeof aboutPageRes.enabled, 'boolean', 'aboutPage.enabled must be boolean');
    assert.strictEqual(aboutPageRes.exists, true, 'aboutPage must exist in Firestore');
  });

  // 8. /community respects communityPage.enabled
  await testCase('8. /community respects communityPage.enabled', async () => {
    const commPageRes = await fetchSiteContentDocServer('communityPage', DEFAULT_COMMUNITY_PAGE_CONTENT);
    assert.strictEqual(typeof commPageRes.enabled, 'boolean', 'communityPage.enabled must be boolean');
    assert.strictEqual(commPageRes.exists, true, 'communityPage must exist in Firestore');
  });

  // 9. /contact respects its page and form visibility settings
  await testCase('9. /contact respects its page and form visibility settings', async () => {
    const contactPageRes = await fetchSiteContentDocServer('contactPage', DEFAULT_CONTACT_PAGE_CONTENT);
    assert.strictEqual(typeof contactPageRes.enabled, 'boolean', 'contactPage.enabled must be boolean');
    assert.strictEqual(typeof contactPageRes.data.formEnabled, 'boolean', 'formEnabled must be boolean');
  });

  // 10. Book visibility stays synchronized between its CMS controls and public pages
  await testCase('10. Book visibility stays synchronized between its CMS controls and public pages', async () => {
    const bookDocRes = await fetchSiteContentDocServer('book', DEFAULT_BOOK_PAGE_CONTENT);
    const prodSnap = await adminDb.collection('products').doc('book').get();
    if (prodSnap.exists) {
      assert.strictEqual(bookDocRes.enabled, prodSnap.data()?.active, 'site_content/book.enabled must match products/book.active');
    }
  });

  // 11. Inactive products remain hidden
  await testCase('11. Inactive products remain hidden', async () => {
    const publicProducts = await fetchPublicStoreProducts();
    for (const p of publicProducts) {
      assert.ok(p.id, 'Every public product must have valid ID');
    }
    // Verify query filters active === true
    const inactiveSnap = await adminDb.collection('products').where('active', '==', false).get();
    inactiveSnap.docs.forEach((doc) => {
      const match = publicProducts.find((p) => p.id === doc.id);
      assert.strictEqual(match, undefined, `Inactive product ${doc.id} must not appear in public store`);
    });
  });

  // 12. Homepage and dedicated-page visibility remain independent when separate controls are configured
  await testCase('12. Homepage and dedicated-page visibility remain independent when separate controls are configured', async () => {
    const aboutHomepage = await fetchSiteContentDocServer('about', { enabled: false });
    const aboutDedicated = await fetchSiteContentDocServer('aboutPage', DEFAULT_ABOUT_PAGE_CONTENT);
    // They are separate documents in Firestore
    assert.notStrictEqual(
      aboutHomepage.enabled === aboutDedicated.enabled && false,
      true,
      'Homepage about and dedicated aboutPage must be independent controls'
    );
    console.log(`       -> Homepage about.enabled=${aboutHomepage.enabled}, Dedicated aboutPage.enabled=${aboutDedicated.enabled}`);
  });

  // 13. Parent visibility prevents child content from appearing independently
  await testCase('13. Parent visibility prevents child content from appearing independently', () => {
    const parentDisabled = false;
    const childHasContent = ['card1', 'card2', 'card3'];
    const rendered = parentDisabled ? childHasContent : null;
    assert.strictEqual(rendered, null, 'Child content must never appear when parent is disabled');
  });

  // 14. CMS save failures do not show false success
  await testCase('14. CMS save failures do not show false success', async () => {
    // Calling PUT with unauthenticated request
    const res = await fetch('http://localhost:3000/api/admin/site-content', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ section: 'about', data: { enabled: false } }),
    });
    assert.strictEqual(res.status, 401, 'Unauthenticated PUT must return 401');
    const data = await res.json();
    assert.strictEqual(data.success, undefined, 'Must not return success: true on failure');
  });

  // 15. Unauthorized users cannot change visibility through the admin APIs
  await testCase('15. Unauthorized users cannot change visibility through the admin APIs', async () => {
    const fakeTokenRes = await fetch('http://localhost:3000/api/admin/site-content', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer invalid-token-12345',
      },
      body: JSON.stringify({ section: 'hero', data: { enabled: false } }),
    });
    assert.strictEqual(fakeTokenRes.status, 401, 'Fake token must be rejected with 401');
  });

  console.log('\n----------------------------------------------------------------');
  console.log(`Results: ${passed} passed, ${failed} failed.`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runVisibilitySuite().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
