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

export interface SafeFirebaseEnvDiagnostic {
  client: {
    hasApiKey: boolean;
    hasAuthDomain: boolean;
    hasProjectId: boolean;
    hasStorageBucket: boolean;
    hasMessagingSenderId: boolean;
    hasAppId: boolean;
    isConfigured: boolean;
    missingKeys: string[];
  };
  server: {
    hasProjectId: boolean;
    hasClientEmail: boolean;
    hasPrivateKey: boolean;
    isAdminConfigured: boolean;
    missingKeys: string[];
  };
}

/**
 * Returns a safe diagnostic report stating only whether required variables are present.
 * NEVER prints or exposes actual secret values, tokens, or private keys.
 */
export function getSafeFirebaseEnvDiagnostic(): SafeFirebaseEnvDiagnostic {
  const missingClient = getMissingClientEnvVars();
  const missingServer: string[] = [];

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) {
    missingServer.push('FIREBASE_PROJECT_ID');
  }

  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  if (!clientEmail || clientEmail.includes('placeholder')) {
    missingServer.push('FIREBASE_CLIENT_EMAIL');
  }

  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (!privateKey || !privateKey.includes('PRIVATE KEY') || privateKey.includes('YOUR_PRIVATE_KEY')) {
    missingServer.push('FIREBASE_PRIVATE_KEY');
  }

  return {
    client: {
      hasApiKey: Boolean(
        process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
          !process.env.NEXT_PUBLIC_FIREBASE_API_KEY.includes('placeholder') &&
          !process.env.NEXT_PUBLIC_FIREBASE_API_KEY.includes('your_')
      ),
      hasAuthDomain: Boolean(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN),
      hasProjectId: Boolean(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
      hasStorageBucket: Boolean(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET),
      hasMessagingSenderId: Boolean(
        process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID &&
          !process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID.includes('your_')
      ),
      hasAppId: Boolean(
        process.env.NEXT_PUBLIC_FIREBASE_APP_ID &&
          !process.env.NEXT_PUBLIC_FIREBASE_APP_ID.includes('your_')
      ),
      isConfigured: missingClient.length === 0,
      missingKeys: missingClient,
    },
    server: {
      hasProjectId: Boolean(projectId),
      hasClientEmail: Boolean(clientEmail && !clientEmail.includes('placeholder')),
      hasPrivateKey: Boolean(privateKey && privateKey.includes('PRIVATE KEY') && !privateKey.includes('YOUR_PRIVATE_KEY')),
      isAdminConfigured: missingServer.length === 0,
      missingKeys: missingServer,
    },
  };
}

