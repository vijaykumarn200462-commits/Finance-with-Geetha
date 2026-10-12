'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAdminAuth } from '@/lib/firebase/auth';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { ShieldAlert, LogOut, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAdmin, loading, logout } = useAdminAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isLoginPage =
    pathname === '/admin/login' ||
    pathname === '/admin/login/' ||
    (typeof pathname === 'string' && pathname.startsWith('/admin/login'));

  useEffect(() => {
    if (!loading && !user && !isLoginPage) {
      router.push('/admin/login');
    }
  }, [loading, user, isLoginPage, router]);

  // If on login page, let it render directly
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-[#2563EB] animate-spin" />
          <p className="text-sm font-medium text-gray-600">Verifying administrator credentials...</p>
        </div>
      </div>
    );
  }

  // Unauthenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center p-4">
        <div className="bg-white border border-gray-200 rounded-xl p-8 max-w-md w-full text-center shadow-xs">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-[#2563EB] flex items-center justify-center mx-auto mb-4">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Redirecting to Login</h2>
          <p className="text-sm text-gray-600 mb-6">
            Authentication required to access the administration console.
          </p>
          <Link
            href="/admin/login"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#2563EB] text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <span>Proceed to Login</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  // Authenticated BUT not an authorized active admin in admins collection
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center p-4">
        <div className="bg-white border border-red-200 rounded-xl p-8 max-w-lg w-full text-center shadow-md">
          <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-sm text-gray-600 mb-4 leading-relaxed">
            You are authenticated as <strong className="text-gray-900">{user.email}</strong>, but
            this account is not registered in the active administrators directory.
          </p>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-xs text-left text-gray-600 space-y-1.5 mb-6 font-mono">
            <p>• User UID: {user.uid}</p>
            <p>• Required Collection: <span className="text-blue-600">admins/{user.uid}</span></p>
            <p>• Required Role: <span className="text-blue-600">role = &quot;admin&quot;</span></p>
            <p>• Required Status: <span className="text-blue-600">active = true</span></p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => logout()}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out & Try Another Account</span>
            </button>
            <Link
              href="/"
              className="w-full sm:w-auto px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors text-center"
            >
              Return to Website
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Authorized Admin: Render Full Dashboard Layout
  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-row">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block shrink-0">
        <AdminSidebar />
      </div>

      {/* Mobile Sidebar Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-64 z-10 flex">
            <AdminSidebar onCloseMobile={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader onToggleMobileMenu={() => setMobileMenuOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
