import { headers, cookies } from 'next/headers';
import { adminAuth, adminDb, isFirebaseAdminValid, resolveAdminCredentials } from './admin';
import { AdminRecord } from '@/types/admin';

export interface VerifyAdminResult {
  authorized: boolean;
  uid?: string;
  email?: string;
  adminRecord?: AdminRecord;
  error?: string;
  status?: number;
  idToken?: string;
}

/**
 * Server-side verification for Next.js API route handlers
 * Checks either Authorization: Bearer <token> or admin_session cookie
 */
export async function verifyAdminRequest(request?: Request): Promise<VerifyAdminResult> {
  try {
    let idToken: string | undefined;

    // 1. Try reading from Request Authorization Header
    if (request) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        idToken = authHeader.split('Bearer ')[1].trim();
      }
    }

    // 2. Try Next.js dynamic headers()
    if (!idToken) {
      try {
        const reqHeaders = await headers();
        const authHeader = reqHeaders.get('authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
          idToken = authHeader.split('Bearer ')[1].trim();
        }
      } catch {
        // headers() might not be available in some contexts
      }
    }

    // 3. Try reading from Cookie via Next.js cookies()
    if (!idToken) {
      try {
        const cookieStore = await cookies();
        idToken = cookieStore.get('admin_session')?.value;
      } catch {
        // cookies() fallback
      }
    }

    // 4. Try reading cookie directly from Request headers
    if (!idToken && request) {
      const cookieHeader = request.headers.get('cookie');
      if (cookieHeader) {
        const match = cookieHeader.match(/(?:^|;\s*)admin_session=([^;]+)/);
        if (match) {
          idToken = decodeURIComponent(match[1].trim());
        }
      }
    }

    if (!idToken) {
      return {
        authorized: false,
        error: 'Authentication required. No session or token provided.',
        status: 401,
      };
    }

    // Validate server environment BEFORE attempting token verification
    if (!isFirebaseAdminValid()) {
      const creds = resolveAdminCredentials();
      const missing: string[] = [];
      if (!creds.clientEmail) missing.push('FIREBASE_CLIENT_EMAIL');
      if (!creds.privateKey) missing.push('FIREBASE_PRIVATE_KEY');

      const details =
        missing.length > 0
          ? `Missing required server-side environment variables: ${missing.join(', ')}.`
          : 'Firebase Admin credentials appear invalid or contain placeholder values.';

      console.error(
        `Firebase Admin Auth configuration error: ${details} Configure valid service-account credentials in .env.local or your hosting environment.`
      );

      return {
        authorized: false,
        error: `Firebase Admin Auth is not configured. ${details}`,
        status: 500,
      };
    }

    // Verify token with Firebase Admin
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    const email = decodedToken.email;

    // Look up admins collection
    const adminDoc = await adminDb.collection('admins').doc(uid).get();

    if (!adminDoc.exists) {
      return {
        authorized: false,
        error: 'Access Denied. User record does not exist in the admins collection.',
        status: 403,
      };
    }

    const data = adminDoc.data();
    if (!data || data.role !== 'admin' || data.active !== true) {
      return {
        authorized: false,
        error: 'Access Denied. Account is not an active administrator.',
        status: 403,
      };
    }

    const adminRecord: AdminRecord = {
      uid,
      email: data.email || email || '',
      name: data.name || '',
      role: 'admin',
      active: true,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt || '',
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt,
    };

    return {
      authorized: true,
      uid,
      email,
      adminRecord,
      idToken,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid session or token';
    console.error('Server admin verification failed:', message);

    const isConfigError =
      message.includes('Firebase Admin') ||
      message.includes('FIREBASE_') ||
      message.includes('environment variables') ||
      message.includes('service account') ||
      message.includes('credential');

    return {
      authorized: false,
      error: isConfigError
        ? `Server configuration error: ${message}`
        : `Admin verification failed: ${message}`,
      status: isConfigError ? 500 : 401,
    };
  }
}
