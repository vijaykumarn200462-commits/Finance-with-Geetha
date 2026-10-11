'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  UserCheck,
  MessageSquare,
  BookOpen,
  Store,
  FileText,
  Image as ImageIcon,
  Settings,
  LogOut,
  ExternalLink,
  Shield,
  X,
} from 'lucide-react';
import { useAdminAuth } from '@/lib/firebase/auth';

interface AdminSidebarProps {
  onCloseMobile?: () => void;
}

export function AdminSidebar({ onCloseMobile }: AdminSidebarProps) {
  const pathname = usePathname();
  const { logout, adminRecord } = useAdminAuth();

  const navItems = [
    { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { label: 'Products', href: '/admin/products', icon: Package },
    { label: 'Orders', href: '/admin/orders', icon: ShoppingCart },
    { label: 'Customers', href: '/admin/customers', icon: Users },
    { label: 'Community', href: '/admin/community', icon: UserCheck },
    { label: 'Messages', href: '/admin/messages', icon: MessageSquare },
    { label: 'Book', href: '/admin/book', icon: BookOpen },
    { label: 'Store', href: '/admin/store', icon: Store },
    { label: 'Site Content', href: '/admin/site-content', icon: FileText },
    { label: 'Media', href: '/admin/media', icon: ImageIcon },
    { label: 'Settings', href: '/admin/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#111827] text-[#F3F4F6] flex flex-col h-full border-r border-[#1F2937]">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#1F2937] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-[#2563EB] text-white flex items-center justify-center font-bold shadow-xs">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-semibold text-sm text-white tracking-wide">Finance with Geetha</h1>
            <span className="text-[11px] font-mono text-[#9CA3AF] uppercase">Admin Console</span>
          </div>
        </div>

        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 text-gray-400 hover:text-white rounded-md hover:bg-gray-800"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onCloseMobile}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-[#2563EB] text-white shadow-xs'
                  : 'text-[#9CA3AF] hover:text-white hover:bg-[#1F2937]'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Profile & Actions */}
      <div className="p-4 border-t border-[#1F2937] space-y-3">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-[#9CA3AF] hover:text-white hover:bg-[#1F2937] transition-colors"
        >
          <span className="flex items-center gap-2">
            <ExternalLink className="w-3.5 h-3.5" />
            <span>View Public Website</span>
          </span>
          <span className="text-[10px] font-mono bg-gray-800 px-1.5 py-0.5 rounded text-gray-300">Live</span>
        </a>

        {adminRecord && (
          <div className="px-3 py-2 rounded-lg bg-[#1F2937]/70 text-xs text-[#9CA3AF]">
            <p className="text-white font-medium truncate">{adminRecord.name || 'Administrator'}</p>
            <p className="text-[11px] truncate text-gray-400">{adminRecord.email}</p>
          </div>
        )}

        <button
          onClick={() => logout()}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
