'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { useUserAuth } from '@/lib/firebase/user-auth';
import { getSafeRedirectUrl } from '@/lib/utils/redirect';
import { AlertCircle, CheckCircle2, User, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirect');
  const safeRedirect = getSafeRedirectUrl(redirectParam, '/');

  const { register, isAuthenticated, loading } = useUserAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // If already authenticated, redirect
  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push(safeRedirect);
    }
  }, [loading, isAuthenticated, safeRedirect, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validation
    if (!fullName.trim()) {
      setFormError('Please enter your full name.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setFormError('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setFormError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setFormError('Passwords do not match. Please verify both fields.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await register(fullName, email, password);
      if (!res.success) {
        setFormError(res.error || 'Failed to create account.');
        setIsSubmitting(false);
        return;
      }

      setIsSuccess(true);
      setTimeout(() => {
        router.push(safeRedirect);
      }, 1000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setFormError(msg);
      setIsSubmitting(false);
    }
  };

  const loginLink = redirectParam
    ? `/login?redirect=${encodeURIComponent(safeRedirect)}`
    : '/login';

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-[#FFFFFF] border border-[#E2DBD0] rounded-2xl p-8 sm:p-10 shadow-sm">
        <div className="text-center mb-8">
          <span className="text-xs font-mono uppercase tracking-widest text-[#244634] font-semibold block mb-2">
            Customer Registration
          </span>
          <h1 className="font-editorial text-3xl sm:text-4xl text-[#181918] font-normal tracking-tight">
            Create an Account
          </h1>
          <p className="text-sm text-[#5C5E5B] mt-2">
            Join the Finance with Geetha community, contact support, and access your resources.
          </p>
        </div>

        {formError && (
          <div className="mb-6 p-4 rounded-xl bg-[#FFF2F0] border border-[#F5C2BC] text-sm text-[#992218] flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>{formError}</div>
          </div>
        )}

        {isSuccess && (
          <div className="mb-6 p-4 rounded-xl bg-[#EAF0EC] border border-[#C5D8CC] text-sm text-[#244634] flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
            <div>Account created successfully! Redirecting you now...</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label
              htmlFor="register-name"
              className="block text-xs font-semibold text-[#181918] uppercase tracking-wider mb-2 font-mono"
            >
              Full Name <span className="text-[#9A6B2F]">*</span>
            </label>
            <div className="relative">
              <input
                id="register-name"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Sarah Jenkins"
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-[#D5CDC0] bg-[#FAF7F2] text-sm text-[#181918] focus:bg-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#244634] transition-all"
                disabled={isSubmitting || isSuccess}
              />
              <User className="w-4 h-4 text-[#706E69] absolute left-3.5 top-3.5 pointer-events-none" />
            </div>
          </div>

          <div>
            <label
              htmlFor="register-email"
              className="block text-xs font-semibold text-[#181918] uppercase tracking-wider mb-2 font-mono"
            >
              Email Address <span className="text-[#9A6B2F]">*</span>
            </label>
            <div className="relative">
              <input
                id="register-email"
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
            <label
              htmlFor="register-password"
              className="block text-xs font-semibold text-[#181918] uppercase tracking-wider mb-2 font-mono"
            >
              Password <span className="text-[#9A6B2F]">*</span>
            </label>
            <div className="relative">
              <input
                id="register-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-[#D5CDC0] bg-[#FAF7F2] text-sm text-[#181918] focus:bg-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#244634] transition-all"
                disabled={isSubmitting || isSuccess}
              />
              <Lock className="w-4 h-4 text-[#706E69] absolute left-3.5 top-3.5 pointer-events-none" />
            </div>
          </div>

          <div>
            <label
              htmlFor="register-confirm-password"
              className="block text-xs font-semibold text-[#181918] uppercase tracking-wider mb-2 font-mono"
            >
              Confirm Password <span className="text-[#9A6B2F]">*</span>
            </label>
            <div className="relative">
              <input
                id="register-confirm-password"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
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
              Create Account
            </Button>
          </div>
        </form>

        <div className="mt-6 pt-6 border-t border-[#E8E2D7] text-center text-xs text-[#5C5E5B]">
          Already have an account?{' '}
          <Link
            href={loginLink}
            className="font-semibold text-[#244634] hover:underline"
          >
            Log In
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
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
            <RegisterForm />
          </Suspense>
        </div>
      </main>
      <Footer />
    </>
  );
}
