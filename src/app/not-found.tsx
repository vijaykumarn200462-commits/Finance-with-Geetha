'use client';

import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Home, BookOpen, Users, ShoppingBag } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2] text-[#181918]">
      <Navbar />

      <main className="flex-1 flex items-center justify-center py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl w-full text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#EAE4D9] text-[#244634]">
            404 — Page Not Found
          </div>

          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-[#181918] tracking-tight">
            We couldn&apos;t find that page
          </h1>

          <p className="text-[#5C5E5B] text-base sm:text-lg leading-relaxed max-w-md mx-auto">
            The page you are looking for may have been moved, renamed, or is temporarily unavailable. Let&apos;s get you back on track.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button href="/" variant="primary" size="lg" leftIcon={<Home className="w-4 h-4" />}>
              Back to Home
            </Button>
            <Button href="/book" variant="outline" size="lg" leftIcon={<BookOpen className="w-4 h-4" />}>
              Read the Book
            </Button>
          </div>

          <div className="pt-8 border-t border-[#E2DBD0] grid grid-cols-2 sm:grid-cols-3 gap-4 text-left">
            <Link
              href="/community"
              className="p-3.5 rounded-xl bg-white/60 hover:bg-white border border-[#E2DBD0] transition-colors group"
            >
              <div className="flex items-center gap-2 text-xs font-semibold text-[#244634] mb-1">
                <Users className="w-3.5 h-3.5" />
                Community
              </div>
              <p className="text-xs text-[#706E69]">Live coaching & templates</p>
            </Link>

            <Link
              href="/store"
              className="p-3.5 rounded-xl bg-white/60 hover:bg-white border border-[#E2DBD0] transition-colors group"
            >
              <div className="flex items-center gap-2 text-xs font-semibold text-[#244634] mb-1">
                <ShoppingBag className="w-3.5 h-3.5" />
                Store
              </div>
              <p className="text-xs text-[#706E69]">Cheat sheets & systems</p>
            </Link>

            <Link
              href="/contact"
              className="p-3.5 rounded-xl bg-white/60 hover:bg-white border border-[#E2DBD0] transition-colors group col-span-2 sm:col-span-1"
            >
              <div className="flex items-center gap-2 text-xs font-semibold text-[#244634] mb-1">
                <ArrowLeft className="w-3.5 h-3.5" />
                Get in Touch
              </div>
              <p className="text-xs text-[#706E69]">Questions & coaching</p>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
