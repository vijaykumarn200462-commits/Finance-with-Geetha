import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { verifyAdminRequest } from '@/lib/firebase/admin-verify';

export const dynamic = 'force-dynamic';

export const ALLOWED_REVALIDATE_SECTIONS = [
  'all',
  'branding',
  'hero',
  'stats',
  'teaching',
  'community',
  'callStructure',
  'book',
  'store',
  'oneOnOne',
  'about',
  'finalCta',
  'communityPage',
  'aboutPage',
  'contactPage',
  'storePage',
  'services',
  'whyUs',
  'settings',
  'products',
] as const;

export async function POST(request: Request) {
  try {
    const authCheck = await verifyAdminRequest(request);
    if (!authCheck.authorized) {
      return NextResponse.json(
        { error: authCheck.error || 'Unauthorized: Admin access required for cache revalidation' },
        { status: authCheck.status || 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const rawSection = body && typeof body.section === 'string' ? body.section.trim() : '';

    if (rawSection && !ALLOWED_REVALIDATE_SECTIONS.includes(rawSection as typeof ALLOWED_REVALIDATE_SECTIONS[number])) {
      return NextResponse.json(
        { error: 'Invalid section specified for revalidation' },
        { status: 400 }
      );
    }

    const section = rawSection || 'all';

    // Always revalidate homepage layout and page
    revalidatePath('/', 'page');
    revalidatePath('/', 'layout');

    // Selectively revalidate dedicated pages based on updated section
    if (section === 'all' || section === 'branding' || section === 'about' || section === 'aboutPage') {
      revalidatePath('/about', 'page');
    }
    if (section === 'all' || section === 'book' || section === 'products') {
      revalidatePath('/book', 'page');
      revalidatePath('/store', 'page');
    }
    if (section === 'all' || section === 'community' || section === 'communityPage' || section === 'callStructure') {
      revalidatePath('/community', 'page');
    }
    if (section === 'all' || section === 'store' || section === 'storePage' || section === 'products') {
      revalidatePath('/store', 'page');
    }
    if (section === 'all' || section === 'contactPage' || section === 'settings') {
      revalidatePath('/contact', 'page');
    }

    return NextResponse.json({
      success: true,
      revalidated: true,
      section,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Revalidation failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
