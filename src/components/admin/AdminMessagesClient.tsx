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
} from 'lucide-react';
import { ContactMessage, MessageStatus } from '@/types/message';

export default function AdminMessagesClient() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);

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
    if (!confirm('Are you sure you want to delete this message from Firestore?')) return;
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

  const filteredMessages = messages.filter((m) => {
    const q = searchQuery.toLowerCase();
    return (
      m.name?.toLowerCase().includes(q) ||
      m.email?.toLowerCase().includes(q) ||
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
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
            <CheckCheck className="w-3 h-3" />
            <span>Replied</span>
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Inbound Inquiries</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Real prospective client messages saved to Cloud Firestore from the public contact form.
          </p>
        </div>

        <button
          onClick={fetchMessages}
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

      {/* Search & Status Filters */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, topic, or message keyword..."
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {(['all', 'unread', 'read', 'replied'] as const).map((st) => (
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
            <h3 className="text-base font-semibold text-gray-900">No messages found</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              When visitors fill out the public contact form on /contact, their inquiry appears here in real-time.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm divide-y divide-gray-200">
              <thead className="bg-gray-50 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Sender</th>
                  <th className="px-6 py-3.5">Topic</th>
                  <th className="px-6 py-3.5">Message Preview</th>
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
                      msg.status === 'unread' ? 'bg-rose-50/20 font-medium' : ''
                    }`}
                  >
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900 text-xs">{msg.name}</p>
                      <p className="text-[11px] text-gray-500">{msg.email}</p>
                    </td>

                    <td className="px-6 py-4 text-xs text-gray-700">
                      <span className="font-mono text-[11px] bg-gray-100 px-2 py-0.5 rounded text-gray-700">
                        {msg.topic || 'General'}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-xs text-gray-600 max-w-xs truncate">
                      {msg.message}
                    </td>

                    <td className="px-6 py-4">{getStatusBadge(msg.status)}</td>

                    <td className="px-6 py-4 text-xs text-gray-500 font-mono">
                      {msg.createdAt ? new Date(msg.createdAt).toLocaleDateString() : 'N/A'}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => {
                            setSelectedMessage(msg);
                            if (msg.status === 'unread') {
                              handleUpdateStatus(msg.id, 'read');
                            }
                          }}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="View Message"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(msg.id)}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <div>
                <h3 className="text-base font-bold text-gray-900">{selectedMessage.name}</h3>
                <p className="text-xs text-gray-500">{selectedMessage.email}</p>
              </div>
              <button
                onClick={() => setSelectedMessage(null)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono text-gray-500">
                  Topic: <strong className="text-gray-900">{selectedMessage.topic || 'General'}</strong>
                </span>
                <div>{getStatusBadge(selectedMessage.status)}</div>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-sm text-gray-800 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                {selectedMessage.message}
              </div>

              <p className="text-[11px] text-gray-400 font-mono">
                Received:{' '}
                {selectedMessage.createdAt
                  ? new Date(selectedMessage.createdAt).toLocaleString()
                  : 'N/A'}
              </p>

              {selectedMessage.userId && (
                <p className="text-[11px] text-gray-500 font-mono">
                  Sender UID:{' '}
                  <span className="text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                    {selectedMessage.userId}
                  </span>
                </p>
              )}
            </div>

            {/* Quick Actions */}
            <div className="pt-2 flex flex-wrap items-center gap-2">
              <a
                href={`mailto:${selectedMessage.email}?subject=Re: Inquiry with Finance with Geetha [${selectedMessage.topic || 'General'}]`}
                onClick={() => handleUpdateStatus(selectedMessage.id, 'replied')}
                className="inline-flex items-center gap-1.5 py-2 px-3 bg-[#2563EB] hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Reply via Email</span>
                <ExternalLink className="w-3 h-3 ml-1" />
              </a>

              <button
                onClick={() => handleUpdateStatus(selectedMessage.id, 'replied')}
                className="py-2 px-3 bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 rounded-lg text-xs font-medium"
              >
                Mark as Replied
              </button>

              <button
                onClick={() => handleUpdateStatus(selectedMessage.id, 'read')}
                className="py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium"
              >
                Mark as Read
              </button>

              <button
                onClick={() => handleDelete(selectedMessage.id)}
                className="py-2 px-3 text-red-600 hover:bg-red-50 rounded-lg text-xs font-medium ml-auto"
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
