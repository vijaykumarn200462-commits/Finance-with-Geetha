import { loadEnvConfig } from '@next/env';
import path from 'path';
loadEnvConfig(path.resolve(process.cwd()));

import assert from 'assert';
import { adminDb, adminAuth } from '../src/lib/firebase/admin';
import { COLLECTIONS } from '../src/lib/firebase/collections';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithCustomToken } from 'firebase/auth';
import { firebaseConfig } from '../src/lib/firebase/config';

async function verifyE2EVisibilityWorkflow() {
  console.log('================================================================');
  console.log('  E2E CMS VISIBILITY WORKFLOW VERIFICATION (LIVE HTTP + FIRESTORE) ');
  console.log('================================================================\n');

  // Obtain verified admin token for test operations
  const clientApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig, 'e2e-vis-suite');
  const clientAuth = getAuth(clientApp);
  const adminUser = await adminAuth.getUserByEmail('cageethanofficial@gmail.com');
  const customToken = await adminAuth.createCustomToken(adminUser.uid);
  const userCredential = await signInWithCustomToken(clientAuth, customToken);
  const adminIdToken = await userCredential.user.getIdToken();

  const BASE_URL = 'http://localhost:3000';

  // Helper to update CMS section via Admin API
  async function updateSection(section: string, data: Record<string, unknown>) {
    const res = await fetch(`${BASE_URL}/api/admin/site-content`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminIdToken}`,
      },
      body: JSON.stringify({ section, data }),
    });
    if (!res.ok) {
      throw new Error(`Failed to update ${section}: ${res.status} ${await res.text()}`);
    }
    // Also trigger revalidate
    const reval = await fetch(`${BASE_URL}/api/admin/site-content/revalidate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminIdToken}`,
      },
      body: JSON.stringify({ section }),
    });
    if (!reval.ok) {
      throw new Error(`Failed to revalidate ${section}: ${reval.status}`);
    }
  }

  // Backup existing data so we can restore it exactly
  const backupDocs: Record<string, Record<string, unknown>> = {};
  const sectionsToTest = [
    'hero',
    'about',
    'aboutPage',
    'teaching',
    'whyUs',
    'stats',
    'community',
    'communityPage',
    'callStructure',
    'oneOnOne',
    'book',
    'store',
    'storePage',
    'contactPage',
    'finalCta',
  ];

  for (const s of sectionsToTest) {
    const snap = await adminDb.collection(COLLECTIONS.SITE_CONTENT).doc(s).get();
    if (snap.exists) {
      backupDocs[s] = snap.data() || {};
    }
  }

  try {
    // -------------------------------------------------------------
    // Test 1: Dedicated /about Page Hide & Unhide
    // -------------------------------------------------------------
    console.log('Testing 1: Dedicated /about Page Hide & Unhide...');
    await updateSection('aboutPage', { ...backupDocs['aboutPage'], enabled: false });
    let html = await (await fetch(`${BASE_URL}/about`)).text();
    assert.ok(
      html.includes('Page Unavailable') || html.includes('This page is currently disabled') || html.includes('page-disabled-notice'),
      '/about must display disabled notice when enabled: false'
    );
    assert.ok(
      !html.includes('id="about-bio"'),
      '/about must NOT render biography content when disabled'
    );
    console.log('   -> Successfully verified /about is hidden when enabled: false');

    await updateSection('aboutPage', { ...backupDocs['aboutPage'], enabled: true });
    html = await (await fetch(`${BASE_URL}/about`)).text();
    assert.ok(
      !html.includes('This page is currently disabled'),
      '/about must NOT display disabled notice when enabled: true'
    );
    console.log('   -> Successfully verified /about is restored when enabled: true');

    // -------------------------------------------------------------
    // Test 2: Dedicated /community Page Hide & Unhide
    // -------------------------------------------------------------
    console.log('\nTesting 2: Dedicated /community Page Hide & Unhide...');
    await updateSection('communityPage', { ...backupDocs['communityPage'], enabled: false });
    html = await (await fetch(`${BASE_URL}/community`)).text();
    assert.ok(
      html.includes('Page Unavailable') || html.includes('This page is currently disabled') || html.includes('page-disabled-notice'),
      '/community must display disabled notice when enabled: false'
    );
    console.log('   -> Successfully verified /community is hidden when enabled: false');

    await updateSection('communityPage', { ...backupDocs['communityPage'], enabled: true });
    html = await (await fetch(`${BASE_URL}/community`)).text();
    assert.ok(
      !html.includes('This page is currently disabled'),
      '/community must NOT display disabled notice when enabled: true'
    );
    console.log('   -> Successfully verified /community is restored when enabled: true');

    // -------------------------------------------------------------
    // Test 3: Dedicated /contact Page Hide & Unhide
    // -------------------------------------------------------------
    console.log('\nTesting 3: Dedicated /contact Page Hide & Unhide...');
    await updateSection('contactPage', { ...backupDocs['contactPage'], enabled: false });
    html = await (await fetch(`${BASE_URL}/contact`)).text();
    assert.ok(
      html.includes('Page Unavailable') || html.includes('This page is currently disabled') || html.includes('page-disabled-notice'),
      '/contact must display disabled notice when enabled: false'
    );
    console.log('   -> Successfully verified /contact is hidden when enabled: false');

    await updateSection('contactPage', { ...backupDocs['contactPage'], enabled: true, formEnabled: true });
    html = await (await fetch(`${BASE_URL}/contact`)).text();
    assert.ok(
      !html.includes('This page is currently disabled'),
      '/contact must NOT display disabled notice when enabled: true'
    );
    console.log('   -> Successfully verified /contact is restored when enabled: true');

    // -------------------------------------------------------------
    // Test 4: Dedicated /book Page Hide & Unhide
    // -------------------------------------------------------------
    console.log('\nTesting 4: Dedicated /book Page Hide & Unhide...');
    await updateSection('book', { ...backupDocs['book'], enabled: false });
    html = await (await fetch(`${BASE_URL}/book`)).text();
    assert.ok(
      html.includes('Page Unavailable') || html.includes('This page is currently disabled') || html.includes('page-disabled-notice'),
      '/book must display disabled notice when enabled: false'
    );
    console.log('   -> Successfully verified /book is hidden when enabled: false');

    await updateSection('book', { ...backupDocs['book'], enabled: true });
    html = await (await fetch(`${BASE_URL}/book`)).text();
    assert.ok(
      !html.includes('This page is currently disabled'),
      '/book must NOT display disabled notice when enabled: true'
    );
    console.log('   -> Successfully verified /book is restored when enabled: true');

    // -------------------------------------------------------------
    // Test 5: Dedicated /store Page Hide & Unhide
    // -------------------------------------------------------------
    console.log('\nTesting 5: Dedicated /store Page Hide & Unhide...');
    await updateSection('storePage', { ...backupDocs['storePage'], enabled: false });
    html = await (await fetch(`${BASE_URL}/store`)).text();
    assert.ok(
      html.includes('Page Unavailable') || html.includes('This page is currently disabled') || html.includes('page-disabled-notice'),
      '/store must display disabled notice when enabled: false'
    );
    console.log('   -> Successfully verified /store is hidden when enabled: false');

    await updateSection('storePage', { ...backupDocs['storePage'], enabled: true });
    html = await (await fetch(`${BASE_URL}/store`)).text();
    assert.ok(
      !html.includes('This page is currently disabled'),
      '/store must NOT display disabled notice when enabled: true'
    );
    console.log('   -> Successfully verified /store is restored when enabled: true');

    // -------------------------------------------------------------
    // Test 6: Homepage Services/Teaching Section Hide & Unhide
    // -------------------------------------------------------------
    console.log('\nTesting 6: Homepage Services/Teaching Section Hide & Unhide...');
    await updateSection('teaching', { ...backupDocs['teaching'], enabled: false });
    html = await (await fetch(`${BASE_URL}/`)).text();
    assert.ok(
      !html.includes('id="services"'),
      'Homepage must NOT contain #services when teaching is disabled'
    );
    console.log('   -> Successfully verified #services is hidden on homepage when teaching.enabled: false');

    await updateSection('teaching', { ...backupDocs['teaching'], enabled: true });
    html = await (await fetch(`${BASE_URL}/`)).text();
    assert.ok(
      html.includes('id="services"'),
      'Homepage must contain #services when teaching is restored'
    );
    console.log('   -> Successfully verified #services is restored on homepage when teaching.enabled: true');

    // -------------------------------------------------------------
    // Test 7: Homepage Why Us Section Hide & Unhide
    // -------------------------------------------------------------
    console.log('\nTesting 7: Homepage Why Us Section Hide & Unhide...');
    await updateSection('whyUs', { ...backupDocs['whyUs'], enabled: false });
    html = await (await fetch(`${BASE_URL}/`)).text();
    assert.ok(
      !html.includes('id="why-us"'),
      'Homepage must NOT contain #why-us when whyUs is disabled'
    );
    console.log('   -> Successfully verified #why-us is hidden on homepage when whyUs.enabled: false');

    await updateSection('whyUs', { ...backupDocs['whyUs'], enabled: true });
    html = await (await fetch(`${BASE_URL}/`)).text();
    assert.ok(
      html.includes('id="why-us"'),
      'Homepage must contain #why-us when whyUs is restored'
    );
    console.log('   -> Successfully verified #why-us is restored on homepage when whyUs.enabled: true');

    // -------------------------------------------------------------
    // Test 8: Homepage Hero Section Hide & Unhide
    // -------------------------------------------------------------
    console.log('\nTesting 8: Homepage Hero Section Hide & Unhide...');
    await updateSection('hero', { ...backupDocs['hero'], enabled: false });
    html = await (await fetch(`${BASE_URL}/`)).text();
    assert.ok(
      !html.includes('id="hero"'),
      'Homepage must NOT contain #hero when hero is disabled'
    );
    console.log('   -> Successfully verified #hero is hidden on homepage when hero.enabled: false');

    await updateSection('hero', { ...backupDocs['hero'], enabled: true });
    html = await (await fetch(`${BASE_URL}/`)).text();
    assert.ok(
      html.includes('id="hero"'),
      'Homepage must contain #hero when hero is restored'
    );
    console.log('   -> Successfully verified #hero is restored on homepage when hero.enabled: true');

    console.log('\n================================================================');
    console.log('  ALL E2E VISIBILITY TESTS PASSED PERFECTLY (8/8)!              ');
    console.log('================================================================\n');
  } finally {
    // Restore all backup documents
    console.log('Restoring original Firestore document states...');
    for (const [sec, data] of Object.entries(backupDocs)) {
      await adminDb.collection(COLLECTIONS.SITE_CONTENT).doc(sec).set(data);
    }
    // Revalidate paths
    await fetch(`${BASE_URL}/api/admin/site-content/revalidate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminIdToken}`,
      },
      body: JSON.stringify({ section: 'all' }),
    });
    console.log('Original Firestore document states successfully restored.');
  }
}

verifyE2EVisibilityWorkflow().catch((err) => {
  console.error('E2E Visibility Workflow failed:', err);
  process.exit(1);
});
