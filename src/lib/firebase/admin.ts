import { getApps, getApp, initializeApp, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getStorage, Storage } from 'firebase-admin/storage';

// Verify server-side execution
if (typeof window !== 'undefined') {
  throw new Error('Firebase Admin SDK cannot be used on the client side.');
}

const projectId =
  process.env.FIREBASE_PROJECT_ID ||
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
  'geetha-coaching';

const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
let privateKey = process.env.FIREBASE_PRIVATE_KEY;

if (privateKey) {
  // Replace escaped newlines if passed through environment variables
  privateKey = privateKey.replace(/\\n/g, '\n');
}

export const isFirebaseAdminConfigured: boolean = Boolean(
  clientEmail &&
    privateKey &&
    privateKey.includes('PRIVATE KEY') &&
    !clientEmail.includes('placeholder')
);

let adminAppInstance: App | null = null;
let adminAuthInstance: Auth | null = null;
let adminDbInstance: Firestore | null = null;
let adminStorageInstance: Storage | null = null;

if (isFirebaseAdminConfigured) {
  try {
    if (getApps().length > 0) {
      adminAppInstance = getApp();
    } else {
      adminAppInstance = initializeApp({
        credential: cert({
          projectId,
          clientEmail: clientEmail!,
          privateKey: privateKey!,
        }),
        storageBucket:
          process.env.FIREBASE_STORAGE_BUCKET ||
          process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
          `${projectId}.firebasestorage.app`,
      });
    }

    adminAuthInstance = getAuth(adminAppInstance);
    adminDbInstance = getFirestore(adminAppInstance);
    adminStorageInstance = getStorage(adminAppInstance);
  } catch (err) {
    console.warn('Firebase Admin SDK initialization warning:', err);
  }
}

// Resilient proxies that prevent unhandled process crashes if credentials are not yet configured
const unconfiguredHandler = (serviceName: string) => ({
  get(_target: object, prop: string | symbol) {
    if (prop === 'then' || prop === 'catch') return undefined;
    return () => {
      throw new Error(
        `Firebase Admin ${serviceName} is not configured. Please supply valid FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY in .env.local.`
      );
    };

  },
});

export const adminApp: App =
  adminAppInstance ||
  (new Proxy({}, unconfiguredHandler('App')) as unknown as App);

export const adminAuth: Auth =
  adminAuthInstance ||
  (new Proxy({}, unconfiguredHandler('Auth')) as unknown as Auth);

export const adminDb: Firestore =
  adminDbInstance ||
  (new Proxy({}, unconfiguredHandler('Firestore')) as unknown as Firestore);

export const adminStorage: Storage =
  adminStorageInstance ||
  (new Proxy({}, unconfiguredHandler('Storage')) as unknown as Storage);

export { COLLECTIONS } from './collections';
