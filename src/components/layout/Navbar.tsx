'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu,
  X,
  ChevronDown,
  User as UserIcon,
  LogOut,
  Phone,
  Calendar,
  Users,
  BookOpen,
  ShoppingBag,
  ShieldCheck,
} from 'lucide-react';
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

export function Navbar({ onOpenCommunityCheckout }: NavbarProps = {}) {
  void onOpenCommunityCheckout;
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const moreDropdownRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  const mounted = useMounted();
  const pathname = usePathname();
  const { currentUser, userProfile, isAuthenticated, logout } = useUserAuth();
  const pricing = useDynamicPricing();
  const { formatPrice } = useCurrency();

  // Scroll detection for sticky header shadow
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menus on route changes
  const [prevPath, setPrevPath] = useState(pathname);
  if (prevPath !== pathname) {
    setPrevPath(pathname);
    setIsMobileMenuOpen(false);
    setIsMoreOpen(false);
    setIsProfileOpen(false);
  }

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (moreDropdownRef.current && !moreDropdownRef.current.contains(target)) {
        setIsMoreOpen(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(target)) {
        setIsProfileOpen(false);
      }
    }

    if (isMoreOpen || isProfileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMoreOpen, isProfileOpen]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsMoreOpen(false);
        setIsProfileOpen(false);
        setIsMobileMenuOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Primary navigation links for desktop
  const primaryLinks = [
    { label: 'About', href: '/#about' },
    { label: 'Services', href: '/#services' },
    { label: 'Why Us', href: '/#why-us' },
    { label: 'Contact', href: '/#contact' },
  ];

  // Secondary items nested under "More"
  const moreLinks = [
    {
      label: 'Community',
      href: '/community',
      description: 'Weekly live coaching & templates',
      price: formatPrice(pricing.community, 'mo'),
      icon: Users,
    },
    {
      label: 'Book',
      href: '/book',
      description: 'The Playbook guidebook',
      price: formatPrice(pricing.book),
      icon: BookOpen,
    },
    {
      label: 'Store',
      href: '/store',
      description: 'Checklists & cheat sheets',
      icon: ShoppingBag,
    },
  ];

  const isMoreActive = ['/community', '/book', '/store'].some((path) => pathname === path);

  const displayName =
    userProfile?.name || currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Account';

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-200 ${
          isScrolled
            ? 'bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs py-2.5 sm:py-3'
            : 'bg-white/90 backdrop-blur-md border-b border-slate-100 py-3 sm:py-3.5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-2 lg:gap-4">
            {/* 1. Brand Logo with Geetha N. Portrait */}
            <Link
              href="/"
              className="group flex items-center gap-2.5 sm:gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#138354] rounded-lg flex-shrink-0 whitespace-nowrap"
              aria-label="Finance with Geetha - Home"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden border-2 border-[#0f2c59] shadow-inner bg-slate-100 flex-shrink-0">
                <img
                  src="https://lh3.googleusercontent.com/gg/AJWXcNc5cFZUdc92Hgns-UUZuRCxQf45gOAiCPRspBVSwOxCVcfEYcsdaPP7rAveA9hbc3jpIfNmlut7sA62tE4LRqKaRzVheSAEiH8dWJOP_EW3N53PIJlvf5SKh6bWKlM607xVHSN9jjV6zjlQrp2tK06iHMWw9HeRSqoYikRWMrWH5zEVpZKtrpaSies_kLBWxmfTic87YfLyTYPi3HoqfknTjTwYRLKROmWzhWy_4ZZazdjKWt4jxTPm_q58n0vPkrEXTE6IJYTJKEkmFcqoApcdvQk0UBSaxk8=s0"
                  alt="Geetha N."
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-serif text-base sm:text-lg lg:text-xl font-bold tracking-tight text-[#0f2c59] group-hover:text-[#138354] transition-colors leading-tight">
                  Finance with Geetha
                </span>
                <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-[#138354] leading-none">
                  Bookkeeping & Accounting
                </span>
              </div>
            </Link>

            {/* 2. Desktop Primary Navigation */}
            <nav className="hidden lg:flex items-center gap-4 xl:gap-6 flex-shrink-0">
              {primaryLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.label}
                    href={link.href}
                    className={`text-xs xl:text-sm font-medium transition-colors hover:text-[#0f2c59] whitespace-nowrap py-1 ${
                      isActive
                        ? 'text-[#0f2c59] font-bold border-b-2 border-[#138354]'
                        : 'text-slate-600'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}

              {/* 3. More Dropdown (Community, Book, Store) */}
              <div className="relative" ref={moreDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsMoreOpen(!isMoreOpen)}
                  aria-expanded={isMoreOpen}
                  aria-haspopup="true"
                  className={`flex items-center gap-1 text-xs xl:text-sm font-medium transition-colors hover:text-[#0f2c59] whitespace-nowrap py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#138354] rounded-md ${
                    isMoreActive
                      ? 'text-[#0f2c59] font-bold border-b-2 border-[#138354]'
                      : 'text-slate-600'
                  }`}
                >
                  <span>More</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      isMoreOpen ? 'rotate-180 text-[#0f2c59]' : 'text-slate-400'
                    }`}
                  />
                </button>

                {isMoreOpen && (
                  <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold border-b border-slate-100 mb-1">
                      Explore Resources
                    </div>
                    {moreLinks.map((item) => {
                      const Icon = item.icon;
                      const isItemActive = pathname === item.href;
                      return (
                        <Link
                          key={item.label}
                          href={item.href}
                          onClick={() => setIsMoreOpen(false)}
                          className={`flex items-start gap-3 p-2.5 rounded-xl transition-colors ${
                            isItemActive
                              ? 'bg-emerald-50 text-[#0f2c59]'
                              : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-[#138354] flex-shrink-0 mt-0.5">
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-xs sm:text-sm text-slate-900">
                                {item.label}
                              </span>
                              {item.price && (
                                <span className="text-[10px] font-mono text-[#138354] bg-emerald-50 px-1.5 py-0.5 rounded font-semibold">
                                  {item.price}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 leading-tight mt-0.5 truncate">
                              {item.description}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </nav>

            {/* 4. Desktop Right Action Items */}
            <div className="hidden lg:flex items-center gap-2 xl:gap-3 flex-shrink-0">
              {/* Phone Consultation Button */}
              <a
                href="tel:9538913912"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0f2c59] bg-slate-100 hover:bg-slate-200 px-2.5 xl:px-3 py-1.5 rounded-full transition-colors whitespace-nowrap"
                title="Direct phone consultation"
              >
                <Phone className="w-3.5 h-3.5 text-[#138354]" />
                <span>9538913912</span>
              </a>

              {/* Book Consultation Button */}
              <Link
                href="/#contact"
                className="inline-flex items-center gap-1.5 bg-[#0f2c59] hover:bg-[#138354] text-white text-xs font-semibold px-3 xl:px-4 py-1.5 rounded-full shadow-xs transition-colors whitespace-nowrap"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Book Consultation</span>
              </Link>

              {/* Authentication: Profile Dropdown or Login */}
              {mounted && isAuthenticated ? (
                <div className="relative pl-1 border-l border-slate-200" ref={profileDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    aria-expanded={isProfileOpen}
                    aria-haspopup="true"
                    className="flex items-center gap-1.5 text-xs font-semibold text-[#0f2c59] hover:text-[#138354] px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#138354]"
                  >
                    <div className="w-6 h-6 rounded-full bg-emerald-100 text-[#138354] flex items-center justify-center font-bold text-xs">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                    <span className="max-w-[80px] xl:max-w-[110px] truncate">{displayName}</span>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </button>

                  {/* Profile Dropdown Menu */}
                  {isProfileOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                      <div className="px-3 py-2 border-b border-slate-100 mb-1">
                        <p className="text-xs font-semibold text-slate-900 truncate">
                          {userProfile?.name || currentUser?.displayName || 'User'}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate font-mono">
                          {currentUser?.email}
                        </p>
                      </div>

                      <Link
                        href="/account"
                        id="nav-profile-link"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-[#0f2c59] transition-colors"
                      >
                        <UserIcon className="w-3.5 h-3.5 text-[#138354]" />
                        <span>My Account</span>
                      </Link>

                      {userProfile?.role === 'admin' && (
                        <Link
                          href="/admin"
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-[#0f2c59] transition-colors"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                          <span>Admin Panel</span>
                        </Link>
                      )}

                      <div className="border-t border-slate-100 my-1" />

                      <button
                        type="button"
                        id="nav-logout-btn"
                        onClick={() => {
                          setIsProfileOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-red-600 hover:bg-red-50 transition-colors cursor-pointer text-left"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Log Out</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center pl-1 border-l border-slate-200">
                  <Link
                    href="/login"
                    id="nav-login-link"
                    className="text-xs font-semibold text-slate-600 hover:text-[#0f2c59] transition-colors px-2 py-1.5 whitespace-nowrap"
                  >
                    Login
                  </Link>
                </div>
              )}

              {/* Compact Currency Selector */}
              <CurrencySelector variant="navbar" />
            </div>

            {/* 5. Mobile / Tablet Hamburger Toggle */}
            <div className="flex items-center gap-2 lg:hidden">
              <CurrencySelector variant="navbar" />

              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-lg text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#138354]"
                aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                aria-expanded={isMobileMenuOpen}
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 6. Tablet & Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-30 lg:hidden bg-black/40 backdrop-blur-xs pt-16 sm:pt-20">
          <div className="bg-white border-b border-slate-200 shadow-2xl px-5 py-6 space-y-5 max-h-[calc(100vh-4rem)] overflow-y-auto">
            {/* Primary Nav Links */}
            <div className="space-y-1">
              <div className="px-3 py-1 text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                Menu
              </div>
              <nav className="flex flex-col space-y-1">
                {primaryLinks.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="px-3 py-2 rounded-xl text-sm font-semibold text-slate-800 hover:bg-slate-50 hover:text-[#0f2c59] transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Extended Resources (Community, Book, Store) */}
            <div className="space-y-1 pt-2 border-t border-slate-100">
              <div className="px-3 py-1 text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                Resources & Store
              </div>
              <nav className="flex flex-col space-y-1">
                {moreLinks.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-between px-3 py-2 rounded-xl text-sm font-semibold text-slate-800 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4 text-[#138354]" />
                        <span>{item.label}</span>
                      </div>
                      {item.price && (
                        <span className="text-xs font-mono font-bold text-[#138354]">
                          {item.price}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Direct Calls & Consultation Action */}
            <div className="pt-2 border-t border-slate-100 space-y-2.5">
              <a
                href="tel:9538913912"
                className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-[#0f2c59] font-bold py-2.5 px-4 rounded-xl text-sm transition-colors"
              >
                <Phone className="w-4 h-4 text-[#138354]" />
                <span>Call Geetha: 9538913912</span>
              </a>

              <Link
                href="/#contact"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 bg-[#0f2c59] hover:bg-[#138354] text-white font-bold py-2.5 px-4 rounded-xl text-sm transition-colors shadow-xs"
              >
                <Calendar className="w-4 h-4" />
                <span>Book Consultation</span>
              </Link>
            </div>

            {/* Authentication Section */}
            <div className="pt-2 border-t border-slate-100">
              {mounted && isAuthenticated ? (
                <div className="space-y-2">
                  <Link
                    href="/account"
                    id="mobile-nav-profile-link"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-800 bg-slate-50 hover:bg-slate-100"
                  >
                    <UserIcon className="w-4 h-4 text-[#138354]" />
                    <span className="truncate">
                      Profile ({displayName})
                    </span>
                  </Link>

                  <button
                    type="button"
                    id="mobile-nav-logout-btn"
                    onClick={() => {
                      logout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 text-left cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log Out</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/login"
                    id="mobile-nav-login-link"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="px-3 py-2 text-center rounded-xl text-sm font-semibold border border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    id="mobile-nav-register-link"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="px-3 py-2 text-center rounded-xl text-sm font-semibold bg-[#0f2c59] text-white hover:bg-opacity-90"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>

            <div className="pt-2 text-center text-xs text-slate-500">
              Finance with Geetha · Professional Bookkeeping & Accounting
            </div>
          </div>
        </div>
      )}
    </>
  );
}
