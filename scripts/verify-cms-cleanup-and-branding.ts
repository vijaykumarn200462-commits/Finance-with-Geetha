import { loadEnvConfig } from '@next/env';
import path from 'path';
loadEnvConfig(path.resolve(process.cwd()));

import { adminDb } from '../src/lib/firebase/admin';
import { COLLECTIONS } from '../src/lib/firebase/collections';
import { BrandingContent, HeroContent } from '../src/types/site-content';
import { DEFAULT_BRANDING_CONTENT } from '../src/lib/firebase/content-defaults';

async function verifyCmsCleanupAndBranding() {
  console.log('================================================================');
  console.log('   VERIFY CMS CLEANUP & DYNAMIC BRANDING / HERO SUITE           ');
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

  // 1. Verify site_content/branding document in Firestore
  console.log('\n--- 1. Branding Document Integrity ---');
  const brandingRef = adminDb.collection(COLLECTIONS.SITE_CONTENT).doc('branding');
  const brandingSnap = await brandingRef.get();
  assert(brandingSnap.exists, 'site_content/branding document exists');

  const brandingData = brandingSnap.data() as BrandingContent;
  assert(Boolean(brandingData.businessName), 'Branding has businessName', brandingData.businessName);
  assert(Boolean(brandingData.tagline), 'Branding has tagline', brandingData.tagline);
  assert(Boolean(brandingData.logoUrl), 'Branding has logoUrl', brandingData.logoUrl);
  assert(typeof brandingData.showLogo === 'boolean', 'Branding has showLogo boolean');
  assert(typeof brandingData.showBusinessName === 'boolean', 'Branding has showBusinessName boolean');
  assert(typeof brandingData.showTagline === 'boolean', 'Branding has showTagline boolean');
  assert(['small', 'medium', 'large'].includes(brandingData.logoSize || 'medium'), 'Branding has valid logoSize');

  // 2. Verify site_content/hero document in Firestore
  console.log('\n--- 2. Hero Document Integrity ---');
  const heroRef = adminDb.collection(COLLECTIONS.SITE_CONTENT).doc('hero');
  const heroSnap = await heroRef.get();
  assert(heroSnap.exists, 'site_content/hero document exists');

  const heroData = heroSnap.data() as HeroContent;
  assert(Boolean(heroData.eyebrow), 'Hero has eyebrow', heroData.eyebrow);
  assert(Boolean(heroData.headline), 'Hero has headline', heroData.headline);
  assert(Boolean(heroData.supportingCopy), 'Hero has supportingCopy');
  assert(Boolean(heroData.profileImageUrl), 'Hero has profileImageUrl', heroData.profileImageUrl);

  // 3. Test writing updated branding and verifying persistence
  console.log('\n--- 3. Branding Persistence Test ---');
  const testBusinessName = 'Finance with Geetha';
  const testTagline = 'Bookkeeping & Accounting';
  await brandingRef.set(
    {
      ...DEFAULT_BRANDING_CONTENT,
      businessName: testBusinessName,
      tagline: testTagline,
      showLogo: true,
      showBusinessName: true,
      showTagline: true,
      logoSize: 'medium',
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
  const updatedBrandingSnap = await brandingRef.get();
  const updatedBranding = updatedBrandingSnap.data() as BrandingContent;
  assert(updatedBranding.businessName === testBusinessName, 'Branding businessName persisted accurately');
  assert(updatedBranding.tagline === testTagline, 'Branding tagline persisted accurately');

  // 4. Test writing hero button links & indicators and verifying persistence
  console.log('\n--- 4. Hero Extended Fields Persistence Test ---');
  await heroRef.set(
    {
      primaryButtonText: 'Schedule Consultation',
      primaryButtonLink: '/#contact',
      secondaryButtonText: 'View Services',
      secondaryButtonLink: '/#services',
      trustIndicator1: '100% Confidential',
      trustIndicator2: 'Tailored Solutions',
      showTrustIndicators: true,
      showProfileCard: true,
      profileName: 'Geetha N.',
      profileRole: 'Independent Bookkeeper & Accountant',
      profileDescription: 'Dedicated financial partner helping you maintain clean books and clear financial insights.',
      profilePhone: '9538913912',
      profileEmail: 'Cageethanofficail@gmail.com',
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
  const updatedHeroSnap = await heroRef.get();
  const updatedHero = updatedHeroSnap.data() as HeroContent;
  assert(updatedHero.primaryButtonLink === '/#contact', 'Hero primaryButtonLink persisted');
  assert(updatedHero.secondaryButtonLink === '/#services', 'Hero secondaryButtonLink persisted');
  assert(updatedHero.trustIndicator1 === '100% Confidential', 'Hero trustIndicator1 persisted');
  assert(updatedHero.showTrustIndicators === true, 'Hero showTrustIndicators persisted');
  assert(updatedHero.showProfileCard === true, 'Hero showProfileCard persisted');

  // 5. Verify historical documents are untouched and preserved
  console.log('\n--- 5. Historical Documents Safe Retention ---');
  const historicalDocs = ['stats', 'teaching', 'about', 'whyUs', 'contactPage', 'aboutPage', 'storePage', 'book', 'communityPage'];
  for (const docId of historicalDocs) {
    const snap = await adminDb.collection(COLLECTIONS.SITE_CONTENT).doc(docId).get();
    assert(snap.exists, `Historical document "${docId}" is preserved in Firestore`);
  }

  // 6. Verify public homepage HTTP response
  console.log('\n--- 6. Public Website Verification ---');
  try {
    const res = await fetch('http://localhost:3000/');
    assert(res.status === 200, 'Public homepage returns HTTP 200 OK');
    const html = await res.text();
    assert(html.includes('Finance with Geetha'), 'Homepage contains dynamic business name');
    assert(
      html.includes('Learn how to actually build a bookkeeping business') ||
      html.includes('Take Control of Your Business Finances') ||
      html.includes(updatedHero.headline),
      'Homepage contains hero headline'
    );
    assert(html.includes('Schedule Consultation'), 'Homepage contains consultation button');
  } catch (err) {
    console.warn('[WARN] Could not connect to dev server at http://localhost:3000:', err);
  }

  console.log('\n================================================================');
  console.log(`Verification Complete: ${passed} PASSED, ${failed} FAILED.`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

verifyCmsCleanupAndBranding().catch((err) => {
  console.error('Fatal verification error:', err);
  process.exit(1);
});
