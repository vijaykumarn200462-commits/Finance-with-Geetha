'use client';

import React from 'react';
import { Menu, LogOut, ExternalLink, ShieldCheck } from 'lucide-react';
import { useAdminAuth } from '@/lib/firebase/auth';

interface AdminHeaderProps {
  onToggleMobileMenu: () => void;
  title?: string;
}

export function AdminHeader({ onToggleMobileMenu, title }: AdminHeaderProps) {
  const { user, adminRecord, logout } = useAdminAuth();

  return (
    <header className="h-16 bg-white border-b border-gray-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
          aria-label="Toggle navigation drawer"
        >
          <Menu className="w-5 h-5" />
        </button>

        {title && (
          <h2 className="text-lg font-semibold text-gray-900 tracking-tight">
            {title}
          </h2>
        )}
      </div>

      <div className="flex items-center gap-3">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          <span>Live Site</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>

        <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
          <div className="w-8 h-8 rounded-full bg-[#EBF5FF] text-[#2563EB] flex items-center justify-center font-bold text-xs">
            {adminRecord?.name ? adminRecord.name.charAt(0).toUpperCase() : 'A'}
          </div>

          <div className="hidden md:block text-left">
            <p className="text-xs font-medium text-gray-900 leading-tight">
              {adminRecord?.name || 'Administrator'}
            </p>
            <p className="text-[11px] text-gray-500 leading-tight flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-green-600 inline" />
              <span>{adminRecord?.email || user?.email}</span>
            </p>
          </div>

          <button
            onClick={() => logout()}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-1"
            title="Sign Out"
            aria-label="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
