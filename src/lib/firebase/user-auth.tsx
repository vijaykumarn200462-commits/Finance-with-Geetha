'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateProfile,
  getIdToken as fbGetIdToken,
} from 'firebase/auth';
import { auth } from './client';
import { getUserProfile, createUserProfile, updateUserProfile } from './firestore';
import { AppUser } from '@/types/user';

interface UserAuthContextType {
  currentUser: User | null;
  userProfile: AppUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<{ success: boolean; error?: string }>;
  updateName: (name: string) => Promise<{ success: boolean; error?: string }>;
  refreshUserProfile: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
}

const UserAuthContext = createContext<UserAuthContextType | undefined>(undefined);

function parseAuthError(err: unknown, fallback: string): string {
  // Safe development logging for diagnosis without exposing sensitive credentials
  if (process.env.NODE_ENV !== 'production') {
    console.error('[UserAuth Diagnostics]:', err);
  }

  const errObj = err as { code?: string; message?: string };
  const code = typeof errObj?.code === 'string' ? errObj.code.toLowerCase() : '';
  const msg = typeof errObj?.message === 'string' ? errObj.message : '';

  if (code.includes('auth/email-already-in-use') || msg.includes('auth/email-already-in-use')) {
    return 'This email is already registered. Please log in.';
  }
  if (code.includes('auth/invalid-email') || msg.includes('auth/invalid-email')) {
    return 'Please enter a valid email address.';
  }
  if (code.includes('auth/weak-password') || msg.includes('auth/weak-password')) {
    return 'Please use a stronger password (at least 6 characters).';
  }
  if (code.includes('auth/operation-not-allowed') || msg.includes('auth/operation-not-allowed')) {
    return 'Email and password registration is currently unavailable.';
  }
  if (code.includes('auth/network-request-failed') || msg.includes('auth/network-request-failed')) {
    return 'Network error. Please check your internet connection and try again.';
  }
  if (code.includes('permission-denied') || msg.includes('permission-denied')) {
    return "We couldn't create your account. Please try again.";
  }
  if (code.includes('auth/user-not-found') || msg.includes('auth/user-not-found')) {
    return 'No account found with this email address.';
  }
  if (
    code.includes('auth/wrong-password') ||
    code.includes('auth/invalid-credential') ||
    msg.includes('auth/wrong-password') ||
    msg.includes('auth/invalid-credential')
  ) {
    return 'Invalid email or password. Please try again.';
  }
  if (code.includes('auth/too-many-requests') || msg.includes('auth/too-many-requests')) {
    return 'Access temporarily disabled due to too many failed attempts. Try again later or reset password.';
  }

  // Clean remaining messages, but NEVER return a bare "Error" or empty string
  const cleaned = msg
    .replace('Firebase: ', '')
    .replace(/\(auth\/[^)]+\)\.?/, '')
    .trim();

  if (!cleaned || cleaned.toLowerCase() === 'error' || cleaned.toLowerCase() === 'error.') {
    return fallback;
  }

  return cleaned;
}


export function UserAuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Sync profile from Firestore
  const syncProfile = useCallback(async (user: User | null) => {
    if (!user) {
      setCurrentUser(null);
      setUserProfile(null);
      setLoading(false);
      return;
    }

    try {
      setCurrentUser(user);
      let profile = await getUserProfile(user.uid);

      // If document doesn't exist yet, handle safely and create it
      if (!profile) {
        const defaultName = user.displayName || user.email?.split('@')[0] || 'Customer';
        await createUserProfile({
          uid: user.uid,
          name: defaultName,
          email: user.email || '',
        });
        profile = await getUserProfile(user.uid);
      }

      setUserProfile(profile);
    } catch (err) {
      console.error('Error synchronizing customer profile:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let unsubscribe: () => void = () => {};
    try {
      unsubscribe = onAuthStateChanged(
        auth,
        async (user) => {
          await syncProfile(user);
        },
        (error) => {
          console.error('onAuthStateChanged error in user auth:', error);
          setLoading(false);
        }
      );
    } catch (err) {
      console.error('Error attaching onAuthStateChanged listener:', err);
      setTimeout(() => setLoading(false), 0);
    }

    return () => unsubscribe();
  }, [syncProfile]);

  const login = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
      await syncProfile(cred.user);
      return { success: true };
    } catch (err: unknown) {
      const error = parseAuthError(err, 'Failed to log in. Please check your credentials.');
      return { success: false, error };
    }
  };

  const register = async (
    name: string,
    email: string,
    pass: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const trimmedName = name.trim();
      const trimmedEmail = email.trim();

      if (!trimmedName) {
        return { success: false, error: 'Full name is required.' };
      }

      const cred = await createUserWithEmailAndPassword(auth, trimmedEmail, pass);

      // Update displayName on Firebase User
      try {
        await updateProfile(cred.user, { displayName: trimmedName });
      } catch (profileErr) {
        console.warn('Error updating Firebase auth displayName:', profileErr);
      }

      // Create Firestore customer document: users/{uid} with role: "customer"
      await createUserProfile({
        uid: cred.user.uid,
        name: trimmedName,
        email: cred.user.email || trimmedEmail,
      });

      await syncProfile(cred.user);
      return { success: true };
    } catch (err: unknown) {
      const error = parseAuthError(err, 'Failed to create account. Please try again.');
      return { success: false, error };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await fbSignOut(auth);
      setCurrentUser(null);
      setUserProfile(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const sendPasswordReset = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await sendPasswordResetEmail(auth, email.trim());
      return { success: true };
    } catch (err: unknown) {
      const error = parseAuthError(err, 'Failed to send password reset email.');
      return { success: false, error };
    }
  };

  const updateName = async (name: string): Promise<{ success: boolean; error?: string }> => {
    const trimmed = name.trim();
    if (!trimmed) {
      return { success: false, error: 'Name cannot be empty.' };
    }
    if (!auth.currentUser) {
      return { success: false, error: 'You must be logged in to update your profile.' };
    }

    try {
      await updateProfile(auth.currentUser, { displayName: trimmed });
      await updateUserProfile(auth.currentUser.uid, { name: trimmed });
      setUserProfile((prev) => (prev ? { ...prev, name: trimmed } : null));
      return { success: true };
    } catch (err: unknown) {
      const error = parseAuthError(err, 'Failed to update name.');
      return { success: false, error };
    }
  };

  const refreshUserProfile = async (): Promise<void> => {
    if (auth.currentUser) {
      await syncProfile(auth.currentUser);
    }
  };

  const getIdToken = async (): Promise<string | null> => {
    if (!auth.currentUser) return null;
    try {
      return await fbGetIdToken(auth.currentUser);
    } catch (err) {
      console.error('Error fetching ID token:', err);
      return null;
    }
  };

  return (
    <UserAuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        isAuthenticated: Boolean(currentUser),
        login,
        register,
        logout,
        sendPasswordReset,
        updateName,
        refreshUserProfile,
        getIdToken,
      }}
    >
      {children}
    </UserAuthContext.Provider>
  );
}

export function useUserAuth() {
  const context = useContext(UserAuthContext);
  if (!context) {
    throw new Error('useUserAuth must be used within a UserAuthProvider');
  }
  return context;
}
