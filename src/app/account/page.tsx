'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { useUserAuth } from '@/lib/firebase/user-auth';
import {
  User,
  Mail,
  Calendar,
  Shield,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  ShoppingBag,
  Users,
  LogOut,
  Loader2,
  Save,
} from 'lucide-react';

export default function AccountPage() {
  const router = useRouter();
  const { currentUser, userProfile, isAuthenticated, loading, updateName, logout } = useUserAuth();

  const defaultName = userProfile?.name || currentUser?.displayName || '';
  const [customName, setCustomName] = useState<string | null>(null);
  const name = customName !== null ? customName : defaultName;

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login?redirect=/account');
    }
  }, [loading, isAuthenticated, router]);


  if (loading || !isAuthenticated) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen flex items-center justify-center pt-32 pb-20">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-[#244634] animate-spin" />
            <p className="text-sm font-medium text-[#706E69] font-mono">
              Loading your account details...
            </p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSaveSuccess(false);

    if (!name.trim()) {
      setErrorMessage('Full name cannot be empty.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await updateName(name.trim());
      if (!res.success) {
        setErrorMessage(res.error || 'Failed to update profile.');
      } else {
        setSaveSuccess(true);
        setCustomName(null);
        setIsEditing(false);
        setTimeout(() => setSaveSuccess(false), 4000);
      }

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error updating profile.';
      setErrorMessage(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const formattedDate = userProfile?.createdAt
    ? new Date(userProfile.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : currentUser?.metadata?.creationTime
    ? new Date(currentUser.metadata.creationTime).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Member';

  return (
    <>
      <Navbar />

      <main className="flex-1 pt-32 pb-20 sm:pt-40 sm:pb-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-mono uppercase tracking-widest text-[#244634] font-semibold">
                Customer Account
              </span>
              <span className="text-xs font-mono bg-[#EAF0EC] text-[#244634] px-2 py-0.5 rounded-full border border-[#C5D8CC]">
                {userProfile?.role || 'customer'}
              </span>
            </div>
            <h1 className="font-editorial text-4xl sm:text-5xl text-[#181918] font-normal tracking-tight">
              My Profile
            </h1>
            <p className="text-sm text-[#5C5E5B] mt-2">
              Manage your personal details and view your account membership status.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Main Profile Info (2 cols) */}
            <div className="md:col-span-2 space-y-6">
              <div className="bg-[#FFFFFF] border border-[#E2DBD0] rounded-2xl p-6 sm:p-8 shadow-sm">
                <div className="flex items-center justify-between pb-6 border-b border-[#E8E2D7]">
                  <div>
                    <h2 className="font-editorial text-2xl text-[#181918]">Account Details</h2>
                    <p className="text-xs text-[#706E69] mt-0.5">
                      Your identity and registered information
                    </p>
                  </div>
                  {!isEditing && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                    >
                      Edit Name
                    </Button>
                  )}
                </div>

                {saveSuccess && (
                  <div className="mt-4 p-4 rounded-xl bg-[#EAF0EC] border border-[#C5D8CC] text-sm text-[#244634] flex items-center gap-2.5">
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                    <span>Your profile name has been updated successfully.</span>
                  </div>
                )}

                {errorMessage && (
                  <div className="mt-4 p-4 rounded-xl bg-[#FFF2F0] border border-[#F5C2BC] text-sm text-[#992218] flex items-center gap-2.5">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="pt-6 space-y-5">
                  {/* Name field */}
                  <div>
                    <label className="block text-xs font-semibold text-[#181918] uppercase tracking-wider mb-2 font-mono">
                      Full Name
                    </label>
                    {isEditing ? (
                      <form onSubmit={handleSaveProfile} className="space-y-3">
                        <div className="relative">
                          <input
                            type="text"
                            value={name}
                            onChange={(e) => setCustomName(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[#D5CDC0] bg-[#FAF7F2] text-sm text-[#181918] focus:bg-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#244634]"
                            disabled={isSaving}
                            autoFocus
                          />
                          <User className="w-4 h-4 text-[#706E69] absolute left-3.5 top-3 pointer-events-none" />
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            type="submit"
                            variant="primary"
                            size="sm"
                            isLoading={isSaving}
                            leftIcon={<Save className="w-3.5 h-3.5" />}
                          >
                            Save Changes
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setCustomName(null);
                              setIsEditing(false);
                              setErrorMessage(null);
                            }}
                            disabled={isSaving}
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>

                    ) : (
                      <div className="flex items-center gap-3 p-3.5 rounded-lg bg-[#FAF7F2] border border-[#E8E2D7]">
                        <User className="w-4 h-4 text-[#244634]" />
                        <span className="text-sm font-medium text-[#181918]">
                          {userProfile?.name || currentUser?.displayName || 'Not specified'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Email field (Read Only) */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-semibold text-[#181918] uppercase tracking-wider font-mono">
                        Email Address
                      </label>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#706E69]">
                        Verified Login
                      </span>
                    </div>
                    <div className="flex items-center gap-3 p-3.5 rounded-lg bg-[#FAF7F2] border border-[#E8E2D7]">
                      <Mail className="w-4 h-4 text-[#244634]" />
                      <span className="text-sm font-medium text-[#181918]">
                        {currentUser?.email}
                      </span>
                    </div>
                  </div>

                  {/* Member Since (Read Only) */}
                  <div>
                    <label className="block text-xs font-semibold text-[#181918] uppercase tracking-wider mb-2 font-mono">
                      Account Created
                    </label>
                    <div className="flex items-center gap-3 p-3.5 rounded-lg bg-[#FAF7F2] border border-[#E8E2D7]">
                      <Calendar className="w-4 h-4 text-[#244634]" />
                      <span className="text-sm text-[#5C5E5B]">{formattedDate}</span>
                    </div>
                  </div>

                  {/* Security / Role indicator */}
                  <div>
                    <label className="block text-xs font-semibold text-[#181918] uppercase tracking-wider mb-2 font-mono">
                      Account Role
                    </label>
                    <div className="flex items-center gap-3 p-3.5 rounded-lg bg-[#FAF7F2] border border-[#E8E2D7]">
                      <Shield className="w-4 h-4 text-[#244634]" />
                      <div className="flex-1">
                        <span className="text-sm font-medium text-[#181918] capitalize">
                          {userProfile?.role || 'Customer'}
                        </span>
                        <p className="text-xs text-[#706E69]">
                          Standard customer profile. Cannot be changed.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar Actions (1 col) */}
            <div className="space-y-6">
              {/* Quick Actions Card */}
              <div className="bg-[#FFFFFF] border border-[#E2DBD0] rounded-2xl p-6 space-y-4 shadow-sm">
                <h3 className="font-editorial text-xl text-[#181918]">Quick Links</h3>
                <div className="space-y-2">
                  <Link
                    href="/contact"
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#FAF7F2] border border-transparent hover:border-[#E8E2D7] text-sm text-[#181918] transition-colors"
                  >
                    <MessageSquare className="w-4 h-4 text-[#244634]" />
                    <span>Contact Geetha</span>
                  </Link>
                  <Link
                    href="/store"
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#FAF7F2] border border-transparent hover:border-[#E8E2D7] text-sm text-[#181918] transition-colors"
                  >
                    <ShoppingBag className="w-4 h-4 text-[#244634]" />
                    <span>Browse Store</span>
                  </Link>
                  <Link
                    href="/community"
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#FAF7F2] border border-transparent hover:border-[#E8E2D7] text-sm text-[#181918] transition-colors"
                  >
                    <Users className="w-4 h-4 text-[#244634]" />
                    <span>Bookkeeping Community</span>
                  </Link>
                </div>

                <div className="pt-4 border-t border-[#E8E2D7]">
                  <button
                    onClick={() => {
                      logout();
                      router.push('/');
                    }}
                    className="w-full flex items-center justify-center gap-2 p-2.5 rounded-lg bg-[#FFF2F0] hover:bg-[#FFE3DF] text-[#992218] text-xs font-semibold uppercase tracking-wider font-mono transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>

              {/* Need Help Card */}
              <div className="bg-[#FAF7F2] border border-[#E2DBD0] rounded-2xl p-6 text-xs text-[#5C5E5B] space-y-2">
                <p className="font-mono uppercase tracking-wider text-[#244634] font-semibold">
                  Personal Support
                </p>
                <p className="leading-relaxed">
                  Have questions about an order or community membership? Send a message directly via the contact page and Geetha will reply within 24–48 hours.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
