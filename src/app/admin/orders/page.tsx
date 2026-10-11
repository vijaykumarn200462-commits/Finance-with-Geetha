import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import AdminOrdersClient from '@/components/admin/AdminOrdersClient';
import { RefreshCw } from 'lucide-react';

export const instant = false;

export const metadata: Metadata = {
  title: 'Orders Management | Admin Console',
};

function OrdersLoadingFallback() {
  return (
    <div className="space-y-6 max-w-6xl animate-pulse">
      <div>
        <div className="h-4 w-32 bg-gray-200 rounded mb-2" />
        <div className="h-8 w-64 bg-gray-200 rounded mb-2" />
        <div className="h-4 w-96 bg-gray-200 rounded" />
      </div>
      <div className="p-12 text-center text-sm text-[#706E69] bg-white rounded-xl border border-[#E2DBD0]">
        <RefreshCw className="w-5 h-5 mx-auto mb-2 animate-spin text-[#244634]" />
        Loading orders...
      </div>
    </div>
  );
}

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={<OrdersLoadingFallback />}>
      <AdminOrdersClient />
    </Suspense>
  );
}
