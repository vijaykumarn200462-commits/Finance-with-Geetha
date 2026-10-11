export type ProductType = 'book' | 'cheatsheet' | 'workflow' | 'other';

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  price: number;
  currency: string;
  type: ProductType;
  imageUrl?: string;
  fileUrl?: string;
  active: boolean;
  featured: boolean;
  sortOrder: number;
  features?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateProductInput {
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  price: number;
  currency?: string;
  type: ProductType;
  imageUrl?: string;
  fileUrl?: string;
  active: boolean;
  featured: boolean;
  sortOrder: number;
  features?: string[];
}
