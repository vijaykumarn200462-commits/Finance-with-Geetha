import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  DocumentData,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from './client';
import { Product } from '@/types/product';
import { Order } from '@/types/order';
import { AppUser } from '@/types/user';
import { ContactMessage } from '@/types/message';
import { CommunityMember } from '@/types/community';
import { AdminRecord } from '@/types/admin';

import { COLLECTIONS } from './collections';
export { COLLECTIONS };

// Helper to convert Firestore doc to typed object
export function docToData<T>(docSnap: DocumentData): T {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    // Convert Firestore Timestamp to ISO string if needed
    createdAt: data?.createdAt?.toDate
      ? data.createdAt.toDate().toISOString()
      : data?.createdAt || new Date().toISOString(),
    updatedAt: data?.updatedAt?.toDate
      ? data.updatedAt.toDate().toISOString()
      : data?.updatedAt || new Date().toISOString(),
  } as T;
}

// ==========================================
// ADMINS
// ==========================================
export async function getAdminRecord(uid: string): Promise<AdminRecord | null> {
  try {
    const docRef = doc(db, COLLECTIONS.ADMINS, uid);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
      uid,
      email: data.email || '',
      name: data.name || '',
      role: data.role || 'admin',
      active: data.active ?? false,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt || '',
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt,
    };
  } catch (error) {
    console.error('Error fetching admin record:', error);
    return null;
  }
}

// ==========================================
// PRODUCTS
// ==========================================
export async function getActiveProducts(): Promise<Product[]> {
  try {
    const q = query(
      collection(db, COLLECTIONS.PRODUCTS),
      where('active', '==', true),
      orderBy('sortOrder', 'asc')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => docToData<Product>(d));
  } catch (error) {
    console.warn('Error fetching active products from Firestore:', error);
    return [];
  }
}

export async function getAllProducts(): Promise<Product[]> {
  try {
    const q = query(collection(db, COLLECTIONS.PRODUCTS), orderBy('sortOrder', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => docToData<Product>(d));
  } catch (error) {
    console.error('Error fetching all products:', error);
    return [];
  }
}

export async function getProductById(id: string): Promise<Product | null> {
  try {
    const ref = doc(db, COLLECTIONS.PRODUCTS, id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return docToData<Product>(snap);
  } catch (error) {
    console.error('Error fetching product by id:', error);
    return null;
  }
}

export async function createProduct(productData: Omit<Product, 'id'>, customId?: string): Promise<string> {
  const timestamp = serverTimestamp();
  const payload = {
    ...productData,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  if (customId) {
    await setDoc(doc(db, COLLECTIONS.PRODUCTS, customId), payload);
    return customId;
  } else {
    const docRef = await addDoc(collection(db, COLLECTIONS.PRODUCTS), payload);
    return docRef.id;
  }
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<void> {
  const ref = doc(db, COLLECTIONS.PRODUCTS, id);
  await updateDoc(ref, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteProduct(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.PRODUCTS, id));
}

// ==========================================
// ORDERS
// ==========================================
export async function getOrders(statusFilter?: string): Promise<Order[]> {
  try {
    const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc')];
    if (statusFilter && statusFilter !== 'all') {
      constraints.unshift(where('status', '==', statusFilter));
    }
    const q = query(collection(db, COLLECTIONS.ORDERS), ...constraints);
    const snap = await getDocs(q);
    return snap.docs.map((d) => docToData<Order>(d));
  } catch (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
}

export async function updateOrderStatus(id: string, status: Order['status']): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.ORDERS, id), {
    status,
    updatedAt: serverTimestamp(),
  });
}

// ==========================================
// MESSAGES (CONTACT)
// ==========================================
export async function createContactMessage(
  data: Omit<ContactMessage, 'id' | 'status' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTIONS.MESSAGES), {
    ...data,
    status: 'unread',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getMessages(statusFilter?: string): Promise<ContactMessage[]> {
  try {
    const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc')];
    if (statusFilter && statusFilter !== 'all') {
      constraints.unshift(where('status', '==', statusFilter));
    }
    const q = query(collection(db, COLLECTIONS.MESSAGES), ...constraints);
    const snap = await getDocs(q);
    return snap.docs.map((d) => docToData<ContactMessage>(d));
  } catch (error) {
    console.error('Error fetching messages:', error);
    return [];
  }
}

export async function updateMessageStatus(id: string, status: ContactMessage['status']): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.MESSAGES, id), {
    status,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteMessage(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.MESSAGES, id));
}

// ==========================================
// COMMUNITY MEMBERS
// ==========================================
export async function getCommunityMembers(): Promise<CommunityMember[]> {
  try {
    const q = query(collection(db, COLLECTIONS.COMMUNITY_MEMBERS), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => docToData<CommunityMember>(d));
  } catch (error) {
    console.error('Error fetching community members:', error);
    return [];
  }
}

// ==========================================
// USERS / CUSTOMERS
// ==========================================
export async function getCustomers(): Promise<AppUser[]> {
  try {
    const q = query(collection(db, COLLECTIONS.USERS), orderBy('createdAt', 'desc'), limit(100));
    const snap = await getDocs(q);
    return snap.docs.map((d) => docToData<AppUser>(d));
  } catch (error) {
    console.error('Error fetching customers:', error);
    return [];
  }
}

export async function getUserProfile(uid: string): Promise<AppUser | null> {
  try {
    const ref = doc(db, COLLECTIONS.USERS, uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return docToData<AppUser>(snap);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

export async function createUserProfile(data: {
  uid: string;
  name: string;
  email: string;
}): Promise<void> {
  const ref = doc(db, COLLECTIONS.USERS, data.uid);
  const timestamp = serverTimestamp();
  await setDoc(ref, {
    uid: data.uid,
    name: data.name,
    email: data.email,
    role: 'customer',
    createdAt: timestamp,
    updatedAt: timestamp,
  });
}

export async function updateUserProfile(
  uid: string,
  updates: { name?: string }
): Promise<void> {
  const ref = doc(db, COLLECTIONS.USERS, uid);
  const payload: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
  };
  if (updates.name !== undefined) {
    payload.name = updates.name.trim();
  }
  await updateDoc(ref, payload);
}


// ==========================================
// SITE CONTENT & SETTINGS
// ==========================================
export async function getSiteContentDoc<T>(documentId: string): Promise<T | null> {
  try {
    const ref = doc(db, COLLECTIONS.SITE_CONTENT, documentId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return snap.data() as T;
  } catch (error) {
    console.warn(`Error fetching site_content/${documentId}:`, error);
    return null;
  }
}

export async function saveSiteContentDoc<T extends object>(documentId: string, data: T): Promise<void> {
  const ref = doc(db, COLLECTIONS.SITE_CONTENT, documentId);
  await setDoc(ref, {
    ...data,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function getSettingsDoc<T>(section: string): Promise<T | null> {
  try {
    const ref = doc(db, COLLECTIONS.SETTINGS, section);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return snap.data() as T;
  } catch (error) {
    console.warn(`Error fetching settings/${section}:`, error);
    return null;
  }
}

export async function saveSettingsDoc<T extends object>(section: string, data: T): Promise<void> {
  const ref = doc(db, COLLECTIONS.SETTINGS, section);
  await setDoc(ref, {
    ...data,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}
