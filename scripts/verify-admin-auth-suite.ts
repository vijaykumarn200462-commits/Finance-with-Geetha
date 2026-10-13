/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { loadEnvConfig } from '@next/env';
import path from 'path';

// Pre-load environment from project root
loadEnvConfig(path.resolve(process.cwd()));

async function runVerificationSuite() {
  console.log('================================================================');
  console.log('    FIREBASE ADMIN AUTHENTICATION VERIFICATION TEST SUITE       ');
  console.log('================================================================\n');

  // Dynamically import application modules
  const adminMod: any = await import('@/lib/firebase/admin');
  const adminAuth = adminMod.adminAuth || adminMod.default?.adminAuth;
  const adminDb = adminMod.adminDb || adminMod.default?.adminDb;
  const adminApp = adminMod.adminApp || adminMod.default?.adminApp;
  const getAdminApp = adminMod.getAdminApp || adminMod.default?.getAdminApp;
  const isFirebaseAdminValid = adminMod.isFirebaseAdminValid || adminMod.default?.isFirebaseAdminValid;
  const resolveAdminCredentials = adminMod.resolveAdminCredentials || adminMod.default?.resolveAdminCredentials;

  const cfgMod: any = await import('@/lib/firebase/config');
  const firebaseConfig = cfgMod.firebaseConfig || cfgMod.default?.firebaseConfig;
  const getSafeFirebaseEnvDiagnostic = cfgMod.getSafeFirebaseEnvDiagnostic || cfgMod.default?.getSafeFirebaseEnvDiagnostic;

  const verifyMod: any = await import('@/lib/firebase/admin-verify');
  const verifyAdminRequest = verifyMod.verifyAdminRequest || verifyMod.default?.verifyAdminRequest;

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++;
    if (!condition) {
      console.error(`❌ [FAIL] ${testName}`);
      if (detail) console.error(`   └─ Detail: ${detail}`);
      throw new Error(`Test failed: ${testName}`);
    }
    passedTests++;
    console.log(`✅ [PASS] ${testName}`);
    if (detail) console.log(`   └─ ${detail}`);
  }

  // TEST 1: Firebase Admin SDK initializes with valid server credentials & targets geetha-coaching
  console.log('--- TEST 1: Firebase Admin SDK Initialization ---');
  assert(isFirebaseAdminValid(), 'isFirebaseAdminValid() returns true for configured environment');
  
  const app = getAdminApp();
  assert(Boolean(app && app.name), 'Firebase Admin App successfully initialized', `App Name: ${app.name}`);
  
  const creds = resolveAdminCredentials();
  assert(creds.projectId === 'geetha-coaching', 'Admin SDK targets existing Firebase project geetha-coaching', `Project: ${creds.projectId}`);
  assert(Boolean(creds.clientEmail && creds.clientEmail.includes('@')), 'Client email is valid service account format (sanitized)');
  assert(Boolean(creds.privateKey && creds.privateKey.includes('BEGIN PRIVATE KEY')), 'Private key contains valid PEM headers without exposure');
  assert(Boolean(adminAuth && adminDb && adminApp), 'Admin Auth, Firestore DB, and App singletons available');

  // TEST 2: Admin health endpoint reports correct authentication configuration status
  console.log('\n--- TEST 2: Admin Health Endpoint Status ---');
  // 2a. Unauthenticated check
  const unauthHealthRes = await fetch('http://localhost:3000/api/admin/health');
  assert(unauthHealthRes.status === 401, 'Unauthenticated GET /api/admin/health returns 401 Unauthorized');
  const unauthHealthData = await unauthHealthRes.json();
  assert(!unauthHealthData.status || unauthHealthData.status !== 'ok', 'Zero health or diagnostic data leaked to unauthenticated caller');

  // Obtain valid administrator ID token
  const adminEmail = 'cageethanofficial@gmail.com';
  const adminUser = await adminAuth.getUserByEmail(adminEmail);
  const adminCustomToken = await adminAuth.createCustomToken(adminUser.uid);
  const adminTokenExchangeRes = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${firebaseConfig.apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: adminCustomToken, returnSecureToken: true }),
    }
  );
  const adminTokenExchangeData = await adminTokenExchangeRes.json();
  const validAdminIdToken = adminTokenExchangeData.idToken;
  assert(Boolean(validAdminIdToken), 'Successfully exchanged custom token for genuine Firebase ID token');

  // 2b. Authenticated check
  const authHealthRes = await fetch('http://localhost:3000/api/admin/health', {
    headers: { Authorization: `Bearer ${validAdminIdToken}` },
  });
  assert(authHealthRes.status === 200, 'Authenticated GET /api/admin/health returns 200 OK');
  const authHealthData = await authHealthRes.json();
  assert(authHealthData.status === 'ok', 'Health status is ok');
  assert(authHealthData.isFirebaseAdminConfigured === true, 'Admin health reports isFirebaseAdminConfigured: true');
  assert(authHealthData.authenticatedAsAdmin === true, 'Admin health reports authenticatedAsAdmin: true');
  assert(authHealthData.projectId === 'geetha-coaching', 'Health reports projectId: geetha-coaching');
  assert(authHealthData.firestoreStatus.startsWith('connected'), 'Health reports Firestore connected', authHealthData.firestoreStatus);

  // TEST 3: Admin login and session verification work (Bearer token & cookie)
  console.log('\n--- TEST 3: Admin Login and Session Verification ---');
  // 3a. Verify with Authorization Header
  const verifyRes = await fetch('http://localhost:3000/api/admin/verify-session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${validAdminIdToken}`,
    },
  });
  assert(verifyRes.status === 200, 'POST /api/admin/verify-session returns 200 OK with Bearer token');
  const verifyData = await verifyRes.json();
  assert(verifyData.authorized === true, 'verifyData.authorized is true');
  assert(verifyData.email === adminEmail, `Verified email matches admin: ${verifyData.email}`);
  assert(verifyData.adminRecord?.role === 'admin', 'Admin record role is "admin"');

  // 3b. Verify with cookie
  const cookieVerifyRes = await fetch('http://localhost:3000/api/admin/verify-session', {
    headers: { Cookie: `admin_session=${validAdminIdToken}` },
  });
  assert(cookieVerifyRes.status === 200, 'GET /api/admin/verify-session returns 200 OK with admin_session cookie');
  const cookieVerifyData = await cookieVerifyRes.json();
  assert(cookieVerifyData.authorized === true, 'Cookie-based session verification authorized');

  // TEST 4: verifyAdminRequest() verifies valid administrator sessions
  console.log('\n--- TEST 4: In-process verifyAdminRequest() Execution ---');
  const mockReqWithHeader = new Request('http://localhost:3000/api/admin/test', {
    headers: { Authorization: `Bearer ${validAdminIdToken}` },
  });
  const inProcessResult = await verifyAdminRequest(mockReqWithHeader);
  assert(inProcessResult.authorized === true, 'verifyAdminRequest() authorizes valid administrator');
  assert(inProcessResult.uid === adminUser.uid, `verifyAdminRequest() resolves correct UID: ${inProcessResult.uid}`);
  assert(inProcessResult.adminRecord?.active === true, 'verifyAdminRequest() confirms admin active status');

  // TEST 5: Invalid and expired tokens are rejected
  console.log('\n--- TEST 5: Invalid and Expired Token Rejection ---');
  const malformedRes = await fetch('http://localhost:3000/api/admin/verify-session', {
    headers: { Authorization: 'Bearer totally-invalid-bogus-token.12345.abcde' },
  });
  assert(malformedRes.status === 401, 'Malformed token strictly rejected with 401 Unauthorized', `Status: ${malformedRes.status}`);
  const malformedData = await malformedRes.json();
  assert(malformedData.authorized === false, 'Malformed token returns authorized: false');

  const emptyBearerRes = await fetch('http://localhost:3000/api/admin/verify-session', {
    headers: { Authorization: 'Bearer ' },
  });
  assert(emptyBearerRes.status === 401, 'Empty Bearer token rejected with 401 Unauthorized');

  // TEST 6: Non-admin users cannot access protected admin APIs
  console.log('\n--- TEST 6: Non-Admin Access Restrictions ---');
  const customerCustomToken = await adminAuth.createCustomToken('customer-non-admin-test-uid');
  const customerExchangeRes = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${firebaseConfig.apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: customerCustomToken, returnSecureToken: true }),
    }
  );
  const customerExchangeData = await customerExchangeRes.json();
  const customerIdToken = customerExchangeData.idToken;

  const nonAdminVerifyRes = await fetch('http://localhost:3000/api/admin/verify-session', {
    headers: { Authorization: `Bearer ${customerIdToken}` },
  });
  assert(nonAdminVerifyRes.status === 403, 'Non-admin user rejected with 403 Forbidden on verify-session');

  const nonAdminOrdersRes = await fetch('http://localhost:3000/api/admin/orders', {
    headers: { Cookie: `admin_session=${customerIdToken}` },
  });
  assert(nonAdminOrdersRes.status === 403, 'Non-admin user rejected with 403 Forbidden on /api/admin/orders');

  const nonAdminMessagesRes = await fetch('http://localhost:3000/api/admin/messages', {
    headers: { Cookie: `admin_session=${customerIdToken}` },
  });
  assert(nonAdminMessagesRes.status === 403, 'Non-admin user rejected with 403 Forbidden on /api/admin/messages');

  const nonAdminCustomersRes = await fetch('http://localhost:3000/api/admin/customers', {
    headers: { Cookie: `admin_session=${customerIdToken}` },
  });
  assert(nonAdminCustomersRes.status === 403, 'Non-admin user rejected with 403 Forbidden on /api/admin/customers');

  // TEST 7: Admin dashboard can load its Firestore data
  console.log('\n--- TEST 7: Admin Dashboard Firestore Data Loading ---');
  const adminOrdersRes = await fetch('http://localhost:3000/api/admin/orders', {
    headers: { Cookie: `admin_session=${validAdminIdToken}` },
  });
  assert(adminOrdersRes.status === 200, 'GET /api/admin/orders returns 200 OK for admin');
  const ordersData = await adminOrdersRes.json();
  assert(Array.isArray(ordersData.orders), 'Orders returned as array', `Count: ${ordersData.orders.length}`);

  const adminMessagesRes = await fetch('http://localhost:3000/api/admin/messages', {
    headers: { Cookie: `admin_session=${validAdminIdToken}` },
  });
  assert(adminMessagesRes.status === 200, 'GET /api/admin/messages returns 200 OK for admin');
  const messagesData = await adminMessagesRes.json();
  assert(Array.isArray(messagesData.messages), 'Messages returned as array', `Count: ${messagesData.messages.length}`);

  const adminCustomersRes = await fetch('http://localhost:3000/api/admin/customers', {
    headers: { Cookie: `admin_session=${validAdminIdToken}` },
  });
  assert(adminCustomersRes.status === 200, 'GET /api/admin/customers returns 200 OK for admin');

  const adminCommunityRes = await fetch('http://localhost:3000/api/admin/community', {
    headers: { Cookie: `admin_session=${validAdminIdToken}` },
  });
  assert(adminCommunityRes.status === 200, 'GET /api/admin/community returns 200 OK for admin');

  // TEST 8: Missing credentials produce clear configuration error without exposing secrets
  console.log('\n--- TEST 8: Missing Credentials Configuration Error Safety ---');
  // Save current env vars
  const origEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const origKey = process.env.FIREBASE_PRIVATE_KEY;
  const origSaKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  const origGac = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  const origAdminEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const origAdminKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  try {
    // Clear out server credentials to test unconfigured error behavior
    delete process.env.FIREBASE_CLIENT_EMAIL;
    delete process.env.FIREBASE_PRIVATE_KEY;
    delete process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    delete process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
    delete process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    delete process.env.FIREBASE_ADMIN_PRIVATE_KEY;

    // Simulate verifyAdminRequest when credentials are not configured
    // Pass fake token so it proceeds past the token presence check
    const unconfiguredReq = new Request('http://localhost:3000/api/admin/orders', {
      headers: { Authorization: 'Bearer some-fake-token' },
    });
    const unconfiguredCheck = await verifyAdminRequest(unconfiguredReq);
    assert(unconfiguredCheck.authorized === false, 'Unconfigured environment returns authorized: false');
    assert(unconfiguredCheck.status === 500, 'Unconfigured environment returns status: 500 Server Configuration Error', `Status: ${unconfiguredCheck.status}`);
    assert(Boolean(unconfiguredCheck.error && unconfiguredCheck.error.includes('Missing required server-side environment variables')), 'Error specifies missing variables without exposing secrets', unconfiguredCheck.error);
    assert(!unconfiguredCheck.error?.includes('-----BEGIN'), 'Error does not contain private key material');
  } finally {
    // Restore environment variables
    if (origEmail) process.env.FIREBASE_CLIENT_EMAIL = origEmail;
    if (origKey) process.env.FIREBASE_PRIVATE_KEY = origKey;
    if (origSaKey) process.env.FIREBASE_SERVICE_ACCOUNT_KEY = origSaKey;
    if (origGac) process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON = origGac;
    if (origAdminEmail) process.env.FIREBASE_ADMIN_CLIENT_EMAIL = origAdminEmail;
    if (origAdminKey) process.env.FIREBASE_ADMIN_PRIVATE_KEY = origAdminKey;
  }

  console.log('\n================================================================');
  console.log(`ALL TESTS PASSED: ${passedTests}/${totalTests} (100% SUCCESS)`);
  console.log('================================================================\n');
}

runVerificationSuite().catch((err) => {
  console.error('\n❌ TEST SUITE FAILED:', err);
  process.exit(1);
});
