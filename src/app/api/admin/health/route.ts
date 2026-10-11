import { NextResponse } from 'next/server';
import { adminDb, isFirebaseAdminConfigured } from '@/lib/firebase/admin';
import { isFirebaseClientConfigured, firebaseConfig } from '@/lib/firebase/client';
import { verifyAdminRequest } from '@/lib/firebase/admin-verify';

export async function GET(request: Request) {
  try {
    const adminCheck = await verifyAdminRequest(request);
    const isAuthorized = adminCheck.authorized;

    // Test Firestore connectivity
    let firestoreStatus = 'untested';
    try {
      const collections = await adminDb.listCollections();
      firestoreStatus = `connected (${collections.length} collections listed)`;
    } catch (err: unknown) {
      firestoreStatus = `error: ${err instanceof Error ? err.message : 'Unknown'}`;
    }

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      projectId: firebaseConfig.projectId,
      isFirebaseClientConfigured,
      isFirebaseAdminConfigured,
      firestoreStatus,
      storageBucket: firebaseConfig.storageBucket,
      authDomain: firebaseConfig.authDomain,
      authenticatedAsAdmin: isAuthorized,
      adminEmail: adminCheck.email,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ status: 'error', error: msg }, { status: 500 });
  }
}
