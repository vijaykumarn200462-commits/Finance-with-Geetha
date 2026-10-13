import React from 'react';
import { fetchSiteContentDocServer } from '@/lib/firebase/content-server';
import { DEFAULT_STORE_PAGE_CONTENT } from '@/lib/firebase/content-defaults';
import { StorePageContent } from '@/types/site-content';
import StorePageClient from '@/components/store/StorePageClient';

export const revalidate = 60;

export default async function StorePage() {
  const result = await fetchSiteContentDocServer<StorePageContent>(
    'storePage',
    DEFAULT_STORE_PAGE_CONTENT
  );

  return <StorePageClient initialData={result.data} />;
}
