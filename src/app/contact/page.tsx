import React from 'react';
import { fetchSiteContentDocServer } from '@/lib/firebase/content-server';
import { DEFAULT_CONTACT_PAGE_CONTENT } from '@/lib/firebase/content-defaults';
import { ContactPageContent } from '@/types/site-content';
import ContactPageClient from '@/components/contact/ContactPageClient';

export const revalidate = 60;

export default async function ContactPage() {
  const result = await fetchSiteContentDocServer<ContactPageContent>(
    'contactPage',
    DEFAULT_CONTACT_PAGE_CONTENT
  );

  return <ContactPageClient initialData={result.data} />;
}
