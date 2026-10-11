import { loadEnvConfig } from '@next/env';
import path from 'path';

// Load .env.local from project root
loadEnvConfig(path.resolve(__dirname, '..'));

async function inspect() {
  const { adminAuth, adminDb } = await import('../src/lib/firebase/admin');
  console.log('--- Inspecting Firebase Auth Users ---');
  const targetEmails = ['cageethanofficial@gmail.com', 'vijaykumarn200462@gmail.com'];

  for (const email of targetEmails) {
    try {
      const user = await adminAuth.getUserByEmail(email);
      console.log(`[AUTH FOUND] Email: ${email}, UID: ${user.uid}, customClaims:`, user.customClaims);

      // Check admins doc
      const adminDoc = await adminDb.collection('admins').doc(user.uid).get();
      if (adminDoc.exists) {
        console.log(`[FIRESTORE ADMIN DOC FOUND] UID: ${user.uid}`, JSON.stringify(adminDoc.data()));
      } else {
        console.log(`[FIRESTORE ADMIN DOC MISSING] UID: ${user.uid} has no doc in 'admins' collection!`);
      }
    } catch (err: unknown) {
      const errorObj = err as { code?: string; message?: string };
      if (errorObj.code === 'auth/user-not-found') {
        console.log(`[AUTH NOT FOUND] User ${email} does not exist in Firebase Auth.`);
      } else {
        console.error(`[ERROR] for ${email}:`, errorObj.message);
      }
    }
  }

  console.log('--- Listing all documents in admins collection ---');
  try {
    const adminsSnapshot = await adminDb.collection('admins').get();
    console.log(`Total admin docs: ${adminsSnapshot.size}`);
    adminsSnapshot.forEach((doc) => {
      console.log(`Admin doc ID: ${doc.id}`, JSON.stringify(doc.data()));
    });

    console.log('--- Listing Settings docs ---');
    const settingsSnap = await adminDb.collection('settings').get();
    settingsSnap.forEach((doc) => {
      console.log(`Settings [${doc.id}]:`, JSON.stringify(doc.data()));
    });

    console.log('--- Listing Site Content docs ---');
    const contentSnap = await adminDb.collection('site_content').get();
    contentSnap.forEach((doc) => {
      console.log(`Site Content [${doc.id}]:`, JSON.stringify(doc.data()));
    });

    console.log('--- Listing Products docs ---');
    const productsSnap = await adminDb.collection('products').get();
    productsSnap.forEach((doc) => {
      console.log(`Product [${doc.id}]: name=${doc.data().name}, price=${doc.data().price}, active=${doc.data().active}`);
    });
  } catch (err: unknown) {
    const errorObj = err as { message?: string };
    console.error('Error fetching collections:', errorObj.message);
  }
}

inspect().then(() => process.exit(0)).catch((e) => {
  console.error(e);
  process.exit(1);
});
