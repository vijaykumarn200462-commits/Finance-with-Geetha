'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { useUserAuth } from '@/lib/firebase/user-auth';
import { getSafeRedirectUrl } from '@/lib/utils/redirect';
import { AlertCircle, CheckCircle2, Mail, Lock, ArrowRight, Loader2, KeyRound } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirect');
  const safeRedirect = getSafeRedirectUrl(redirectParam, '/');

  const { login, sendPasswordReset, isAuthenticated, loading } = useUserAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Forgot password mode
  const [isForgotPasswordMode, setIsForgotPasswordMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);
  const [resetErrorMessage, setResetErrorMessage] = useState<string | null>(null);

  // If already authenticated, redirect
  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push(safeRedirect);
    }
  }, [loading, isAuthenticated, safeRedirect, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setFormError('Please enter a valid email address.');
      return;
    }

    if (!password) {
      setFormError('Please enter your password.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await login(email, password);
      if (!res.success) {
        setFormError(res.error || 'Failed to sign in. Please check your credentials.');
        setIsSubmitting(false);
        return;
      }

      setIsSuccess(true);
      setTimeout(() => {
        router.push(safeRedirect);
      }, 600);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setFormError(msg);
      setIsSubmitting(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetErrorMessage(null);
    setResetSuccessMessage(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!resetEmail.trim() || !emailRegex.test(resetEmail.trim())) {
      setResetErrorMessage('Please enter a valid email address.');
      return;
    }

    setResetSubmitting(true);

    try {
      const res = await sendPasswordReset(resetEmail);
      if (!res.success) {
        setResetErrorMessage(res.error || 'Failed to send password reset email.');
      } else {
        setResetSuccessMessage(
          `Password reset instructions have been sent to ${resetEmail}. Check your inbox.`
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send reset email.';
      setResetErrorMessage(msg);
    } finally {
      setResetSubmitting(false);
    }
  };

  const registerLink = redirectParam
    ? `/register?redirect=${encodeURIComponent(safeRedirect)}`
    : '/register';

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-[#FFFFFF] border border-[#E2DBD0] rounded-2xl p-8 sm:p-10 shadow-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <span className="text-xs font-mono uppercase tracking-widest text-[#244634] font-semibold block mb-2">
            Customer Portal
          </span>
          <h1 className="font-editorial text-3xl sm:text-4xl text-[#181918] font-normal tracking-tight">
            {isForgotPasswordMode ? 'Reset Password' : 'Sign In'}
          </h1>
          <p className="text-sm text-[#5C5E5B] mt-2">
            {isForgotPasswordMode
              ? 'Enter your email to receive a secure password reset link.'
              : 'Log in to access your resources and reach out to Geetha.'}
          </p>
        </div>

        {/* FORGOT PASSWORD FORM */}
        {isForgotPasswordMode ? (
          <div className="space-y-4">
            {resetErrorMessage && (
              <div className="p-4 rounded-xl bg-[#FFF2F0] border border-[#F5C2BC] text-sm text-[#992218] flex items-start gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>{resetErrorMessage}</div>
              </div>
            )}

            {resetSuccessMessage ? (
              <div className="p-4 rounded-xl bg-[#EAF0EC] border border-[#C5D8CC] text-sm text-[#244634] space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>{resetSuccessMessage}</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPasswordMode(false);
                    setResetSuccessMessage(null);
                  }}
                  className="text-xs font-semibold uppercase tracking-wider text-[#244634] underline font-mono cursor-pointer"
                >
                  Return to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handlePasswordReset} className="space-y-4" noValidate>
                <div>
                  <label
                    htmlFor="reset-email"
                    className="block text-xs font-semibold text-[#181918] uppercase tracking-wider mb-2 font-mono"
                  >
                    Email Address <span className="text-[#9A6B2F]">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="reset-email"
                      type="email"
                      required
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="name@firm.com"
                      className="w-full pl-10 pr-4 py-3 rounded-lg border border-[#D5CDC0] bg-[#FAF7F2] text-sm text-[#181918] focus:bg-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#244634] transition-all"
                      disabled={resetSubmitting}
                    />
                    <Mail className="w-4 h-4 text-[#706E69] absolute left-3.5 top-3.5 pointer-events-none" />
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={resetSubmitting}
                  className="w-full justify-center text-base"
                  rightIcon={<KeyRound className="w-4 h-4" />}
                >
                  Send Reset Link
                </Button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPasswordMode(false);
                      setResetErrorMessage(null);
                    }}
                    className="text-xs text-[#706E69] hover:text-[#181918] underline font-mono cursor-pointer"
                  >
                    Cancel and Return to Login
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          /* STANDARD LOGIN FORM */
          <>
            {formError && (
              <div className="mb-6 p-4 rounded-xl bg-[#FFF2F0] border border-[#F5C2BC] text-sm text-[#992218] flex items-start gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>{formError}</div>
              </div>
            )}

            {isSuccess && (
              <div className="mb-6 p-4 rounded-xl bg-[#EAF0EC] border border-[#C5D8CC] text-sm text-[#244634] flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                <div>Authenticated successfully! Redirecting...</div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label
                  htmlFor="login-email"
                  className="block text-xs font-semibold text-[#181918] uppercase tracking-wider mb-2 font-mono"
                >
                  Email Address <span className="text-[#9A6B2F]">*</span>
                </label>
                <div className="relative">
                  <input
                    id="login-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@firm.com"
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-[#D5CDC0] bg-[#FAF7F2] text-sm text-[#181918] focus:bg-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#244634] transition-all"
                    disabled={isSubmitting || isSuccess}
                  />
                  <Mail className="w-4 h-4 text-[#706E69] absolute left-3.5 top-3.5 pointer-events-none" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label
                    htmlFor="login-password"
                    className="block text-xs font-semibold text-[#181918] uppercase tracking-wider font-mono"
                  >
                    Password <span className="text-[#9A6B2F]">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPasswordMode(true);
                      setResetEmail(email);
                    }}
                    className="text-xs text-[#244634] hover:underline font-mono cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    id="login-password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-[#D5CDC0] bg-[#FAF7F2] text-sm text-[#181918] focus:bg-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#244634] transition-all"
                    disabled={isSubmitting || isSuccess}
                  />
                  <Lock className="w-4 h-4 text-[#706E69] absolute left-3.5 top-3.5 pointer-events-none" />
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={isSubmitting}
                  className="w-full justify-center text-base"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                  disabled={isSuccess}
                >
                  Sign In
                </Button>
              </div>
            </form>

            <div className="mt-6 pt-6 border-t border-[#E8E2D7] text-center text-xs text-[#5C5E5B]">
              Don&apos;t have an account?{' '}
              <Link
                href={registerLink}
                className="font-semibold text-[#244634] hover:underline"
              >
                Create an account
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 pt-32 pb-20 sm:pt-40 sm:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Suspense
            fallback={
              <div className="flex justify-center items-center py-20">
                <Loader2 className="w-8 h-8 text-[#244634] animate-spin" />
              </div>
            }
          >
            <LoginForm />
          </Suspense>
        </div>
      </main>
      <Footer />
    </>
  );
}
