/**
 * Firebase Client Configuration & Safe Environment Validation
 * Safe for execution on both Server (Node.js) and Browser runtimes.
 * Does not make any Firebase SDK calls during evaluation.
 */

// Production client configuration defaults for geetha-coaching project
const DEFAULT_FIREBASE_CLIENT_CONFIG = {
  apiKey: 'AIzaSyBwA1I-z8CzylPB_BmGDYNkn7gQVgIzBJI',
  authDomain: 'geetha-coaching.firebaseapp.com',
  projectId: 'geetha-coaching',
  storageBucket: 'geetha-coaching.firebasestorage.app',
  messagingSenderId: '704521310592',
  appId: '1:704521310592:web:cc28c9e0dc54c7d699b165',
};

// Support both standard NEXT_PUBLIC_ prefixes, non-prefixed aliases, and project defaults
const resolvedApiKey =
  (process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
   !process.env.NEXT_PUBLIC_FIREBASE_API_KEY.includes('placeholder') &&
   !process.env.NEXT_PUBLIC_FIREBASE_API_KEY.includes('your_')
    ? process.env.NEXT_PUBLIC_FIREBASE_API_KEY
    : undefined) ||
  (process.env.FIREBASE_API_KEY &&
   !process.env.FIREBASE_API_KEY.includes('placeholder') &&
   !process.env.FIREBASE_API_KEY.includes('your_')
    ? process.env.FIREBASE_API_KEY
    : undefined) ||
  DEFAULT_FIREBASE_CLIENT_CONFIG.apiKey;

const resolvedAuthDomain =
  process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
  process.env.FIREBASE_AUTH_DOMAIN ||
  DEFAULT_FIREBASE_CLIENT_CONFIG.authDomain;

const resolvedProjectId =
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
  process.env.FIREBASE_PROJECT_ID ||
  DEFAULT_FIREBASE_CLIENT_CONFIG.projectId;

const resolvedStorageBucket =
  process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
  process.env.FIREBASE_STORAGE_BUCKET ||
  DEFAULT_FIREBASE_CLIENT_CONFIG.storageBucket;

const resolvedMessagingSenderId =
  process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ||
  process.env.FIREBASE_MESSAGING_SENDER_ID ||
  DEFAULT_FIREBASE_CLIENT_CONFIG.messagingSenderId;

const resolvedAppId =
  process.env.NEXT_PUBLIC_FIREBASE_APP_ID ||
  process.env.FIREBASE_APP_ID ||
  DEFAULT_FIREBASE_CLIENT_CONFIG.appId;

export const isFirebaseClientConfigured: boolean = Boolean(
  resolvedApiKey &&
    !resolvedApiKey.includes('placeholder') &&
    !resolvedApiKey.includes('your_')
);

export const firebaseConfig = {
  apiKey: resolvedApiKey,
  authDomain: resolvedAuthDomain,
  projectId: resolvedProjectId,
  storageBucket: resolvedStorageBucket,
  messagingSenderId: resolvedMessagingSenderId,
  appId: resolvedAppId,
};

export function getMissingClientEnvVars(): string[] {
  const missing: string[] = [];
  if (
    !resolvedApiKey ||
    resolvedApiKey.includes('placeholder') ||
    resolvedApiKey.includes('your_')
  ) {
    missing.push('NEXT_PUBLIC_FIREBASE_API_KEY');
  }
  if (!resolvedProjectId) {
    missing.push('NEXT_PUBLIC_FIREBASE_PROJECT_ID');
  }
  if (!resolvedAuthDomain) {
    missing.push('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN');
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
      hasApiKey: isFirebaseClientConfigured,
      hasAuthDomain: Boolean(resolvedAuthDomain),
      hasProjectId: Boolean(resolvedProjectId),
      hasStorageBucket: Boolean(resolvedStorageBucket),
      hasMessagingSenderId: Boolean(
        resolvedMessagingSenderId && !resolvedMessagingSenderId.includes('your_')
      ),
      hasAppId: Boolean(resolvedAppId && !resolvedAppId.includes('your_')),
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

