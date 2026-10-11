/**
 * CLI Seed Script for Bookkeeping With Jake Demi
 * Firebase Project: geetha-coaching
 *
 * Usage:
 *   npx tsx scripts/seed.ts
 *
 * This script is idempotent: it will NOT duplicate products or overwrite existing data.
 */

import { loadEnvConfig } from '@next/env';

// Load .env.local via Next.js env loader
loadEnvConfig(process.cwd());

async function runSeed() {
  console.log('----------------------------------------------------');
  console.log('Starting Firestore Seeder for: geetha-coaching');
  console.log('----------------------------------------------------');

  try {
    const { seedInitialFirestoreData } = await import('../src/lib/firebase/seed');
    const result = await seedInitialFirestoreData();

    console.log('✅ Seed completed successfully:');
    console.log(`   - Products Created: ${result.productsCreated}`);
    console.log(`   - Products Skipped (already exist): ${result.productsSkipped}`);
    console.log(`   - Site Content Sections Seeded: ${result.contentCreated.join(', ') || 'None (already present)'}`);
    console.log(`   - Settings Seeded: ${result.settingsCreated.join(', ') || 'None (already present)'}`);
    console.log('----------------------------------------------------');
  } catch (err: unknown) {
    console.error('❌ Error during seeding:', err);
    process.exit(1);
  }
}

runSeed();
