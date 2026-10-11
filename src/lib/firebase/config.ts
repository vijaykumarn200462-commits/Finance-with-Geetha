/**
 * Firebase Client Configuration & Safe Environment Validation
 * Safe for execution on both Server (Node.js) and Browser runtimes.
 * Does not make any Firebase SDK calls during evaluation.
 */

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'geetha-coaching.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'geetha-coaching',
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'geetha-coaching.appspot.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
};

export const isFirebaseClientConfigured: boolean = Boolean(
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    !process.env.NEXT_PUBLIC_FIREBASE_API_KEY.includes('placeholder') &&
    !process.env.NEXT_PUBLIC_FIREBASE_API_KEY.includes('your_')
);

export function getMissingClientEnvVars(): string[] {
  const missing: string[] = [];
  if (
    !process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY.includes('placeholder') ||
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY.includes('your_')
  ) {
    missing.push('NEXT_PUBLIC_FIREBASE_API_KEY');
  }
  if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
    missing.push('NEXT_PUBLIC_FIREBASE_PROJECT_ID');
  }
  if (!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN) {
    missing.push('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN');
  }
  if (!process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET) {
    missing.push('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET');
  }
  if (
    !process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID.includes('your_')
  ) {
    missing.push('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID');
  }
  if (
    !process.env.NEXT_PUBLIC_FIREBASE_APP_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID.includes('your_')
  ) {
    missing.push('NEXT_PUBLIC_FIREBASE_APP_ID');
  }
  return missing;
}

export function validateFirebaseClientConfig(): { valid: boolean; missing: string[] } {
  const missing = getMissingClientEnvVars();
  return {
    valid: missing.length === 0,
    missing,
  };
}
