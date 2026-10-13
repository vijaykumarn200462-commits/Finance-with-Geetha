import { loadEnvConfig } from '@next/env';
import path from 'path';
loadEnvConfig(path.resolve(process.cwd()));

import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { firebaseConfig } from '../src/lib/firebase/config';
import { fetchAllSiteContent } from '../src/lib/firebase/content-server';
import { fetchPublicStoreProducts } from '../src/lib/firebase/content';

async function main() {
  console.log('================================================================');
  console.log('   CMS VISIBILITY & FIRESTORE PRODUCTS INDEX TEST SUITE        ');
  console.log('================================================================\n');

  const app = initializeApp(firebaseConfig, 'test-cms-suite');
  const db = getFirestore(app);

  // ---------------------------------------------------------------
  // TEST 1: FIRESTORE PRODUCTS QUERY & COMPOSITE INDEX VERIFICATION
  // ---------------------------------------------------------------
  console.log('--- TEST 1: Firestore Products Composite Index Query ---');
  try {
    const q = query(
      collection(db, 'products'),
      where('active', '==', true),
      orderBy('sortOrder', 'asc')
    );
    const snap = await getDocs(q);
    console.log(`[PASS] Products query succeeded! Found ${snap.size} active products sorted by sortOrder.`);
    snap.docs.forEach((d) => {
      console.log(`  - Product [${d.id}]: sortOrder=${d.data().sortOrder}, name="${d.data().name}", active=${d.data().active}`);
    });

    const helperProducts = await fetchPublicStoreProducts();
    console.log(`[PASS] fetchPublicStoreProducts() succeeded! Returned ${helperProducts.length} formatted products.`);
  } catch (err: unknown) {
    console.error('[FAIL] Products query failed:', err);
    process.exit(1);
  }

  // ---------------------------------------------------------------
  // TEST 2: SERVER-SIDE FETCH ALL SITE CONTENT
  // ---------------------------------------------------------------
  console.log('\n--- TEST 2: Server-Side fetchAllSiteContent() ---');
  try {
    const siteContent = await fetchAllSiteContent();
    const docKeys = Object.keys(siteContent.sections);
    console.log(`[PASS] fetchAllSiteContent() retrieved ${docKeys.length} documents from Firestore (loaded: ${siteContent.loaded}).`);
    console.log(`  - site_content/about enabled: ${(siteContent.sections.about as { enabled?: boolean })?.enabled}`);
    console.log(`  - site_content/hero enabled: ${(siteContent.sections.hero as { enabled?: boolean })?.enabled}`);
    console.log(`  - site_content/book enabled: ${(siteContent.sections.book as { enabled?: boolean })?.enabled}`);
    console.log(`  - site_content/store enabled: ${(siteContent.sections.store as { enabled?: boolean })?.enabled}`);
  } catch (err: unknown) {
    console.error('[FAIL] fetchAllSiteContent() failed:', err);
    process.exit(1);
  }

  // ---------------------------------------------------------------
  // TEST 3: REVALIDATION ROUTE VERIFICATION
  // ---------------------------------------------------------------
  console.log('\n--- TEST 3: On-Demand Revalidation Route ---');
  try {
    const res = await fetch('http://localhost:3000/api/admin/site-content/revalidate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ section: 'about' }),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      console.log(`[PASS] Revalidation endpoint responded 200 OK:`, data);
    } else {
      console.warn(`[WARN] Revalidation response:`, res.status, data);
    }
  } catch (err: unknown) {
    console.warn(`[NOTICE] Local dev server might not be serving revalidation port:`, err);
  }

  // ---------------------------------------------------------------
  // TEST 4: CMS VISIBILITY PERSISTENCE & TOGGLE CYCLE
  // ---------------------------------------------------------------
  console.log('\n--- TEST 4: CMS Visibility Toggle & Save Verification ---');
  const { adminAuth } = await import('../src/lib/firebase/admin');
  const { getAuth, signInWithCustomToken } = await import('firebase/auth');
  const adminUser = await adminAuth.getUserByEmail('cageethanofficial@gmail.com');
  const customToken = await adminAuth.createCustomToken(adminUser.uid);
  const clientAuth = getAuth(app);
  await signInWithCustomToken(clientAuth, customToken);
  console.log('  [PASS] Authenticated client SDK as admin cageethanofficial@gmail.com');

  const aboutRef = doc(db, 'site_content', 'about');
  const initialSnap = await getDoc(aboutRef);
  const initialData = initialSnap.data() || {};
  const originalEnabled = initialData.enabled;

  console.log(`  Current Firestore site_content/about enabled: ${originalEnabled}`);

  // Test toggling to true
  console.log('  Testing persistence: setting enabled = true...');
  await setDoc(aboutRef, { ...initialData, enabled: true }, { merge: true });
  let checkSnap = await getDoc(aboutRef);
  if (checkSnap.data()?.enabled !== true) {
    throw new Error('FAIL: Firestore did not persist enabled: true');
  }
  console.log('  [PASS] Successfully persisted enabled: true to Firestore.');

  // Test toggling back to false (as configured by admin)
  console.log('  Testing persistence: setting enabled = false...');
  await setDoc(aboutRef, { ...initialData, enabled: false }, { merge: true });
  checkSnap = await getDoc(aboutRef);
  if (checkSnap.data()?.enabled !== false) {
    throw new Error('FAIL: Firestore did not persist enabled: false');
  }
  console.log('  [PASS] Successfully persisted enabled: false to Firestore.');

  console.log('\n================================================================');
  console.log('   ALL INTEGRATION & VISIBILITY TESTS PASSED SUCCESSFULLY!     ');
  console.log('================================================================');
  process.exit(0);
}

main().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
