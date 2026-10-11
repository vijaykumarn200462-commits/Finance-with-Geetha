import { loadEnvConfig } from '@next/env';
import path from 'path';

loadEnvConfig(path.resolve(__dirname, '..'));

async function runTests() {
  console.log('====================================================');
  console.log('     MASTER PROJECT COMPREHENSIVE WORKFLOW TEST     ');
  console.log('====================================================\n');

  const { adminAuth, adminDb } = await import('../src/lib/firebase/admin');
  let passCount = 0;
  let totalCount = 0;

  function assert(condition: boolean, testName: string, details?: string) {
    totalCount++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      if (details) console.log(`   └─ ${details}`);
      passCount++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      if (details) console.error(`   └─ ${details}`);
    }
  }

  // TEST SUITE 1: Admin Accounts & Authorization
  console.log('\n--- 1. Admin Authentication & Firestore Authorization ---');
  const admins = [
    { email: 'cageethanofficial@gmail.com', name: 'CA Geetha' },
    { email: 'vijaykumarn200462@gmail.com', name: 'Vijay Kumar' },
  ];

  for (const adm of admins) {
    try {
      const user = await adminAuth.getUserByEmail(adm.email);
      assert(!!user.uid, `Firebase Auth user exists for ${adm.email}`, `UID: ${user.uid}`);
      assert(user.customClaims?.admin === true, `Custom claim { admin: true } set for ${adm.email}`);

      const adminDoc = await adminDb.collection('admins').doc(user.uid).get();
      assert(adminDoc.exists, `Firestore document admins/${user.uid} exists`);
      if (adminDoc.exists) {
        const data = adminDoc.data();
        assert(data?.role === 'admin', `admins/${user.uid} role is 'admin'`, `Role: ${data?.role}`);
        assert(data?.active === true, `admins/${user.uid} active is true`, `Active: ${data?.active}`);
        assert(data?.email === adm.email, `admins/${user.uid} email matches ${adm.email}`);
      }
    } catch (err: unknown) {
      const errObj = err as { message?: string };
      assert(false, `Verification failed for ${adm.email}`, errObj.message);
    }
  }

  // TEST SUITE 2: CMS Dynamic Section Visibility
  console.log('\n--- 2. Firestore CMS Section Visibility & Item Toggles ---');
  try {
    const heroRef = adminDb.collection('site_content').doc('hero');
    const origHeroSnap = await heroRef.get();
    const origHeroData = origHeroSnap.exists ? origHeroSnap.data() : { enabled: true, title: 'Master Your Personal Finances' };

    // Toggle OFF
    await heroRef.set({ ...origHeroData, enabled: false }, { merge: true });
    const heroOffSnap = await heroRef.get();
    assert(heroOffSnap.data()?.enabled === false, 'Disable section: site_content/hero enabled set to false and verified');

    // Toggle ON
    await heroRef.set({ ...origHeroData, enabled: true }, { merge: true });
    const heroOnSnap = await heroRef.get();
    assert(heroOnSnap.data()?.enabled === true, 'Re-enable section: site_content/hero enabled restored to true');

    // Test item-level toggle in stats
    const statsRef = adminDb.collection('site_content').doc('stats');
    const origStatsSnap = await statsRef.get();
    const origStatsData = origStatsSnap.exists ? origStatsSnap.data() : {
      enabled: true,
      stats: [
        { label: 'Recurring clients', value: '~60', active: true },
        { label: 'Annual revenue', value: '₹25L+', active: true },
      ],
    };

    const statsList = origStatsData?.stats || origStatsData?.items || [];
    const modifiedStats = statsList.map((item: Record<string, unknown>, idx: number) =>
      idx === 0 ? { ...item, active: false } : item
    );
    await statsRef.set({ ...origStatsData, stats: modifiedStats }, { merge: true });
    const statsModifiedSnap = await statsRef.get();
    assert(
      statsModifiedSnap.data()?.stats?.[0]?.active === false,
      'Item-level toggle: first stat item disabled (active: false) and verified in Firestore'
    );

    // Restore stats
    await statsRef.set(origStatsData || {}, { merge: true });
    const statsRestoredSnap = await statsRef.get();
    assert(
      statsRestoredSnap.data()?.stats?.[0]?.active !== false,
      'Item-level restore: stat item active state restored'
    );
  } catch (err: unknown) {
    const errObj = err as { message?: string };
    assert(false, 'CMS Section visibility tests encountered error', errObj.message);
  }

  // TEST SUITE 3: Product Visibility, Pricing & INR Consistency
  console.log('\n--- 3. Product Pricing, Visibility & Currency Management ---');
  try {
    const commRef = adminDb.collection('products').doc('community');
    const commSnap = await commRef.get();
    assert(commSnap.exists, 'Product products/community exists in Firestore');

    if (commSnap.exists) {
      const commData = commSnap.data();
      assert(commData?.currency === 'INR', 'Community product currency is strictly INR', `Currency: ${commData?.currency}`);
      const origPrice = commData?.price;
      assert(typeof origPrice === 'number', `Original Community price is numeric: ₹${origPrice}`);

      // Test dynamic price update: ₹150 -> ₹200
      await commRef.set({ price: 200 }, { merge: true });
      const updatedSnap = await commRef.get();
      assert(updatedSnap.data()?.price === 200, 'Price change persisted: Community price updated to ₹200');

      // Restore to ₹150
      await commRef.set({ price: origPrice }, { merge: true });
      const restoredSnap = await commRef.get();
      assert(restoredSnap.data()?.price === origPrice, `Price restored cleanly to original value: ₹${origPrice}`);
    }

    // Product CRUD verification
    const testProdId = `test-auto-${Date.now()}`;
    const testProdRef = adminDb.collection('products').doc(testProdId);

    // Create
    await testProdRef.set({
      id: testProdId,
      name: 'Automated Test Product',
      description: 'Temporary product created for workflow testing',
      price: 99,
      currency: 'INR',
      active: true,
      category: 'tools',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    const createdSnap = await testProdRef.get();
    assert(createdSnap.exists && createdSnap.data()?.price === 99, 'Product Create: Created test product in Firestore');

    // Update & Disable
    await testProdRef.set({ active: false, price: 149 }, { merge: true });
    const updatedProdSnap = await testProdRef.get();
    assert(
      updatedProdSnap.data()?.active === false && updatedProdSnap.data()?.price === 149,
      'Product Edit & Disable: Updated active: false, price: 149 verified'
    );

    // Delete
    await testProdRef.delete();
    const deletedSnap = await testProdRef.get();
    assert(!deletedSnap.exists, 'Product Delete: Cleanly deleted test product from Firestore');
  } catch (err: unknown) {
    const errObj = err as { message?: string };
    assert(false, 'Product pricing/CRUD tests encountered error', errObj.message);
  }

  // TEST SUITE 4: Social Settings & YouTube Channel Binding
  console.log('\n--- 4. Social Settings & YouTube Channel Configuration ---');
  try {
    const socialRef = adminDb.collection('settings').doc('social');
    const socialSnap = await socialRef.get();
    assert(socialSnap.exists, 'Firestore document settings/social exists');
    if (socialSnap.exists) {
      const data = socialSnap.data();
      const ytUrl = data?.youtubeUrl || data?.youtube;
      assert(!!ytUrl, 'YouTube setting field exists in settings/social', `URL: ${ytUrl || '(empty/hidden)'}`);
      assert(
        !ytUrl?.includes('@jakedemi'),
        'YouTube URL does NOT contain outdated reference @jakedemi',
        `Current YouTube URL: ${ytUrl}`
      );
    }
  } catch (err: unknown) {
    const errObj = err as { message?: string };
    assert(false, 'Social settings test encountered error', errObj.message);
  }

  console.log('\n====================================================');
  console.log(`TEST RESULTS: ${passCount}/${totalCount} assertions passed (${Math.round((passCount / totalCount) * 100)}%)`);
  console.log('====================================================');

  if (passCount === totalCount) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests().catch((e) => {
  console.error(e);
  process.exit(1);
});
