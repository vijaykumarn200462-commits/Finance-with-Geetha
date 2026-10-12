'use client';

import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  ExternalLink,
  Plus,
  Edit,
  Check,
  AlertCircle,
  Eye,
  RefreshCw,
  Tag,
  BookOpen,
  FileSpreadsheet,
  Workflow,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { getAllProducts, updateProduct } from '@/lib/firebase/firestore';
import { Product } from '@/types/product';

export default function AdminStoreClient() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    setLoading(true);
    try {
      const prods = await getAllProducts();
      setProducts(prods);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error loading store items';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  }

  const handleToggleActive = async (prod: Product) => {
    setUpdatingId(prod.id);
    try {
      const nextActive = !prod.active;
      await updateProduct(prod.id, { active: nextActive });
      setProducts((prev) =>
        prev.map((p) => (p.id === prod.id ? { ...p, active: nextActive } : p))
      );
      try {
        await fetch('/api/admin/site-content/revalidate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ section: 'store' }),
        });
      } catch {
        // Non-blocking
      }
      setSuccessMessage(`Product "${prod.name}" is now ${nextActive ? 'visible' : 'hidden'} on /store`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update visibility';
      setErrorMessage(msg);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleToggleFeatured = async (prod: Product) => {
    setUpdatingId(prod.id);
    try {
      const nextFeatured = !prod.featured;
      await updateProduct(prod.id, { featured: nextFeatured });
      setProducts((prev) =>
        prev.map((p) => (p.id === prod.id ? { ...p, featured: nextFeatured } : p))
      );
      setSuccessMessage(`Featured status updated for "${prod.name}"`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update featured';
      setErrorMessage(msg);
    } finally {
      setUpdatingId(null);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'book':
        return <BookOpen className="w-4 h-4 text-emerald-700" />;
      case 'cheatsheet':
        return <FileSpreadsheet className="w-4 h-4 text-amber-700" />;
      case 'workflow':
        return <Workflow className="w-4 h-4 text-blue-700" />;
      default:
        return <Tag className="w-4 h-4 text-gray-700" />;
    }
  };

  const activeStoreCount = products.filter((p) => p.active).length;

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-[#244634] font-semibold">
            Digital Store Catalog
          </span>
          <h1 className="text-2xl font-editorial text-[#181918] mt-1">Store Front Management</h1>
          <p className="text-sm text-[#706E69]">
            Control digital products displayed on the public /store page, visibility toggles, and catalog rankings.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/store"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#244634] bg-[#EAF0EC] border border-[#C5D8CC] rounded-lg hover:bg-[#DCE7E0] transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            View Public Store
            <ExternalLink className="w-3 h-3 ml-0.5 opacity-60" />
          </Link>

          <Link
            href="/admin/products"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-[#244634] rounded-lg hover:bg-[#1B3527] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add New Product
          </Link>

          <button
            onClick={loadProducts}
            title="Reload from Firestore"
            className="p-2 text-[#706E69] hover:text-[#181918] bg-white border border-[#E2DBD0] rounded-lg hover:bg-[#F9F7F4] transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-[#E2DBD0] p-5 shadow-sm">
          <div className="flex items-center justify-between text-[#706E69] text-xs font-mono uppercase">
            <span>Total Catalog</span>
            <ShoppingBag className="w-4 h-4 text-[#244634]" />
          </div>
          <div className="font-editorial text-3xl text-[#181918] mt-2">{products.length}</div>
          <p className="text-xs text-[#706E69] mt-1">Stored digital items in Firestore</p>
        </div>

        <div className="bg-white rounded-xl border border-[#E2DBD0] p-5 shadow-sm">
          <div className="flex items-center justify-between text-[#706E69] text-xs font-mono uppercase">
            <span>Live on /store</span>
            <Eye className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="font-editorial text-3xl text-emerald-700 mt-2">{activeStoreCount}</div>
          <p className="text-xs text-[#706E69] mt-1">Products with active == true</p>
        </div>

        <div className="bg-white rounded-xl border border-[#E2DBD0] p-5 shadow-sm">
          <div className="flex items-center justify-between text-[#706E69] text-xs font-mono uppercase">
            <span>Featured Items</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <div className="font-editorial text-3xl text-[#181918] mt-2">
            {products.filter((p) => p.featured).length}
          </div>
          <p className="text-xs text-[#706E69] mt-1">Highlighted on homepage & store</p>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-[#EAF0EC] border border-[#244634]/30 text-[#244634] text-sm animate-fadeIn">
          <Check className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm animate-fadeIn">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Store Products Table */}
      <div className="bg-white rounded-xl border border-[#E2DBD0] shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#E2DBD0] bg-[#FAF8F5] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-[#244634]" />
            <h2 className="text-sm font-semibold text-[#181918]">Active Digital Store Offerings</h2>
          </div>
          <span className="text-xs text-[#706E69] font-mono">
            Directly synced to Cloud Firestore `products` collection
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-[#706E69]">
            <RefreshCw className="w-5 h-5 mx-auto mb-2 animate-spin text-[#244634]" />
            Loading store offerings from Firestore...
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center text-sm text-[#706E69]">
            <ShoppingBag className="w-8 h-8 mx-auto mb-3 text-[#B8B4AA]" />
            <p className="font-medium text-[#181918]">No products found in Firestore.</p>
            <p className="text-xs mt-1">Run the database seed script from the Dashboard to populate default products.</p>
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 bg-[#244634] text-white text-xs rounded-lg hover:bg-[#1B3527]"
            >
              Go to Dashboard Seed
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#FAF8F5] text-xs font-mono uppercase text-[#706E69] border-b border-[#E2DBD0]">
                <tr>
                  <th className="px-5 py-3.5">Product</th>
                  <th className="px-5 py-3.5">Type</th>
                  <th className="px-5 py-3.5">Price</th>
                  <th className="px-5 py-3.5 text-center">Live on /store</th>
                  <th className="px-5 py-3.5 text-center">Featured</th>
                  <th className="px-5 py-3.5 text-center">Sort Order</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2DBD0]">
                {products.map((prod) => (
                  <tr key={prod.id} className="hover:bg-[#FAF8F5]/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-medium text-[#181918]">{prod.name}</div>
                      <div className="text-xs text-[#706E69] font-mono mt-0.5 truncate max-w-xs">
                        ID: {prod.id}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#F4EFE6] text-[#484A46] border border-[#E2DBD0]">
                        {getTypeIcon(prod.type)}
                        {prod.type}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="font-mono font-semibold text-[#181918]">
                        ${prod.price} <span className="text-xs text-[#706E69] font-normal">{prod.currency || 'USD'}</span>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-center">
                      <button
                        onClick={() => handleToggleActive(prod)}
                        disabled={updatingId === prod.id}
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors ${prod.active
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200'
                          }`}
                      >
                        {prod.active ? '● Public' : '○ Hidden'}
                      </button>
                    </td>

                    <td className="px-5 py-4 text-center">
                      <button
                        onClick={() => handleToggleFeatured(prod)}
                        disabled={updatingId === prod.id}
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${prod.featured
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'text-gray-400 hover:text-gray-600'
                          }`}
                      >
                        {prod.featured ? '★ Featured' : '☆ Standard'}
                      </button>
                    </td>

                    <td className="px-5 py-4 text-center font-mono text-xs text-[#706E69]">
                      #{prod.sortOrder || 1}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/admin/products`}
                        className="inline-flex items-center gap-1 text-xs font-medium text-[#244634] hover:text-[#181918] px-2.5 py-1.5 rounded-lg border border-[#C5D8CC] hover:bg-[#EAF0EC] transition-colors"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        Edit Details
                      </Link>
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
