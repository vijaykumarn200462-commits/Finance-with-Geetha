export interface AdminRecord {
  uid: string;
  email: string;
  name: string;
  role: 'admin';
  active: boolean;
  createdAt: string;
  updatedAt?: string;
}
