import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import {
  firebaseConfig,
  isFirebaseClientConfigured,
  getMissingClientEnvVars,
  validateFirebaseClientConfig,
  getSafeFirebaseEnvDiagnostic,
  SafeFirebaseEnvDiagnostic,
} from './config';

export {
  firebaseConfig,
  isFirebaseClientConfigured,
  getMissingClientEnvVars,
  validateFirebaseClientConfig,
  getSafeFirebaseEnvDiagnostic,
  type SafeFirebaseEnvDiagnostic,
};

// Direct real Firebase client SDK initialization (no Proxy delegates that cause _getRecaptchaConfig errors)
const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);
const storage: FirebaseStorage = getStorage(app);

// Configure realistic retry timeout (5s) so missing buckets or network outages fail fast instead of hanging for 10 minutes (600,000ms default)
storage.maxUploadRetryTime = 5000;
storage.maxOperationRetryTime = 5000;

export function getFirebaseApp(): FirebaseApp {
  return app;
}

export function getFirebaseAuth(): Auth {
  return auth;
}

export function getFirebaseDb(): Firestore {
  return db;
}

export function getFirebaseStorage(): FirebaseStorage {
  return storage;
}

export { app, auth, db, storage };
