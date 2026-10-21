/**
 * Client-side local photo storage using browser IndexedDB.
 * Ensures photographs are stored directly on the user's local device without any server storage.
 */

const DB_NAME = 'duo_client_vault';
const STORE_NAME = 'local_photos';
const DB_VERSION = 1;

function openPhotoDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported in this environment'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Save a photo blob/data URL locally into the client's IndexedDB.
 */
export async function savePhotoLocally(id: string, dataUrl: string): Promise<void> {
  try {
    const db = await openPhotoDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.put({ id, dataUrl, savedAt: Date.now() });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Failed to save photo to IndexedDB:', err);
  }
}

/**
 * Retrieve a locally cached photo from IndexedDB.
 */
export async function getPhotoLocally(id: string): Promise<string | null> {
  try {
    const db = await openPhotoDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result?.dataUrl || null);
      };
      request.onerror = () => reject(request.error);
    });
  } catch {
    return null;
  }
}

/**
 * Compress an image File on the client to an optimized WebP data URL.
 * Max dimension: 1200px, quality: 0.80. Average size: ~80KB-160KB.
 * Zero bytes ever sent to any file/storage server.
 */
export function compressImageOnClient(file: File, maxDimension = 1200, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }

        // Draw with high-quality smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to WebP format
        let resultUrl = canvas.toDataURL('image/webp', quality);
        // Fallback to JPEG if browser doesn't encode WebP
        if (!resultUrl.startsWith('data:image/webp')) {
          resultUrl = canvas.toDataURL('image/jpeg', quality);
        }

        resolve(resultUrl);
      };

      img.onerror = () => reject(new Error('Failed to decode image file'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
}
