/**
 * Test Suite: Google Reviews Carousel & Admin CMS Integration
 *
 * Usage:
 *   npx tsx scripts/test-reviews-and-carousel.ts
 */

import { loadEnvConfig } from '@next/env';
import fs from 'fs';
import path from 'path';

loadEnvConfig(process.cwd());

async function runTestSuite() {
  console.log('====================================================');
  console.log('Finance with Geetha: Reviews & Carousel Test Suite');
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

  const { adminDb } = await import('../src/lib/firebase/admin');
  const { COLLECTIONS } = await import('../src/lib/firebase/collections');
  const db = adminDb;

  // --- Group 1: Firestore site_content/reviews ---
  console.log('--- Test Group 1: Firestore site_content/reviews ---');
  try {
    const docRef = db.collection(COLLECTIONS.SITE_CONTENT).doc('reviews');
    const docSnap = await docRef.get();
    assert(docSnap.exists, 'site_content/reviews document exists in Firestore');

    if (docSnap.exists) {
      const data = docSnap.data();
      assert(data?.heading === 'What Our Clients Say', 'Heading matches "What Our Clients Say"');
      assert(
        data?.subtitle ===
          'Trusted by our clients for reliable accounting, professional guidance, and hassle-free tax filing.',
        'Subtitle matches exact accounting-firm description'
      );
      assert(
        typeof data?.googleMapsUrl === 'string' && data.googleMapsUrl.includes('Finance+With+Geetha'),
        'Google Maps URL points to Finance With Geetha Google Maps listing'
      );
      assert(Array.isArray(data?.reviews) && data.reviews.length >= 5, 'Contains authentic client reviews in reviews array (count >= 5)');
      assert(typeof data?.totalReviewsCount === 'number' && data.totalReviewsCount >= 5, 'totalReviewsCount is at least 5');
      assert(data?.averageRating === 5.0, 'averageRating is 5.0');
      assert(data?.enabled === true, 'Section enabled is true');
    }
  } catch (err) {
    console.error('Group 1 error:', err);
    failed++;
  }

  // --- Group 2: Firestore homepageReviews Collection ---
  console.log('\n--- Test Group 2: Firestore homepageReviews Collection ---');
  try {
    const snap = await db.collection(COLLECTIONS.HOMEPAGE_REVIEWS).orderBy('sortOrder', 'asc').get();
    console.log(`[homepageReviews count: ${snap.size}]`);
    snap.docs.forEach(d => console.log(`  - doc ${d.id}: ${d.data().reviewerName}`));
    assert(snap.size >= 5, 'homepageReviews collection contains authentic documents (count >= 5)');

    const names = snap.docs.map((d) => d.data().reviewerName);
    assert(names.includes('Subbu Subbu'), 'Includes Subbu Subbu');
    assert(names.includes('Nagaveni N'), 'Includes Nagaveni N');
    assert(names.includes('Kevin Gibson'), 'Includes Kevin Gibson');
    assert(names.includes('Ravi Kumar'), 'Includes Ravi Kumar');
    assert(names.includes('Mahesh V S'), 'Includes Mahesh V S');

    const kevinDoc = snap.docs.find((d) => d.data().reviewerName === 'Kevin Gibson')?.data();
    assert(kevinDoc?.ownerResponse === 'Thank you Kevin', 'Kevin Gibson review has owner response: "Thank you Kevin"');
    assert(kevinDoc?.rating === 5, 'Kevin Gibson has 5-star rating');
    assert(kevinDoc?.reviewDate === '2 years ago', 'Kevin Gibson has relative date "2 years ago"');

    const raviDoc = snap.docs.find((d) => d.data().reviewerName === 'Ravi Kumar')?.data();
    assert(
      raviDoc?.reviewText?.includes('ITR with Geetha for 3 years'),
      'Ravi Kumar review contains authentic review text verbatim'
    );
  } catch (err) {
    console.error('Group 2 error:', err);
    failed++;
  }

  // --- Group 3: Review Screenshot Assets ---
  console.log('\n--- Test Group 3: Local Image Asset Verification ---');
  const imageFiles = [
    'subbu-subbu-review.png',
    'nagaveni-n-review.png',
    'kevin-gibson-review.png',
    'ravi-kumar-review.png',
    'mahesh-v-s-review.png',
  ];
  for (const img of imageFiles) {
    const fullPath = path.join(process.cwd(), 'public', 'images', 'reviews', img);
    const exists = fs.existsSync(fullPath);
    const size = exists ? fs.statSync(fullPath).size : 0;
    assert(exists && size > 1000, `Review asset exists with valid size: public/images/reviews/${img} (${size} bytes)`);
  }

  // --- Group 4: Next.js SSR / DOM Layout Verification ---
  console.log('\n--- Test Group 4: Next.js SSR / DOM Layout Verification ---');
  try {
    const res = await fetch('http://localhost:3000/');
    const html = await res.text();

    assert(res.status === 200, 'Homepage HTTP status is 200 OK');
    assert(html.includes('What Our Clients Say'), 'HTML includes "What Our Clients Say" heading');
    assert(html.includes('Trusted by our clients for reliable accounting'), 'HTML includes section subtitle');
    assert(html.includes('Google Reviews'), 'HTML includes "Google Reviews" badge');
    assert(html.includes('View All Google Reviews'), 'HTML includes "View All Google Reviews" CTA button');
    assert(html.includes('Get Directions on Google Maps'), 'HTML includes "Get Directions on Google Maps" CTA button');
    assert(html.includes('View Review Proof'), 'HTML includes modal trigger "View Review Proof"');

    // Section ordering verification:
    // Ensure section 'reviews' appears after the hero and before about
    const heroIndex =
      html.indexOf('FINANCE &amp; BOOKKEEPING COACHING') !== -1
        ? html.indexOf('FINANCE &amp; BOOKKEEPING COACHING')
        : html.indexOf('FINANCE & BOOKKEEPING COACHING');
    const reviewsIndex = html.indexOf('What Our Clients Say');
    const aboutIndex = html.indexOf('About Geetha');

    assert(heroIndex !== -1, 'Hero section found in HTML');
    assert(reviewsIndex !== -1, 'Reviews carousel section found in HTML');
    assert(aboutIndex !== -1, 'About section found in HTML');
    assert(
      reviewsIndex > heroIndex && reviewsIndex < aboutIndex,
      'Reviews carousel is placed immediately below Hero and above About'
    );
  } catch (err) {
    console.error('Group 4 error:', err);
    failed++;
  }

  console.log('\n====================================================');
  console.log(`TOTAL: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
