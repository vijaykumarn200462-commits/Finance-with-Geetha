import { loadEnvConfig } from '@next/env';
import path from 'path';
loadEnvConfig(path.resolve(process.cwd()));

import { adminDb } from '../src/lib/firebase/admin';
import { COLLECTIONS } from '../src/lib/firebase/collections';
import {
  DEFAULT_CALL_STRUCTURE_CONTENT,
  DEFAULT_COMMUNITY_PAGE_CONTENT,
  DEFAULT_ABOUT_PAGE_CONTENT,
  DEFAULT_CONTACT_PAGE_CONTENT,
  DEFAULT_WHY_US_CONTENT,
} from '../src/lib/firebase/content-defaults';

async function repairMissingCmsDocs() {
  console.log('================================================================');
  console.log('   ADMIN REPAIR OPERATION: INITIALIZE MISSING CMS DOCUMENTS     ');
  console.log('================================================================\n');

  const REQUIRED_DOCS: Record<string, Record<string, unknown>> = {
    callStructure: DEFAULT_CALL_STRUCTURE_CONTENT as unknown as Record<string, unknown>,
    communityPage: DEFAULT_COMMUNITY_PAGE_CONTENT as unknown as Record<string, unknown>,
    aboutPage: DEFAULT_ABOUT_PAGE_CONTENT as unknown as Record<string, unknown>,
    contactPage: DEFAULT_CONTACT_PAGE_CONTENT as unknown as Record<string, unknown>,
    whyUs: DEFAULT_WHY_US_CONTENT as unknown as Record<string, unknown>,
  };

  const created: string[] = [];
  const skipped: string[] = [];
  const failed: string[] = [];

  for (const [docId, defaultData] of Object.entries(REQUIRED_DOCS)) {
    try {
      const docRef = adminDb.collection(COLLECTIONS.SITE_CONTENT).doc(docId);
      const docSnap = await docRef.get();

      if (docSnap.exists) {
        console.log(`[SKIPPED] Document "${docId}" already exists. Preserving saved administrator data.`);
        skipped.push(docId);
      } else {
        await docRef.set({
          ...defaultData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        console.log(`[CREATED] Document "${docId}" was missing and has now been initialized.`);
        created.push(docId);
      }
    } catch (err) {
      console.error(`[ERROR] Document "${docId}" initialization failed:`, err);
      failed.push(docId);
    }
  }

  console.log('\n----------------------------------------------------------------');
  console.log(`Repair summary: ${created.length} created, ${skipped.length} skipped, ${failed.length} failed.`);
  console.log('================================================================\n');
}

repairMissingCmsDocs().catch((err) => {
  console.error('Fatal repair error:', err);
  process.exit(1);
});
