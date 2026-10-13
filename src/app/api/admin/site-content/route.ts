import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import type { QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import { COLLECTIONS } from '@/lib/firebase/collections';
import { verifyAdminRequest } from '@/lib/firebase/admin-verify';
import {
  DEFAULT_CALL_STRUCTURE_CONTENT,
  DEFAULT_COMMUNITY_PAGE_CONTENT,
  DEFAULT_ABOUT_PAGE_CONTENT,
  DEFAULT_CONTACT_PAGE_CONTENT,
  DEFAULT_WHY_US_CONTENT,
} from '@/lib/firebase/content-defaults';

export const dynamic = 'force-dynamic';

const ALLOWED_CMS_SECTIONS = [
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
] as const;

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

    if (!section || typeof section !== 'string') {
      return NextResponse.json({ error: 'Valid section key is required' }, { status: 400 });
    }

    if (!data || typeof data !== 'object') {
      return NextResponse.json({ error: 'Section data payload is required' }, { status: 400 });
    }

    const trimmedSection = section.trim();
    if (!ALLOWED_CMS_SECTIONS.includes(trimmedSection as typeof ALLOWED_CMS_SECTIONS[number])) {
      return NextResponse.json({ error: `Unrecognized CMS section "${trimmedSection}"` }, { status: 400 });
    }

    // Persist document to site_content using Admin SDK
    await adminDb.collection(COLLECTIONS.SITE_CONTENT).doc(trimmedSection).set(
      {
        ...data,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    // Sync products/book active state when book visibility changes
    if (trimmedSection === 'book' && typeof (data as { enabled?: boolean }).enabled === 'boolean') {
      try {
        await adminDb.collection(COLLECTIONS.PRODUCTS).doc('book').set(
          {
            active: (data as { enabled?: boolean }).enabled,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch (prodErr) {
        console.warn('[CMS API] Could not sync products/book active status:', prodErr);
      }
    }

    // Automatic server-side ISR/Cache revalidation on successful write
    try {
      revalidatePath('/', 'page');
      revalidatePath('/', 'layout');

      if (trimmedSection === 'about' || trimmedSection === 'aboutPage') {
        revalidatePath('/about', 'page');
      }
      if (trimmedSection === 'community' || trimmedSection === 'communityPage' || trimmedSection === 'callStructure') {
        revalidatePath('/community', 'page');
      }
      if (trimmedSection === 'book') {
        revalidatePath('/book', 'page');
        revalidatePath('/store', 'page');
      }
      if (trimmedSection === 'store' || trimmedSection === 'storePage') {
        revalidatePath('/store', 'page');
      }
      if (trimmedSection === 'contactPage') {
        revalidatePath('/contact', 'page');
      }
    } catch (revalErr) {
      console.warn('[CMS API] Automatic revalidation notice:', revalErr);
    }

    return NextResponse.json({ success: true, section: trimmedSection, data });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error updating site content';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/**
 * Explicit, admin-authorized repair operation to initialize missing CMS documents.
 * Creates only documents that are truly absent in Firestore without overwriting existing data.
 */
export async function POST(request: Request) {
  try {
    const authCheck = await verifyAdminRequest(request);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status || 401 });
    }

    const body = await request.json().catch(() => ({}));
    const action = body?.action || 'repair-missing';

    if (action !== 'repair-missing') {
      return NextResponse.json({ error: `Unsupported action: "${action}"` }, { status: 400 });
    }

    const REQUIRED_DOCS: Record<string, Record<string, unknown>> = {
      callStructure: DEFAULT_CALL_STRUCTURE_CONTENT as unknown as Record<string, unknown>,
      communityPage: DEFAULT_COMMUNITY_PAGE_CONTENT as unknown as Record<string, unknown>,
      aboutPage: DEFAULT_ABOUT_PAGE_CONTENT as unknown as Record<string, unknown>,
      contactPage: DEFAULT_CONTACT_PAGE_CONTENT as unknown as Record<string, unknown>,
      whyUs: DEFAULT_WHY_US_CONTENT as unknown as Record<string, unknown>,
    };

    const created: string[] = [];
    const skipped: string[] = [];
    const failed: string[] = [];

    for (const [docId, defaultData] of Object.entries(REQUIRED_DOCS)) {
      try {
        const docRef = adminDb.collection(COLLECTIONS.SITE_CONTENT).doc(docId);
        const docSnap = await docRef.get();

        if (docSnap.exists) {
          skipped.push(docId);
        } else {
          await docRef.set({
            ...defaultData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          created.push(docId);
        }
      } catch (docErr) {
        console.error(`[CMS Repair] Failed to check/create document ${docId}:`, docErr);
        failed.push(docId);
      }
    }

    // Revalidate paths if any document was newly created
    if (created.length > 0) {
      try {
        revalidatePath('/', 'page');
        revalidatePath('/about', 'page');
        revalidatePath('/community', 'page');
        revalidatePath('/contact', 'page');
      } catch {
        // Non-blocking
      }
    }

    return NextResponse.json({
      success: true,
      action: 'repair-missing',
      created,
      skipped,
      failed,
      message: `CMS Document Audit: ${created.length} created, ${skipped.length} preserved, ${failed.length} failed.`,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error repairing CMS documents';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
