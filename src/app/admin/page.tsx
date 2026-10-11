import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import AdminDashboardClient from '@/components/admin/AdminDashboardClient';

export const instant = false;

export const metadata: Metadata = {
  title: 'Business Overview | Admin Console',
};

function DashboardLoadingFallback() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Top Banner Skeleton */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="h-7 w-56 bg-gray-200 rounded mb-2" />
          <div className="h-4 w-96 bg-gray-200 rounded" />
        </div>
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-28 bg-gray-200 rounded-lg" />
          <div className="h-8 w-28 bg-gray-200 rounded-lg" />
        </div>
      </div>

      {/* 7 Metric Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div
            key={i}
            className={`bg-white border border-gray-200 rounded-xl p-5 shadow-xs ${
              i === 7 ? 'sm:col-span-2 lg:col-span-2' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="h-3 w-24 bg-gray-200 rounded" />
              <div className="w-9 h-9 rounded-lg bg-gray-100" />
            </div>
            <div className="h-7 w-20 bg-gray-200 rounded mb-1" />
            <div className="h-3 w-32 bg-gray-100 rounded" />
          </div>
        ))}
      </div>

      {/* Tables Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 bg-white border border-gray-200 rounded-xl p-6 shadow-xs">
          <div className="h-5 w-32 bg-gray-200 rounded mb-2" />
          <div className="h-3 w-48 bg-gray-100 rounded mb-6" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 bg-gray-50 rounded border border-gray-100" />
            ))}
          </div>
        </div>
        <div className="lg:col-span-5 bg-white border border-gray-200 rounded-xl p-6 shadow-xs">
          <div className="h-5 w-32 bg-gray-200 rounded mb-2" />
          <div className="h-3 w-48 bg-gray-100 rounded mb-6" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-50 rounded border border-gray-100" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<DashboardLoadingFallback />}>
      <AdminDashboardClient />
    </Suspense>
  );
}
