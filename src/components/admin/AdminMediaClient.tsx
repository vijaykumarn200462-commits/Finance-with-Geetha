'use client';

import React, { useState, useEffect } from 'react';
import {
  Image as ImageIcon,
  Upload,
  Trash2,
  Copy,
  Check,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Search,
  File,
  FileText,
  Music,
  Video,
} from 'lucide-react';
import { uploadFileWithProgress, listMediaFiles, deleteFileFromStorage, StorageFileItem } from '@/lib/firebase/storage';

export default function AdminMediaClient() {
  const [files, setFiles] = useState<StorageFileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [deletingPath, setDeletingPath] = useState<string | null>(null);

  // Upload states
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentUploadName, setCurrentUploadName] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    loadFiles();
  }, []);

  async function loadFiles() {
    setLoading(true);
    setErrorMessage(null);
    try {
      // First try client SDK listing
      const items = await listMediaFiles('media');
      setFiles(items);
    } catch (err: unknown) {
      console.warn('Storage list error, trying API fallback:', err);
      try {
        const res = await fetch('/api/admin/media');
        const data = await res.json();
        if (data.files) {
          setFiles(data.files);
        }
      } catch {
        setErrorMessage('Failed to load media files from Firebase Storage.');
      }
    } finally {
      setLoading(false);
    }
  }

  const handleFileUpload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const file = fileList[0];

    setUploading(true);
    setUploadProgress(0);
    setCurrentUploadName(file.name);
    setErrorMessage(null);

    try {
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const storagePath = `media/${Date.now()}_${sanitizedName}`;

      await uploadFileWithProgress(storagePath, file, (progress) => {
        setUploadProgress(progress);
      });

      setSuccessMessage(`File "${file.name}" uploaded successfully!`);
      setTimeout(() => setSuccessMessage(null), 4000);

      // Reload files list
      await loadFiles();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      setErrorMessage(`Upload error: ${msg}`);
    } finally {
      setUploading(false);
      setUploadProgress(0);
      setCurrentUploadName('');
    }
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setSuccessMessage('URL copied to clipboard!');
    setTimeout(() => {
      setCopiedUrl(null);
      setSuccessMessage(null);
    }, 2500);
  };

  const handleDelete = async (file: StorageFileItem) => {
    if (!confirm(`Are you sure you want to delete "${file.name}" from Firebase Storage?`)) {
      return;
    }

    setDeletingPath(file.fullPath);
    try {
      await deleteFileFromStorage(file.fullPath);
      setFiles((prev) => prev.filter((f) => f.fullPath !== file.fullPath));
      setSuccessMessage(`Deleted "${file.name}"`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Delete failed';
      setErrorMessage(`Delete error: ${msg}`);
    } finally {
      setDeletingPath(null);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const getFileIcon = (contentType?: string) => {
    if (!contentType) return <File className="w-5 h-5 text-gray-400" />;
    if (contentType.startsWith('image/')) return <ImageIcon className="w-5 h-5 text-emerald-600" />;
    if (contentType.startsWith('video/')) return <Video className="w-5 h-5 text-blue-600" />;
    if (contentType.startsWith('audio/')) return <Music className="w-5 h-5 text-purple-600" />;
    if (contentType.includes('pdf')) return <FileText className="w-5 h-5 text-red-600" />;
    return <File className="w-5 h-5 text-gray-500" />;
  };

  const filteredFiles = files.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-[#244634] font-semibold">
            Cloud Assets
          </span>
          <h1 className="text-2xl font-editorial text-[#181918] mt-1">Media Management</h1>
          <p className="text-sm text-[#706E69]">
            Upload and organize photos, graphics, PDFs, and assets stored in Firebase Storage (`media/`).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-[#244634] text-white text-xs font-medium rounded-lg hover:bg-[#1B3527] transition-colors shadow-sm">
            <Upload className="w-3.5 h-3.5" />
            Upload File
            <input
              type="file"
              className="hidden"
              disabled={uploading}
              onChange={(e) => handleFileUpload(e.target.files)}
            />
          </label>

          <button
            onClick={loadFiles}
            title="Reload from Storage"
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

      {/* Upload Progress Banner */}
      {uploading && (
        <div className="p-4 rounded-xl bg-white border border-[#244634]/30 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-[#181918] font-medium truncate">Uploading {currentUploadName}...</span>
            <span className="text-[#244634] font-semibold">{uploadProgress}%</span>
          </div>
          <div className="w-full bg-[#E2DBD0] rounded-full h-2 overflow-hidden">
            <div
              className="bg-[#244634] h-2 transition-all duration-150"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#706E69]" />
          <input
            type="text"
            placeholder="Search media files by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-[#E2DBD0] rounded-lg bg-white focus:outline-none focus:border-[#244634]"
          />
        </div>
        <span className="text-xs font-mono text-[#706E69]">
          Total: {filteredFiles.length} file{filteredFiles.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Media Grid / List */}
      <div className="bg-white rounded-xl border border-[#E2DBD0] shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-sm text-[#706E69]">
            <RefreshCw className="w-5 h-5 mx-auto mb-2 animate-spin text-[#244634]" />
            Fetching media files from Firebase Storage...
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="p-12 text-center text-sm text-[#706E69]">
            <ImageIcon className="w-8 h-8 mx-auto mb-3 text-[#B8B4AA]" />
            <p className="font-medium text-[#181918]">No media files found</p>
            <p className="text-xs mt-1">Upload photos, documents, or book covers using the button above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#FAF8F5] text-xs font-mono uppercase text-[#706E69] border-b border-[#E2DBD0]">
                <tr>
                  <th className="px-5 py-3.5">Preview</th>
                  <th className="px-5 py-3.5">Filename</th>
                  <th className="px-5 py-3.5">Type</th>
                  <th className="px-5 py-3.5">Size</th>
                  <th className="px-5 py-3.5">Uploaded</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2DBD0]">
                {filteredFiles.map((file) => {
                  const isImage = file.contentType?.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(file.name);
                  return (
                    <tr key={file.fullPath} className="hover:bg-[#FAF8F5]/50 transition-colors">
                      <td className="px-5 py-3">
                        <div className="w-12 h-12 rounded-lg bg-[#FAF8F5] border border-[#E2DBD0] overflow-hidden flex items-center justify-center">
                          {isImage ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={file.url}
                              alt={file.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            getFileIcon(file.contentType)
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-3">
                        <div className="font-medium text-[#181918] max-w-xs truncate" title={file.name}>
                          {file.name}
                        </div>
                        <div className="text-xs text-[#706E69] font-mono mt-0.5 truncate max-w-xs">
                          {file.fullPath}
                        </div>
                      </td>

                      <td className="px-5 py-3 font-mono text-xs text-[#706E69]">
                        {file.contentType || 'file'}
                      </td>

                      <td className="px-5 py-3 font-mono text-xs text-[#706E69]">
                        {formatFileSize(file.size)}
                      </td>

                      <td className="px-5 py-3 text-xs text-[#706E69]">
                        {file.timeCreated ? new Date(file.timeCreated).toLocaleDateString() : '—'}
                      </td>

                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleCopyUrl(file.url)}
                            title="Copy Public URL"
                            className="p-1.5 text-[#706E69] hover:text-[#181918] rounded-lg border border-[#E2DBD0] hover:bg-[#FAF8F5] transition-colors"
                          >
                            {copiedUrl === file.url ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>

                          <a
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Open in new tab"
                            className="p-1.5 text-[#706E69] hover:text-[#181918] rounded-lg border border-[#E2DBD0] hover:bg-[#FAF8F5] transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>

                          <button
                            onClick={() => handleDelete(file)}
                            disabled={deletingPath === file.fullPath}
                            title="Delete file"
                            className="p-1.5 text-red-500 hover:text-red-700 rounded-lg border border-red-200 hover:bg-red-50 transition-colors disabled:opacity-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
