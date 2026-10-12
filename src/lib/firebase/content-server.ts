import { db } from './client';
import { collection, getDocs } from 'firebase/firestore';
import { COLLECTIONS } from './collections';

/**
 * Server-side helper to fetch all site_content sections from Firestore
 * for SSR pre-rendering without importing client-side hooks.
 */
export async function fetchAllSiteContent(): Promise<Record<string, Record<string, unknown>>> {
  try {
    const colRef = collection(db, COLLECTIONS.SITE_CONTENT);
    const snapshot = await getDocs(colRef);
    const map: Record<string, Record<string, unknown>> = {};
    snapshot.forEach((d) => {
      map[d.id] = d.data();
    });
    return map;
  } catch (err: unknown) {
    console.warn('[CMS] Failed to fetch site_content on server:', err);
    return {};
  }
}
