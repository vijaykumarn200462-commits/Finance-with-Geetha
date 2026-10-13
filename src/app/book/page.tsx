import React from 'react';
import { fetchSiteContentDocServer } from '@/lib/firebase/content-server';
import { DEFAULT_BOOK_PAGE_CONTENT } from '@/lib/firebase/content-defaults';
import { BookContent } from '@/types/site-content';
import BookPageClient from '@/components/book/BookPageClient';

export const revalidate = 60;

export default async function BookPage() {
  const result = await fetchSiteContentDocServer<BookContent>(
    'book',
    DEFAULT_BOOK_PAGE_CONTENT
  );

  return <BookPageClient initialData={result.data} />;
}
