'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '@/lib/firebase/auth';
import { Shield, Eye, EyeOff, Lock, Mail, ArrowRight, Loader2, AlertCircle, Info, KeyRound } from 'lucide-react';
import Link from 'next/link';

export default function AdminLoginPage() {
  const router = useRouter();
  const { user, isAdmin, loading, login, resetPassword, error, clearError } = useAdminAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  // If already logged in and verified as admin, redirect to /admin
  useEffect(() => {
    if (!loading && user && isAdmin) {
      router.push('/admin');
    }
  }, [loading, user, isAdmin, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setResetSuccessMessage(null);

    if (!email.trim() || !password) return;

    setIsSubmitting(true);
    const result = await login(email.trim(), password);
    setIsSubmitting(false);

    if (result.success) {
      router.push('/admin');
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) return;

    setIsResetting(true);
    const res = await resetPassword(resetEmail.trim());
    setIsResetting(false);

    if (res.success) {
      setResetSuccessMessage('Password reset instructions sent. Please check your email inbox.');
      setShowResetModal(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-12 h-12 rounded-xl bg-[#2563EB] text-white flex items-center justify-center mx-auto shadow-md">
          <Shield className="w-6 h-6" />
        </div>
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-gray-900">
          Admin Console
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Finance with Geetha — Management Dashboard
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm sm:rounded-xl sm:px-10 border border-gray-200">
          {error && (
            <div className="mb-5 p-3.5 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <div className="leading-snug">{error}</div>
            </div>
          )}

          {resetSuccessMessage && (
            <div className="mb-5 p-3.5 rounded-lg bg-green-50 border border-green-200 text-sm text-green-700 flex items-start gap-2.5">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-green-600" />
              <div className="leading-snug">{resetSuccessMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="admin-email"
                className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5"
              >
                Admin Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="admin-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full pl-9 pr-3.5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="admin-password"
                  className="block text-xs font-semibold text-gray-700 uppercase tracking-wider"
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setResetEmail(email);
                    setShowResetModal(true);
                  }}
                  className="text-xs font-medium text-[#2563EB] hover:underline"
                >
                  Forgot password?
                </button>
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium text-sm transition-colors shadow-xs disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* First Admin Setup Helper Banner */}
          <div className="mt-6 pt-5 border-t border-gray-100 text-xs text-gray-500">
            <div className="flex items-start gap-2">
              <KeyRound className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-medium text-gray-700">First-time administrator setup?</p>
                <p className="text-[11px] leading-relaxed">
                  Only accounts with <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-700 font-mono">role = &quot;admin&quot;</code> in the Firestore <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-700 font-mono">admins</code> collection are granted dashboard privileges.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-xs text-gray-500 hover:text-gray-900 transition-colors"
          >
            ← Return to public website
          </Link>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-xl border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Reset Password</h3>
            <p className="text-xs text-gray-600 mb-4">
              Enter your administrator email address and Firebase Auth will dispatch a reset link.
            </p>
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <input
                type="email"
                required
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="admin@example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="px-3 py-2 text-xs text-gray-600 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isResetting}
                  className="px-4 py-2 bg-[#2563EB] text-white text-xs font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isResetting ? 'Sending...' : 'Send Reset Email'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
