import React from 'react';
import { fetchSiteContentDocServer } from '@/lib/firebase/content-server';
import { DEFAULT_ABOUT_PAGE_CONTENT } from '@/lib/firebase/content-defaults';
import { AboutPageContent } from '@/types/site-content';
import AboutPageClient from '@/components/about/AboutPageClient';

export const revalidate = 60;

export default async function AboutPage() {
  const result = await fetchSiteContentDocServer<AboutPageContent>(
    'aboutPage',
    DEFAULT_ABOUT_PAGE_CONTENT
  );

  return <AboutPageClient initialData={result.data} />;
}
