'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ArrowRight, BookOpen, User as UserIcon, LogOut } from 'lucide-react';
import { Button } from '../ui/Button';
import { useUserAuth } from '@/lib/firebase/user-auth';
import { useDynamicPricing } from '@/lib/firebase/content';
import { CurrencySelector } from './CurrencySelector';
import { useCurrency } from '@/lib/context/CurrencyContext';

interface NavbarProps {
  onOpenCommunityCheckout?: () => void;
}

const emptySubscribe = () => () => {};
function useMounted(): boolean {
  return React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

export function Navbar({ onOpenCommunityCheckout }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mounted = useMounted();
  const pathname = usePathname();
  const { currentUser, userProfile, isAuthenticated, logout } = useUserAuth();
  const pricing = useDynamicPricing();
  const { formatPrice } = useCurrency();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const [prevPath, setPrevPath] = useState(pathname);
  if (prevPath !== pathname) {
    setPrevPath(pathname);
    setIsMobileMenuOpen(false);
  }

  const navLinks = [
    { label: 'What I Teach', href: '/#what-i-teach' },
    { label: 'Community', href: '/community' },
    { label: 'Book', href: '/book' },
    { label: 'Store', href: '/store' },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
  ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-200 ${
          isScrolled
            ? 'bg-[#FAF7F2]/90 backdrop-blur-md border-b border-[#E8E2D7] shadow-xs py-3.5'
            : 'bg-transparent border-b border-[#E8E2D7]/60 py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo / Brand */}
            <Link
              href="/"
              className="group flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#244634] rounded-lg"
              aria-label="Finance with Geetha - Home"
            >
              <div className="w-8 h-8 rounded-md bg-[#244634] text-[#FAF7F2] flex items-center justify-center font-editorial text-lg font-bold group-hover:bg-[#1B3527] transition-colors shadow-xs">
                G
              </div>
              <div className="flex flex-col">
                <span className="font-editorial text-lg sm:text-xl font-normal tracking-tight text-[#181918] group-hover:text-[#244634] transition-colors leading-tight">
                  Finance with Geetha
                </span>
                <span className="text-[10px] uppercase font-mono tracking-wider text-[#706E69] leading-none">
                  Calm & Profitable Firms
                </span>
              </div>
            </Link>


            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-7">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.label}
                    href={link.href}
                    className={`text-sm font-medium transition-colors hover:text-[#244634] ${
                      isActive ? 'text-[#244634] font-semibold' : 'text-[#424440]'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            {/* Desktop Primary CTA & Customer Auth */}
            <div className="hidden lg:flex items-center gap-3">
              {mounted && isAuthenticated ? (
                <div className="flex items-center gap-2">
                  <Link
                    href="/account"
                    id="nav-profile-link"
                    className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#181918] hover:text-[#244634] px-2.5 py-1.5 rounded-lg hover:bg-[#EAE4D9] transition-colors font-mono"
                    title={userProfile?.name || currentUser?.displayName || currentUser?.email || 'Profile'}
                  >
                    <UserIcon className="w-3.5 h-3.5 text-[#244634]" />
                    <span>Profile</span>
                  </Link>
                  <button
                    id="nav-logout-btn"
                    onClick={() => logout()}
                    className="text-xs font-mono uppercase tracking-wider text-[#706E69] hover:text-[#992218] transition-colors px-2 py-1.5 cursor-pointer"
                  >
                    Log Out
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Link
                    href="/login"
                    id="nav-login-link"
                    className="text-xs font-mono uppercase tracking-wider font-semibold text-[#424440] hover:text-[#244634] transition-colors px-2 py-1.5"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    id="nav-register-link"
                    className="text-xs font-mono uppercase tracking-wider font-semibold text-[#244634] hover:underline px-2 py-1.5"
                  >
                    Register
                  </Link>
                </div>
              )}

              <CurrencySelector variant="navbar" />

              <Button
                variant="primary"
                size="md"
                href="/community"
                onClick={onOpenCommunityCheckout ? (e) => {
                  if (pathname === '/community') {
                    e.preventDefault();
                    onOpenCommunityCheckout();
                  }
                } : undefined}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Join the Community
              </Button>
            </div>

            {/* Mobile Hamburger Button */}
            <div className="flex items-center lg:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2.5 rounded-lg text-[#181918] hover:bg-[#EAE4D9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#244634]"
                aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                aria-expanded={isMobileMenuOpen}
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Slide Navigation Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-30 lg:hidden bg-black/40 backdrop-blur-xs pt-20">
          <div className="bg-[#FAF7F2] border-b border-[#E8E2D7] shadow-xl px-6 py-6 space-y-4 max-h-[calc(100vh-5rem)] overflow-y-auto">
            <nav className="flex flex-col space-y-3">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-3 py-2.5 rounded-lg text-base font-medium text-[#181918] hover:bg-[#EAE4D9] hover:text-[#244634] transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="pt-3 pb-1 border-t border-[#E8E2D7] flex flex-col space-y-2">
              {mounted && isAuthenticated ? (
                <>
                  <Link
                    href="/account"
                    id="mobile-nav-profile-link"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-[#181918] hover:bg-[#EAE4D9]"
                  >
                    <UserIcon className="w-4 h-4 text-[#244634]" />
                    <span>Profile ({userProfile?.name || currentUser?.displayName || currentUser?.email || 'Account'})</span>
                  </Link>
                  <button
                    id="mobile-nav-logout-btn"
                    onClick={() => {
                      logout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-[#992218] hover:bg-[#FFF2F0] text-left cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log Out</span>
                  </button>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/login"
                    id="mobile-nav-login-link"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="px-3 py-2 text-center rounded-lg text-sm font-medium border border-[#D5CDC0] bg-white text-[#181918] hover:bg-[#FAF7F2]"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    id="mobile-nav-register-link"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="px-3 py-2 text-center rounded-lg text-sm font-medium bg-[#244634] text-white hover:bg-[#1B3527]"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-[#E8E2D7] space-y-3">
              <div>
                <label className="block text-[11px] font-mono uppercase text-[#706E69] mb-1.5 font-semibold">
                  Display Currency
                </label>
                <CurrencySelector variant="mobile" />
              </div>

              <Button
                variant="primary"
                size="lg"
                href="/community"
                className="w-full justify-center"
                onClick={() => setIsMobileMenuOpen(false)}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Join the Community — {formatPrice(pricing.community, 'mo')}
              </Button>

              <Button
                variant="secondary"
                size="md"
                href="/book"
                className="w-full justify-center"
                onClick={() => setIsMobileMenuOpen(false)}
                leftIcon={<BookOpen className="w-4 h-4" />}
              >
                Start with the Book — {formatPrice(pricing.book)}
              </Button>
            </div>

            <div className="pt-2 text-center text-xs text-[#706E69]">
              Finance with Geetha · Practical coaching & community
            </div>
          </div>
        </div>
      )}
    </>
  );

}
