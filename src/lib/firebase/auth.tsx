'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  sendPasswordResetEmail,
  onIdTokenChanged,
  getIdToken,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword as fbUpdatePassword,
} from 'firebase/auth';
import { auth } from './client';
import { getAdminRecord } from './firestore';
import { AdminRecord } from '@/types/admin';

interface AdminAuthContextType {
  user: User | null;
  adminRecord: AdminRecord | null;
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  changePassword: (currentPass: string, newPass: string) => Promise<{ success: boolean; error?: string }>;
  clearError: () => void;
  refreshAdminStatus: () => Promise<void>;
}

function parseAdminAuthError(err: unknown, fallback: string): string {
  if (process.env.NODE_ENV !== 'production') {
    console.error('[AdminAuth Diagnostics]:', err);
  }

  const errObj = err as { code?: string; message?: string };
  const code = typeof errObj?.code === 'string' ? errObj.code.toLowerCase() : '';
  const msg = typeof errObj?.message === 'string' ? errObj.message : '';

  if (
    code.includes('auth/invalid-credential') ||
    code.includes('auth/invalid-login-credentials') ||
    code.includes('auth/wrong-password') ||
    msg.includes('auth/invalid-credential') ||
    msg.includes('auth/invalid-login-credentials') ||
    msg.includes('auth/wrong-password')
  ) {
    return 'Invalid administrator email or password. Please verify your credentials.';
  }
  if (code.includes('auth/user-not-found') || msg.includes('auth/user-not-found')) {
    return 'No administrator account was found with this email address.';
  }
  if (code.includes('auth/invalid-email') || msg.includes('auth/invalid-email')) {
    return 'Please enter a valid administrator email address.';
  }
  if (code.includes('auth/user-disabled') || msg.includes('auth/user-disabled')) {
    return 'This administrator account has been disabled. Please contact system support.';
  }
  if (code.includes('auth/too-many-requests') || msg.includes('auth/too-many-requests')) {
    return 'Access temporarily restricted due to multiple failed login attempts. Please wait a few minutes or reset your password.';
  }
  if (code.includes('auth/network-request-failed') || msg.includes('auth/network-request-failed')) {
    return 'Network communication failure. Please check your internet connection.';
  }
  if (code.includes('auth/missing-password') || msg.includes('auth/missing-password')) {
    return 'Please enter your administrator password.';
  }
  if (code.includes('auth/weak-password') || msg.includes('auth/weak-password')) {
    return 'Password is too weak. Please choose a password with at least 6 characters.';
  }
  if (code.includes('auth/requires-recent-login') || msg.includes('auth/requires-recent-login')) {
    return 'For security reasons, please log out and log in again before changing your password.';
  }
  if (
    code.includes('auth/api-key-not-valid') ||
    code.includes('auth/app-not-authorized') ||
    code.includes('auth/configuration-not-found') ||
    code.includes('auth/operation-not-allowed')
  ) {
    return 'Firebase authentication service configuration issue. Please check project settings.';
  }
  if (code.includes('permission-denied') || msg.includes('permission-denied')) {
    return 'Permission denied: Missing administrator authorization in the database.';
  }

  const cleaned = msg
    .replace('Firebase: ', '')
    .replace(/\(auth\/[^)]+\)\.?/, '')
    .replace(/^Error:?\s*/i, '')
    .trim();

  if (!cleaned || cleaned.toLowerCase() === 'error' || cleaned.toLowerCase() === 'error.') {
    return fallback;
  }

  return cleaned;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [adminRecord, setAdminRecord] = useState<AdminRecord | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  const verifyAndSetAdminState = useCallback(async (currentUser: User | null) => {
    if (!currentUser) {
      setUser(null);
      setAdminRecord(null);
      setIsAdmin(false);
      setLoading(false);
      // Clear cookie
      document.cookie = 'admin_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      return;
    }

    try {
      // 1. First attempt direct Firestore lookup
      let record = await getAdminRecord(currentUser.uid);

      // 2. If direct lookup returns null (e.g. security rules or latency), check server verification
      if (!record) {
        try {
          const token = await getIdToken(currentUser);
          const res = await fetch('/api/admin/verify-session', {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data = await res.json();
            if (data.authorized && data.adminRecord) {
              record = data.adminRecord;
            }
          }
        } catch {
          // ignore fallback error
        }
      }

      if (record && record.role === 'admin' && record.active === true) {
        setUser(currentUser);
        setAdminRecord(record);
        setIsAdmin(true);

        // Store ID token in cookie for server verification
        const token = await getIdToken(currentUser);
        document.cookie = `admin_session=${token}; path=/; credentials=include; max-age=3600; SameSite=Lax`;
      } else {
        // User is logged into Firebase, but is NOT an authorized active admin
        console.warn(`User ${currentUser.email} (${currentUser.uid}) is not an active admin.`);
        setUser(currentUser);
        setAdminRecord(null);
        setIsAdmin(false);
        document.cookie = 'admin_session=; path=/; credentials=include; credentials=include; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      }
    } catch (err: unknown) {
      console.error('Error verifying admin authorization:', err);
      setIsAdmin(false);
      setAdminRecord(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (currentUser) => {
      setLoading(true);
      await verifyAndSetAdminState(currentUser);
    });

    return () => unsubscribe();
  }, [verifyAndSetAdminState]);

  const login = async (email: string, pass: string) => {
    setError(null);
    setLoading(true);
    try {
      const credential = await signInWithEmailAndPassword(auth, email.trim(), pass);
      const token = await getIdToken(credential.user, true);
      document.cookie = `admin_session=${token}; path=/; max-age=3600; SameSite=Lax`;

      // 1. Fetch admin record directly from Firestore
      let record = await getAdminRecord(credential.user.uid);

      // 2. Server verification fallback with token
      if (!record) {
        try {
          const res = await fetch('/api/admin/verify-session', {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data = await res.json();
            if (data.authorized && data.adminRecord) {
              record = data.adminRecord;
            }
          }
        } catch {
          // ignore
        }
      }

      if (!record) {
        await fbSignOut(auth);
        setUser(null);
        setAdminRecord(null);
        setIsAdmin(false);
        const errMsg =
          'Access Denied: Your account is authenticated in Firebase, but does not exist in the admins collection.';
        setError(errMsg);
        setLoading(false);
        return { success: false, error: errMsg };
      }

      if (record.role !== 'admin') {
        await fbSignOut(auth);
        setUser(null);
        setAdminRecord(null);
        setIsAdmin(false);
        const errMsg = `Access Denied: Account has role "${record.role}" instead of "admin".`;
        setError(errMsg);
        setLoading(false);
        return { success: false, error: errMsg };
      }

      if (record.active !== true) {
        await fbSignOut(auth);
        setUser(null);
        setAdminRecord(null);
        setIsAdmin(false);
        const errMsg =
          'Access Denied: This administrator account is currently deactivated. Please contact support.';
        setError(errMsg);
        setLoading(false);
        return { success: false, error: errMsg };
      }

      setUser(credential.user);
      setAdminRecord(record);
      setIsAdmin(true);

      setLoading(false);
      return { success: true };
    } catch (err: unknown) {
      setLoading(false);
      const msg = parseAdminAuthError(err, 'Failed to sign in. Please verify your administrator credentials.');
      setError(msg);
      return { success: false, error: msg };
    }
  };

  const logout = async () => {
    try {
      await fbSignOut(auth);
      setUser(null);
      setAdminRecord(null);
      setIsAdmin(false);
      document.cookie = 'admin_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email.trim());
      return { success: true };
    } catch (err: unknown) {
      const msg = parseAdminAuthError(err, 'Failed to send password reset email.');
      return { success: false, error: msg };
    }
  };

  const changePassword = async (
    currentPass: string,
    newPass: string
  ): Promise<{ success: boolean; error?: string }> => {
    const currentUser = auth.currentUser;
    if (!currentUser || !currentUser.email) {
      return { success: false, error: 'You must be signed in as an administrator to change your password.' };
    }

    if (!newPass || newPass.length < 6) {
      return { success: false, error: 'New password must be at least 6 characters long.' };
    }

    try {
      // Re-authenticate with current credentials
      const credential = EmailAuthProvider.credential(currentUser.email, currentPass);
      await reauthenticateWithCredential(currentUser, credential);

      // Update password in Firebase Authentication
      await fbUpdatePassword(currentUser, newPass);

      // Refresh admin session token
      const token = await getIdToken(currentUser, true);
      document.cookie = `admin_session=${token}; path=/; max-age=3600; SameSite=Lax`;

      return { success: true };
    } catch (err: unknown) {
      const msg = parseAdminAuthError(err, 'Failed to update administrator password.');
      return { success: false, error: msg };
    }
  };

  const refreshAdminStatus = async () => {
    if (auth.currentUser) {
      await verifyAndSetAdminState(auth.currentUser);
    }
  };

  return (
    <AdminAuthContext.Provider
      value={{
        user,
        adminRecord,
        isAdmin,
        loading,
        error,
        login,
        logout,
        resetPassword,
        changePassword,
        clearError,
        refreshAdminStatus,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}
