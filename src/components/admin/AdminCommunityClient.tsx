'use client';

import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Plus,
  Search,
  RefreshCw,
  AlertCircle,
  X,
  CheckCircle2,
  Clock,
  XCircle,
} from 'lucide-react';
import { CommunityMember, CommunityStatus } from '@/types/community';

export default function AdminCommunityClient() {
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [memberName, setMemberName] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [memberPlan, setMemberPlan] = useState('Monthly Membership (₹150/mo)');
  const [isSaving, setIsSaving] = useState(false);

  const fetchMembers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/community');
      const data = await res.json();
      if (res.ok) {
        setMembers(data.members || []);
      } else {
        setError(data.error || 'Failed to fetch community members');
      }
    } catch {
      setError('Network error fetching community members');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch('/api/admin/community');
        const data = await res.json();
        if (active) {
          if (res.ok) {
            setMembers(data.members || []);
          } else {
            setError(data.error || 'Failed to fetch community members');
          }
        }
      } catch {
        if (active) setError('Network error fetching community members');
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberEmail.trim()) return;

    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/community', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: memberName.trim() || 'Community Member',
          email: memberEmail.trim(),
          plan: memberPlan,
          amount: 150,
          status: 'active',
        }),
      });

      if (res.ok) {
        setIsAddModalOpen(false);
        setMemberName('');
        setMemberEmail('');
        fetchMembers();
      } else {
        alert('Failed to save community member');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredMembers = members.filter((m) => {
    const q = searchQuery.toLowerCase();
    const matchesQuery =
      m.name?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
    return matchesQuery && matchesStatus;
  });

  const getStatusBadge = (status: CommunityStatus) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
            <CheckCircle2 className="w-3 h-3" />
            <span>Active</span>
          </span>
        );
      case 'past_due':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3" />
            <span>Past Due</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
            <XCircle className="w-3 h-3" />
            <span>Cancelled</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Community Membership</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Active bookkeepers enrolled in Geetha&apos;s ₹150/month live coaching calls in Cloud Firestore.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchMembers}
            disabled={isLoading}
            className="p-2 text-gray-600 hover:text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 shadow-xs"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-white bg-[#2563EB] hover:bg-blue-700 rounded-lg shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Member</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by member name or email..."
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {(['all', 'active', 'past_due', 'cancelled'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                statusFilter === st
                  ? 'bg-gray-900 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="text-center py-12 px-4">
            <UserCheck className="w-10 h-10 text-gray-400 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-900">No community members found</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto mb-4">
              Subscribers to &quot;The Community&quot; (₹150/mo) are automatically listed here via Stripe webhook.
            </p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#2563EB] rounded-lg"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Manually Add Member</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm divide-y divide-gray-200">
              <thead className="bg-gray-50 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Member</th>
                  <th className="px-6 py-3.5">Plan</th>
                  <th className="px-6 py-3.5">Rate</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Start Date</th>
                  <th className="px-6 py-3.5">Next Renewal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredMembers.map((m) => (
                  <tr key={m.userId} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
                          {m.name ? m.name.charAt(0).toUpperCase() : 'M'}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-xs">{m.name}</p>
                          <p className="text-[11px] text-gray-500">{m.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-xs text-gray-700">
                      {m.plan || 'Monthly Membership'}
                    </td>

                    <td className="px-6 py-4 font-mono font-medium text-xs text-gray-900">
                      ₹{m.amount || 150} / mo
                    </td>

                    <td className="px-6 py-4">{getStatusBadge(m.status)}</td>

                    <td className="px-6 py-4 text-xs text-gray-500 font-mono">
                      {m.startDate ? new Date(m.startDate).toLocaleDateString() : 'N/A'}
                    </td>

                    <td className="px-6 py-4 text-xs text-gray-500 font-mono">
                      {m.renewalDate ? new Date(m.renewalDate).toLocaleDateString() : 'Auto-renew'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Member Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <h3 className="text-base font-bold text-gray-900">Add Community Member</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                  placeholder="e.g. David Wright"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={memberEmail}
                  onChange={(e) => setMemberEmail(e.target.value)}
                  placeholder="david@wrightaccounting.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Plan Tier
                </label>
                <select
                  value={memberPlan}
                  onChange={(e) => setMemberPlan(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
                >
                  <option value="Monthly Membership (₹150/mo)">Monthly Membership (₹150/mo)</option>
                  <option value="Annual Membership (Discounted)">Annual Membership</option>
                  <option value="Scholarship / Complimentary">Scholarship / Complimentary</option>
                </select>
              </div>

              <div className="pt-3 border-t border-gray-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-1.5 bg-[#2563EB] text-white rounded-lg text-xs font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
