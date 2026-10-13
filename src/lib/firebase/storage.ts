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
    try {
      const storageRef = ref(storage, storagePath);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) {
            onProgress(Math.round(progress));
          }
        },
        (error) => {
          console.error('Storage upload error:', error);
          const isBucketNotFound =
            (error as { code?: string })?.code === 'storage/bucket-not-found' ||
            (error as { message?: string })?.message?.includes('bucket does not exist');
          if (isBucketNotFound) {
            reject(
              new Error(
                'Firebase Storage bucket has not yet been provisioned in the Firebase Console. Please activate Cloud Storage in the Firebase Console (Build > Storage) for project geetha-coaching.'
              )
            );
          } else {
            reject(error);
          }
        },
        async () => {
          try {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadUrl);
          } catch (err) {
            reject(err);
          }
        }
      );
    } catch (err) {
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
