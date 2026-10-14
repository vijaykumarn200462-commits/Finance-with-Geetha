import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import path from 'path';
import fs from 'fs/promises';
import { adminDb, adminStorage, isFirebaseAdminValid } from '@/lib/firebase/admin';
import { COLLECTIONS } from '@/lib/firebase/collections';
import { verifyAdminRequest } from '@/lib/firebase/admin-verify';
import { DEFAULT_PROFILE_IMAGE } from '@/lib/firebase/content-defaults';

export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
]);

/**
 * Validates buffer magic bytes against expected MIME types to prevent spoofed file extensions.
 */
function isValidImageSignature(buffer: Buffer, mimeType: string): boolean {
  if (mimeType === 'image/svg+xml') {
    // Basic text check for SVG
    const text = buffer.slice(0, 1024).toString('utf-8');
    return text.includes('<svg') || text.includes('<?xml');
  }

  if (buffer.length < 4) return false;

  // JPEG: FF D8 FF
  if (mimeType === 'image/jpeg') {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }

  // PNG: 89 50 4E 47
  if (mimeType === 'image/png') {
    return (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47
    );
  }

  // GIF: 47 49 46 38
  if (mimeType === 'image/gif') {
    return (
      buffer[0] === 0x47 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x38
    );
  }

  // WebP: RIFF .... WEBP
  if (mimeType === 'image/webp') {
    if (buffer.length < 12) return false;
    const riff = buffer.slice(0, 4).toString('ascii');
    const webp = buffer.slice(8, 12).toString('ascii');
    return riff === 'RIFF' && webp === 'WEBP';
  }

  return true;
}

export async function GET(request: Request) {
  try {
    const authCheck = await verifyAdminRequest(request);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status || 401 });
    }

    const docSnap = await adminDb.collection(COLLECTIONS.SITE_CONTENT).doc('hero').get();
    const data = docSnap.exists ? docSnap.data() : null;
    const profileImageUrl = data?.profileImageUrl || DEFAULT_PROFILE_IMAGE;

    return NextResponse.json({
      profileImageUrl,
      updatedAt: data?.updatedAt || null,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error retrieving profile photo';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authCheck = await verifyAdminRequest(request);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status || 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const customUrl = formData.get('url') as string | null;

    let finalImageUrl = '';

    if (file && typeof file === 'object' && 'arrayBuffer' in file) {
      // 1. Validate file size
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File size exceeds the 5MB limit. (Provided: ${(file.size / (1024 * 1024)).toFixed(2)}MB)` },
          { status: 400 }
        );
      }

      // 2. Validate MIME type
      const mimeType = file.type?.toLowerCase() || '';
      if (!ALLOWED_MIME_TYPES.has(mimeType)) {
        return NextResponse.json(
          {
            error: `Unsupported file type "${mimeType}". Allowed formats: JPEG, PNG, WebP, GIF, SVG.`,
          },
          { status: 400 }
        );
      }

      // 3. Read buffer and check magic signature
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      if (!isValidImageSignature(buffer, mimeType)) {
        return NextResponse.json(
          { error: 'File content does not match the specified image format.' },
          { status: 400 }
        );
      }

      const sanitizedOriginalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filename = `profile_${Date.now()}_${sanitizedOriginalName}`;

      // 4. Try Firebase Admin Storage if provisioned
      let storageUploaded = false;
      if (isFirebaseAdminValid()) {
        try {
          const bucket = adminStorage.bucket();
          const [exists] = await bucket.exists();
          if (exists) {
            const storageFile = bucket.file(`profile/${filename}`);
            await storageFile.save(buffer, {
              metadata: {
                contentType: mimeType,
                cacheControl: 'public, max-age=31536000',
              },
            });
            await storageFile.makePublic().catch(() => {});
            finalImageUrl = `https://storage.googleapis.com/${bucket.name}/profile/${filename}`;
            storageUploaded = true;
          }
        } catch (storageErr) {
          console.warn('[Profile Photo Upload] Firebase Cloud Storage bucket upload skipped/failed:', storageErr);
        }
      }

      // 5. If not stored in cloud storage, write to public directory for immediate reliable serving
      if (!storageUploaded) {
        const publicDir = path.join(process.cwd(), 'public', 'images', 'profile');
        await fs.mkdir(publicDir, { recursive: true });
        const filePath = path.join(publicDir, filename);
        await fs.writeFile(filePath, buffer);
        finalImageUrl = `/images/profile/${filename}`;
      }
    } else if (customUrl && typeof customUrl === 'string' && customUrl.trim()) {
      const trimmed = customUrl.trim();
      if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.startsWith('/')) {
        return NextResponse.json(
          { error: 'Invalid URL. Must start with http://, https://, or /' },
          { status: 400 }
        );
      }
      finalImageUrl = trimmed;
    } else {
      return NextResponse.json(
        { error: 'No image file or URL was provided.' },
        { status: 400 }
      );
    }

    const target = formData.get('target') as string | null; // 'branding' | 'hero' | null

    // Persist to site_content/hero and/or site_content/branding
    const nowIso = new Date().toISOString();

    if (target === 'branding') {
      const brandingRef = adminDb.collection(COLLECTIONS.SITE_CONTENT).doc('branding');
      await brandingRef.set(
        {
          logoUrl: finalImageUrl,
          updatedAt: nowIso,
        },
        { merge: true }
      );
    } else if (target === 'hero') {
      const heroRef = adminDb.collection(COLLECTIONS.SITE_CONTENT).doc('hero');
      await heroRef.set(
        {
          profileImageUrl: finalImageUrl,
          updatedAt: nowIso,
        },
        { merge: true }
      );
    } else {
      // Default: Update both to keep portrait and logo consistent
      const heroRef = adminDb.collection(COLLECTIONS.SITE_CONTENT).doc('hero');
      const brandingRef = adminDb.collection(COLLECTIONS.SITE_CONTENT).doc('branding');
      await Promise.all([
        heroRef.set({ profileImageUrl: finalImageUrl, updatedAt: nowIso }, { merge: true }),
        brandingRef.set({ logoUrl: finalImageUrl, updatedAt: nowIso }, { merge: true }),
      ]);
    }

    // Revalidate SSR/ISR caches
    try {
      revalidatePath('/', 'page');
      revalidatePath('/', 'layout');
      revalidatePath('/about', 'page');
      revalidatePath('/store', 'page');
      revalidatePath('/contact', 'page');
    } catch (revalidateErr) {
      console.warn('[Profile Photo Upload] Path revalidation error:', revalidateErr);
    }

    return NextResponse.json({
      success: true,
      url: finalImageUrl,
      message: 'Profile photograph updated and saved to Firestore successfully.',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error uploading profile photo';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const authCheck = await verifyAdminRequest(request);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status || 401 });
    }

    const heroRef = adminDb.collection(COLLECTIONS.SITE_CONTENT).doc('hero');
    await heroRef.set(
      {
        profileImageUrl: DEFAULT_PROFILE_IMAGE,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    try {
      revalidatePath('/', 'page');
      revalidatePath('/', 'layout');
      revalidatePath('/about', 'page');
    } catch {
      // Non-blocking
    }

    return NextResponse.json({
      success: true,
      url: DEFAULT_PROFILE_IMAGE,
      message: 'Profile photograph reset to default.',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error resetting profile photo';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
