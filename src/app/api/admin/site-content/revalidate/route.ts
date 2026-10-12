import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const section = (body && typeof body.section === 'string') ? body.section : '';

    // Always revalidate the homepage layout and homepage itself
    revalidatePath('/', 'page');
    revalidatePath('/', 'layout');

    // Selectively revalidate dedicated pages based on updated section
    if (!section || section === 'about' || section === 'aboutPage') {
      revalidatePath('/about', 'page');
    }
    if (!section || section === 'book') {
      revalidatePath('/book', 'page');
    }
    if (!section || section === 'community' || section === 'communityPage' || section === 'callStructure') {
      revalidatePath('/community', 'page');
    }
    if (!section || section === 'store' || section === 'storePage') {
      revalidatePath('/store', 'page');
    }
    if (!section || section === 'contactPage') {
      revalidatePath('/contact', 'page');
    }

    return NextResponse.json({
      success: true,
      revalidated: true,
      section: section || 'all',
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Revalidation notice';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
