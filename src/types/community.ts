export type CommunityStatus = 'active' | 'past_due' | 'cancelled' | 'incomplete';

export interface CommunityMember {
  userId: string;
  name: string;
  email: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  status: CommunityStatus;
  plan: string;
  amount: number;
  currency: string;
  startDate: string;
  renewalDate?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
}
