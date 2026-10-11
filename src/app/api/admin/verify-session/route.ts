import { NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/firebase/admin-verify';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const check = await verifyAdminRequest(request);
    if (!check.authorized) {
      return NextResponse.json(
        {
          authorized: false,
          error: check.error || 'Unauthorized',
        },
        { status: check.status || 401 }
      );
    }

    return NextResponse.json({
      authorized: true,
      uid: check.uid,
      email: check.email,
      adminRecord: check.adminRecord,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal verification failure';
    return NextResponse.json({ authorized: false, error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return GET(request);
}
