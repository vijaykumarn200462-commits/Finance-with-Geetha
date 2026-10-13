import { getApps, getApp, initializeApp, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getStorage, Storage } from 'firebase-admin/storage';

// Verify server-side execution
if (typeof window !== 'undefined') {
  throw new Error('Firebase Admin SDK cannot be used on the client side.');
}

export interface AdminCredentials {
  projectId: string;
  clientEmail?: string;
  privateKey?: string;
  storageBucket?: string;
}

/**
 * Safely ensures environment variables from .env.local are loaded into process.env
 * if server-side credentials are not yet populated.
 */
function ensureEnvLoaded(): void {
  if (typeof window !== 'undefined') return;

  const hasCreds =
    (process.env.FIREBASE_CLIENT_EMAIL || process.env.FIREBASE_ADMIN_CLIENT_EMAIL) &&
    (process.env.FIREBASE_PRIVATE_KEY || process.env.FIREBASE_ADMIN_PRIVATE_KEY);

  if (!hasCreds) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { loadEnvConfig } = require('@next/env');
      const projectDir = process.cwd();
      loadEnvConfig(projectDir);

      const stillMissing =
        !process.env.FIREBASE_CLIENT_EMAIL &&
        !process.env.FIREBASE_ADMIN_CLIENT_EMAIL &&
        !process.env.FIREBASE_SERVICE_ACCOUNT_KEY &&
        !process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

      if (stillMissing) {
        // Fallback: search relative to this source directory (src/lib/firebase -> 3 levels up)
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const path = require('path');
        const resolvedRoot = path.resolve(__dirname, '../../..');
        if (resolvedRoot !== projectDir) {
          loadEnvConfig(resolvedRoot);
        }
      }
    } catch {
      // Gracefully continue in non-Node or restricted runtimes
    }
  }
}

// Ensure environment is populated on module load
ensureEnvLoaded();

/**
 * Safely resolves and cleans Firebase Admin credentials from environment variables.
 * Handles:
 * - Standard project environment variables: FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY, FIREBASE_PROJECT_ID
 * - Standard server aliases: FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY, FIREBASE_ADMIN_PROJECT_ID
 * - Full JSON service account string: FIREBASE_SERVICE_ACCOUNT_KEY, GOOGLE_APPLICATION_CREDENTIALS_JSON, FIREBASE_SERVICE_ACCOUNT
 * - Strips outer surrounding quotes ("..." or '...') that often get introduced in deployment dashboards
 * - Converts escaped newlines (\n, \r\n, \\n) into valid PEM newlines
 */
export function resolveAdminCredentials(): AdminCredentials {
  ensureEnvLoaded();

  let projectId =
    process.env.FIREBASE_PROJECT_ID ||
    process.env.FIREBASE_ADMIN_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    'geetha-coaching';

  let clientEmail =
    process.env.FIREBASE_CLIENT_EMAIL ||
    process.env.FIREBASE_ADMIN_CLIENT_EMAIL;

  let rawPrivateKey =
    process.env.FIREBASE_PRIVATE_KEY ||
    process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  // Support full service account JSON if provided in hosting dashboards
  const serviceAccountJson =
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON ||
    process.env.FIREBASE_SERVICE_ACCOUNT;

  if (serviceAccountJson && (!clientEmail || !rawPrivateKey)) {
    try {
      const parsed = JSON.parse(serviceAccountJson);
      if (parsed.client_email && !clientEmail) {
        clientEmail = parsed.client_email;
      }
      if (parsed.private_key && !rawPrivateKey) {
        rawPrivateKey = parsed.private_key;
      }
      if (parsed.project_id && (!projectId || projectId === 'geetha-coaching')) {
        projectId = parsed.project_id;
      }
    } catch {
      // Ignore JSON parse errors in fallback
    }
  }

  let privateKey: string | undefined = undefined;
  if (rawPrivateKey) {
    let key = rawPrivateKey.trim();
    // Strip surrounding quotes
    while (
      (key.startsWith('"') && key.endsWith('"')) ||
      (key.startsWith("'") && key.endsWith("'"))
    ) {
      key = key.slice(1, -1).trim();
    }
    // Convert escaped newlines
    key = key
      .replace(/\\\\n/g, '\n')
      .replace(/\\r\\n/g, '\n')
      .replace(/\\n/g, '\n')
      .replace(/\r\n/g, '\n')
      .replace(/\\r/g, '');
    privateKey = key;
  }

  const storageBucket =
    process.env.FIREBASE_STORAGE_BUCKET ||
    process.env.FIREBASE_ADMIN_STORAGE_BUCKET ||
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    `${projectId}.firebasestorage.app`;

  return { projectId, clientEmail, privateKey, storageBucket };
}

/**
 * Validates whether required server-side credentials are configured.
 */
export function isFirebaseAdminValid(): boolean {
  ensureEnvLoaded();
  const creds = resolveAdminCredentials();
  return Boolean(
    creds.clientEmail &&
      creds.clientEmail.includes('@') &&
      !creds.clientEmail.includes('placeholder') &&
      !creds.clientEmail.includes('your_') &&
      creds.privateKey &&
      creds.privateKey.includes('PRIVATE KEY') &&
      !creds.privateKey.includes('YOUR_PRIVATE_KEY') &&
      !creds.privateKey.includes('placeholder')
  );
}

export const isFirebaseAdminConfigured: boolean = isFirebaseAdminValid();

// Global singleton declarations to survive Next.js development reloads and HMR
declare global {
  var __firebaseAdminApp: App | undefined;
  var __firebaseAdminAuth: Auth | undefined;
  var __firebaseAdminDb: Firestore | undefined;
  var __firebaseAdminStorage: Storage | undefined;
}

/**
 * Centralized, singleton Firebase Admin App getter.
 * Reuses existing Firebase Admin app instance to prevent duplicate initialization.
 */
export function getAdminApp(): App {
  if (globalThis.__firebaseAdminApp) {
    return globalThis.__firebaseAdminApp;
  }

  // Check if Firebase Admin app has already been initialized
  const existingApps = getApps();
  if (existingApps.length > 0) {
    globalThis.__firebaseAdminApp = getApp();
    return globalThis.__firebaseAdminApp;
  }

  const creds = resolveAdminCredentials();

  if (!creds.clientEmail || !creds.privateKey) {
    const missing: string[] = [];
    if (!creds.clientEmail) missing.push('FIREBASE_CLIENT_EMAIL');
    if (!creds.privateKey) missing.push('FIREBASE_PRIVATE_KEY');
    throw new Error(
      `Firebase Admin Auth is not configured. Missing required server-side environment variables: ${missing.join(', ')}. Please supply valid FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY in .env.local or your hosting environment.`
    );
  }

  if (
    !creds.privateKey.includes('PRIVATE KEY') ||
    creds.clientEmail.includes('placeholder') ||
    creds.privateKey.includes('YOUR_PRIVATE_KEY')
  ) {
    throw new Error(
      'Firebase Admin credentials appear invalid or contain placeholder values. Please supply a valid service account private key.'
    );
  }

  try {
    globalThis.__firebaseAdminApp = initializeApp({
      credential: cert({
        projectId: creds.projectId,
        clientEmail: creds.clientEmail,
        privateKey: creds.privateKey,
      }),
      storageBucket: creds.storageBucket,
    });
    return globalThis.__firebaseAdminApp;
  } catch (err: unknown) {
    const safeMsg = err instanceof Error ? err.message : 'Unknown initialization error';
    throw new Error(`Firebase Admin SDK failed to initialize: ${safeMsg}`);
  }
}

/**
 * Singleton Firebase Admin Auth getter.
 */
export function getAdminAuth(): Auth {
  if (globalThis.__firebaseAdminAuth) return globalThis.__firebaseAdminAuth;
  const app = getAdminApp();
  globalThis.__firebaseAdminAuth = getAuth(app);
  return globalThis.__firebaseAdminAuth;
}

/**
 * Singleton Firebase Admin Firestore getter.
 */
export function getAdminDb(): Firestore {
  if (globalThis.__firebaseAdminDb) return globalThis.__firebaseAdminDb;
  const app = getAdminApp();
  globalThis.__firebaseAdminDb = getFirestore(app);
  return globalThis.__firebaseAdminDb;
}

/**
 * Singleton Firebase Admin Storage getter.
 */
export function getAdminStorage(): Storage {
  if (globalThis.__firebaseAdminStorage) return globalThis.__firebaseAdminStorage;
  const app = getAdminApp();
  globalThis.__firebaseAdminStorage = getStorage(app);
  return globalThis.__firebaseAdminStorage;
}

/**
 * Transparent proxy helper that dynamically resolves the singleton instance
 * on first access without throwing module-level errors during build or compilation.
 */
function createAdminProxy<T extends object>(getService: () => T): T {
  return new Proxy({} as T, {
    get(_target, prop, receiver) {
      if (prop === 'then' || prop === 'catch') return undefined;
      const instance = getService();
      const val = Reflect.get(instance as unknown as object, prop, receiver);
      if (typeof val === 'function') {
        return val.bind(instance);
      }
      return val;
    },
  });
}

export const adminApp: App = createAdminProxy(() => getAdminApp());
export const adminAuth: Auth = createAdminProxy(() => getAdminAuth());
export const adminDb: Firestore = createAdminProxy(() => getAdminDb());
export const adminStorage: Storage = createAdminProxy(() => getAdminStorage());

export { COLLECTIONS } from './collections';
