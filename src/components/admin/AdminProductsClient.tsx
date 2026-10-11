'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Package,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Upload,
  RefreshCw,
  Search,
  Loader2,
  AlertCircle,
  FileText,
  ImageIcon,
} from 'lucide-react';
import { Product, ProductType } from '@/types/product';
import { uploadFileWithProgress } from '@/lib/firebase/storage';

export default function AdminProductsClient() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('29');
  const [currency, setCurrency] = useState('INR');
  const [type, setType] = useState<ProductType>('book');
  const [imageUrl, setImageUrl] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [active, setActive] = useState(true);
  const [featured, setFeatured] = useState(false);
  const [sortOrder, setSortOrder] = useState('1');

  // File Upload states
  const [imageProgress, setImageProgress] = useState<number | null>(null);
  const [fileProgress, setFileProgress] = useState<number | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchProducts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/products');
      const data = await res.json();
      if (res.ok) {
        setProducts(data.products || []);
      } else {
        setError(data.error || 'Failed to fetch products');
      }
    } catch {
      setError('Network error fetching products');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch('/api/admin/products');
        const data = await res.json();
        if (active) {
          if (res.ok) {
            setProducts(data.products || []);
          } else {
            setError(data.error || 'Failed to fetch products');
          }
        }
      } catch {
        if (active) setError('Network error fetching products');
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const openAddModal = () => {
    setEditingProduct(null);
    setName('');
    setSlug('');
    setShortDescription('');
    setDescription('');
    setPrice('29');
    setCurrency('INR');
    setType('book');
    setImageUrl('');
    setFileUrl('');
    setActive(true);
    setFeatured(false);
    setSortOrder(String(products.length + 1));
    setFormError(null);
    setFormSuccess(null);
    setImageProgress(null);
    setFileProgress(null);
    setIsModalOpen(true);
  };

  const openEditModal = (prod: Product) => {
    setEditingProduct(prod);
    setName(prod.name);
    setSlug(prod.slug || prod.id);
    setShortDescription(prod.shortDescription || '');
    setDescription(prod.description || '');
    setPrice(String(prod.price));
    setCurrency(prod.currency || 'INR');
    setType(prod.type || 'other');
    setImageUrl(prod.imageUrl || '');
    setFileUrl(prod.fileUrl || '');
    setActive(prod.active ?? true);
    setFeatured(prod.featured ?? false);
    setSortOrder(String(prod.sortOrder || 0));
    setFormError(null);
    setFormSuccess(null);
    setImageProgress(null);
    setFileProgress(null);
    setIsModalOpen(true);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!editingProduct) {
      // Auto-generate slug
      const generated = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setSlug(generated);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const safeSlug = slug || 'temp-product';
    const storagePath = `products/${safeSlug}/image_${Date.now()}_${file.name}`;

    try {
      setImageProgress(0);
      const downloadUrl = await uploadFileWithProgress(storagePath, file, (pct) => {
        setImageProgress(pct);
      });
      setImageUrl(downloadUrl);
      setImageProgress(100);
    } catch (err: unknown) {
      console.error('Image upload failed:', err);
      setFormError('Failed to upload image to Firebase Storage.');
      setImageProgress(null);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const safeSlug = slug || 'temp-product';
    const folder = type === 'book' ? 'books' : 'templates';
    const storagePath = `${folder}/${safeSlug}/${Date.now()}_${file.name}`;

    try {
      setFileProgress(0);
      const downloadUrl = await uploadFileWithProgress(storagePath, file, (pct) => {
        setFileProgress(pct);
      });
      setFileUrl(downloadUrl);
      setFileProgress(100);
    } catch (err: unknown) {
      console.error('Digital file upload failed:', err);
      setFormError('Failed to upload digital product file to Firebase Storage.');
      setFileProgress(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!name.trim()) {
      setFormError('Product name is required');
      return;
    }

    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice < 0) {
      setFormError('Valid price is required');
      return;
    }

    setIsSaving(true);

    try {
      const payload = {
        id: editingProduct ? editingProduct.id : slug,
        name: name.trim(),
        slug: slug.trim(),
        shortDescription: shortDescription.trim(),
        description: description.trim(),
        price: numPrice,
        currency,
        type,
        imageUrl,
        fileUrl,
        active,
        featured,
        sortOrder: parseInt(sortOrder) || 0,
      };

      const method = editingProduct ? 'PUT' : 'POST';
      const res = await fetch('/api/admin/products', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save product');
      }

      setFormSuccess(editingProduct ? 'Product updated successfully.' : 'Product added successfully.');
      setTimeout(() => {
        setIsModalOpen(false);
        fetchProducts();
      }, 600);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error saving product';
      setFormError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (prod: Product) => {
    try {
      const updatedActive = !prod.active;
      await fetch('/api/admin/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: prod.id, active: updatedActive }),
      });
      setProducts((prev) =>
        prev.map((p) => (p.id === prod.id ? { ...p, active: updatedActive } : p))
      );
    } catch (err) {
      console.error('Failed to toggle product status:', err);
    }
  };

  const handleDelete = async (prod: Product) => {
    if (!confirm(`Are you sure you want to delete "${prod.name}" from Firestore?`)) return;

    try {
      const res = await fetch(`/api/admin/products?id=${encodeURIComponent(prod.id)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== prod.id));
      } else {
        alert('Failed to delete product from database.');
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.slug?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Product Catalog</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage books, cheat sheets, workflows, and coaching memberships in Cloud Firestore.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchProducts}
            disabled={isLoading}
            className="p-2 text-gray-600 hover:text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 shadow-xs"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-white bg-[#2563EB] hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
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
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, slug, or type..."
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
          />
        </div>
        <p className="text-xs text-gray-500 font-mono">
          Showing {filteredProducts.length} of {products.length} items
        </p>
      </div>

      {/* Products Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12 px-4">
            <Package className="w-10 h-10 text-gray-400 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-900">No products found</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto mb-4">
              Add your first coaching product or click &quot;Seed Catalog&quot; on the dashboard to populate defaults.
            </p>
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#2563EB] rounded-lg"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Product</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm divide-y divide-gray-200">
              <thead className="bg-gray-50 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Product</th>
                  <th className="px-6 py-3.5">Type</th>
                  <th className="px-6 py-3.5">Price</th>
                  <th className="px-6 py-3.5">Order</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredProducts.map((prod) => (
                  <tr key={prod.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {prod.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={prod.imageUrl}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover border border-gray-200"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400">
                            <Package className="w-5 h-5" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{prod.name}</p>
                          <p className="text-xs text-gray-500 font-mono">/{prod.slug || prod.id}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium font-mono uppercase bg-gray-100 text-gray-800">
                        {prod.type}
                      </span>
                    </td>

                    <td className="px-6 py-4 font-mono font-medium text-gray-900">
                      ₹{prod.price} {prod.currency || 'INR'}
                    </td>

                    <td className="px-6 py-4 font-mono text-xs text-gray-500">
                      {prod.sortOrder || 0}
                    </td>

                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleActive(prod)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                          prod.active
                            ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            prod.active ? 'bg-green-600' : 'bg-gray-400'
                          }`}
                        />
                        <span>{prod.active ? 'Active' : 'Disabled'}</span>
                      </button>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => openEditModal(prod)}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(prod)}
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

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-gray-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-gray-200 mb-5">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h3>
                <p className="text-xs text-gray-500">
                  Writes directly to Cloud Firestore & Firebase Storage
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-xs text-green-700 flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. Start a Bookkeeping Business"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    URL Slug *
                  </label>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="start-a-bookkeeping-business"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Price (₹ INR) *
                  </label>
                  <input
                    type="number"
                    step="1"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="29"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Product Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as ProductType)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
                  >
                    <option value="book">Book (eBook / Playbook)</option>
                    <option value="cheatsheet">Cheat Sheet (PDF Bundle)</option>
                    <option value="workflow">Workflow (Notion / Sheets)</option>
                    <option value="other">Other / Community Membership</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Short Description
                </label>
                <input
                  type="text"
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  placeholder="One sentence value proposition..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Full Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detailed breakdown of what is included in this coaching product..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
                />
              </div>

              {/* Firebase Storage Image Upload */}
              <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                    <span>Product Image (Firebase Storage)</span>
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    ref={imageInputRef}
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-100"
                  >
                    <Upload className="w-3 h-3" />
                    <span>Upload Image</span>
                  </button>
                </div>
                {imageProgress !== null && (
                  <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-blue-600 h-1.5 transition-all duration-200"
                      style={{ width: `${imageProgress}%` }}
                    />
                  </div>
                )}
                {imageUrl && (
                  <p className="text-[11px] font-mono text-gray-500 truncate">{imageUrl}</p>
                )}
              </div>

              {/* Firebase Storage Downloadable File Upload */}
              <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-purple-600" />
                    <span>Downloadable File (PDF / EPUB / ZIP)</span>
                  </span>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-100"
                  >
                    <Upload className="w-3 h-3" />
                    <span>Upload Digital Asset</span>
                  </button>
                </div>
                {fileProgress !== null && (
                  <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-purple-600 h-1.5 transition-all duration-200"
                      style={{ width: `${fileProgress}%` }}
                    />
                  </div>
                )}
                {fileUrl && (
                  <p className="text-[11px] font-mono text-gray-500 truncate">{fileUrl}</p>
                )}
              </div>

              {/* Checkboxes */}
              <div className="flex items-center gap-6 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-gray-700">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>Active (Visible publicly on /store)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-gray-700">
                  <input
                    type="checkbox"
                    checked={featured}
                    onChange={(e) => setFeatured(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>Featured on Homepage</span>
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-gray-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 px-5 py-2 text-xs font-medium text-white bg-[#2563EB] hover:bg-blue-700 rounded-lg disabled:opacity-50"
                >
                  {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isSaving ? 'Saving to Firestore...' : 'Save Product'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
