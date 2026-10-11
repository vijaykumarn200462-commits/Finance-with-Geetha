import React from 'react';
import { Loader2 } from 'lucide-react';

export default function AdminLoading() {
  return (
    <div className="space-y-6 max-w-6xl animate-pulse p-4 sm:p-6 lg:p-8">
      <div className="flex items-center gap-3 mb-6">
        <Loader2 className="w-5 h-5 text-[#244634] animate-spin" />
        <span className="text-sm font-medium text-gray-600">Loading console...</span>
      </div>
      <div className="h-8 w-64 bg-gray-200 rounded mb-2" />
      <div className="h-4 w-96 bg-gray-200 rounded mb-8" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-white border border-gray-200 rounded-xl p-5" />
        ))}
      </div>
    </div>
  );
}
