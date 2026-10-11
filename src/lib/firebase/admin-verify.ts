import { headers, cookies } from 'next/headers';
import { adminAuth, adminDb, isFirebaseAdminConfigured } from './admin';
import { AdminRecord } from '@/types/admin';

export interface VerifyAdminResult {
  authorized: boolean;
  uid?: string;
  email?: string;
  adminRecord?: AdminRecord;
  error?: string;
  status?: number;
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

    // 3. Try reading from Cookie
    if (!idToken) {
      try {
        const cookieStore = await cookies();
        idToken = cookieStore.get('admin_session')?.value;
      } catch {
        // cookies() fallback
      }
    }

    if (!idToken) {
      return {
        authorized: false,
        error: 'Authentication required. No session or token provided.',
        status: 401,
      };
    }

    // If Firebase Admin credentials are not yet set in environment, check development fallback
    if (!isFirebaseAdminConfigured) {
      console.warn(
        'FIREBASE ADMIN NOTICE: Service account credentials are not configured in environment variables. Set FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY.'
      );
      // In development, if a token is present, we still try decoding or warn
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
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid session or token';
    console.error('Server admin verification failed:', message);
    return {
      authorized: false,
      error: `Admin verification failed: ${message}`,
      status: 401,
    };
  }
}
