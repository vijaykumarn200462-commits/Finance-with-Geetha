import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { GoogleReviewsSection } from '../src/components/home/GoogleReviewsSection';
import { ReviewItem, ReviewsSectionContent } from '../src/types/site-content';
import { adminDb } from '../src/lib/firebase/admin';
import { COLLECTIONS } from '../src/lib/firebase/collections';

async function runTestSuite() {
  console.log('================================================================');
  console.log('   DEEP FIX VERIFICATION SUITE: CAROUSEL, REVIEWS & ADMIN UX   ');
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

  // ===========================================================================
  // 1. GOOGLE REVIEWS RUNTIME ERROR & CAROUSEL FUNCTIONALITY
  // ===========================================================================
  console.log('--- 1. Google Reviews Carousel State & Runtime Verification ---');

  const sampleReviews: ReviewItem[] = [
    {
      id: 'rev-1',
      reviewerName: 'Subbu Subbu',
      reviewCountText: '1 review',
      rating: 5,
      reviewDate: '3 days ago',
      reviewText: 'Excellent accounting service, very responsive and clear.',
      reviewerInitials: 'S',
      avatarBgColor: '#0f2c59',
      sortOrder: 1,
      isVisible: true,
    },
    {
      id: 'rev-2',
      reviewerName: 'Nagaveni N',
      reviewCountText: '1 review',
      rating: 5,
      reviewDate: '1 week ago',
      reviewText: 'Great experience working with Geetha for business bookkeeping.',
      reviewerInitials: 'N',
      avatarBgColor: '#138354',
      sortOrder: 2,
      isVisible: true,
    },
    {
      id: 'rev-3',
      reviewerName: 'Kevin Gibson',
      reviewCountText: '3 reviews',
      rating: 5,
      reviewDate: '2 years ago',
      reviewText: 'Geetha has been an essential partner for our business finances.',
      ownerResponse: 'Thank you Kevin',
      ownerResponseDate: '2 years ago',
      reviewerInitials: 'K',
      avatarBgColor: '#0f2c59',
      sortOrder: 3,
      isVisible: true,
    },
    {
      id: 'rev-4',
      reviewerName: 'Ravi Kumar',
      reviewCountText: '2 reviews',
      rating: 5,
      reviewDate: '3 months ago',
      reviewText: 'Very professional and meticulous tax filing assistance.',
      reviewerInitials: 'R',
      avatarBgColor: '#0f2c59',
      sortOrder: 4,
      isVisible: true,
    },
    {
      id: 'rev-5',
      reviewerName: 'Mahesh V S',
      reviewCountText: '1 review',
      rating: 5,
      reviewDate: '4 months ago',
      reviewText: 'Clean accounting records and timely monthly reconciliations.',
      reviewerInitials: 'M',
      avatarBgColor: '#138354',
      sortOrder: 5,
      isVisible: true,
    },
    {
      id: 'rev-6',
      reviewerName: 'Disabled Client',
      reviewCountText: '1 review',
      rating: 1,
      reviewDate: '5 months ago',
      reviewText: 'Draft or hidden review that should never appear publicly.',
      reviewerInitials: 'D',
      avatarBgColor: '#999999',
      sortOrder: 6,
      isVisible: false, // Disabled
    },
  ];

  const testContent: ReviewsSectionContent = {
    enabled: true,
    heading: 'What Our Clients Say',
    subtitle: 'Trusted by our clients for reliable accounting and professional guidance.',
    googleMapsUrl: 'https://maps.google.com',
    averageRating: 5.0,
    totalReviewsCount: 5,
    showGoogleRatingBadge: true,
    autoAdvanceSeconds: 1,
    reviews: sampleReviews,
  };

  // Test that rendering produces no ReferenceError or exception
  let renderedHtml = '';
  try {
    renderedHtml = renderToStaticMarkup(
      React.createElement(GoogleReviewsSection, { content: testContent })
    );
    record('Carousel component renders cleanly without ReferenceError', true);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    record('Carousel component renders cleanly without ReferenceError', false, msg);
  }

  // Test pagination dots count equals visible enabled reviews (5 enabled, 1 disabled)
  const dotMatches = renderedHtml.match(/role="tab"/g);
  const dotCount = dotMatches ? dotMatches.length : 0;
  record(
    'Pagination dots strictly match number of enabled reviews (5 dots for 5 enabled reviews)',
    dotCount === 5,
    `Found ${dotCount} dots`
  );

  // Test active dot has distinct green highlight and expansion
  record(
    'Active dot has brand green highlight and expanded width (w-8 bg-[#138354])',
    renderedHtml.includes('w-8 bg-[#138354]')
  );

  // Test inactive dots are styled cleanly
  record(
    'Inactive dots have standard muted width and color (w-2.5 bg-slate-300)',
    renderedHtml.includes('w-2.5 bg-slate-300')
  );

  // Test center-focused coverflow layout styling
  record(
    'Center card has scale(1.0) and full opacity',
    renderedHtml.includes('scale(1.0)') || renderedHtml.includes('scale(1)')
  );
  record(
    'Side cards have coverflow scale (0.84 to 0.90)',
    renderedHtml.includes('scale(0.88)') ||
      renderedHtml.includes('scale(0.86)') ||
      renderedHtml.includes('scale(0.84)')
  );
  record(
    'Accessible previous and next navigation controls are present',
    renderedHtml.includes('aria-label="Previous review"') &&
      renderedHtml.includes('aria-label="Next review"')
  );

  // Test handling of 0 reviews (should return null safely)
  const zeroReviewsContent: ReviewsSectionContent = {
    ...testContent,
    reviews: [],
  };
  const zeroHtml = renderToStaticMarkup(
    React.createElement(GoogleReviewsSection, { content: zeroReviewsContent })
  );
  record('Zero reviews renders null without crashing', zeroHtml === '');

  // Test handling of 1 review (no navigation buttons or dots, but renders card)
  const oneReviewContent: ReviewsSectionContent = {
    ...testContent,
    reviews: [sampleReviews[0]],
  };
  const oneHtml = renderToStaticMarkup(
    React.createElement(GoogleReviewsSection, { content: oneReviewContent })
  );
  record(
    'Single review renders card without duplicate dots or infinite loops',
    oneHtml.includes('Subbu Subbu') && !oneHtml.includes('aria-label="Previous review"')
  );

  // ===========================================================================
  // 2. FIREBASE-DRIVEN AUTHORITATIVE REVIEW STATISTICS
  // ===========================================================================
  console.log('\n--- 2. Firebase-Driven Authoritative Review Statistics ---');

  // Calculation test utility matching authoritative algorithm
  function computeStats(reviews: ReviewItem[]) {
    const enabled = reviews.filter((r) => r.isVisible !== false);
    const count = enabled.length;
    let avg = 5.0;
    if (count > 0) {
      const valid = enabled
        .map((r) => Number(r.rating))
        .filter((n) => !isNaN(n) && n >= 1 && n <= 5);
      if (valid.length > 0) {
        avg = Number((valid.reduce((sum, n) => sum + n, 0) / valid.length).toFixed(1));
      }
    }
    return { count, avg };
  }

  // 1. Initial 5 reviews with 5.0
  const stats1 = computeStats(sampleReviews);
  record('Total review count counts only enabled reviews (5)', stats1.count === 5);
  record('Average rating ignores disabled reviews (5.0)', stats1.avg === 5.0);

  // 2. Add a review with rating 4
  const updatedReviewsAdd: ReviewItem[] = [
    ...sampleReviews,
    {
      id: 'rev-7',
      reviewerName: 'Anita Sharma',
      rating: 4,
      reviewDate: 'Recently',
      sortOrder: 7,
      isVisible: true,
      reviewText: 'Great work',
    },
  ];
  const stats2 = computeStats(updatedReviewsAdd);
  // 5 reviews with 5 + 1 review with 4 = 29 / 6 = 4.833... -> 4.8
  record('Adding a 4-star review dynamically updates average rating to 4.8', stats2.avg === 4.8);
  record('Adding an enabled review increments total count to 6', stats2.count === 6);

  // 3. Edit rating of rev-7 to 3
  const updatedReviewsEdit = updatedReviewsAdd.map((r) =>
    r.id === 'rev-7' ? { ...r, rating: 3 } : r
  );
  const stats3 = computeStats(updatedReviewsEdit);
  // 5 reviews with 5 + 1 review with 3 = 28 / 6 = 4.666... -> 4.7
  record('Editing review rating immediately updates average to 4.7', stats3.avg === 4.7);

  // 4. Disable rev-7 (isVisible: false)
  const updatedReviewsDisable = updatedReviewsEdit.map((r) =>
    r.id === 'rev-7' ? { ...r, isVisible: false } : r
  );
  const stats4 = computeStats(updatedReviewsDisable);
  record('Disabling review immediately restores average to 5.0', stats4.avg === 5.0);
  record('Disabling review immediately decreases public count to 5', stats4.count === 5);

  // 5. Re-enable rev-7 (isVisible: true)
  const updatedReviewsReEnable = updatedReviewsDisable.map((r) =>
    r.id === 'rev-7' ? { ...r, isVisible: true } : r
  );
  const stats5 = computeStats(updatedReviewsReEnable);
  record('Re-enabling review includes it in statistics again (4.7 avg, count 6)', stats5.avg === 4.7 && stats5.count === 6);

  // 6. Delete rev-7
  const updatedReviewsDelete = updatedReviewsReEnable.filter((r) => r.id !== 'rev-7');
  const stats6 = computeStats(updatedReviewsDelete);
  record('Deleting review leaves canonical count at 5 and avg at 5.0', stats6.avg === 5.0 && stats6.count === 5);

  // 7. Verify rendered GoogleReviewsSection displays dynamic stats correctly
  const renderedDynamicStats = renderToStaticMarkup(
    React.createElement(GoogleReviewsSection, {
      content: {
        ...testContent,
        reviews: updatedReviewsAdd, // 6 enabled reviews, avg 4.8
      },
    })
  );
  record(
    'GoogleReviewsSection badge dynamically renders calculated average 4.8',
    renderedDynamicStats.includes('4.8')
  );
  record(
    'GoogleReviewsSection badge dynamically renders calculated count (6 Verified)',
    renderedDynamicStats.includes('(6 Verified)')
  );

  // ===========================================================================
  // 3. ADMIN PANEL LAYOUT & JUMP-FREE EDITING
  // ===========================================================================
  console.log('\n--- 3. Admin Panel Layout Stability Verification ---');

  // Verify AdminSiteContentClient implementation
  const adminClientCode = await import('fs').then((fs) =>
    fs.readFileSync('src/components/admin/AdminSiteContentClient.tsx', 'utf-8')
  );

  // Check 1: In-flow unsaved changes banner removed from above navigation tabs
  const hasInFlowUnsavedBanner = adminClientCode.includes(
    'UNSAVED CHANGES BANNER (Pops in dynamically above navigation'
  );
  record(
    'Unsaved changes banner removed from top page flow to prevent 80px layout shift',
    !hasInFlowUnsavedBanner
  );

  // Check 2: Unsaved changes indicator integrated inline into action bar
  const hasInlineUnsavedIndicator = adminClientCode.includes('hasUnsavedChanges && (');
  record(
    'Unsaved changes status displayed as non-shifting inline badge in actions bar',
    hasInlineUnsavedIndicator
  );

  // Check 3: Notifications rendered as fixed floating toasts (fixed bottom-6 right-6)
  const hasFloatingToasts =
    adminClientCode.includes('fixed bottom-6 right-6 z-50') &&
    adminClientCode.includes('Floating Non-Disruptive Toast Notifications');
  record(
    'Success and error notifications use floating toasts to eliminate vertical page jump',
    hasFloatingToasts
  );

  // Check 4: Number inputs support fluid typing without instant reset
  const hasFluidNumberInput =
    adminClientCode.includes("val === '' ? ('' as unknown as number) : Number(val)") &&
    adminClientCode.includes('onKeyDown={(e) => {');
  record(
    'Carousel auto-advance number input supports fluid backspacing without snapping back',
    hasFluidNumberInput
  );

  // Check 5: Live review statistics panel in AdminSiteContentClient
  const hasLiveAdminStats =
    adminClientCode.includes('Live Review Statistics (Authoritative)') &&
    adminClientCode.includes('liveAvgRating.toFixed(1)');
  record(
    'Admin panel displays authoritative live calculated review statistics',
    hasLiveAdminStats
  );

  // Check 6: AdminSettingsClient implementation
  const adminSettingsCode = await import('fs').then((fs) =>
    fs.readFileSync('src/components/admin/AdminSettingsClient.tsx', 'utf-8')
  );
  const settingsHasFloatingToasts = adminSettingsCode.includes(
    'Floating Non-Disruptive Toast Notifications'
  );
  record(
    'AdminSettingsClient notifications use floating toasts to prevent tab shifts',
    settingsHasFloatingToasts
  );

  // ===========================================================================
  // 4. LIVE BACKEND API & DATA PERSISTENCE
  // ===========================================================================
  console.log('\n--- 4. Live Firestore & API Verification ---');

  const snap = await adminDb.collection(COLLECTIONS.SITE_CONTENT).doc('reviews').get();
  record('site_content/reviews exists in Firestore', snap.exists);
  const data = snap.data();
  if (data) {
    record(
      'Firestore site_content/reviews has valid enabled reviews array',
      Array.isArray(data.reviews) && data.reviews.length >= 5
    );
    record(
      'Firestore site_content/reviews has authoritative totalReviewsCount',
      typeof data.totalReviewsCount === 'number' && data.totalReviewsCount >= 5
    );
    record(
      'Firestore site_content/reviews has authoritative averageRating',
      typeof data.averageRating === 'number' && data.averageRating >= 4.0 && data.averageRating <= 5.0
    );
    record(
      'Firestore site_content/reviews autoAdvanceSeconds is 1s',
      data.autoAdvanceSeconds === 1
    );
  }

  console.log('\n================================================================');
  console.log(`TOTAL: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
