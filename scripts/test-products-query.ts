import { loadEnvConfig } from '@next/env';
import path from 'path';

loadEnvConfig(path.resolve(process.cwd()));

async function testProductsQuery() {
  const { adminDb } = await import('@/lib/firebase/admin');
  console.log('Testing query: collection("products").where("active", "==", true).orderBy("sortOrder", "asc")');
  try {
    const snap = await adminDb
      .collection('products')
      .where('active', '==', true)
      .orderBy('sortOrder', 'asc')
      .get();

    console.log(`Query succeeded! Found ${snap.size} active products sorted by sortOrder.`);
    snap.forEach((doc) => {
      console.log(`- [${doc.id}]: sortOrder=${doc.data().sortOrder}, name=${doc.data().name}, active=${doc.data().active}`);
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error('Query failed with error:');
    console.error(error.message);
  }
}

testProductsQuery().catch(console.error);
