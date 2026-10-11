import { loadEnvConfig } from '@next/env';
import path from 'path';

loadEnvConfig(path.resolve(process.cwd()));

async function main() {
  const { adminAuth } = await import('@/lib/firebase/admin');
  const { firebaseConfig } = await import('@/lib/firebase/config');

  console.log('--- 1. Testing unauthorized GET /api/admin/health ---');
  const unauthRes = await fetch('http://localhost:3008/api/admin/health');
  console.log('Status (unauthenticated):', unauthRes.status);
  const unauthData = await unauthRes.json();
  console.log('Response (unauthenticated):', JSON.stringify(unauthData));
  if (unauthRes.status !== 401) {
    throw new Error(`Expected status 401, got ${unauthRes.status}`);
  }
  if (unauthData.status === 'ok' || unauthData.envDiagnostic || unauthData.firestoreStatus) {
    throw new Error('Diagnostic data leaked to unauthenticated request!');
  }
  console.log('✅ Unauthenticated request correctly rejected with 401 and zero leaked data.');

  console.log('\n--- 2. Minting Admin ID Token for live authenticated check ---');
  const adminUser = await adminAuth.getUserByEmail('cageethanofficial@gmail.com');
  const customToken = await adminAuth.createCustomToken(adminUser.uid);

  // Exchange custom token for ID token via Firebase REST API
  const apiKey = firebaseConfig.apiKey;
  const tokenRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: customToken, returnSecureToken: true }),
  });

  const tokenData = await tokenRes.json();
  if (!tokenData.idToken) {
    console.warn('Could not exchange custom token via REST API:', tokenData.error);
    return;
  }

  const idToken = tokenData.idToken;
  console.log('Obtained valid Admin ID token.');

  console.log('\n--- 3. Testing authorized GET /api/admin/health ---');
  const authRes = await fetch('http://localhost:3008/api/admin/health', {
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  });
  console.log('Status (authenticated):', authRes.status);
  const authData = await authRes.json();
  console.log('Response (authenticated):', JSON.stringify(authData, null, 2));

  if (authRes.status !== 200 || authData.status !== 'ok') {
    throw new Error(`Expected status 200 ok, got ${authRes.status}`);
  }
  console.log('✅ Authenticated admin health check succeeded with 200 OK and valid health report.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
