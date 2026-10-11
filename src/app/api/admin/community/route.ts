import { NextResponse } from 'next/server';
import type { QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import { COLLECTIONS } from '@/lib/firebase/collections';
import { verifyAdminRequest } from '@/lib/firebase/admin-verify';
import { CommunityMember } from '@/types/community';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const authCheck = await verifyAdminRequest(request);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status || 401 });
    }

    const snap = await adminDb.collection(COLLECTIONS.COMMUNITY_MEMBERS).orderBy('createdAt', 'desc').get();
    const members: CommunityMember[] = snap.docs.map((d: QueryDocumentSnapshot) => ({
      userId: d.id,
      ...d.data(),
    } as CommunityMember));

    return NextResponse.json({ members });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error fetching community members';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authCheck = await verifyAdminRequest(request);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status || 401 });
    }

    const body = await request.json();
    const { email, name, status = 'active', plan = 'Monthly Membership', amount = 150 } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const memberId = email.toLowerCase();
    const nowIso = new Date().toISOString();

    const payload = {
      userId: memberId,
      name: name || 'Member',
      email,
      status,
      plan,
      amount: Number(amount),
      currency: 'INR',
      startDate: nowIso,
      renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    await adminDb.collection(COLLECTIONS.COMMUNITY_MEMBERS).doc(memberId).set(payload, { merge: true });

    return NextResponse.json({ success: true, member: payload });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error creating community member';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
