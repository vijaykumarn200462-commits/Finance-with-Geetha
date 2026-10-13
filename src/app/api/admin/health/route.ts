import { NextResponse } from 'next/server';
import { adminDb, isFirebaseAdminValid } from '@/lib/firebase/admin';
import { isFirebaseClientConfigured, firebaseConfig, getSafeFirebaseEnvDiagnostic } from '@/lib/firebase/config';
import { verifyAdminRequest } from '@/lib/firebase/admin-verify';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const adminCheck = await verifyAdminRequest(request);
    if (!adminCheck.authorized) {
      return NextResponse.json(
        { error: adminCheck.error || 'Unauthorized. Administrator access required.' },
        { status: adminCheck.status || 401 }
      );
    }

    // Test Firestore connectivity
    let firestoreStatus = 'untested';
    try {
      const collections = await adminDb.listCollections();
      firestoreStatus = `connected (${collections.length} collections listed)`;
    } catch (err: unknown) {
      firestoreStatus = `error: ${err instanceof Error ? err.message : 'Unknown'}`;
    }

    const envDiagnostic = getSafeFirebaseEnvDiagnostic();

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      projectId: firebaseConfig.projectId,
      isFirebaseClientConfigured,
      isFirebaseAdminConfigured: isFirebaseAdminValid(),
      firestoreStatus,
      storageBucket: firebaseConfig.storageBucket,
      authDomain: firebaseConfig.authDomain,
      authenticatedAsAdmin: true,
      adminEmail: adminCheck.email,
      envDiagnostic,
    });
  } catch (error: unknown) {
    if ((error as { digest?: string })?.digest?.startsWith?.('NEXT_')) {
      throw error;
    }
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ status: 'error', error: msg }, { status: 500 });
  }
}
