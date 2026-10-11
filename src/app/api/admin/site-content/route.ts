import { NextResponse } from 'next/server';
import type { QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import { COLLECTIONS } from '@/lib/firebase/collections';
import { verifyAdminRequest } from '@/lib/firebase/admin-verify';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const authCheck = await verifyAdminRequest(request);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status || 401 });
    }

    const { searchParams } = new URL(request.url);
    const section = searchParams.get('section');

    if (section) {
      const doc = await adminDb.collection(COLLECTIONS.SITE_CONTENT).doc(section).get();
      return NextResponse.json({ section, data: doc.exists ? doc.data() : null });
    }

    const snap = await adminDb.collection(COLLECTIONS.SITE_CONTENT).get();
    const content: Record<string, unknown> = {};
    snap.docs.forEach((d: QueryDocumentSnapshot) => {
      content[d.id] = d.data();
    });

    return NextResponse.json({ content });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error fetching site content';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const authCheck = await verifyAdminRequest(request);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status || 401 });
    }

    const body = await request.json();
    const { section, data } = body;

    if (!section || !data) {
      return NextResponse.json({ error: 'Section and data are required' }, { status: 400 });
    }

    await adminDb.collection(COLLECTIONS.SITE_CONTENT).doc(section).set(
      {
        ...data,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    return NextResponse.json({ success: true, section, data });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error updating site content';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
