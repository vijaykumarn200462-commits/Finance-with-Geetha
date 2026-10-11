import { loadEnvConfig } from '@next/env';
import path from 'path';

loadEnvConfig(path.resolve(process.cwd()));

async function main() {
  const { GoogleAuth } = await import('google-auth-library');
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (privateKey) privateKey = privateKey.replace(/\\n/g, '\n');

  const auth = new GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
    scopes: ['https://www.googleapis.com/auth/cloud-platform', 'https://www.googleapis.com/auth/datastore'],
  });

  const client = await auth.getClient();
  const projectId = process.env.FIREBASE_PROJECT_ID || 'geetha-coaching';

  // 1. List existing indexes
  console.log(`Checking existing indexes for collectionGroup 'products' in project '${projectId}'...`);
  try {
    const listUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/collectionGroups/products/indexes`;
    const res = await client.request<{ indexes?: unknown[] }>({ url: listUrl });
    console.log('Existing indexes:', JSON.stringify(res.data, null, 2));

    // Check if active + sortOrder index already exists
    interface FirestoreIndexField {
      fieldPath: string;
      order?: string;
    }
    interface FirestoreIndex {
      fields?: FirestoreIndexField[];
    }
    const indexes = (res.data.indexes || []) as FirestoreIndex[];
    const indexAlreadyPresent = indexes.some((idx) => {
      const fields = idx.fields || [];
      return fields.some((f) => f.fieldPath === 'active') && fields.some((f) => f.fieldPath === 'sortOrder');
    });

    if (indexAlreadyPresent) {
      console.log('Index is already present or building in Firestore!');
    } else {
      console.log('Index not found in list. Attempting to create index via Firestore Admin API...');
      const createRes = await client.request({
        url: listUrl,
        method: 'POST',
        data: {
          queryScope: 'COLLECTION',
          fields: [
            { fieldPath: 'active', order: 'ASCENDING' },
            { fieldPath: 'sortOrder', order: 'ASCENDING' },
          ],
        },
      });
      console.log('Create index response:', JSON.stringify(createRes.data, null, 2));
    }
  } catch (err: unknown) {
    const error = err as { message?: string; response?: { data?: unknown } };
    console.log('API call info:', error.message);
    if (error.response?.data) {
      console.log('Details:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

main().catch(console.error);
