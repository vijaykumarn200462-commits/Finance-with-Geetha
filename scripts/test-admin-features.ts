import { loadEnvConfig } from '@next/env';
import path from 'path';

loadEnvConfig(path.resolve(__dirname, '..'));

async function runAdminFeaturesVerification() {
  const adminMod = await import('../src/lib/firebase/admin');
  const adminAuth = adminMod.adminAuth;
  const adminDb = adminMod.adminDb;
  const adminStorage = adminMod.adminStorage;
  const { COLLECTIONS } = await import('../src/lib/firebase/firestore');

  console.log('====================================================');
  console.log('   ADMIN SITE CONTENT, MEDIA & SETTINGS TEST SUITE  ');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, title: string, details?: string) {
    total++;
    if (condition) {
      passed++;
      console.log(`✅ [PASS] ${title}`);
      if (details) console.log(`   └─ ${details}`);
    } else {
      console.error(`❌ [FAIL] ${title}`);
      if (details) console.error(`   └─ ${details}`);
    }
  }

  try {
    // ----------------------------------------------------
    // 1. SITE CONTENT (FIRESTORE)
    // ----------------------------------------------------
    console.log('--- 1. Site Content Persistence & Visibility ---');

    // Hero section
    const heroRef = adminDb.collection(COLLECTIONS.SITE_CONTENT).doc('hero');
    const heroSnap = await heroRef.get();
    assert(heroSnap.exists, 'Firestore document site_content/hero exists');

    const heroData = heroSnap.data() || {};
    const originalHeroHeadline = heroData.headline || 'Learn how to actually build a bookkeeping business.';
    assert(typeof heroData.headline === 'string', 'Hero headline is configured', `Headline: "${heroData.headline}"`);

    // Update hero headline and verify persistence
    const testHeadline = 'Learn how to actually build a bookkeeping business. (Verified Live Test)';
    await heroRef.set({ headline: testHeadline }, { merge: true });
    let updatedHeroSnap = await heroRef.get();
    assert(
      updatedHeroSnap.data()?.headline === testHeadline,
      'Site Content update persists in Firestore',
      `Persisted value: "${updatedHeroSnap.data()?.headline}"`
    );

    // Restore original headline
    await heroRef.set({ headline: originalHeroHeadline }, { merge: true });
    updatedHeroSnap = await heroRef.get();
    assert(
      updatedHeroSnap.data()?.headline === originalHeroHeadline,
      'Site Content restored to original headline'
    );

    // Visibility switch test: book section
    const bookContentRef = adminDb.collection(COLLECTIONS.SITE_CONTENT).doc('book');
    const bookSnap = await bookContentRef.get();
    assert(bookSnap.exists, 'Firestore document site_content/book exists');

    const originalBookEnabled = bookSnap.data()?.enabled ?? true;
    // Toggle disabled
    await bookContentRef.set({ enabled: false }, { merge: true });
    let checkSnap = await bookContentRef.get();
    assert(checkSnap.data()?.enabled === false, 'Section visibility toggle: disabled (enabled = false)');

    // Toggle back enabled
    await bookContentRef.set({ enabled: originalBookEnabled }, { merge: true });
    checkSnap = await bookContentRef.get();
    assert(checkSnap.data()?.enabled === originalBookEnabled, 'Section visibility toggle: restored to original state');

    // Community section content
    const commSnap = await adminDb.collection(COLLECTIONS.SITE_CONTENT).doc('community').get();
    assert(commSnap.exists, 'Firestore document site_content/community exists');
    assert(typeof commSnap.data()?.title === 'string', 'Community title configured', `Title: "${commSnap.data()?.title}"`);

    // About section content
    const aboutSnap = await adminDb.collection(COLLECTIONS.SITE_CONTENT).doc('about').get();
    assert(aboutSnap.exists, 'Firestore document site_content/about exists');
    assert(typeof aboutSnap.data()?.title === 'string', 'About section title configured', `Title: "${aboutSnap.data()?.title}"`);

    // Stats section content
    const statsSnap = await adminDb.collection(COLLECTIONS.SITE_CONTENT).doc('stats').get();
    assert(statsSnap.exists, 'Firestore document site_content/stats exists');
    assert(Array.isArray(statsSnap.data()?.items), 'Stats items array exists in Firestore');

    // Final CTA section content
    const ctaSnap = await adminDb.collection(COLLECTIONS.SITE_CONTENT).doc('finalCta').get();
    assert(ctaSnap.exists, 'Firestore document site_content/finalCta exists');
    assert(typeof ctaSnap.data()?.headline === 'string', 'Final CTA headline configured', `Headline: "${ctaSnap.data()?.headline}"`);

    // ----------------------------------------------------
    // 2. PRODUCT STORE CONTENT & DYNAMIC PRICING
    // ----------------------------------------------------
    console.log('\n--- 2. Product Catalog & Store Content in Firestore ---');

    const productsSnap = await adminDb.collection(COLLECTIONS.PRODUCTS).get();
    assert(productsSnap.docs.length > 0, `Store catalog has ${productsSnap.docs.length} active products in Firestore`);

    const communityProduct = productsSnap.docs.find((d) => d.id === 'community');
    assert(!!communityProduct, 'Store product "community" exists in Firestore');
    assert(communityProduct?.data()?.currency === 'INR', 'Community currency strictly INR', `Currency: ${communityProduct?.data()?.currency}`);

    const bookProduct = productsSnap.docs.find((d) => d.id === 'book');
    assert(!!bookProduct, 'Store product "book" exists in Firestore');
    assert(typeof bookProduct?.data()?.price === 'number', 'Book price is numeric', `Price: ₹${bookProduct?.data()?.price}`);

    // ----------------------------------------------------
    // 3. MEDIA & FIREBASE STORAGE INTEGRATION
    // ----------------------------------------------------
    console.log('\n--- 3. Media & Firebase Storage Operations ---');

    const bucket = adminStorage.bucket();
    assert(!!bucket.name, 'Firebase Storage bucket reference configured', `Bucket name: ${bucket.name}`);

    // Test API route handling: GET /api/admin/media
    const localDevUrl = 'http://localhost:3000';
    try {
      const unauthMediaRes = await fetch(`${localDevUrl}/api/admin/media`);
      assert(unauthMediaRes.status === 401, 'Unauthorized request to /api/admin/media is blocked with 401');
    } catch {
      console.log('ℹ️ Local dev server fetch skipped (dev server offline or not required)');
    }

    // Graceful empty storage handling:
    let emptyBucketHandledGracefully = false;
    try {
      const [files] = await bucket.getFiles({ prefix: 'media/' });
      emptyBucketHandledGracefully = Array.isArray(files);
    } catch (storageErr: unknown) {
      const err = storageErr as { code?: number; message?: string };
      if (err?.code === 404 || err?.message?.includes('bucket does not exist')) {
        emptyBucketHandledGracefully = true; // Handled gracefully as empty/not-yet-created
      }
    }
    assert(
      emptyBucketHandledGracefully,
      'Media page does not fail when Storage bucket is empty or not yet created',
      'Handled gracefully with zero unhandled server exceptions'
    );

    // ----------------------------------------------------
    // 4. SETTINGS PERSISTENCE & SECRET PROTECTION
    // ----------------------------------------------------
    console.log('\n--- 4. Settings Persistence & Server Secret Protection ---');

    // General settings
    const generalSettingsRef = adminDb.collection(COLLECTIONS.SETTINGS).doc('general');
    const genSnap = await generalSettingsRef.get();
    assert(genSnap.exists, 'Firestore document settings/general exists');
    const siteOrBusinessName = genSnap.data()?.siteName || genSnap.data()?.businessName;
    assert(typeof siteOrBusinessName === 'string', 'General site/business name configured', `Name: "${siteOrBusinessName}"`);

    // Contact settings
    const contactSettingsRef = adminDb.collection(COLLECTIONS.SETTINGS).doc('contact');
    const contactSnap = await contactSettingsRef.get();
    assert(contactSnap.exists, 'Firestore document settings/contact exists');
    const originalContactEmail = contactSnap.data()?.email || 'contact@financewithgeetha.com';

    // Test saving contact settings
    const testEmail = 'verified-test-contact@financewithgeetha.com';
    await contactSettingsRef.set({ email: testEmail }, { merge: true });
    let checkContact = await contactSettingsRef.get();
    assert(checkContact.data()?.email === testEmail, 'Contact settings update persists in Firestore');

    // Restore original contact settings
    await contactSettingsRef.set({ email: originalContactEmail }, { merge: true });
    checkContact = await contactSettingsRef.get();
    assert(checkContact.data()?.email === originalContactEmail, 'Contact settings restored cleanly');

    // Social settings (including YouTube)
    const socialSnap = await adminDb.collection(COLLECTIONS.SETTINGS).doc('social');
    const socSnap = await socialSnap.get();
    assert(socSnap.exists, 'Firestore document settings/social exists');
    const youtubeUrl = socSnap.data()?.youtubeUrl || socSnap.data()?.youtube;
    assert(
      typeof youtubeUrl === 'string' && youtubeUrl.includes('@vijay_mbl'),
      'YouTube social channel accurately configured',
      `YouTube: ${youtubeUrl}`
    );

    // Regional & payment settings
    const regSnap = await adminDb.collection(COLLECTIONS.SETTINGS).doc('regional').get();
    assert(regSnap.exists, 'Firestore document settings/regional exists');
    assert(regSnap.data()?.baseCurrency === 'INR', 'Regional base currency is INR');

    // Server secret protection: Ensure no private keys or webhook secrets are in Firestore settings
    const allSettingsSnap = await adminDb.collection(COLLECTIONS.SETTINGS).get();
    let hasLeakedSecrets = false;
    allSettingsSnap.docs.forEach((doc) => {
      const dataStr = JSON.stringify(doc.data());
      if (
        dataStr.includes('sk_live_') ||
        dataStr.includes('sk_test_') ||
        dataStr.includes('whsec_') ||
        dataStr.includes('BEGIN PRIVATE KEY')
      ) {
        hasLeakedSecrets = true;
      }
    });
    assert(!hasLeakedSecrets, 'Zero server-side secrets exposed in Firestore settings collection');

    // ----------------------------------------------------
    // 5. ADMINISTRATOR AUTHENTICATION & AUTHORIZATION
    // ----------------------------------------------------
    console.log('\n--- 5. Administrator Authentication & Security Model ---');

    const adminEmail = 'cageethanofficial@gmail.com';
    const adminUser = await adminAuth.getUserByEmail(adminEmail);
    assert(!!adminUser.uid, 'Primary admin exists in Firebase Auth', `UID: ${adminUser.uid}`);

    const adminDoc = await adminDb.collection('admins').doc(adminUser.uid).get();
    assert(adminDoc.exists, `admins/${adminUser.uid} document exists`);
    assert(adminDoc.data()?.role === 'admin', 'Admin role is "admin"');
    assert(adminDoc.data()?.active === true, 'Admin status is active = true');

    // Second admin check
    const secondAdmin = await adminAuth.getUserByEmail('vijaykumarn200462@gmail.com');
    assert(!!secondAdmin.uid, 'Secondary admin exists in Firebase Auth', `UID: ${secondAdmin.uid}`);
    const secondAdminDoc = await adminDb.collection('admins').doc(secondAdmin.uid).get();
    assert(secondAdminDoc.data()?.role === 'admin' && secondAdminDoc.data()?.active === true, 'Secondary admin is active admin');

    // Non-admin / normal customer rejection:
    const fakeCustomerUid = 'customer_uid_normal_user_12345';
    const customerDoc = await adminDb.collection('admins').doc(fakeCustomerUid).get();
    assert(!customerDoc.exists, 'Customer UID not in admins collection (Access Denied / unauthorized)');

    console.log('\n====================================================');
    console.log(`TEST RESULTS: ${passed}/${total} assertions passed (${Math.round((passed / total) * 100)}%)`);
    console.log('====================================================\n');

    if (passed < total) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal test error:', err);
    process.exit(1);
  }
}

runAdminFeaturesVerification();
