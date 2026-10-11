import { NextResponse } from 'next/server';
import type { Query, QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import { COLLECTIONS } from '@/lib/firebase/firestore';
import { verifyAdminRequest } from '@/lib/firebase/admin-verify';
import { ContactMessage } from '@/types/message';

export async function GET(request: Request) {
  try {
    const authCheck = await verifyAdminRequest(request);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status || 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let query: Query = adminDb.collection(COLLECTIONS.MESSAGES);
    if (status && status !== 'all') {
      query = query.where('status', '==', status);
    }

    query = query.orderBy('createdAt', 'desc');
    const snap = await query.get();

    const messages: ContactMessage[] = snap.docs.map((d: QueryDocumentSnapshot) => ({
      id: d.id,
      ...d.data(),
    } as ContactMessage));

    return NextResponse.json({ messages });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error fetching messages';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const authCheck = await verifyAdminRequest(request);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status || 401 });
    }

    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'Message ID and status are required' }, { status: 400 });
    }

    await adminDb.collection(COLLECTIONS.MESSAGES).doc(id).update({
      status,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, id, status });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error updating message status';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const authCheck = await verifyAdminRequest(request);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status || 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Message ID is required' }, { status: 400 });
    }

    await adminDb.collection(COLLECTIONS.MESSAGES).doc(id).delete();
    return NextResponse.json({ success: true, message: `Message ${id} deleted` });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error deleting message';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
