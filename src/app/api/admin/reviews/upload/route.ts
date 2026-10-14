import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import path from 'path';
import fs from 'fs/promises';
import { adminStorage, isFirebaseAdminValid } from '@/lib/firebase/admin';
import { verifyAdminRequest } from '@/lib/firebase/admin-verify';

export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
]);

function isValidImageSignature(buffer: Buffer, mimeType: string): boolean {
  if (mimeType === 'image/svg+xml') {
    const text = buffer.slice(0, 1024).toString('utf-8');
    return text.includes('<svg') || text.includes('<?xml');
  }

  if (buffer.length < 4) return false;

  // JPEG
  if (mimeType === 'image/jpeg') {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }

  // PNG
  if (mimeType === 'image/png') {
    return (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47
    );
  }

  // GIF
  if (mimeType === 'image/gif') {
    return (
      buffer[0] === 0x47 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x38
    );
  }

  // WebP
  if (mimeType === 'image/webp') {
    if (buffer.length < 12) return false;
    const riff = buffer.slice(0, 4).toString('ascii');
    const webp = buffer.slice(8, 12).toString('ascii');
    return riff === 'RIFF' && webp === 'WEBP';
  }

  return true;
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
          {
            error: `File size exceeds the 10MB limit. (Provided: ${(
              file.size /
              (1024 * 1024)
            ).toFixed(2)}MB)`,
          },
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
      const filename = `review_${Date.now()}_${sanitizedOriginalName}`;

      // 4. Try Firebase Cloud Storage if provisioned
      let storageUploaded = false;
      if (isFirebaseAdminValid()) {
        try {
          const bucket = adminStorage.bucket();
          const [exists] = await bucket.exists();
          if (exists) {
            const storageFile = bucket.file(`reviews/${filename}`);
            await storageFile.save(buffer, {
              metadata: {
                contentType: mimeType,
                cacheControl: 'public, max-age=31536000',
              },
            });
            await storageFile.makePublic().catch(() => {});
            finalImageUrl = `https://storage.googleapis.com/${bucket.name}/reviews/${filename}`;
            storageUploaded = true;
          }
        } catch (storageErr) {
          console.warn('[Review Image Upload] Cloud Storage bucket upload notice:', storageErr);
        }
      }

      // 5. Fallback: Save to public directory for guaranteed zero-freeze serving
      if (!storageUploaded) {
        const publicDir = path.join(process.cwd(), 'public', 'images', 'reviews');
        await fs.mkdir(publicDir, { recursive: true });
        const filePath = path.join(publicDir, filename);
        await fs.writeFile(filePath, buffer);
        finalImageUrl = `/images/reviews/${filename}`;
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
      return NextResponse.json({ error: 'No image file or URL was provided.' }, { status: 400 });
    }

    try {
      revalidatePath('/', 'page');
    } catch {
      // Non-blocking
    }

    return NextResponse.json({
      success: true,
      url: finalImageUrl,
      message: 'Review screenshot/image uploaded successfully.',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error uploading review image';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
