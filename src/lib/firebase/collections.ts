/**
 * Canonical Firestore Collection Names
 * Shared safely across both Server (Firebase Admin) and Client (Firebase Web SDK)
 */
export const COLLECTIONS = {
  ADMINS: 'admins',
  USERS: 'users',
  PRODUCTS: 'products',
  ORDERS: 'orders',
  COMMUNITY_MEMBERS: 'community_members',
  MESSAGES: 'messages',
  SITE_CONTENT: 'site_content',
  SETTINGS: 'settings',
  HOMEPAGE_REVIEWS: 'homepageReviews',
} as const;

export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];
