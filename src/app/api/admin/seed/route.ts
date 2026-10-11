import { NextResponse } from 'next/server';
import { seedInitialFirestoreData } from '@/lib/firebase/seed';
import { verifyAdminRequest } from '@/lib/firebase/admin-verify';

export async function POST(request: Request) {
  try {
    const setupSecret = process.env.ADMIN_SETUP_SECRET || 'geetha-admin-secret-setup-2026';
    const reqSecret = request.headers.get('x-setup-secret');

    // Allow execution either with the setup secret header or with an authenticated admin token
    if (reqSecret !== setupSecret) {
      const adminAuth = await verifyAdminRequest(request);
      if (!adminAuth.authorized) {
        return NextResponse.json(
          { error: 'Unauthorized. Admin session or valid setup secret required.' },
          { status: 403 }
        );
      }
    }

    const result = await seedInitialFirestoreData();
    return NextResponse.json({
      success: true,
      message: 'Initial Firestore data seeded successfully without duplicates.',
      ...result,
    });
  } catch (error: unknown) {
    console.error('Seed error:', error);
    const message = error instanceof Error ? error.message : 'Failed to seed initial data';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
