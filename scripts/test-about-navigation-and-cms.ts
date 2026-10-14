import { loadEnvConfig } from '@next/env';
import path from 'path';
loadEnvConfig(path.resolve(process.cwd()));

import assert from 'assert';
import { adminDb, adminAuth } from '../src/lib/firebase/admin';
import { COLLECTIONS } from '../src/lib/firebase/collections';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithCustomToken } from 'firebase/auth';
import { firebaseConfig } from '../src/lib/firebase/config';

async function testAboutNavigationAndCMS() {
  console.log('================================================================');
  console.log('   ABOUT NAVIGATION, CMS VISIBILITY & HEADER INTEGRATION TEST   ');
  console.log('================================================================\n');

  const BASE_URL = 'http://localhost:3000';

  // Obtain verified admin token for test operations
  const clientApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig, 'about-vis-test');
  const clientAuth = getAuth(clientApp);
  const adminUser = await adminAuth.getUserByEmail('cageethanofficial@gmail.com');
  const customToken = await adminAuth.createCustomToken(adminUser.uid);
  const userCredential = await signInWithCustomToken(clientAuth, customToken);
  const adminIdToken = await userCredential.user.getIdToken();

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

  // 1. Check Header Navigation Items in Homepage HTML
  console.log('--- TEST 1: Public Header Navigation Items ---');
  let homeHtml = await (await fetch(`${BASE_URL}/`)).text();

  // "More", "Community", "Book", "Store" links should NOT be in public desktop navigation
  const navMatchesMore = homeHtml.includes('>More<') || homeHtml.includes('>more<');
  console.log('   -> Header has "More" dropdown:', navMatchesMore);
  assert.strictEqual(navMatchesMore, false, 'Public header must NOT render "More" dropdown');

  // Verify visible navigation links
  assert.ok(homeHtml.includes('About') || homeHtml.includes('#about'), 'Header must contain About navigation');
  assert.ok(homeHtml.includes('Services') || homeHtml.includes('#services'), 'Header must contain Services navigation');
  assert.ok(homeHtml.includes('Why Us') || homeHtml.includes('#why-us'), 'Header must contain Why Us navigation');
  assert.ok(homeHtml.includes('Contact') || homeHtml.includes('#contact'), 'Header must contain Contact navigation');
  console.log('✅ [PASS] Public header renders only About, Services, Why Us, Contact. More is hidden.');

  // 2. Check About Section Rendering on Homepage
  console.log('\n--- TEST 2: Homepage About Section & Feature Cards ---');
  assert.ok(homeHtml.includes('id="about"'), 'Homepage must contain element with id="about"');
  assert.ok(homeHtml.includes('Your Trusted Financial Partner'), 'Homepage must contain About heading');
  assert.ok(homeHtml.includes('Absolute Accuracy'), 'Homepage must contain card "Absolute Accuracy"');
  assert.ok(
    homeHtml.includes('Save Time & Energy') || homeHtml.includes('Save Time &amp; Energy'),
    'Homepage must contain card "Save Time & Energy"'
  );
  assert.ok(homeHtml.includes('Personalized Approach'), 'Homepage must contain card "Personalized Approach"');
  assert.ok(homeHtml.includes('scroll-mt-24') || homeHtml.includes('scroll-mt-28'), 'About section must have scroll-margin-top offset');
  console.log('✅ [PASS] Homepage About section rendered with all 3 feature cards and sticky-header offset.');

  // 3. Test CMS Visibility: Disable About Section
  console.log('\n--- TEST 3: Admin CMS Visibility Toggle (Hide About) ---');
  const aboutSnap = await adminDb.collection(COLLECTIONS.SITE_CONTENT).doc('about').get();
  const originalAboutData = aboutSnap.data() || {};

  await updateSection('about', { ...originalAboutData, enabled: false });
  homeHtml = await (await fetch(`${BASE_URL}/`)).text();
  assert.ok(!homeHtml.includes('id="about"'), 'Homepage must NOT contain id="about" when about.enabled: false');
  console.log('✅ [PASS] About section correctly hidden on homepage when disabled via Admin CMS.');

  // 4. Test CMS Visibility: Restore About Section
  console.log('\n--- TEST 4: Admin CMS Visibility Toggle (Restore About) ---');
  await updateSection('about', { ...originalAboutData, enabled: true });
  homeHtml = await (await fetch(`${BASE_URL}/`)).text();
  assert.ok(homeHtml.includes('id="about"'), 'Homepage must contain id="about" when about.enabled: true');
  assert.ok(homeHtml.includes('Absolute Accuracy'), 'About cards restored');
  console.log('✅ [PASS] About section correctly restored on homepage when re-enabled.');

  // 5. Test Dedicated Pages Existence & Status
  console.log('\n--- TEST 5: Dedicated Pages Status ---');
  const aboutPageRes = await fetch(`${BASE_URL}/about`);
  assert.strictEqual(aboutPageRes.status, 200, '/about dedicated page must return HTTP 200');
  console.log('✅ [PASS] Dedicated /about page returns HTTP 200 OK.');

  const storePageRes = await fetch(`${BASE_URL}/store`);
  assert.strictEqual(storePageRes.status, 200, '/store dedicated page must return HTTP 200');
  console.log('✅ [PASS] Dedicated /store page returns HTTP 200 OK.');

  const contactPageRes = await fetch(`${BASE_URL}/contact`);
  assert.strictEqual(contactPageRes.status, 200, '/contact dedicated page must return HTTP 200');
  console.log('✅ [PASS] Dedicated /contact page returns HTTP 200 OK.');

  // 6. Test Profile Image in Hero
  console.log('\n--- TEST 6: Profile Image Source ---');
  assert.ok(
    homeHtml.includes('/images/geetha-profile.jpg') || homeHtml.includes('firebasestorage.googleapis.com'),
    'Homepage hero must contain valid profile image source'
  );
  console.log('✅ [PASS] Profile image source verified.');

  console.log('\n================================================================');
  console.log('   ALL ABOUT NAVIGATION & CMS VERIFICATION TESTS PASSED!        ');
  console.log('================================================================\n');
}

testAboutNavigationAndCMS().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
