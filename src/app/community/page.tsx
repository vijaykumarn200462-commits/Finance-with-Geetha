import React from 'react';
import { fetchSiteContentDocServer } from '@/lib/firebase/content-server';
import {
  DEFAULT_COMMUNITY_PAGE_CONTENT,
  DEFAULT_CALL_STRUCTURE_CONTENT,
} from '@/lib/firebase/content-defaults';
import { CommunityPageContent, CallStructureContent } from '@/types/site-content';
import CommunityPageClient from '@/components/community/CommunityPageClient';

export const revalidate = 60;

export default async function CommunityPage() {
  const [commResult, callResult] = await Promise.all([
    fetchSiteContentDocServer<CommunityPageContent>(
      'communityPage',
      DEFAULT_COMMUNITY_PAGE_CONTENT
    ),
    fetchSiteContentDocServer<CallStructureContent>(
      'callStructure',
      DEFAULT_CALL_STRUCTURE_CONTENT
    ),
  ]);

  return (
    <CommunityPageClient
      initialCommPage={commResult.data}
      initialCallStructure={callResult.data}
    />
  );
}
