'use client';

import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Search,
  RefreshCw,
  Mail,
  Check,
  CheckCheck,
  Trash2,
  Eye,
  X,
  ExternalLink,
  AlertCircle,
  Phone,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { ContactMessage, MessageStatus, EmailDeliveryStatus } from '@/types/message';
import { auth } from '@/lib/firebase/client';

export default function AdminMessagesClient() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [retryingEmailId, setRetryingEmailId] = useState<string | null>(null);

  const fetchMessages = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const url =
        statusFilter === 'all'
          ? '/api/admin/messages'
          : `/api/admin/messages?status=${encodeURIComponent(statusFilter)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) {
        setMessages(data.messages || []);
      } else {
        setError(data.error || 'Failed to fetch messages');
      }
    } catch {
      setError('Network error fetching messages');
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
            ? '/api/admin/messages'
            : `/api/admin/messages?status=${encodeURIComponent(statusFilter)}`;
        const res = await fetch(url);
        const data = await res.json();
        if (active) {
          if (res.ok) {
            setMessages(data.messages || []);
          } else {
            setError(data.error || 'Failed to fetch messages');
          }
        }
      } catch {
        if (active) setError('Network error fetching messages');
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [statusFilter]);

  const handleUpdateStatus = async (id: string, status: MessageStatus) => {
    try {
      const res = await fetch('/api/admin/messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        setMessages((prev) =>
          prev.map((m) => (m.id === id ? { ...m, status } : m))
        );
        if (selectedMessage && selectedMessage.id === id) {
          setSelectedMessage({ ...selectedMessage, status });
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this inquiry from Firestore?')) return;
    try {
      const res = await fetch(`/api/admin/messages?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== id));
        if (selectedMessage && selectedMessage.id === id) {
          setSelectedMessage(null);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRetryEmail = async (id: string) => {
    setRetryingEmailId(id);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (auth.currentUser) {
        try {
          const freshToken = await auth.currentUser.getIdToken(true);
          if (freshToken) headers['Authorization'] = `Bearer ${freshToken}`;
        } catch (tokenErr) {
          console.warn('[Admin Messages] Could not refresh ID token:', tokenErr);
        }
      }

      const res = await fetch('/api/admin/messages/retry', {
        method: 'POST',
        headers,
        body: JSON.stringify({ id }),
      });
      const data = await res.json().catch(() => ({}));

      // Update local state with latest delivery status returned by server (even on non-200)
      const newStatus = data.emailDeliveryStatus || data.status;
      if (newStatus) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === id
              ? {
                  ...m,
                  emailDeliveryStatus: newStatus,
                  emailDeliveryError: data.emailDeliveryError || data.error || null,
                  emailDeliveryId: data.emailDeliveryId || data.deliveryId || null,
                }
              : m
          )
        );
        if (selectedMessage && selectedMessage.id === id) {
          setSelectedMessage((prev) =>
            prev
              ? {
                  ...prev,
                  emailDeliveryStatus: newStatus,
                  emailDeliveryError: data.emailDeliveryError || data.error || null,
                  emailDeliveryId: data.emailDeliveryId || data.deliveryId || null,
                }
              : null
          );
        }
      }

      if (res.ok) {
        alert(data.message || 'Notification email successfully sent!');
      } else if (res.status === 401) {
        alert('Your administrator session has expired. Please refresh the page or log in again.');
      } else if (res.status === 403) {
        alert('Access denied. Your account does not have administrator privileges.');
      } else if (res.status === 503) {
        alert(data.message || 'Email provider is not configured. Please set RESEND_API_KEY in the server environment.');
      } else {
        alert(data.message || data.error || 'Failed to retry email delivery.');
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Network error while attempting to retry email delivery.');
    } finally {
      setRetryingEmailId(null);
    }
  };

  const filteredMessages = messages.filter((m) => {
    const q = searchQuery.toLowerCase();
    return (
      m.name?.toLowerCase().includes(q) ||
      m.email?.toLowerCase().includes(q) ||
      m.phone?.toLowerCase().includes(q) ||
      m.message?.toLowerCase().includes(q) ||
      m.topic?.toLowerCase().includes(q)
    );
  });

  const getStatusBadge = (status: MessageStatus) => {
    switch (status) {
      case 'unread':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span>Unread</span>
          </span>
        );
      case 'read':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
            <Check className="w-3 h-3" />
            <span>Read</span>
          </span>
        );
      case 'replied':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-[#138354] border border-emerald-200">
            <CheckCheck className="w-3 h-3 text-[#138354]" />
            <span>Replied</span>
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  const getEmailDeliveryBadge = (status?: EmailDeliveryStatus, error?: string | null) => {
    switch (status) {
      case 'sent':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-[#138354] border border-emerald-200" title="Delivered to cageethanofficial@gmail.com">
            <CheckCircle2 className="w-3 h-3 text-[#138354]" />
            <span>Delivered</span>
          </span>
        );
      case 'failed':
        return (
          <span
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200"
            title={error || 'Email notification delivery failed'}
          >
            <AlertCircle className="w-3 h-3 text-rose-500" />
            <span>Failed</span>
          </span>
        );
      case 'not_configured':
        return (
          <span
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200"
            title="Email provider not configured in server environment"
          >
            <Clock className="w-3 h-3 text-amber-600" />
            <span>Not Configured</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
            <span>Pending</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-serif text-[#0f2c59] tracking-tight">Client Inquiries & Messages</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Prospective bookkeeping and accounting client inquiries saved to Cloud Firestore and delivered to cageethanofficial@gmail.com.
          </p>
        </div>

        <button
          onClick={fetchMessages}
          disabled={isLoading}
          className="p-2 text-gray-600 hover:text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 shadow-xs cursor-pointer"
          title="Refresh Inquiries"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#138354]' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      {/* Search & Status Filters */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, phone, or keyword..."
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2c59]"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {(['all', 'unread', 'read', 'replied'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors cursor-pointer ${
                statusFilter === st
                  ? 'bg-[#0f2c59] text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Messages Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="text-center py-12 px-4">
            <MessageSquare className="w-10 h-10 text-gray-400 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-900">No inquiries found</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              When clients submit an inquiry via the website contact form, it appears here in real-time and notifies cageethanofficial@gmail.com.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm divide-y divide-gray-200">
              <thead className="bg-gray-50 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Client Contact</th>
                  <th className="px-6 py-3.5">Service / Topic</th>
                  <th className="px-6 py-3.5">Message Preview</th>
                  <th className="px-6 py-3.5">Email Delivery</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredMessages.map((msg) => (
                  <tr
                    key={msg.id}
                    className={`hover:bg-gray-50/80 transition-colors ${
                      msg.status === 'unread' ? 'bg-emerald-50/20 font-medium' : ''
                    }`}
                  >
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900 text-xs">{msg.name}</p>
                      <a href={`mailto:${msg.email}`} className="text-[11px] text-[#0f2c59] hover:underline block truncate max-w-[180px]">
                        {msg.email}
                      </a>
                      {msg.phone && (
                        <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-[#138354]" />
                          <a href={`tel:${msg.phone.replace(/\D/g, '')}`} className="hover:text-[#138354]">
                            {msg.phone}
                          </a>
                        </p>
                      )}
                    </td>

                    <td className="px-6 py-4 text-xs text-gray-700">
                      <span className="font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                        {msg.topic || 'Bookkeeping & Accounting'}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-xs text-gray-600 max-w-xs truncate">
                      {msg.message}
                    </td>

                    <td className="px-6 py-4">
                      {getEmailDeliveryBadge(msg.emailDeliveryStatus, msg.emailDeliveryError)}
                    </td>

                    <td className="px-6 py-4">{getStatusBadge(msg.status)}</td>

                    <td className="px-6 py-4 text-xs text-gray-500 font-mono whitespace-nowrap">
                      {msg.createdAt ? new Date(msg.createdAt).toLocaleDateString() : 'N/A'}
                    </td>

                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => {
                            setSelectedMessage(msg);
                            if (msg.status === 'unread') {
                              handleUpdateStatus(msg.id, 'read');
                            }
                          }}
                          className="p-1.5 text-gray-500 hover:text-[#0f2c59] hover:bg-slate-100 rounded-lg cursor-pointer"
                          title="View Inquiry Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(msg.id)}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Message View Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <div>
                <h3 className="text-base font-bold font-serif text-[#0f2c59]">{selectedMessage.name}</h3>
                <p className="text-xs text-gray-500">Inquiry ID: {selectedMessage.id}</p>
              </div>
              <button
                onClick={() => setSelectedMessage(null)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Contact Info Grid */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold block">Email</span>
                  <a
                    href={`mailto:${selectedMessage.email}`}
                    className="text-xs font-semibold text-[#0f2c59] hover:underline break-all"
                  >
                    {selectedMessage.email}
                  </a>
                </div>
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold block">Phone</span>
                  {selectedMessage.phone ? (
                    <a
                      href={`tel:${selectedMessage.phone.replace(/\D/g, '')}`}
                      className="text-xs font-semibold text-[#138354] hover:underline"
                    >
                      {selectedMessage.phone}
                    </a>
                  ) : (
                    <span className="text-slate-400">Not provided</span>
                  )}
                </div>
              </div>

              {/* Status Row */}
              <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[11px] text-slate-500 block">Topic / Service</span>
                  <span className="font-semibold text-slate-800 text-xs">{selectedMessage.topic || 'General'}</span>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(selectedMessage.status)}
                  {getEmailDeliveryBadge(selectedMessage.emailDeliveryStatus, selectedMessage.emailDeliveryError)}
                </div>
              </div>

              {/* Email Delivery Details Banner */}
              <div className={`p-3 rounded-xl border text-xs ${
                selectedMessage.emailDeliveryStatus === 'sent'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : selectedMessage.emailDeliveryStatus === 'failed'
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}>
                <div className="flex items-start gap-2">
                  {selectedMessage.emailDeliveryStatus === 'sent' ? (
                    <CheckCircle2 className="w-4 h-4 text-[#138354] shrink-0 mt-0.5" />
                  ) : selectedMessage.emailDeliveryStatus === 'failed' ? (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  ) : (
                    <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-bold block">
                      {selectedMessage.emailDeliveryStatus === 'sent'
                        ? 'Notification Email Delivered'
                        : selectedMessage.emailDeliveryStatus === 'failed'
                        ? 'Email Delivery Failed'
                        : 'Email Provider Not Configured'}
                    </span>
                    <p className="mt-0.5 text-[11px]">
                      Recipient: <strong>{selectedMessage.emailRecipient || 'cageethanofficial@gmail.com'}</strong>
                    </p>
                    {selectedMessage.emailDeliveryError && (
                      <p className="mt-1 text-[11px] text-rose-700 font-mono bg-white/70 p-1.5 rounded">
                        Error: {selectedMessage.emailDeliveryError}
                      </p>
                    )}

                    {selectedMessage.emailDeliveryStatus !== 'sent' && (
                      <div className="pt-2">
                        <button
                          type="button"
                          disabled={retryingEmailId === selectedMessage.id}
                          onClick={() => handleRetryEmail(selectedMessage.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#0f2c59] text-white hover:bg-[#138354] transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${retryingEmailId === selectedMessage.id ? 'animate-spin' : ''}`} />
                          <span>{retryingEmailId === selectedMessage.id ? 'Retrying Email...' : 'Retry Email Delivery'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Full Message */}
              <div>
                <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold block mb-1">
                  Client Message
                </span>
                <div className="p-4 bg-white rounded-xl border border-slate-300 text-sm text-slate-800 whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto">
                  {selectedMessage.message}
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span>Received: {selectedMessage.createdAt ? new Date(selectedMessage.createdAt).toLocaleString() : 'N/A'}</span>
                <span>Type: {selectedMessage.isPublic !== false ? 'Public Guest' : 'Registered User'}</span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="pt-2 flex flex-wrap items-center gap-2 border-t border-slate-200">
              <a
                href={`mailto:${selectedMessage.email}?subject=Re:%20Inquiry%20with%20Finance%20with%20Geetha%20[${encodeURIComponent(selectedMessage.topic || 'Bookkeeping')}]`}
                onClick={() => handleUpdateStatus(selectedMessage.id, 'replied')}
                className="inline-flex items-center gap-1.5 py-2 px-3.5 bg-[#0f2c59] hover:bg-[#138354] text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Reply via Email</span>
                <ExternalLink className="w-3 h-3 ml-1" />
              </a>

              {selectedMessage.phone && (
                <a
                  href={`tel:${selectedMessage.phone.replace(/\D/g, '')}`}
                  className="inline-flex items-center gap-1.5 py-2 px-3 bg-emerald-50 text-[#138354] border border-emerald-200 hover:bg-emerald-100 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call {selectedMessage.phone}</span>
                </a>
              )}

              <button
                onClick={() => handleUpdateStatus(selectedMessage.id, 'replied')}
                className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium cursor-pointer"
              >
                Mark as Replied
              </button>

              <button
                onClick={() => handleDelete(selectedMessage.id)}
                className="py-2 px-3 text-red-600 hover:bg-red-50 rounded-lg text-xs font-medium ml-auto cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
