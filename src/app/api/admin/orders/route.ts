import { NextResponse } from 'next/server';
import type { Query, QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import { COLLECTIONS } from '@/lib/firebase/collections';
import { verifyAdminRequest } from '@/lib/firebase/admin-verify';
import { Order } from '@/types/order';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const authCheck = await verifyAdminRequest(request);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status || 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let query: Query = adminDb.collection(COLLECTIONS.ORDERS);
    if (status && status !== 'all') {
      query = query.where('status', '==', status);
    }

    query = query.orderBy('createdAt', 'desc');
    const snap = await query.get();

    const orders: Order[] = snap.docs.map((d: QueryDocumentSnapshot) => ({
      id: d.id,
      ...d.data(),
    } as Order));

    return NextResponse.json({ orders });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error fetching orders';
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
      return NextResponse.json({ error: 'Order ID and status are required' }, { status: 400 });
    }

    const docRef = adminDb.collection(COLLECTIONS.ORDERS).doc(id);
    await docRef.update({
      status,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, id, status });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error updating order status';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
