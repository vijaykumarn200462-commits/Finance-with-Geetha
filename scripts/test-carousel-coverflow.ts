/**
 * Comprehensive Verification Suite:
 * Premium Center-Focused Review Carousel & 9-Dot Dynamic Pagination
 *
 * Usage:
 *   npx tsx scripts/test-carousel-coverflow.ts
 */

import { loadEnvConfig } from '@next/env';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

loadEnvConfig(process.cwd());

async function runVerification() {
  console.log('====================================================');
  console.log('Finance with Geetha: Coverflow Carousel Verification');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`PASS: ${testName}`);
      passed++;
    } else {
      console.error(`FAIL: ${testName}`);
      failed++;
    }
  }

  // --- Group 1: 9-Dot Dynamic Pagination Verification ---
  console.log('--- Test Group 1: Nine Enabled Reviews Produce Exactly Nine Dots ---');

  const { GoogleReviewsSection } = await import('../src/components/home/GoogleReviewsSection');
  const { DEFAULT_GOOGLE_MAPS_URL } = await import('../src/lib/firebase/reviews-defaults');

  // Construct test payload with 9 enabled reviews
  const nineReviews = Array.from({ length: 9 }, (_, i) => ({
    id: `test-review-${i + 1}`,
    reviewerName: `Client ${i + 1}`,
    reviewCountText: '1 review',
    rating: 5,
    reviewDate: `${i + 1} days ago`,
    isNew: i === 0,
    reviewText: `Outstanding accounting and taxation guidance from Geetha. Review number ${i + 1}.`,
    ownerResponse: i === 2 ? 'Thank you for your feedback!' : null,
    ownerResponseDate: i === 2 ? '2 days ago' : null,
    reviewerImageUrl: null,
    reviewerInitials: `C${i + 1}`,
    avatarBgColor: '#0f2c59',
    reviewScreenshotUrl: '/images/reviews/subbu-subbu-review.png',
    sortOrder: i + 1,
    isVisible: true,
  }));

  const contentWithNine = {
    enabled: true,
    heading: 'What Our Clients Say',
    subtitle: 'Trusted by our clients for reliable accounting, professional guidance, and hassle-free tax filing.',
    googleMapsUrl: DEFAULT_GOOGLE_MAPS_URL,
    showGoogleRatingBadge: true,
    averageRating: 5.0,
    totalReviewsCount: 9,
    autoAdvanceSeconds: 1.0,
    reviews: nineReviews,
  };

  const htmlNine = renderToStaticMarkup(React.createElement(GoogleReviewsSection, { content: contentWithNine }));

  // Count role="tab" elements (pagination buttons)
  const tabMatchesNine = htmlNine.match(/role="tab"/g);
  const dotCountNine = tabMatchesNine ? tabMatchesNine.length : 0;
  assert(dotCountNine === 9, `Rendered with 9 enabled reviews produces exactly 9 pagination dots (found: ${dotCountNine})`);

  // Verify that dots are NOT grouped into 3 slides
  assert(dotCountNine !== 3, 'Pagination is NOT grouped into 3 slides; each review has its own distinct dot');

  // Verify active indicator styles: exactly one dot has the expanded active indicator class
  const activeDotMatches = htmlNine.match(/w-8 bg-\[#138354\]/g);
  assert(
    activeDotMatches !== null && activeDotMatches.length === 1,
    'Exactly one active dot is highlighted in brand green (#138354) and expanded (w-8)'
  );

  // Inactive dots match
  const inactiveDotMatches = htmlNine.match(/w-2\.5 bg-slate-300/g);
  assert(
    inactiveDotMatches !== null && inactiveDotMatches.length === 8,
    'Remaining 8 dots are styled as inactive (w-2.5 bg-slate-300)'
  );

  // Verify dynamic adaptability: 5 reviews produces exactly 5 dots
  const contentWithFive = {
    ...contentWithNine,
    totalReviewsCount: 5,
    reviews: nineReviews.slice(0, 5),
  };
  const htmlFive = renderToStaticMarkup(React.createElement(GoogleReviewsSection, { content: contentWithFive }));
  const tabMatchesFive = htmlFive.match(/role="tab"/g);
  const dotCountFive = tabMatchesFive ? tabMatchesFive.length : 0;
  assert(dotCountFive === 5, `Dynamic adaptability: 5 enabled reviews produces exactly 5 dots (found: ${dotCountFive})`);

  // --- Group 2: Center-Focused Coverflow Layout & Scaling Verification ---
  console.log('\n--- Test Group 2: Center-Focused Layout & Scaling ---');

  // Verify center card has scale(1.0) and full opacity
  assert(
    htmlNine.includes('scale(1.0)') || htmlNine.includes('scale(1)'),
    'Center card transform includes scale(1.0)'
  );
  assert(
    htmlNine.includes('opacity:1') || htmlNine.includes('opacity: 1'),
    'Center card style includes opacity: 1'
  );

  // Verify side cards have scale between 0.84 and 0.90
  const hasSideScale =
    htmlNine.includes('scale(0.88)') ||
    htmlNine.includes('scale(0.86)') ||
    htmlNine.includes('scale(0.84)');
  assert(hasSideScale, 'Side cards have scale between 0.84 and 0.90 (e.g., 0.88/0.86/0.84)');

  // Verify vertical centering: transform translate(..., -50%)
  assert(
    htmlNine.includes('-50%'),
    'Cards are vertically centered and aligned via -50% translateY'
  );

  // Verify transition duration: 600ms cubic-bezier transition
  assert(
    htmlNine.includes('duration-600') && htmlNine.includes('cubic-bezier(0.25,1,0.5,1)'),
    'Smooth coverflow transition configured with 600ms duration and smooth cubic-bezier curve'
  );

  // --- Group 3: One-Second Autoplay Interval & Settings Verification ---
  console.log('\n--- Test Group 3: 1,000ms (1-Second) Autoplay ---');
  const { DEFAULT_REVIEWS_SECTION_CONTENT } = await import('../src/lib/firebase/reviews-defaults');
  assert(
    DEFAULT_REVIEWS_SECTION_CONTENT.autoAdvanceSeconds === 1,
    'Default autoAdvanceSeconds in reviews-defaults is set to 1 second (1,000 ms)'
  );

  const { adminDb } = await import('../src/lib/firebase/admin');
  const { COLLECTIONS } = await import('../src/lib/firebase/collections');
  const db = adminDb;
  const siteContentReviewsDoc = await db.collection(COLLECTIONS.SITE_CONTENT).doc('reviews').get();
  assert(siteContentReviewsDoc.exists, 'site_content/reviews exists in Firestore');
  const firestoreData = siteContentReviewsDoc.data();
  assert(
    firestoreData?.autoAdvanceSeconds === 1,
    `Firestore site_content/reviews autoAdvanceSeconds is configured to 1 (value: ${firestoreData?.autoAdvanceSeconds})`
  );

  // --- Group 4: Live HTTP Server / DOM Layout Verification ---
  console.log('\n--- Test Group 4: Live HTTP Server & Layout ---');
  try {
    const res = await fetch('http://localhost:3000/');
    assert(res.status === 200, 'Homepage server status is 200 OK');

    const html = await res.text();
    assert(html.includes('What Our Clients Say'), 'Homepage HTML contains "What Our Clients Say"');
    assert(
      html.includes('Google Reviews and Client Testimonials'),
      'Homepage HTML contains Google Reviews section'
    );
    assert(html.includes('role="region"'), 'Carousel has role="region"');
    assert(html.includes('aria-roledescription="carousel"'), 'Carousel has aria-roledescription="carousel"');
    assert(html.includes('Previous review'), 'Includes accessible "Previous review" navigation button');
    assert(html.includes('Next review'), 'Includes accessible "Next review" navigation button');
    assert(html.includes('role="tablist"'), 'Includes accessible pagination role="tablist"');

    // Section ordering verification:
    // Ensure section 'reviews' appears after the hero and before about
    const heroIndex =
      html.indexOf('FINANCE &amp; BOOKKEEPING COACHING') !== -1
        ? html.indexOf('FINANCE &amp; BOOKKEEPING COACHING')
        : html.indexOf('FINANCE & BOOKKEEPING COACHING');
    const reviewsIndex = html.indexOf('What Our Clients Say');
    const aboutIndex = html.indexOf('About Geetha');

    assert(
      heroIndex !== -1 && reviewsIndex > heroIndex && reviewsIndex < aboutIndex,
      'Reviews carousel is placed immediately below Hero and above About'
    );
  } catch (err) {
    console.error('HTTP check error:', err);
    failed++;
  }

  // --- Group 5: Firestore Data Integrity ---
  console.log('\n--- Test Group 5: Firestore Reviews Data Integrity ---');
  const reviewsSnap = await db.collection(COLLECTIONS.HOMEPAGE_REVIEWS).orderBy('sortOrder', 'asc').get();
  assert(reviewsSnap.size >= 5, `homepageReviews collection has authentic reviews (count: ${reviewsSnap.size})`);

  const kevinDoc = reviewsSnap.docs.find((d) => d.data().reviewerName === 'Kevin Gibson')?.data();
  assert(kevinDoc?.ownerResponse === 'Thank you Kevin', 'Kevin Gibson review preserves owner response: "Thank you Kevin"');
  assert(kevinDoc?.rating === 5, 'Kevin Gibson has 5-star rating');

  console.log('\n====================================================');
  console.log(`TOTAL: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runVerification().catch((err) => {
  console.error('Fatal verification error:', err);
  process.exit(1);
});
