'use client';

import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  Search,
  RefreshCw,
  AlertCircle,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  X,
  CreditCard,
} from 'lucide-react';
import { Order, OrderStatus } from '@/types/order';

export default function AdminOrdersClient() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const fetchOrders = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const url =
        statusFilter === 'all'
          ? '/api/admin/orders'
          : `/api/admin/orders?status=${encodeURIComponent(statusFilter)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) {
        setOrders(data.orders || []);
      } else {
        setError(data.error || 'Failed to fetch orders');
      }
    } catch {
      setError('Network error fetching orders');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const url =
          statusFilter === 'all'
            ? '/api/admin/orders'
            : `/api/admin/orders?status=${encodeURIComponent(statusFilter)}`;
        const res = await fetch(url);
        const data = await res.json();
        if (active) {
          if (res.ok) {
            setOrders(data.orders || []);
          } else {
            setError(data.error || 'Failed to fetch orders');
          }
        }
      } catch {
        if (active) setError('Network error fetching orders');
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [statusFilter]);

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    setIsUpdatingStatus(true);
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, status: newStatus }),
      });
      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
        );
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder({ ...selectedOrder, status: newStatus });
        }
      } else {
        alert('Failed to update order status');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const q = searchQuery.toLowerCase();
    return (
      o.id.toLowerCase().includes(q) ||
      o.customerName?.toLowerCase().includes(q) ||
      o.customerEmail?.toLowerCase().includes(q) ||
      o.productName?.toLowerCase().includes(q)
    );
  });

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
            <CheckCircle2 className="w-3 h-3" />
            <span>Paid</span>
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200">
            <Clock className="w-3 h-3" />
            <span>Pending</span>
          </span>
        );
      case 'refunded':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
            <RotateCcw className="w-3 h-3" />
            <span>Refunded</span>
          </span>
        );
      case 'failed':
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
            <XCircle className="w-3 h-3" />
            <span>{status}</span>
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
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Orders Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Real customer transactions recorded from Stripe checkout webhooks into Cloud Firestore.
          </p>
        </div>

        <button
          onClick={fetchOrders}
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

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by order ID, email, or customer name..."
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {(['all', 'paid', 'pending', 'failed', 'refunded'] as const).map((st) => (
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

      {/* Orders Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12 px-4">
            <ShoppingCart className="w-10 h-10 text-gray-400 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-900">No orders found</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              When visitors complete a checkout session via Stripe, their order data is automatically logged here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm divide-y divide-gray-200">
              <thead className="bg-gray-50 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Order ID</th>
                  <th className="px-6 py-3.5">Customer</th>
                  <th className="px-6 py-3.5">Product</th>
                  <th className="px-6 py-3.5">Amount</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-6 py-3.5 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-gray-900 truncate max-w-[120px]">
                      {order.id}
                    </td>

                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900 text-xs">{order.customerName}</p>
                      <p className="text-[11px] text-gray-500 truncate max-w-[150px]">
                        {order.customerEmail}
                      </p>
                    </td>

                    <td className="px-6 py-4 text-xs text-gray-700">
                      {order.productName || order.productId}
                    </td>

                    <td className="px-6 py-4 font-mono font-medium text-xs text-gray-900">
                      ₹{order.amount} {order.currency || 'INR'}
                    </td>

                    <td className="px-6 py-4">{getStatusBadge(order.status)}</td>

                    <td className="px-6 py-4 text-xs text-gray-500 font-mono">
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="View Order"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-gray-900">Order Information</h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <span className="text-gray-500">Order ID</span>
                <span className="font-mono text-gray-900 select-all">{selectedOrder.id}</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <span className="text-gray-500">Customer Name</span>
                <span className="font-medium text-gray-900">{selectedOrder.customerName}</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <span className="text-gray-500">Customer Email</span>
                <span className="text-gray-900">{selectedOrder.customerEmail}</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <span className="text-gray-500">Purchased Product</span>
                <span className="font-medium text-gray-900">{selectedOrder.productName}</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <span className="text-gray-500">Amount Paid</span>
                <span className="font-mono text-base font-bold text-gray-900">
                  ₹{selectedOrder.amount} {selectedOrder.currency || 'INR'}
                </span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <span className="text-gray-500">Payment Provider</span>
                <span className="uppercase font-mono text-gray-700">{selectedOrder.paymentProvider}</span>
              </div>

              {selectedOrder.paymentId && (
                <div className="flex justify-between py-1.5 border-b border-gray-100">
                  <span className="text-gray-500">Stripe Payment / Intent ID</span>
                  <span className="font-mono text-gray-700 truncate max-w-[200px]">
                    {selectedOrder.paymentId}
                  </span>
                </div>
              )}

              <div className="flex justify-between py-1.5 border-b border-gray-100 items-center">
                <span className="text-gray-500">Current Status</span>
                <div>{getStatusBadge(selectedOrder.status)}</div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="pt-2">
              <p className="text-[11px] font-semibold text-gray-700 uppercase tracking-wider mb-2">
                Change Status in Firestore:
              </p>
              <div className="flex items-center gap-2">
                <button
                  disabled={isUpdatingStatus || selectedOrder.status === 'paid'}
                  onClick={() => handleUpdateStatus(selectedOrder.id, 'paid')}
                  className="flex-1 py-1.5 px-3 bg-green-50 text-green-700 border border-green-200 rounded-lg text-xs font-medium hover:bg-green-100 disabled:opacity-40"
                >
                  Mark Paid
                </button>
                <button
                  disabled={isUpdatingStatus || selectedOrder.status === 'refunded'}
                  onClick={() => handleUpdateStatus(selectedOrder.id, 'refunded')}
                  className="flex-1 py-1.5 px-3 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg text-xs font-medium hover:bg-purple-100 disabled:opacity-40"
                >
                  Mark Refunded
                </button>
                <button
                  disabled={isUpdatingStatus || selectedOrder.status === 'cancelled'}
                  onClick={() => handleUpdateStatus(selectedOrder.id, 'cancelled')}
                  className="flex-1 py-1.5 px-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs font-medium hover:bg-red-100 disabled:opacity-40"
                >
                  Cancel
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
