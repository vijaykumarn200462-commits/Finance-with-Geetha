'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  RefreshCw,
  Mail,
  AlertCircle,
  UserCheck,
} from 'lucide-react';
import { AppUser } from '@/types/user';

export default function AdminCustomersClient() {
  const [customers, setCustomers] = useState<AppUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchCustomers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/customers');
      const data = await res.json();
      if (res.ok) {
        setCustomers(data.customers || []);
      } else {
        setError(data.error || 'Failed to fetch customers');
      }
    } catch {
      setError('Network error fetching customers');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch('/api/admin/customers');
        const data = await res.json();
        if (active) {
          if (res.ok) {
            setCustomers(data.customers || []);
          } else {
            setError(data.error || 'Failed to fetch customers');
          }
        }
      } catch {
        if (active) setError('Network error fetching customers');
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const filteredCustomers = customers.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.uid?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Customer Directory</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Registered students, clients, and community members in Cloud Firestore.
          </p>
        </div>

        <button
          onClick={fetchCustomers}
          disabled={isLoading}
          className="p-2 text-gray-600 hover:text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 shadow-xs"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer name, email, or UID..."
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
          />
        </div>
        <p className="text-xs text-gray-500 font-mono">
          Total customers: {customers.length}
        </p>
      </div>

      {/* Customers Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="text-center py-12 px-4">
            <Users className="w-10 h-10 text-gray-400 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-900">No customers found</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              When buyers complete transactions via Stripe or sign up, their records appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm divide-y divide-gray-200">
              <thead className="bg-gray-50 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Customer</th>
                  <th className="px-6 py-3.5">Email</th>
                  <th className="px-6 py-3.5">Orders</th>
                  <th className="px-6 py-3.5">Total Spent</th>
                  <th className="px-6 py-3.5">Community</th>
                  <th className="px-6 py-3.5">Joined Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredCustomers.map((cust) => (
                  <tr key={cust.uid} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-[#2563EB] flex items-center justify-center font-bold text-xs shrink-0">
                          {cust.name ? cust.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-xs">{cust.name || 'Student'}</p>
                          <p className="text-[10px] text-gray-400 font-mono truncate max-w-[120px]">
                            {cust.uid}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-xs text-gray-700">
                      <a
                        href={`mailto:${cust.email}`}
                        className="inline-flex items-center gap-1 hover:text-blue-600 hover:underline"
                      >
                        <Mail className="w-3.5 h-3.5 text-gray-400" />
                        <span>{cust.email}</span>
                      </a>
                    </td>

                    <td className="px-6 py-4 font-mono text-xs text-gray-900">
                      {cust.orderCount || 1}
                    </td>

                    <td className="px-6 py-4 font-mono font-medium text-xs text-gray-900">
                      ${(cust.totalSpent || 0).toLocaleString()}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium font-mono uppercase ${
                          cust.communityStatus === 'active'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {cust.communityStatus === 'active' && <UserCheck className="w-3 h-3" />}
                        <span>{cust.communityStatus || 'none'}</span>
                      </span>
                    </td>

                    <td className="px-6 py-4 text-xs text-gray-500 font-mono">
                      {cust.createdAt ? new Date(cust.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
