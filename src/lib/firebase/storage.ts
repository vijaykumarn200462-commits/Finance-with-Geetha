import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  listAll,
  StorageReference,
  getMetadata,
} from 'firebase/storage';
import { storage } from './client';

export interface StorageFileItem {
  name: string;
  fullPath: string;
  url: string;
  contentType?: string;
  size?: number;
  timeCreated?: string;
}

export function uploadFileWithProgress(
  storagePath: string,
  file: File | Blob,
  onProgress?: (percent: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    let completed = false;
    let timeoutTimer: NodeJS.Timeout | null = null;

    try {
      const storageRef = ref(storage, storagePath);
      const uploadTask = uploadBytesResumable(storageRef, file);

      // Safety timeout: if upload has 0 progress after 6 seconds (e.g. bucket doesn't exist and SDK retry loop triggers), cancel task
      timeoutTimer = setTimeout(() => {
        if (!completed && uploadTask.snapshot.bytesTransferred === 0) {
          uploadTask.cancel();
          reject(
            new Error(
              'Firebase Storage upload timed out after 6 seconds. The storage bucket is either unreachable or not yet provisioned in Firebase Console.'
            )
          );
        }
      }, 6000);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          if (snapshot.state === 'running') {
            const progress = snapshot.totalBytes > 0
              ? (snapshot.bytesTransferred / snapshot.totalBytes) * 100
              : 0;
            if (onProgress) {
              onProgress(Math.round(progress));
            }
          } else if (snapshot.state === 'paused') {
            console.warn('[Firebase Storage] Upload is paused.');
          }
        },
        (error) => {
          completed = true;
          if (timeoutTimer) clearTimeout(timeoutTimer);
          console.error('[Firebase Storage] Upload task error:', error);

          const errCode = (error as { code?: string })?.code || '';
          const errMsg = (error as { message?: string })?.message || '';

          if (
            errCode === 'storage/bucket-not-found' ||
            errCode === 'storage/retry-limit-exceeded' ||
            errMsg.includes('bucket does not exist') ||
            errMsg.includes('404')
          ) {
            reject(
              new Error(
                'Firebase Storage bucket has not been provisioned or is unreachable for project geetha-coaching.'
              )
            );
          } else if (errCode === 'storage/unauthorized') {
            reject(new Error('Permission denied. You must be an authorized administrator to upload files.'));
          } else if (errCode === 'storage/canceled') {
            reject(new Error('Upload was canceled or timed out.'));
          } else {
            reject(error);
          }
        },
        async () => {
          completed = true;
          if (timeoutTimer) clearTimeout(timeoutTimer);
          try {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            if (onProgress) onProgress(100);
            resolve(downloadUrl);
          } catch (err) {
            reject(err);
          }
        }
      );
    } catch (err) {
      if (timeoutTimer) clearTimeout(timeoutTimer);
      reject(err);
    }
  });
}

export async function deleteFileFromStorage(storagePathOrUrl: string): Promise<void> {
  try {
    let fileRef: StorageReference;
    if (storagePathOrUrl.startsWith('http://') || storagePathOrUrl.startsWith('https://')) {
      fileRef = ref(storage, storagePathOrUrl);
    } else {
      fileRef = ref(storage, storagePathOrUrl);
    }
    await deleteObject(fileRef);
  } catch (error) {
    console.error('Error deleting file from storage:', error);
    throw error;
  }
}

export async function listMediaFiles(folderPath: string = 'media'): Promise<StorageFileItem[]> {
  try {
    const listRef = ref(storage, folderPath);
    const res = await listAll(listRef);

    const filePromises = res.items.map(async (itemRef) => {
      const [url, metadata] = await Promise.all([
        getDownloadURL(itemRef).catch(() => ''),
        getMetadata(itemRef).catch(() => null),
      ]);

      return {
        name: itemRef.name,
        fullPath: itemRef.fullPath,
        url,
        contentType: metadata?.contentType,
        size: metadata?.size,
        timeCreated: metadata?.timeCreated,
      };
    });

    const files = await Promise.all(filePromises);
    return files.filter((f) => f.url);
  } catch (error) {
    console.warn('Error listing media files from storage:', error);
    return [];
  }
}
