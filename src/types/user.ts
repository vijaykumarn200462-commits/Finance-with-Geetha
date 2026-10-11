export interface AppUser {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
  role: 'customer' | 'member' | 'admin';
  createdAt: string;
  updatedAt: string;
  orderCount?: number;
  totalSpent?: number;
  communityStatus?: 'active' | 'inactive' | 'none';
}
