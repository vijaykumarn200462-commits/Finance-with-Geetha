import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import {
  firebaseConfig,
  isFirebaseClientConfigured,
  getMissingClientEnvVars,
  validateFirebaseClientConfig,
} from './config';

export {
  firebaseConfig,
  isFirebaseClientConfigured,
  getMissingClientEnvVars,
  validateFirebaseClientConfig,
};

let clientAppInstance: FirebaseApp | null = null;
let clientAuthInstance: Auth | null = null;
let clientDbInstance: Firestore | null = null;
let clientStorageInstance: FirebaseStorage | null = null;

export function getFirebaseApp(): FirebaseApp {
  if (clientAppInstance) return clientAppInstance;
  if (getApps().length > 0) {
    clientAppInstance = getApp();
    return clientAppInstance;
  }
  const { valid, missing } = validateFirebaseClientConfig();
  if (!valid) {
    throw new Error(
      `Firebase client is not configured. Missing required environment variables: ${missing.join(', ')}. Please configure them in Vercel or your local environment.`
    );
  }
  clientAppInstance = initializeApp(firebaseConfig);
  return clientAppInstance;
}

export function getFirebaseAuth(): Auth {
  if (clientAuthInstance) return clientAuthInstance;
  if (typeof window === 'undefined') {
    throw new Error('Firebase Auth is a browser-only service and cannot be accessed during server-side execution.');
  }
  const fbApp = getFirebaseApp();
  clientAuthInstance = getAuth(fbApp);
  return clientAuthInstance;
}

export function getFirebaseDb(): Firestore {
  if (clientDbInstance) return clientDbInstance;
  const fbApp = getFirebaseApp();
  clientDbInstance = getFirestore(fbApp);
  return clientDbInstance;
}

export function getFirebaseStorage(): FirebaseStorage {
  if (clientStorageInstance) return clientStorageInstance;
  const fbApp = getFirebaseApp();
  clientStorageInstance = getStorage(fbApp);
  return clientStorageInstance;
}

// Resilient proxies for server-side evaluation or unconfigured environments.
// These prevent module evaluation crashes during Next.js App Router build-time page-data collection.
const createFallbackHandler = (serviceName: string) => ({
  get(_target: object, prop: string | symbol) {
    if (prop === 'then' || prop === 'catch') return undefined;
    if (prop === '_delegate') {
      return {
        onAuthStateChanged: () => () => {},
        onIdTokenChanged: () => () => {},
        currentUser: null,
      };
    }
    return () => {
      const isServer = typeof window === 'undefined';
      if (isServer) {
        throw new Error(
          `Firebase Client ${serviceName} cannot be called during server-side execution or build. Use Firebase Admin SDK for server-side operations.`
        );
      }
      throw new Error(
        `Firebase Client ${serviceName} is not configured. Missing required environment variables: ${getMissingClientEnvVars().join(', ')}.`
      );
    };
  },
});

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

// Safe client-side initialization: only in browser and when credentials are valid
if (typeof window !== 'undefined' && isFirebaseClientConfigured) {
  try {
    app = getFirebaseApp();
    auth = getFirebaseAuth();
    db = getFirebaseDb();
    storage = getFirebaseStorage();
  } catch (err) {
    console.warn('Firebase client SDK initialization warning:', err);
    app = new Proxy({}, createFallbackHandler('App')) as unknown as FirebaseApp;
    auth = new Proxy({}, createFallbackHandler('Auth')) as unknown as Auth;
    db = new Proxy({}, createFallbackHandler('Firestore')) as unknown as Firestore;
    storage = new Proxy({}, createFallbackHandler('Storage')) as unknown as FirebaseStorage;
  }
} else {
  // On the server or when client credentials are missing, provide resilient fallbacks
  app = new Proxy({}, createFallbackHandler('App')) as unknown as FirebaseApp;
  auth = new Proxy({}, createFallbackHandler('Auth')) as unknown as Auth;
  db = new Proxy({}, createFallbackHandler('Firestore')) as unknown as Firestore;
  storage = new Proxy({}, createFallbackHandler('Storage')) as unknown as FirebaseStorage;
}

export { app, auth, db, storage };
