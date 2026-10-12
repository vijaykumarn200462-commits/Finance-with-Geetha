import React from 'react';
import { fetchAllSiteContent } from '@/lib/firebase/content-server';
import HomePageClient from '@/components/home/HomePageClient';

// Enable ISR revalidation every 60 seconds, with immediate on-demand revalidatePath on admin save
export const revalidate = 60;

export default async function HomePage() {
  const initialSections = await fetchAllSiteContent();
  return <HomePageClient initialSections={initialSections} />;
}
