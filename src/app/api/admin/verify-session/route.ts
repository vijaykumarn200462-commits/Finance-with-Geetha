import { NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/firebase/admin-verify';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const check = await verifyAdminRequest(request);
    if (!check.authorized) {
      const response = NextResponse.json(
        {
          authorized: false,
          error: check.error || 'Unauthorized',
        },
        { status: check.status || 401 }
      );
      response.cookies.set('admin_session', '', {
        path: '/',
        maxAge: 0,
        expires: new Date(0),
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      });
      return response;
    }

    const response = NextResponse.json({
      authorized: true,
      uid: check.uid,
      email: check.email,
      adminRecord: check.adminRecord,
    });

    if (check.idToken) {
      response.cookies.set('admin_session', check.idToken, {
        path: '/',
        maxAge: 3600,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        httpOnly: false,
      });
    }

    return response;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal verification failure';
    return NextResponse.json({ authorized: false, error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return GET(request);
}
