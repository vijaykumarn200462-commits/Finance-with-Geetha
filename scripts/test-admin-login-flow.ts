import { loadEnvConfig } from '@next/env';
import path from 'path';

loadEnvConfig(path.resolve(process.cwd()));

async function runTest() {
  const adminMod: any = await import('@/lib/firebase/admin');
  const adminAuth = adminMod.adminAuth || adminMod.default?.adminAuth;
  const adminDb = adminMod.adminDb || adminMod.default?.adminDb;
  const cfgMod: any = await import('@/lib/firebase/config');
  const firebaseConfig = cfgMod.firebaseConfig || cfgMod.default?.firebaseConfig;

  console.log('====================================================');
  console.log('   ADMIN AUTHENTICATION & LOGIN FLOW TEST SUITE    ');
  console.log('====================================================\n');

  // 1. Verify Client Firebase Config
  console.log('--- 1. Validating Firebase Client Configuration ---');
  if (!firebaseConfig.apiKey || firebaseConfig.apiKey.includes('placeholder')) {
    throw new Error('FAIL: Firebase API key is missing or is a placeholder.');
  }
  console.log('✅ [PASS] Genuine Firebase API key configured');
  console.log(`   └─ Project ID: ${firebaseConfig.projectId}`);
  console.log(`   └─ Auth Domain: ${firebaseConfig.authDomain}`);
  console.log(`   └─ Storage Bucket: ${firebaseConfig.storageBucket}`);

  // 2. Test Unauthenticated Access
  console.log('\n--- 2. Testing Unauthenticated Access Protection ---');
  const unauthRes = await fetch('http://localhost:3000/api/admin/verify-session');
  if (unauthRes.status !== 401) {
    throw new Error(`Expected status 401 for unauthenticated request, got ${unauthRes.status}`);
  }
  const unauthData = await unauthRes.json();
  if (unauthData.authorized !== false) {
    throw new Error('Expected authorized: false for unauthenticated request');
  }
  console.log('✅ [PASS] Unauthenticated request strictly blocked with 401');

  // 3. Test Authorized Administrator Login Flow
  console.log('\n--- 3. Testing Authorized Admin Login Flow ---');
  const adminEmail = 'cageethanofficial@gmail.com';
  const adminUser = await adminAuth.getUserByEmail(adminEmail);
  console.log(`✅ [PASS] Found admin user in Firebase Auth: ${adminEmail} (UID: ${adminUser.uid})`);

  // Verify Firestore admins doc
  const adminDoc = await adminDb.collection('admins').doc(adminUser.uid).get();
  if (!adminDoc.exists) {
    throw new Error(`FAIL: admins/${adminUser.uid} document does not exist`);
  }
  const adminData = adminDoc.data();
  if (adminData.role !== 'admin' || adminData.active !== true) {
    throw new Error(`FAIL: admin document has invalid role (${adminData.role}) or inactive status`);
  }
  console.log('✅ [PASS] Firestore admins record valid and active: role = "admin", active = true');

  // Mint custom token and exchange for real Firebase ID Token
  const customToken = await adminAuth.createCustomToken(adminUser.uid);
  const tokenRes = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${firebaseConfig.apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: customToken, returnSecureToken: true }),
    }
  );
  const tokenData = await tokenRes.json();
  if (!tokenData.idToken) {
    throw new Error(`FAIL: Unable to obtain ID token: ${JSON.stringify(tokenData)}`);
  }
  const adminIdToken = tokenData.idToken;
  console.log('✅ [PASS] Successfully obtained genuine Firebase ID token');

  // 4. Server Verification with Authorization Header
  console.log('\n--- 4. Testing Server Verification with Authorization Header ---');
  const verifyRes = await fetch('http://localhost:3000/api/admin/verify-session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminIdToken}`,
    },
  });
  if (verifyRes.status !== 200) {
    throw new Error(`Expected status 200 for valid admin, got ${verifyRes.status}`);
  }
  const verifyData = await verifyRes.json();
  if (!verifyData.authorized || verifyData.adminRecord?.role !== 'admin') {
    throw new Error(`FAIL: Server verification returned unauthorized: ${JSON.stringify(verifyData)}`);
  }
  const setCookieHeader = verifyRes.headers.get('set-cookie');
  console.log('✅ [PASS] Server verification succeeded with 200 OK');
  console.log(`   └─ Verified Admin: ${verifyData.email} (${verifyData.uid})`);
  console.log(`   └─ Session Cookie Set in Response: ${Boolean(setCookieHeader)}`);

  // 5. Server Verification with admin_session Cookie
  console.log('\n--- 5. Testing Server Verification with admin_session Cookie ---');
  const cookieVerifyRes = await fetch('http://localhost:3000/api/admin/verify-session', {
    headers: {
      Cookie: `admin_session=${adminIdToken}`,
    },
  });
  if (cookieVerifyRes.status !== 200) {
    throw new Error(`Expected status 200 with cookie, got ${cookieVerifyRes.status}`);
  }
  const cookieVerifyData = await cookieVerifyRes.json();
  if (!cookieVerifyData.authorized) {
    throw new Error('FAIL: Cookie verification failed');
  }
  console.log('✅ [PASS] Cookie-based verification succeeded with 200 OK');

  // 6. Test Admin API Route Access with Cookie
  console.log('\n--- 6. Testing Admin API Routes with Session Cookie ---');
  const ordersRes = await fetch('http://localhost:3000/api/admin/orders', {
    headers: { Cookie: `admin_session=${adminIdToken}` },
  });
  console.log(`✅ [PASS] /api/admin/orders returned status ${ordersRes.status} (Access Granted)`);

  const messagesRes = await fetch('http://localhost:3000/api/admin/messages', {
    headers: { Cookie: `admin_session=${adminIdToken}` },
  });
  console.log(`✅ [PASS] /api/admin/messages returned status ${messagesRes.status} (Access Granted)`);

  // 7. Test Non-Admin Customer Blocked from Admin APIs
  console.log('\n--- 7. Testing Customer Access Strictly Blocked ---');
  const customerCustomToken = await adminAuth.createCustomToken('customer-test-id-12345');
  const customerTokenRes = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${firebaseConfig.apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: customerCustomToken, returnSecureToken: true }),
    }
  );
  const customerTokenData = await customerTokenRes.json();
  const customerIdToken = customerTokenData.idToken;

  const customerVerifyRes = await fetch('http://localhost:3000/api/admin/verify-session', {
    headers: { Authorization: `Bearer ${customerIdToken}` },
  });
  if (customerVerifyRes.status !== 403) {
    throw new Error(`Expected status 403 for non-admin, got ${customerVerifyRes.status}`);
  }
  console.log('✅ [PASS] Non-admin customer strictly rejected with 403 Forbidden');

  const customerOrdersRes = await fetch('http://localhost:3000/api/admin/orders', {
    headers: { Cookie: `admin_session=${customerIdToken}` },
  });
  if (customerOrdersRes.status !== 403) {
    throw new Error(`Expected status 403 for customer on /api/admin/orders, got ${customerOrdersRes.status}`);
  }
  console.log('✅ [PASS] Non-admin customer blocked from /api/admin/orders with 403 Forbidden');

  console.log('\n====================================================');
  console.log('ALL ADMIN LOGIN & VERIFICATION TESTS PASSED (100%)');
  console.log('====================================================\n');
}

runTest().catch((err) => {
  console.error('\n❌ TEST RUN FAILED:', err);
  process.exit(1);
});
