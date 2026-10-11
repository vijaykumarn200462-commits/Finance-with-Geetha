'use client';

import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  ShoppingCart,
  Users,
  UserCheck,
  BookOpen,
  FileCheck,
  MessageSquare,
  RefreshCw,
  ArrowRight,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { Order } from '@/types/order';
import { ContactMessage } from '@/types/message';
import { AppUser } from '@/types/user';
import { formatCurrency } from '@/lib/utils/currency';

interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  activeMembers: number;
  bookSales: number;
  templateSales: number;
  unreadMessages: number;
}

export default function AdminDashboardClient() {
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    totalRevenue: 0,
    totalCustomers: 0,
    activeMembers: 0,
    bookSales: 0,
    templateSales: 0,
    unreadMessages: 0,
  });

  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [recentMessages, setRecentMessages] = useState<ContactMessage[]>([]);
  const [recentCustomers, setRecentCustomers] = useState<AppUser[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedMessage, setSeedMessage] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [ordersRes, messagesRes, customersRes, communityRes] = await Promise.all([
        fetch('/api/admin/orders').catch(() => null),
        fetch('/api/admin/messages').catch(() => null),
        fetch('/api/admin/customers').catch(() => null),
        fetch('/api/admin/community').catch(() => null),
      ]);

      const ordersData = ordersRes?.ok ? await ordersRes.json() : { orders: [] };
      const messagesData = messagesRes?.ok ? await messagesRes.json() : { messages: [] };
      const customersData = customersRes?.ok ? await customersRes.json() : { customers: [] };
      const communityData = communityRes?.ok ? await communityRes.json() : { members: [] };

      const orders: Order[] = ordersData.orders || [];
      const messages: ContactMessage[] = messagesData.messages || [];
      const customers: AppUser[] = customersData.customers || [];
      const members = communityData.members || [];

      // Calculate real statistics from Firestore data
      const paidOrders = orders.filter((o) => o.status === 'paid');
      const totalRev = paidOrders.reduce((sum, o) => sum + (Number(o.amount) || 0), 0);
      const booksCount = paidOrders.filter((o) => o.productId === 'book').length;
      const templatesCount = paidOrders.filter(
        (o) => o.productId === 'cheatsheets' || o.productId === 'workflow'
      ).length;
      const unreadCount = messages.filter((m) => m.status === 'unread').length;
      const activeMembersCount = members.filter((m: { status?: string }) => m.status === 'active').length;

      setStats({
        totalOrders: orders.length,
        totalRevenue: totalRev,
        totalCustomers: customers.length,
        activeMembers: activeMembersCount,
        bookSales: booksCount,
        templateSales: templatesCount,
        unreadMessages: unreadCount,
      });

      setRecentOrders(orders.slice(0, 5));
      setRecentMessages(messages.slice(0, 5));
      setRecentCustomers(customers.slice(0, 5));
    } catch (err: unknown) {
      console.error('Failed to load dashboard data:', err);
      setError('Failed to fetch data from Firestore. Please ensure your session is active.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [ordersRes, messagesRes, customersRes, communityRes] = await Promise.all([
          fetch('/api/admin/orders').catch(() => null),
          fetch('/api/admin/messages').catch(() => null),
          fetch('/api/admin/customers').catch(() => null),
          fetch('/api/admin/community').catch(() => null),
        ]);

        const ordersData = ordersRes?.ok ? await ordersRes.json() : { orders: [] };
        const messagesData = messagesRes?.ok ? await messagesRes.json() : { messages: [] };
        const customersData = customersRes?.ok ? await customersRes.json() : { customers: [] };
        const communityData = communityRes?.ok ? await communityRes.json() : { members: [] };

        if (!active) return;

        const orders: Order[] = ordersData.orders || [];
        const messages: ContactMessage[] = messagesData.messages || [];
        const customers: AppUser[] = customersData.customers || [];
        const members = communityData.members || [];

        const paidOrders = orders.filter((o) => o.status === 'paid');
        const totalRev = paidOrders.reduce((sum, o) => sum + (Number(o.amount) || 0), 0);
        const booksCount = paidOrders.filter((o) => o.productId === 'book').length;
        const templatesCount = paidOrders.filter(
          (o) => o.productId === 'cheatsheets' || o.productId === 'workflow'
        ).length;
        const unreadCount = messages.filter((m) => m.status === 'unread').length;
        const activeMembersCount = members.filter((m: { status?: string }) => m.status === 'active').length;

        setStats({
          totalOrders: orders.length,
          totalRevenue: totalRev,
          totalCustomers: customers.length,
          activeMembers: activeMembersCount,
          bookSales: booksCount,
          templateSales: templatesCount,
          unreadMessages: unreadCount,
        });

        setRecentOrders(orders.slice(0, 5));
        setRecentMessages(messages.slice(0, 5));
        setRecentCustomers(customers.slice(0, 5));
      } catch (err: unknown) {
        if (active) {
          console.error('Failed to load dashboard data:', err);
          setError('Failed to fetch data from Firestore. Please ensure your session is active.');
        }
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const handleSeedCatalog = async () => {
    setIsSeeding(true);
    setSeedMessage(null);
    try {
      const res = await fetch('/api/admin/seed', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setSeedMessage(
          `Success: Created ${data.productsCreated} products, ${data.contentCreated?.length || 0} content documents.`
        );
        fetchDashboardData();
      } else {
        setSeedMessage(`Seed failed: ${data.error}`);
      }
    } catch {
      setSeedMessage('Failed to trigger database seed.');
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Business Overview</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Real-time operations, sales, and community members connected to Cloud Firestore.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchDashboardData}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Data</span>
          </button>

          <button
            onClick={handleSeedCatalog}
            disabled={isSeeding}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-[#2563EB] hover:bg-blue-700 rounded-lg transition-colors shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isSeeding ? 'Seeding...' : 'Seed Catalog'}</span>
          </button>
        </div>
      </div>

      {seedMessage && (
        <div className="p-3.5 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-800 flex items-center justify-between">
          <span>{seedMessage}</span>
          <button onClick={() => setSeedMessage(null)} className="underline ml-4">
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      {/* 7 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Revenue */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Total Revenue
            </span>
            <div className="w-9 h-9 rounded-lg bg-green-50 text-green-700 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          {isLoading ? (
            <div className="h-8 w-24 bg-gray-100 rounded animate-pulse" />
          ) : (
            <div>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
              <p className="text-xs text-gray-500 mt-1">From verified paid orders</p>
            </div>
          )}
        </div>

        {/* Total Orders */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Total Orders
            </span>
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5" />
            </div>
          </div>
          {isLoading ? (
            <div className="h-8 w-16 bg-gray-100 rounded animate-pulse" />
          ) : (
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
              <p className="text-xs text-gray-500 mt-1">Logged in orders collection</p>
            </div>
          )}
        </div>

        {/* Active Members */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Community Members
            </span>
            <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          {isLoading ? (
            <div className="h-8 w-16 bg-gray-100 rounded animate-pulse" />
          ) : (
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.activeMembers}</p>
              <p className="text-xs text-gray-500 mt-1">₹150/mo active subscribers</p>
            </div>
          )}
        </div>

        {/* Total Customers */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Registered Users
            </span>
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          {isLoading ? (
            <div className="h-8 w-16 bg-gray-100 rounded animate-pulse" />
          ) : (
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalCustomers}</p>
              <p className="text-xs text-gray-500 mt-1">In users collection</p>
            </div>
          )}
        </div>

        {/* Book Sales */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Book Sales (₹29)
            </span>
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          {isLoading ? (
            <div className="h-8 w-16 bg-gray-100 rounded animate-pulse" />
          ) : (
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.bookSales}</p>
              <p className="text-xs text-gray-500 mt-1">Playbook copies sold</p>
            </div>
          )}
        </div>

        {/* Template Sales */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Template Sales
            </span>
            <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
              <FileCheck className="w-5 h-5" />
            </div>
          </div>
          {isLoading ? (
            <div className="h-8 w-16 bg-gray-100 rounded animate-pulse" />
          ) : (
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.templateSales}</p>
              <p className="text-xs text-gray-500 mt-1">Cheat Sheets & Workflows</p>
            </div>
          )}
        </div>

        {/* Unread Messages */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs sm:col-span-2 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Unread Inquiries
            </span>
            <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
          </div>
          {isLoading ? (
            <div className="h-8 w-16 bg-gray-100 rounded animate-pulse" />
          ) : (
            <div className="flex items-baseline justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.unreadMessages}</p>
                <p className="text-xs text-gray-500 mt-1">Messages awaiting reply from /contact</p>
              </div>
              <Link
                href="/admin/messages"
                className="text-xs font-medium text-[#2563EB] hover:underline flex items-center gap-1"
              >
                <span>View Inbox</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Two Column Grid: Recent Orders & Recent Messages */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Recent Orders (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-gray-200 rounded-xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-5 pb-3 border-b border-gray-100">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Recent Orders</h2>
              <p className="text-xs text-gray-500">Live order activity from Firestore</p>
            </div>
            <Link
              href="/admin/orders"
              className="text-xs font-medium text-[#2563EB] hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-200">
              <ShoppingCart className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-700">No orders recorded yet</p>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                Orders will appear automatically when customers complete checkout via Stripe.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-xs text-gray-400 uppercase font-mono border-b border-gray-100">
                    <th className="pb-2">Customer</th>
                    <th className="pb-2">Product</th>
                    <th className="pb-2">Amount</th>
                    <th className="pb-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="py-3">
                        <p className="font-medium text-gray-900 text-xs">{order.customerName}</p>
                        <p className="text-[11px] text-gray-500 truncate max-w-[140px]">
                          {order.customerEmail}
                        </p>
                      </td>
                      <td className="py-3 text-xs text-gray-700">{order.productName}</td>
                      <td className="py-3 font-mono font-medium text-xs text-gray-900">
                        {formatCurrency(Number(order.amount) || 0)}
                      </td>
                      <td className="py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium font-mono uppercase ${
                            order.status === 'paid'
                              ? 'bg-green-50 text-green-700 border border-green-200'
                              : order.status === 'pending'
                              ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                              : 'bg-gray-50 text-gray-700'
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Messages (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-gray-200 rounded-xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-5 pb-3 border-b border-gray-100">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Recent Messages</h2>
              <p className="text-xs text-gray-500">Inbound inquiries from /contact</p>
            </div>
            <Link
              href="/admin/messages"
              className="text-xs font-medium text-[#2563EB] hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : recentMessages.length === 0 ? (
            <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-200">
              <MessageSquare className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-700">No contact messages yet</p>
              <p className="text-xs text-gray-500 mt-1">
                Submissions from the public contact page will arrive here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentMessages.map((msg) => (
                <div
                  key={msg.id}
                  className="p-3.5 rounded-lg border border-gray-100 hover:border-gray-200 bg-gray-50/50 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-semibold text-gray-900">{msg.name}</p>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-medium uppercase ${
                        msg.status === 'unread'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {msg.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                    {msg.message}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-2 font-mono">
                    {msg.createdAt ? new Date(msg.createdAt).toLocaleDateString() : 'Recent'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Customers Section */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Recent Customers</h2>
            <p className="text-xs text-gray-500">Recently registered accounts from Firestore users collection</p>
          </div>
          <Link
            href="/admin/customers"
            className="text-xs font-medium text-[#2563EB] hover:underline flex items-center gap-1"
          >
            <span>View All Customers</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : recentCustomers.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-200">
            <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-700">No customers registered yet</p>
            <p className="text-xs text-gray-500 mt-1">
              Registered customers and buyers will appear in this list.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentCustomers.map((cust) => (
              <div
                key={cust.uid}
                className="p-4 rounded-lg border border-gray-100 bg-gray-50/50 flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-full bg-[#EAF0EC] text-[#244634] font-semibold flex items-center justify-center shrink-0">
                  {cust.name ? cust.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">{cust.name || 'Unnamed'}</p>
                  <p className="text-xs text-gray-500 truncate">{cust.email}</p>
                  <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                    Joined: {cust.createdAt ? new Date(cust.createdAt).toLocaleDateString() : 'Recent'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
