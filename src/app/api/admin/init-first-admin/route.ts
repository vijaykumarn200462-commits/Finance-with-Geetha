import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { COLLECTIONS } from '@/lib/firebase/firestore';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { uid: inputUid, email, name, secret, password } = body;

    const setupSecret = process.env.ADMIN_SETUP_SECRET || 'geetha-admin-secret-setup-2026';

    if (!secret || secret !== setupSecret) {
      return NextResponse.json(
        { error: 'Forbidden: Invalid administrator setup secret.' },
        { status: 403 }
      );
    }

    if (!inputUid && !email) {
      return NextResponse.json(
        { error: 'Either a valid Firebase UID or administrator email is required.' },
        { status: 400 }
      );
    }

    let authUid = inputUid;
    let authEmail = email;

    // 1. Resolve or create user in Firebase Authentication
    if (authEmail && !authUid) {
      try {
        const existingAuthUser = await adminAuth.getUserByEmail(authEmail);
        authUid = existingAuthUser.uid;
        if (password) {
          await adminAuth.updateUser(authUid, { password });
        }
      } catch (notFoundErr: unknown) {
        const errObj = notFoundErr as { code?: string };
        if (errObj?.code === 'auth/user-not-found') {
          if (!password) {
            return NextResponse.json(
              { error: `Account for ${authEmail} does not exist in Firebase Auth. A password is required to create it.` },
              { status: 400 }
            );
          }
          const createdUser = await adminAuth.createUser({
            email: authEmail,
            password,
            displayName: name || 'Administrator',
          });
          authUid = createdUser.uid;
        } else {
          throw notFoundErr;
        }
      }
    } else if (authUid && password) {
      await adminAuth.updateUser(authUid, { password });
    }

    if (!authUid) {
      return NextResponse.json({ error: 'Failed to resolve Firebase Auth UID.' }, { status: 400 });
    }

    // Ensure email is resolved from auth if not supplied
    if (!authEmail) {
      try {
        const u = await adminAuth.getUser(authUid);
        authEmail = u.email || '';
      } catch {
        // ignore
      }
    }

    // 2. Set document in admins collection
    const adminRef = adminDb.collection(COLLECTIONS.ADMINS).doc(authUid);
    const existing = await adminRef.get();

    const adminPayload = {
      uid: authUid,
      email: authEmail || '',
      name: name || (existing.exists ? existing.data()?.name : 'Administrator') || 'Administrator',
      role: 'admin',
      active: true,
      updatedAt: new Date().toISOString(),
      createdAt: existing.exists ? existing.data()?.createdAt || new Date().toISOString() : new Date().toISOString(),
    };

    await adminRef.set(adminPayload, { merge: true });

    // 3. Set custom claims on Firebase Auth user
    try {
      await adminAuth.setCustomUserClaims(authUid, { admin: true });
    } catch (claimErr) {
      console.warn('Could not set custom user claim:', claimErr);
    }

    return NextResponse.json({
      success: true,
      message: `User ${authUid} (${authEmail}) successfully configured as active administrator.`,
      admin: adminPayload,
    });
  } catch (error: unknown) {
    console.error('Init first admin error:', error);
    const message = error instanceof Error ? error.message : 'Internal error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
