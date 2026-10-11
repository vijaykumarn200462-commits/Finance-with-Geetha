import { NextResponse } from 'next/server';
import type { QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import { COLLECTIONS } from '@/lib/firebase/collections';
import { verifyAdminRequest } from '@/lib/firebase/admin-verify';
import { Product } from '@/types/product';

export async function GET(request: Request) {
  try {
    const authCheck = await verifyAdminRequest(request);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status || 401 });
    }

    const snap = await adminDb.collection(COLLECTIONS.PRODUCTS).orderBy('sortOrder', 'asc').get();
    const products: Product[] = snap.docs.map((doc: QueryDocumentSnapshot) => ({
      id: doc.id,
      ...doc.data(),
    } as Product));

    return NextResponse.json({ products });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error fetching products';
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
    const {
      name,
      slug,
      shortDescription,
      description,
      price,
      currency = 'INR',
      type = 'other',
      imageUrl,
      fileUrl,
      active = true,
      featured = false,
      sortOrder = 0,
      features = [],
    } = body;

    if (!name || price === undefined) {
      return NextResponse.json({ error: 'Name and price are required' }, { status: 400 });
    }

    const docId = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const nowIso = new Date().toISOString();

    const productPayload = {
      name,
      slug: docId,
      shortDescription: shortDescription || '',
      description: description || '',
      price: Number(price),
      currency,
      type,
      imageUrl: imageUrl || '',
      fileUrl: fileUrl || '',
      active: Boolean(active),
      featured: Boolean(featured),
      sortOrder: Number(sortOrder),
      features: Array.isArray(features) ? features : [],
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    const docRef = adminDb.collection(COLLECTIONS.PRODUCTS).doc(docId);
    await docRef.set(productPayload);

    return NextResponse.json({
      success: true,
      product: { id: docId, ...productPayload },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error creating product';
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
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required for update' }, { status: 400 });
    }

    const docRef = adminDb.collection(COLLECTIONS.PRODUCTS).doc(id);
    const existing = await docRef.get();
    if (!existing.exists) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    await docRef.update({
      ...updates,
      updatedAt: new Date().toISOString(),
    });

    const updatedDoc = await docRef.get();
    return NextResponse.json({
      success: true,
      product: { id, ...updatedDoc.data() },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error updating product';
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
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    await adminDb.collection(COLLECTIONS.PRODUCTS).doc(id).delete();
    return NextResponse.json({ success: true, message: `Product ${id} deleted` });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error deleting product';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
