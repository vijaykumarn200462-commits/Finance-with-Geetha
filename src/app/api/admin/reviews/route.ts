import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import type { QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import { COLLECTIONS } from '@/lib/firebase/collections';
import { verifyAdminRequest } from '@/lib/firebase/admin-verify';
import { INITIAL_REVIEWS } from '@/lib/firebase/content-defaults';
import { ReviewItem } from '@/types/site-content';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const authCheck = await verifyAdminRequest(request);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status || 401 });
    }

    const { searchParams } = new URL(request.url);
    const reviewId = searchParams.get('id');

    if (reviewId) {
      const doc = await adminDb.collection(COLLECTIONS.HOMEPAGE_REVIEWS).doc(reviewId).get();
      if (!doc.exists) {
        return NextResponse.json({ error: 'Review not found' }, { status: 404 });
      }
      return NextResponse.json({ review: { id: doc.id, ...doc.data() } });
    }

    const snapshot = await adminDb
      .collection(COLLECTIONS.HOMEPAGE_REVIEWS)
      .orderBy('sortOrder', 'asc')
      .get();

    if (snapshot.empty) {
      // If collection not yet seeded, check site_content/reviews
      const sectionDoc = await adminDb.collection(COLLECTIONS.SITE_CONTENT).doc('reviews').get();
      if (sectionDoc.exists && sectionDoc.data()?.reviews) {
        return NextResponse.json({ reviews: sectionDoc.data()?.reviews });
      }
      return NextResponse.json({ reviews: INITIAL_REVIEWS });
    }

    const reviews: ReviewItem[] = [];
    snapshot.docs.forEach((doc: QueryDocumentSnapshot) => {
      reviews.push({ id: doc.id, ...(doc.data() as Omit<ReviewItem, 'id'>) });
    });

    return NextResponse.json({ reviews });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error fetching reviews';
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
      reviewerName,
      reviewText,
      rating = 5,
      reviewDate,
      isNew = false,
      ownerResponse = null,
      ownerResponseDate = null,
      reviewerImageUrl = null,
      reviewerInitials = '',
      avatarBgColor = '#0f2c59',
      reviewScreenshotUrl = null,
      sortOrder,
      isVisible = true,
      reviewCountText = '1 review',
    } = body;

    if (!reviewerName || typeof reviewerName !== 'string' || !reviewerName.trim()) {
      return NextResponse.json({ error: 'Reviewer name is required' }, { status: 400 });
    }

    if (!reviewText || typeof reviewText !== 'string' || !reviewText.trim()) {
      return NextResponse.json({ error: 'Review text is required' }, { status: 400 });
    }

    // Determine sortOrder if not provided
    let finalSortOrder = typeof sortOrder === 'number' ? sortOrder : 0;
    if (typeof sortOrder !== 'number') {
      const highestOrderSnap = await adminDb
        .collection(COLLECTIONS.HOMEPAGE_REVIEWS)
        .orderBy('sortOrder', 'desc')
        .limit(1)
        .get();
      if (!highestOrderSnap.empty) {
        finalSortOrder = ((highestOrderSnap.docs[0].data()?.sortOrder as number) ?? 0) + 1;
      } else {
        finalSortOrder = 1;
      }
    }

    const nowIso = new Date().toISOString();
    const docRef = adminDb.collection(COLLECTIONS.HOMEPAGE_REVIEWS).doc();

    const newReview: ReviewItem = {
      id: docRef.id,
      reviewerName: reviewerName.trim(),
      reviewText: reviewText.trim(),
      rating: Math.min(5, Math.max(1, Number(rating) || 5)),
      reviewDate: (reviewDate && String(reviewDate).trim()) || 'Recently',
      isNew: Boolean(isNew),
      ownerResponse: ownerResponse && typeof ownerResponse === 'string' ? ownerResponse.trim() : null,
      ownerResponseDate:
        ownerResponseDate && typeof ownerResponseDate === 'string' ? ownerResponseDate.trim() : null,
      reviewerImageUrl:
        reviewerImageUrl && typeof reviewerImageUrl === 'string' ? reviewerImageUrl.trim() : null,
      reviewerInitials:
        reviewerInitials && typeof reviewerInitials === 'string'
          ? reviewerInitials.trim().slice(0, 2).toUpperCase()
          : reviewerName.trim().charAt(0).toUpperCase(),
      avatarBgColor: avatarBgColor || '#0f2c59',
      reviewScreenshotUrl:
        reviewScreenshotUrl && typeof reviewScreenshotUrl === 'string'
          ? reviewScreenshotUrl.trim()
          : null,
      sortOrder: finalSortOrder,
      isVisible: Boolean(isVisible),
      reviewCountText: reviewCountText || '1 review',
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    await docRef.set(newReview);

    // Also update site_content/reviews.reviews array for server-side cache consistency
    await syncReviewsToSectionDoc();

    try {
      revalidatePath('/', 'page');
    } catch {
      // Non-blocking
    }

    return NextResponse.json({ success: true, review: newReview }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error creating review';
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

    // Check if bulk reorder / batch update
    if (Array.isArray(body.reviews)) {
      const batch = adminDb.batch();
      const nowIso = new Date().toISOString();

      body.reviews.forEach((rev: Partial<ReviewItem> & { id: string }, index: number) => {
        if (rev.id) {
          const ref = adminDb.collection(COLLECTIONS.HOMEPAGE_REVIEWS).doc(rev.id);
          const updatePayload: Record<string, unknown> = {
            updatedAt: nowIso,
          };
          if (typeof rev.sortOrder === 'number') updatePayload.sortOrder = rev.sortOrder;
          else updatePayload.sortOrder = index + 1;

          if (typeof rev.isVisible === 'boolean') updatePayload.isVisible = rev.isVisible;
          if (typeof rev.reviewerName === 'string') updatePayload.reviewerName = rev.reviewerName;
          if (typeof rev.reviewText === 'string') updatePayload.reviewText = rev.reviewText;
          if (typeof rev.rating === 'number') updatePayload.rating = rev.rating;
          if (typeof rev.reviewDate === 'string') updatePayload.reviewDate = rev.reviewDate;
          if (typeof rev.ownerResponse !== 'undefined') updatePayload.ownerResponse = rev.ownerResponse;
          if (typeof rev.reviewScreenshotUrl !== 'undefined')
            updatePayload.reviewScreenshotUrl = rev.reviewScreenshotUrl;
          if (typeof rev.reviewerImageUrl !== 'undefined')
            updatePayload.reviewerImageUrl = rev.reviewerImageUrl;

          batch.set(ref, updatePayload, { merge: true });
        }
      });

      await batch.commit();
      await syncReviewsToSectionDoc();

      try {
        revalidatePath('/', 'page');
      } catch {
        // Non-blocking
      }

      return NextResponse.json({ success: true, message: 'Reviews reordered/updated successfully' });
    }

    const { id, ...updates } = body;
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'Review ID is required' }, { status: 400 });
    }

    const docRef = adminDb.collection(COLLECTIONS.HOMEPAGE_REVIEWS).doc(id);
    const existingSnap = await docRef.get();
    if (!existingSnap.exists) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    const cleanUpdates: Record<string, unknown> = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    if (typeof cleanUpdates.rating === 'number') {
      cleanUpdates.rating = Math.min(5, Math.max(1, cleanUpdates.rating));
    }

    await docRef.set(cleanUpdates, { merge: true });
    await syncReviewsToSectionDoc();

    try {
      revalidatePath('/', 'page');
    } catch {
      // Non-blocking
    }

    const updatedSnap = await docRef.get();
    return NextResponse.json({ success: true, review: { id: updatedSnap.id, ...updatedSnap.data() } });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error updating review';
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
      return NextResponse.json({ error: 'Review ID parameter is required' }, { status: 400 });
    }

    await adminDb.collection(COLLECTIONS.HOMEPAGE_REVIEWS).doc(id).delete();
    await syncReviewsToSectionDoc();

    try {
      revalidatePath('/', 'page');
    } catch {
      // Non-blocking
    }

    return NextResponse.json({ success: true, message: 'Review deleted successfully' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error deleting review';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/**
 * Synchronizes the list of reviews from homepageReviews collection into site_content/reviews
 * to maintain instant SSR hydration and cross-document integrity.
 */
async function syncReviewsToSectionDoc() {
  try {
    const snap = await adminDb
      .collection(COLLECTIONS.HOMEPAGE_REVIEWS)
      .orderBy('sortOrder', 'asc')
      .get();

    const reviews: ReviewItem[] = [];
    snap.docs.forEach((d: QueryDocumentSnapshot) => {
      reviews.push({ id: d.id, ...(d.data() as Omit<ReviewItem, 'id'>) });
    });

    const reviewsSectionRef = adminDb.collection(COLLECTIONS.SITE_CONTENT).doc('reviews');
    await reviewsSectionRef.set(
      {
        reviews,
        totalReviewsCount: reviews.length,
        averageRating:
          reviews.length > 0
            ? Number((reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / reviews.length).toFixed(1))
            : 5.0,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (syncErr) {
    console.warn('[Reviews API] Sync to site_content/reviews notice:', syncErr);
  }
}
