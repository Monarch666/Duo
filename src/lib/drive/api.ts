/**
 * Direct Google Drive v3 REST API Client
 * Operates purely client-side without any backend server.
 * Requires accessToken with scope `https://www.googleapis.com/auth/drive.file`.
 */

import { DriveFileItem, DriveFolder } from './types';

const DRIVE_API_URL = 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3';

export class GoogleDriveApiError extends Error {
  constructor(public status: number, message: string, public details?: any) {
    super(`Google Drive API Error (${status}): ${message}`);
    this.name = 'GoogleDriveApiError';
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorDetails: any = null;
    try {
      errorDetails = await res.json();
    } catch {
      // Body may not be JSON
    }
    const message = errorDetails?.error?.message || res.statusText || 'Unknown Drive error';
    throw new GoogleDriveApiError(res.status, message, errorDetails);
  }
  return res.json() as Promise<T>;
}

/**
 * Searches for a folder by name, optionally within a parent folder.
 */
export async function findFolder(
  accessToken: string,
  folderName: string,
  parentFolderId?: string
): Promise<DriveFolder | null> {
  let query = `name = '${folderName.replace(/'/g, "\\'")}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  if (parentFolderId) {
    query += ` and '${parentFolderId}' in parents`;
  }

  const url = `${DRIVE_API_URL}/files?q=${encodeURIComponent(query)}&fields=files(id,name,webViewLink)&pageSize=1`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const data = await handleResponse<{ files: DriveFolder[] }>(res);
  return data.files && data.files.length > 0 ? data.files[0] : null;
}

/**
 * Creates a folder in Google Drive.
 */
export async function createFolder(
  accessToken: string,
  folderName: string,
  parentFolderId?: string
): Promise<DriveFolder> {
  const metadata: { name: string; mimeType: string; parents?: string[] } = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
  };

  if (parentFolderId) {
    metadata.parents = [parentFolderId];
  }

  const res = await fetch(`${DRIVE_API_URL}/files?fields=id,name,webViewLink`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(metadata),
  });

  return handleResponse<DriveFolder>(res);
}

/**
 * Shares a folder with a partner via Google Drive permissions.
 * Sets role to 'writer' so both partners have read/write access.
 */
export async function shareFolderWithPartner(
  accessToken: string,
  folderId: string,
  partnerEmail: string
): Promise<void> {
  const permissionPayload = {
    role: 'writer',
    type: 'user',
    emailAddress: partnerEmail,
  };

  const res = await fetch(
    `${DRIVE_API_URL}/files/${folderId}/permissions?sendNotificationEmail=true`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(permissionPayload),
    }
  );

  await handleResponse<any>(res);
}

/**
 * Finds a specific file by name in a parent folder.
 */
export async function findFileInFolder(
  accessToken: string,
  folderId: string,
  fileName: string
): Promise<DriveFileItem | null> {
  const query = `name = '${fileName.replace(/'/g, "\\'")}' and '${folderId}' in parents and trashed = false`;
  const url = `${DRIVE_API_URL}/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,modifiedTime,size)&pageSize=1`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const data = await handleResponse<{ files: DriveFileItem[] }>(res);
  return data.files && data.files.length > 0 ? data.files[0] : null;
}

/**
 * Lists all files in a folder.
 */
export async function listFilesInFolder(
  accessToken: string,
  folderId: string,
  pageSize = 100
): Promise<DriveFileItem[]> {
  const query = `'${folderId}' in parents and trashed = false`;
  const url = `${DRIVE_API_URL}/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,modifiedTime,size)&pageSize=${pageSize}&orderBy=modifiedTime desc`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const data = await handleResponse<{ files: DriveFileItem[] }>(res);
  return data.files || [];
}

/**
 * Creates or updates a JSON file in a folder using multipart upload.
 */
export async function saveJsonFile(
  accessToken: string,
  folderId: string,
  fileName: string,
  jsonData: any
): Promise<DriveFileItem> {
  const existing = await findFileInFolder(accessToken, folderId, fileName);
  const jsonContent = JSON.stringify(jsonData, null, 2);

  if (existing) {
    // Update existing file content
    const res = await fetch(
      `${DRIVE_UPLOAD_URL}/files/${existing.id}?uploadType=media`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: jsonContent,
      }
    );
    return handleResponse<DriveFileItem>(res);
  }

  // Create new file with multipart upload (metadata + media)
  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metadata = {
    name: fileName,
    parents: [folderId],
    mimeType: 'application/json',
  };

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: application/json\r\n\r\n' +
    jsonContent +
    closeDelimiter;

  const res = await fetch(
    `${DRIVE_UPLOAD_URL}/files?uploadType=multipart&fields=id,name,mimeType,modifiedTime`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    }
  );

  return handleResponse<DriveFileItem>(res);
}

/**
 * Downloads and parses a JSON file from Drive by file ID.
 */
export async function readJsonFile<T = any>(
  accessToken: string,
  fileId: string
): Promise<T> {
  const res = await fetch(`${DRIVE_API_URL}/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new GoogleDriveApiError(res.status, `Failed to download file ${fileId}`);
  }

  return res.json() as Promise<T>;
}

/**
 * Uploads a binary photo / media blob into a specific folder in Google Drive.
 */
export async function uploadMediaFile(
  accessToken: string,
  folderId: string,
  fileName: string,
  blob: Blob
): Promise<DriveFileItem> {
  const metadata = {
    name: fileName,
    parents: [folderId],
    mimeType: blob.type || 'image/jpeg',
  };

  const boundary = '-------DuoVaultMediaBoundary';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metadataPart =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    `Content-Type: ${blob.type || 'image/jpeg'}\r\n` +
    'Content-Transfer-Encoding: base64\r\n\r\n';

  // Read blob as base64
  const arrayBuffer = await blob.arrayBuffer();
  let binary = '';
  const bytes = new Uint8Array(arrayBuffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64Data = btoa(binary);

  const multipartRequestBody = metadataPart + base64Data + closeDelimiter;

  const res = await fetch(
    `${DRIVE_UPLOAD_URL}/files?uploadType=multipart&fields=id,name,mimeType,modifiedTime,size`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    }
  );

  return handleResponse<DriveFileItem>(res);
}

/**
 * Downloads a binary media blob from Drive.
 */
export async function downloadMediaBlob(
  accessToken: string,
  fileId: string
): Promise<Blob> {
  const res = await fetch(`${DRIVE_API_URL}/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new GoogleDriveApiError(res.status, `Failed to download media ${fileId}`);
  }

  return res.blob();
}

