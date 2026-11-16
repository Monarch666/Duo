/**
 * Google Drive & Sync Engine Types for Duo Sanctuary
 */

export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  givenName?: string;
  familyName?: string;
  imageUrl?: string;
  accessToken: string;
  expiresAt: number; // Unix timestamp in ms
}

export interface DriveFolder {
  id: string;
  name: string;
  webViewLink?: string;
}

export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  size?: string;
}

export interface SanctuaryMetadata {
  sanctuaryId: string;
  sanctuaryName: string;
  creatorEmail: string;
  creatorName: string;
  partnerEmail?: string;
  partnerName?: string;
  anniversaryDate?: string;
  createdAt: number;
  updatedAt: number;
  schemaVersion: number;
}

export type SyncActionType =
  | 'EVENT_CREATED'
  | 'EVENT_UPDATED'
  | 'EVENT_DELETED'
  | 'LIST_CREATED'
  | 'LIST_DELETED'
  | 'LIST_ITEM_CREATED'
  | 'LIST_ITEM_TOGGLED'
  | 'LIST_ITEM_DELETED'
  | 'MEMORY_CREATED'
  | 'MEMORY_DELETED'
  | 'PREFERENCE_CREATED'
  | 'PREFERENCE_UPDATED'
  | 'PREFERENCE_DELETED'
  | 'LOVE_NOTE_CREATED'
  | 'LOVE_NOTE_TAPPED'
  | 'LOVE_NOTE_REPLIED'
  | 'LOVE_NOTE_DELETED'
  | 'CHECKIN_SUBMITTED'
  | 'CYCLE_LOGGED'
  | 'CYCLE_COMFORT_UPDATED'
  | 'MOOD_UPDATED';

export interface SyncEvent<T = any> {
  id: string;
  type: SyncActionType;
  actorEmail: string;
  actorName: string;
  timestamp: number;
  payload: T;
}

export interface SyncState {
  isSyncing: boolean;
  lastSyncedAt: number | null;
  pendingCount: number;
  lastError: string | null;
  isOnline: boolean;
  folderId: string | null;
}

