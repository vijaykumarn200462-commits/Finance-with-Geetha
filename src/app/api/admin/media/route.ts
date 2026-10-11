import { NextResponse } from 'next/server';
import { adminStorage, isFirebaseAdminConfigured } from '@/lib/firebase/admin';
import { verifyAdminRequest } from '@/lib/firebase/admin-verify';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const authCheck = await verifyAdminRequest(request);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status || 401 });
    }

    if (!isFirebaseAdminConfigured) {
      return NextResponse.json({
        files: [],
        message: 'Firebase Admin Storage not configured in server environment.',
      });
    }

    let fileList: Array<{
      name: string;
      fullPath: string;
      size: number;
      contentType: string;
      timeCreated: string;
      url: string;
    }> = [];

    try {
      const [files] = await adminStorage.bucket().getFiles({ prefix: 'media/' });
      fileList = files.map((file: { name: string; metadata: Record<string, unknown>; bucket: { name: string } }) => ({
        name: file.name.replace('media/', ''),
        fullPath: file.name,
        size: Number(file.metadata.size || 0),
        contentType: (file.metadata.contentType as string) || 'application/octet-stream',
        timeCreated: (file.metadata.timeCreated as string) || new Date().toISOString(),
        url: `https://storage.googleapis.com/${file.bucket.name}/${file.name}`,
      }));
    } catch (storageErr: unknown) {
      const isNotFound =
        (storageErr as { code?: number })?.code === 404 ||
        (storageErr instanceof Error && storageErr.message.includes('bucket does not exist'));

      if (isNotFound) {
        return NextResponse.json({
          files: [],
          notice: 'Firebase Storage bucket has not yet been provisioned in the Firebase Console or is empty.',
        });
      }
      throw storageErr;
    }

    return NextResponse.json({ files: fileList });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error listing media files';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const authCheck = await verifyAdminRequest(request);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status || 401 });
    }

    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');

    if (!path) {
      return NextResponse.json({ error: 'File path is required' }, { status: 400 });
    }

    await adminStorage.bucket().file(path).delete();
    return NextResponse.json({ success: true, message: `File ${path} deleted` });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error deleting media file';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
