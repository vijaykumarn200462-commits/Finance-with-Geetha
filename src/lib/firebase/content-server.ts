import { adminDb, isFirebaseAdminValid } from './admin';
import { COLLECTIONS } from './collections';
import { serializeFirestoreData } from './serialize';

export interface ServerSiteContentResult {
  sections: Record<string, Record<string, unknown>>;
  loaded: boolean;
  error?: string | null;
}

/**
 * Server-side helper to fetch all site_content sections from Cloud Firestore
 * using the Firebase Admin SDK for trusted, high-performance SSR/ISR pre-rendering.
 * All document data is recursively converted into plain serializable objects
 * and ISO strings to eliminate Next.js Server-to-Client serialization errors.
 *
 * Missing documents, network failures, and explicit enabled: false states
 * are preserved as distinct states to prevent SSR visibility leaks.
 */
export async function fetchAllSiteContent(): Promise<ServerSiteContentResult> {
  if (!isFirebaseAdminValid() || !adminDb) {
    console.warn('[CMS Server] Firebase Admin SDK is not configured; server-side content prefetch skipped.');
    return {
      sections: {},
      loaded: false,
      error: 'Firebase Admin SDK not configured',
    };
  }

  try {
    const snapshot = await adminDb.collection(COLLECTIONS.SITE_CONTENT).get();
    const map: Record<string, Record<string, unknown>> = {};
    snapshot.forEach((d) => {
      map[d.id] = serializeFirestoreData(d.data());
    });

    return {
      sections: map,
      loaded: true,
      error: null,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[CMS Server] Failed to fetch site_content on server with Admin SDK:', msg);
    return {
      sections: {},
      loaded: false,
      error: msg,
    };
  }
}

/**
 * Server-side helper to fetch a specific site_content document using Admin SDK.
 * Safely converts timestamps and handles missing documents, explicitly disabled states,
 * and errors without silently defaulting to enabled.
 */
export async function fetchSiteContentDocServer<T extends object>(
  docId: string,
  fallback: T
): Promise<{ data: T; exists: boolean; enabled: boolean }> {
  if (!isFirebaseAdminValid() || !adminDb) {
    return {
      data: fallback,
      exists: false,
      enabled: (fallback as { enabled?: boolean }).enabled !== false,
    };
  }

  try {
    const snap = await adminDb.collection(COLLECTIONS.SITE_CONTENT).doc(docId).get();
    if (!snap.exists) {
      return {
        data: fallback,
        exists: false,
        enabled: (fallback as { enabled?: boolean }).enabled !== false,
      };
    }

    const rawData = snap.data() || {};
    const serialized = serializeFirestoreData(rawData) as Record<string, unknown>;
    const merged = { ...fallback, ...serialized } as T;
    const isEnabled = serialized.enabled !== false;

    return {
      data: merged,
      exists: true,
      enabled: isEnabled,
    };
  } catch (err: unknown) {
    console.error(`[CMS Server] Failed to fetch site_content/${docId} on server:`, err);
    return {
      data: fallback,
      exists: false,
      enabled: false, // Failure never silently defaults to enabled
    };
  }
}


