import { NextResponse } from 'next/server';
import type { QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import { COLLECTIONS } from '@/lib/firebase/firestore';
import { verifyAdminRequest } from '@/lib/firebase/admin-verify';
import { AppUser } from '@/types/user';

export async function GET(request: Request) {
  try {
    const authCheck = await verifyAdminRequest(request);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status || 401 });
    }

    const snap = await adminDb.collection(COLLECTIONS.USERS).orderBy('createdAt', 'desc').limit(150).get();
    const customers: AppUser[] = snap.docs.map((d: QueryDocumentSnapshot) => ({
      uid: d.id,
      ...d.data(),
    } as AppUser));

    return NextResponse.json({ customers });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error fetching customers';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
