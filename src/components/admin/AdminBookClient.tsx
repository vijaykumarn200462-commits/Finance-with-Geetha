'use client';

import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Save,
  Upload,
  Check,
  AlertCircle,
  Eye,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { getSiteContentDoc, getProductById, updateProduct } from '@/lib/firebase/firestore';
import { uploadFileWithProgress } from '@/lib/firebase/storage';
import { BookContent } from '@/types/site-content';
import { auth } from '@/lib/firebase/client';
import Link from 'next/link';

const DEFAULT_BOOK_CONTENT: BookContent = {
  eyebrow: 'The Practical Guidebook',
  title: 'Start a Bookkeeping Business',
  subtitle: 'How to build one that pays you well — and leaves you alone.',
  description:
    'The entire playbook in one book. How Geetha went from zero clients to a calm, profitable firm — pricing, first clients, the monthly work, hiring, and getting your time back. Real numbers. Real mistakes. Real lessons. Read it in an afternoon, use it for years.',
  price: 29,
  format: 'PDF + EPUB (Instant Download)',
  compatibility: 'Kindle, Apple Books, Kobo, Any PDF Reader',
  excerptTitle: 'Chapter 1: The 15-Minute Diagnostic Call',
  excerptText:
    'Most bookkeepers make their first mistake on the discovery call: they spend forty minutes pitching services and trying to sound qualified. In Finance with Geetha, our discovery calls never exceed fifteen minutes. Here are the six questions that tell you everything...',
  coverImageUrl: '',
  pdfUrl: '',
  epubUrl: '',
  samplePdfUrl: '',
};

export default function AdminBookClient() {
  const [formData, setFormData] = useState<BookContent>(DEFAULT_BOOK_CONTENT);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Upload states
  const [uploadingCover, setUploadingCover] = useState(false);
  const [coverProgress, setCoverProgress] = useState(0);

  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [pdfProgress, setPdfProgress] = useState(0);

  const [uploadingEpub, setUploadingEpub] = useState(false);
  const [epubProgress, setEpubProgress] = useState(0);

  const [uploadingSample, setUploadingSample] = useState(false);
  const [sampleProgress, setSampleProgress] = useState(0);

  useEffect(() => {
    loadBookData();
  }, []);

  async function loadBookData() {
    setLoading(true);
    try {
      const [bookDoc, bookProduct] = await Promise.all([
        getSiteContentDoc<BookContent>('book'),
        getProductById('book'),
      ]);

      if (bookDoc) {
        setFormData((prev) => ({ ...prev, ...bookDoc }));
      }
      if (bookProduct) {
        setIsActive(bookProduct.active);
        if (!bookDoc) {
          setFormData((prev) => ({
            ...prev,
            title: bookProduct.name || prev.title,
            description: bookProduct.description || prev.description,
            price: bookProduct.price || prev.price,
            coverImageUrl: bookProduct.imageUrl || prev.coverImageUrl,
            pdfUrl: bookProduct.fileUrl || prev.pdfUrl,
          }));
        }
      }
    } catch (err) {
      console.error('Error loading book data:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleFileUpload = async (
    file: File,
    folder: string,
    field: keyof BookContent,
    setProgress: (p: number) => void,
    setUploading: (u: boolean) => void
  ) => {
    setUploading(true);
    setProgress(0);
    try {
      const path = `books/${folder}_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const downloadUrl = await uploadFileWithProgress(path, file, setProgress);
      setFormData((prev) => ({ ...prev, [field]: downloadUrl }));
      setSuccessMessage(`${folder.toUpperCase()} uploaded successfully!`);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      setErrorMessage(`Upload error: ${msg}`);
      setTimeout(() => setErrorMessage(null), 5000);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        throw new Error('Authentication required. Please sign in as an administrator.');
      }

      // 1. Synchronize the active state to site_content/book.enabled
      const bookDataToSave = {
        ...formData,
        enabled: isActive,
      };

      // 2. Persist to site_content via authenticated server API (which triggers revalidation)
      const res = await fetch('/api/admin/site-content', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ section: 'book', data: bookDataToSave }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Save failed with status ${res.status}`);
      }

      setFormData(bookDataToSave);

      // 3. Sync to products/book
      try {
        await updateProduct('book', {
          name: formData.title,
          shortDescription: formData.subtitle,
          description: formData.description,
          price: Number(formData.price),
          active: isActive,
          imageUrl: formData.coverImageUrl,
          fileUrl: formData.pdfUrl,
        });
      } catch (prodErr) {
        console.warn('Could not update products/book (might not exist yet):', prodErr);
      }

      setSuccessMessage('Book details saved successfully to Firestore and live site updated!');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save book changes';
      setErrorMessage(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-[#EAE5DC] rounded w-64 animate-pulse" />
        <div className="bg-white rounded-xl border border-[#E2DBD0] p-8 space-y-4">
          <div className="h-6 bg-[#EAE5DC] rounded w-1/3 animate-pulse" />
          <div className="h-10 bg-[#EAE5DC] rounded animate-pulse" />
          <div className="h-24 bg-[#EAE5DC] rounded animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-[#244634] font-semibold">
            Product & Content Administration
          </span>
          <h1 className="text-2xl font-editorial text-[#181918] mt-1">Book Management</h1>
          <p className="text-sm text-[#706E69]">
            Configure book publication metadata, price, digital downloads (PDF/EPUB), and cover artwork.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/book"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#244634] bg-[#EAF0EC] border border-[#C5D8CC] rounded-lg hover:bg-[#DCE7E0] transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            View Public Page
            <ExternalLink className="w-3 h-3 ml-0.5 opacity-60" />
          </Link>

          <button
            onClick={loadBookData}
            title="Reload from Firestore"
            className="p-2 text-[#706E69] hover:text-[#181918] bg-white border border-[#E2DBD0] rounded-lg hover:bg-[#F9F7F4] transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
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

      <form onSubmit={handleSave} className="space-y-6">
        {/* Core Book Information */}
        <div className="bg-white rounded-xl border border-[#E2DBD0] shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#E2DBD0]">
            <div className="flex items-center gap-2.5">
              <BookOpen className="w-5 h-5 text-[#244634]" />
              <h2 className="text-base font-semibold text-[#181918]">Book Details & Copy</h2>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-mono uppercase text-[#706E69] cursor-pointer">
                Publicly Active:
              </label>
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded text-[#244634] focus:ring-[#244634]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#706E69] mb-1.5">
                Eyebrow Badge
              </label>
              <input
                type="text"
                value={formData.eyebrow}
                onChange={(e) => setFormData({ ...formData, eyebrow: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-[#E2DBD0] rounded-lg focus:outline-none focus:border-[#244634]"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#706E69] mb-1.5">
                Price (₹ INR)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-sm text-[#706E69]">₹</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                  className="w-full pl-7 pr-3 py-2 text-sm border border-[#E2DBD0] rounded-lg focus:outline-none focus:border-[#244634]"
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[#706E69] mb-1.5">
              Book Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3.5 py-2 text-sm border border-[#E2DBD0] rounded-lg focus:outline-none focus:border-[#244634]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[#706E69] mb-1.5">
              Subtitle
            </label>
            <input
              type="text"
              value={formData.subtitle}
              onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
              className="w-full px-3.5 py-2 text-sm border border-[#E2DBD0] rounded-lg focus:outline-none focus:border-[#244634]"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[#706E69] mb-1.5">
              Full Description
            </label>
            <textarea
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3.5 py-2 text-sm border border-[#E2DBD0] rounded-lg focus:outline-none focus:border-[#244634]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#706E69] mb-1.5">
                Format Specs
              </label>
              <input
                type="text"
                value={formData.format}
                onChange={(e) => setFormData({ ...formData, format: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-[#E2DBD0] rounded-lg focus:outline-none focus:border-[#244634]"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#706E69] mb-1.5">
                Device Compatibility
              </label>
              <input
                type="text"
                value={formData.compatibility}
                onChange={(e) => setFormData({ ...formData, compatibility: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-[#E2DBD0] rounded-lg focus:outline-none focus:border-[#244634]"
              />
            </div>
          </div>
        </div>

        {/* Digital Files & Storage Uploads */}
        <div className="bg-white rounded-xl border border-[#E2DBD0] shadow-sm p-6 sm:p-8 space-y-6">
          <div className="pb-4 border-b border-[#E2DBD0]">
            <h2 className="text-base font-semibold text-[#181918]">Digital Assets & Firebase Storage</h2>
            <p className="text-xs text-[#706E69] mt-0.5">
              Upload files to Firebase Storage bucket or paste existing URLs.
            </p>
          </div>

          {/* 1. Cover Image */}
          <div className="p-4 rounded-lg bg-[#FAF8F5] border border-[#E2DBD0] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-[#181918] block">Cover Artwork (Image)</span>
                <span className="text-xs text-[#706E69]">Path: books/cover_* (JPG, PNG, WebP)</span>
              </div>
              <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#244634] bg-white border border-[#C5D8CC] rounded-lg hover:bg-[#EAF0EC] transition-colors">
                <Upload className="w-3.5 h-3.5" />
                {uploadingCover ? `Uploading (${coverProgress}%)` : 'Upload Artwork'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploadingCover}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileUpload(f, 'cover', 'coverImageUrl', setCoverProgress, setUploadingCover);
                  }}
                />
              </label>
            </div>

            {uploadingCover && (
              <div className="w-full bg-[#E2DBD0] rounded-full h-1.5 overflow-hidden">
                <div className="bg-[#244634] h-1.5 transition-all" style={{ width: `${coverProgress}%` }} />
              </div>
            )}

            <input
              type="text"
              placeholder="https://..."
              value={formData.coverImageUrl || ''}
              onChange={(e) => setFormData({ ...formData, coverImageUrl: e.target.value })}
              className="w-full px-3 py-1.5 text-xs font-mono border border-[#E2DBD0] rounded-lg bg-white"
            />
          </div>

          {/* 2. PDF Full Book */}
          <div className="p-4 rounded-lg bg-[#FAF8F5] border border-[#E2DBD0] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-[#181918] block">Full Book PDF (For Buyers)</span>
                <span className="text-xs text-[#706E69]">Path: books/pdf_*</span>
              </div>
              <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#244634] bg-white border border-[#C5D8CC] rounded-lg hover:bg-[#EAF0EC] transition-colors">
                <Upload className="w-3.5 h-3.5" />
                {uploadingPdf ? `Uploading (${pdfProgress}%)` : 'Upload PDF'}
                <input
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  disabled={uploadingPdf}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileUpload(f, 'pdf', 'pdfUrl', setPdfProgress, setUploadingPdf);
                  }}
                />
              </label>
            </div>

            {uploadingPdf && (
              <div className="w-full bg-[#E2DBD0] rounded-full h-1.5 overflow-hidden">
                <div className="bg-[#244634] h-1.5 transition-all" style={{ width: `${pdfProgress}%` }} />
              </div>
            )}

            <input
              type="text"
              placeholder="https://..."
              value={formData.pdfUrl || ''}
              onChange={(e) => setFormData({ ...formData, pdfUrl: e.target.value })}
              className="w-full px-3 py-1.5 text-xs font-mono border border-[#E2DBD0] rounded-lg bg-white"
            />
          </div>

          {/* 3. EPUB Full Book */}
          <div className="p-4 rounded-lg bg-[#FAF8F5] border border-[#E2DBD0] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-[#181918] block">EPUB Edition</span>
                <span className="text-xs text-[#706E69]">Path: books/epub_*</span>
              </div>
              <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#244634] bg-white border border-[#C5D8CC] rounded-lg hover:bg-[#EAF0EC] transition-colors">
                <Upload className="w-3.5 h-3.5" />
                {uploadingEpub ? `Uploading (${epubProgress}%)` : 'Upload EPUB'}
                <input
                  type="file"
                  accept=".epub"
                  className="hidden"
                  disabled={uploadingEpub}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileUpload(f, 'epub', 'epubUrl', setEpubProgress, setUploadingEpub);
                  }}
                />
              </label>
            </div>

            {uploadingEpub && (
              <div className="w-full bg-[#E2DBD0] rounded-full h-1.5 overflow-hidden">
                <div className="bg-[#244634] h-1.5 transition-all" style={{ width: `${epubProgress}%` }} />
              </div>
            )}

            <input
              type="text"
              placeholder="https://..."
              value={formData.epubUrl || ''}
              onChange={(e) => setFormData({ ...formData, epubUrl: e.target.value })}
              className="w-full px-3 py-1.5 text-xs font-mono border border-[#E2DBD0] rounded-lg bg-white"
            />
          </div>

          {/* 4. Free Sample Chapter */}
          <div className="p-4 rounded-lg bg-[#FAF8F5] border border-[#E2DBD0] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-[#181918] block">Free Sample Chapter (PDF)</span>
                <span className="text-xs text-[#706E69]">Path: books/sample_* (Distributed on sample requests)</span>
              </div>
              <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#244634] bg-white border border-[#C5D8CC] rounded-lg hover:bg-[#EAF0EC] transition-colors">
                <Upload className="w-3.5 h-3.5" />
                {uploadingSample ? `Uploading (${sampleProgress}%)` : 'Upload Sample'}
                <input
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  disabled={uploadingSample}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileUpload(f, 'sample', 'samplePdfUrl', setSampleProgress, setUploadingSample);
                  }}
                />
              </label>
            </div>

            {uploadingSample && (
              <div className="w-full bg-[#E2DBD0] rounded-full h-1.5 overflow-hidden">
                <div className="bg-[#244634] h-1.5 transition-all" style={{ width: `${sampleProgress}%` }} />
              </div>
            )}

            <input
              type="text"
              placeholder="https://..."
              value={formData.samplePdfUrl || ''}
              onChange={(e) => setFormData({ ...formData, samplePdfUrl: e.target.value })}
              className="w-full px-3 py-1.5 text-xs font-mono border border-[#E2DBD0] rounded-lg bg-white"
            />
          </div>
        </div>

        {/* Sample Excerpt */}
        <div className="bg-white rounded-xl border border-[#E2DBD0] shadow-sm p-6 sm:p-8 space-y-4">
          <div className="pb-3 border-b border-[#E2DBD0]">
            <h2 className="text-base font-semibold text-[#181918]">Public Website Excerpt Preview</h2>
            <p className="text-xs text-[#706E69] mt-0.5">
              The preview text displayed in the sample chapter modal on the public /book page.
            </p>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[#706E69] mb-1.5">
              Excerpt Heading
            </label>
            <input
              type="text"
              value={formData.excerptTitle}
              onChange={(e) => setFormData({ ...formData, excerptTitle: e.target.value })}
              className="w-full px-3.5 py-2 text-sm border border-[#E2DBD0] rounded-lg focus:outline-none focus:border-[#244634]"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[#706E69] mb-1.5">
              Excerpt Text
            </label>
            <textarea
              rows={5}
              value={formData.excerptText}
              onChange={(e) => setFormData({ ...formData, excerptText: e.target.value })}
              className="w-full px-3.5 py-2 text-sm border border-[#E2DBD0] rounded-lg focus:outline-none focus:border-[#244634]"
            />
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#244634] text-[#FAF7F2] text-sm font-medium rounded-xl hover:bg-[#1B3527] transition-colors disabled:opacity-50 shadow-sm"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving changes to Firestore...' : 'Save Book Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
