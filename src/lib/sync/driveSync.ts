/**
 * Google Drive Synchronization Engine for Duo Sanctuary
 * Manages two-way sync between local on-device IndexedDB and the shared Google Drive folder.
 */

import {
  findFolder,
  createFolder,
  shareFolderWithPartner,
  findFileInFolder,
  saveJsonFile,
  readJsonFile,
  uploadMediaFile,
} from '../drive/api';
import { GoogleUser, SanctuaryMetadata, SyncEvent, SyncState } from '../drive/types';
import { localSanctuaryDb } from '../storage/localSanctuaryDb';

const SANCTUARY_ROOT_FOLDER = 'Duo Sanctuary';
const PHOTOS_FOLDER_NAME = 'photos';
const METADATA_FILE = 'sanctuary_metadata.json';
const EVENTS_LOG_FILE = 'events_log.json';

export class DriveSyncEngine {
  private user: GoogleUser | null = null;
  private folderId: string | null = null;
  private photosFolderId: string | null = null;
  private isSyncing = false;
  private lastSyncedAt: number | null = null;
  private listeners: ((state: SyncState) => void)[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      const storedFolder = localStorage.getItem('duo_drive_folder_id');
      if (storedFolder) this.folderId = storedFolder;
      const storedLastSync = localStorage.getItem('duo_last_synced_at');
      if (storedLastSync) this.lastSyncedAt = Number(storedLastSync);
    }
  }

  public setUser(user: GoogleUser | null) {
    this.user = user;
    this.notifyState();
  }

  public subscribe(cb: (state: SyncState) => void): () => void {
    this.listeners.push(cb);
    cb(this.getState());
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  public getState(): SyncState {
    return {
      isSyncing: this.isSyncing,
      lastSyncedAt: this.lastSyncedAt,
      pendingCount: 0,
      lastError: null,
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      folderId: this.folderId,
    };
  }

  private notifyState(lastError: string | null = null) {
    const state: SyncState = {
      isSyncing: this.isSyncing,
      lastSyncedAt: this.lastSyncedAt,
      pendingCount: 0,
      lastError,
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      folderId: this.folderId,
    };
    this.listeners.forEach((l) => l(state));
  }

  /**
   * Initializes or links the sanctuary folder in Google Drive.
   */
  public async setupSanctuary(
    sanctuaryName: string,
    partnerEmail?: string
  ): Promise<{ folderId: string; metadata: SanctuaryMetadata }> {
    if (!this.user) throw new Error('User not authenticated with Google');

    const folderName = `${SANCTUARY_ROOT_FOLDER} - ${sanctuaryName}`;
    let folder = await findFolder(this.user.accessToken, folderName);

    if (!folder) {
      folder = await createFolder(this.user.accessToken, folderName);
    }

    this.folderId = folder.id;
    if (typeof window !== 'undefined') {
      localStorage.setItem('duo_drive_folder_id', folder.id);
    }

    // Ensure photos subfolder exists
    let photosFolder = await findFolder(this.user.accessToken, PHOTOS_FOLDER_NAME, folder.id);
    if (!photosFolder) {
      photosFolder = await createFolder(this.user.accessToken, PHOTOS_FOLDER_NAME, folder.id);
    }
    this.photosFolderId = photosFolder.id;

    // Check or create metadata
    let metadata: SanctuaryMetadata;
    const metaFile = await findFileInFolder(this.user.accessToken, folder.id, METADATA_FILE);

    if (metaFile) {
      metadata = await readJsonFile<SanctuaryMetadata>(this.user.accessToken, metaFile.id);
    } else {
      metadata = {
        sanctuaryId: folder.id,
        sanctuaryName,
        creatorEmail: this.user.email,
        creatorName: this.user.name,
        partnerEmail: partnerEmail || undefined,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        schemaVersion: 1,
      };
      await saveJsonFile(this.user.accessToken, folder.id, METADATA_FILE, metadata);
    }

    // Share with partner if partnerEmail is provided
    if (partnerEmail && partnerEmail !== this.user.email) {
      try {
        await shareFolderWithPartner(this.user.accessToken, folder.id, partnerEmail);
      } catch (err) {
        console.warn('Notice sharing folder with partner:', err);
      }
    }

    await localSanctuaryDb.setMetadata(metadata);
    this.notifyState();
    return { folderId: folder.id, metadata };
  }

  /**
   * Discovers and joins an existing sanctuary folder shared with this Google account.
   */
  public async joinSharedSanctuary(): Promise<SanctuaryMetadata | null> {
    if (!this.user) throw new Error('User not authenticated with Google');

    // Find any folder with Duo Sanctuary in name
    const folder = await findFolder(this.user.accessToken, SANCTUARY_ROOT_FOLDER);
    if (!folder) return null;

    this.folderId = folder.id;
    if (typeof window !== 'undefined') {
      localStorage.setItem('duo_drive_folder_id', folder.id);
    }

    const metaFile = await findFileInFolder(this.user.accessToken, folder.id, METADATA_FILE);
    if (!metaFile) return null;

    const metadata = await readJsonFile<SanctuaryMetadata>(this.user.accessToken, metaFile.id);
    await localSanctuaryDb.setMetadata(metadata);

    // Initial sync
    await this.sync();
    return metadata;
  }

  /**
   * Uploads a photo directly to the couple's Drive photos/ folder.
   */
  public async uploadPhoto(blob: Blob, fileName: string): Promise<string> {
    if (!this.user || !this.folderId) {
      throw new Error('Drive not connected');
    }

    if (!this.photosFolderId) {
      let photosFolder = await findFolder(this.user.accessToken, PHOTOS_FOLDER_NAME, this.folderId);
      if (!photosFolder) {
        photosFolder = await createFolder(this.user.accessToken, PHOTOS_FOLDER_NAME, this.folderId);
      }
      this.photosFolderId = photosFolder.id;
    }

    const file = await uploadMediaFile(
      this.user.accessToken,
      this.photosFolderId,
      fileName,
      blob
    );

    return file.id;
  }

  /**
   * Executes a two-way synchronization:
   * 1. Pulls new events from Drive events_log.json
   * 2. Pushes local outbox events up to Drive
   */
  public async sync(): Promise<void> {
    if (this.isSyncing || !this.user || !this.folderId) return;

    this.isSyncing = true;
    this.notifyState();

    try {
      // 1. Pull remote events log
      const logFile = await findFileInFolder(this.user.accessToken, this.folderId, EVENTS_LOG_FILE);
      let remoteEvents: SyncEvent[] = [];

      if (logFile) {
        remoteEvents = await readJsonFile<SyncEvent[]>(this.user.accessToken, logFile.id);
      }

      // Apply incoming remote events to local store
      const lastSync = this.lastSyncedAt || 0;
      const incoming = remoteEvents.filter(
        (e) => e.timestamp > lastSync && e.actorEmail !== this.user?.email
      );

      for (const event of incoming) {
        await this.applyIncomingEvent(event);
      }

      // 2. Push local pending outbox events
      const outbox = await localSanctuaryDb.getOutbox();
      if (outbox.length > 0) {
        const mergedEvents = [...remoteEvents, ...outbox];
        await saveJsonFile(this.user.accessToken, this.folderId, EVENTS_LOG_FILE, mergedEvents);

        // Clear pushed items from outbox
        for (const item of outbox) {
          await localSanctuaryDb.removeSyncEvent(item.id);
        }
      }

      this.lastSyncedAt = Date.now();
      if (typeof window !== 'undefined') {
        localStorage.setItem('duo_last_synced_at', String(this.lastSyncedAt));
      }

      this.notifyState();
    } catch (err: any) {
      console.warn('Sync failed:', err);
      this.notifyState(err.message || 'Sync failed');
    } finally {
      this.isSyncing = false;
      this.notifyState();
    }
  }

  /**
   * Applies an incoming SyncEvent into the local IndexedDB.
   */
  private async applyIncomingEvent(event: SyncEvent): Promise<void> {
    switch (event.type) {
      case 'EVENT_CREATED':
      case 'EVENT_UPDATED':
        await localSanctuaryDb.saveEvent(event.payload);
        break;
      case 'EVENT_DELETED':
        await localSanctuaryDb.deleteEvent(event.payload.id);
        break;
      case 'LIST_CREATED':
        await localSanctuaryDb.saveList(event.payload);
        break;
      case 'LIST_DELETED':
        await localSanctuaryDb.deleteList(event.payload.id);
        break;
      case 'LIST_ITEM_CREATED':
      case 'LIST_ITEM_TOGGLED':
        await localSanctuaryDb.saveListItem(event.payload);
        break;
      case 'LIST_ITEM_DELETED':
        await localSanctuaryDb.deleteListItem(event.payload.id);
        break;
      case 'MEMORY_CREATED':
        await localSanctuaryDb.saveMemory(event.payload);
        break;
      case 'MEMORY_DELETED':
        await localSanctuaryDb.deleteMemory(event.payload.id);
        break;
      case 'PREFERENCE_CREATED':
      case 'PREFERENCE_UPDATED':
        await localSanctuaryDb.savePreference(event.payload);
        break;
      case 'PREFERENCE_DELETED':
        await localSanctuaryDb.deletePreference(event.payload.id);
        break;
      case 'LOVE_NOTE_CREATED':
      case 'LOVE_NOTE_TAPPED':
      case 'LOVE_NOTE_REPLIED':
        await localSanctuaryDb.saveNote(event.payload);
        break;
      case 'LOVE_NOTE_DELETED':
        await localSanctuaryDb.deleteNote(event.payload.id);
        break;
      case 'CHECKIN_SUBMITTED':
        await localSanctuaryDb.saveCheckin(event.payload);
        break;
      case 'CYCLE_LOGGED':
      case 'CYCLE_COMFORT_UPDATED':
        await localSanctuaryDb.saveCycle(event.payload);
        break;
      default:
        console.warn('Unknown sync event type:', event.type);
    }
  }
}

// Singleton export
export const driveSync = new DriveSyncEngine();

