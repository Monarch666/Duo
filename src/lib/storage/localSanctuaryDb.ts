/**
 * Client-Side Local Sanctuary IndexedDB Store
 * Provides offline-first persistence for all Duo features directly on the user's phone.
 */

import { SanctuaryMetadata, SyncEvent } from '../drive/types';

const DB_NAME = 'duo_sanctuary_vault';
const DB_VERSION = 2;

export interface LocalCalendarEvent {
  id: string;
  coupleId: string;
  createdById: string;
  title: string;
  description?: string | null;
  category: string;
  startAt: string;
  endAt?: string | null;
  isAllDay: boolean;
  location?: string | null;
  color?: string | null;
  creatorName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LocalList {
  id: string;
  coupleId: string;
  createdById: string;
  title: string;
  category: string;
  color?: string | null;
  icon?: string | null;
  items: LocalListItem[];
  createdAt: string;
  updatedAt: string;
}

export interface LocalListItem {
  id: string;
  listId: string;
  title: string;
  isCompleted: boolean;
  assignedToId?: string | null;
  sortOrder: number;
  completedAt?: string | null;
  completedById?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LocalMemory {
  id: string;
  coupleId: string;
  createdById: string;
  title: string;
  memoryDate: string;
  note?: string | null;
  photoUrl: string;
  driveFileId?: string;
  photoBlobUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LocalPreference {
  id: string;
  coupleId: string;
  userId: string;
  category: string;
  title: string;
  content: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface LocalLoveNote {
  id: string;
  coupleId: string;
  senderId: string;
  receiverId: string;
  content: string;
  noteType: string;
  fontStyle?: string;
  tappedCount: number;
  replyNoteId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LocalCheckin {
  id: string;
  coupleId: string;
  year: number;
  weekNumber: number;
  promptOne: string;
  promptTwo: string;
  partnerOneId: string;
  partnerOneAnswerOne?: string | null;
  partnerOneAnswerTwo?: string | null;
  partnerOneSubmittedAt?: string | null;
  partnerTwoId?: string | null;
  partnerTwoAnswerOne?: string | null;
  partnerTwoAnswerTwo?: string | null;
  partnerTwoSubmittedAt?: string | null;
  revealedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LocalCycle {
  id: string;
  coupleId: string;
  userId: string;
  cycleStartDate: string;
  periodLengthDays: number;
  cycleLengthDays: number;
  currentPhase?: string | null;
  symptoms?: string | null;
  comfortRequest?: string | null;
  comfortRequestedAt?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

function openSanctuaryDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported in this environment'));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      const stores = [
        'metadata',
        'events',
        'lists',
        'list_items',
        'memories',
        'preferences',
        'notes',
        'checkins',
        'cycles',
        'outbox',
      ];

      stores.forEach((storeName) => {
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: 'id' });
        }
      });
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Generic IndexedDB helpers
async function putItem<T extends { id: string }>(storeName: string, item: T): Promise<void> {
  const db = await openSanctuaryDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.put(item);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function getAllItems<T>(storeName: string): Promise<T[]> {
  const db = await openSanctuaryDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

async function getItem<T>(storeName: string, id: string): Promise<T | null> {
  const db = await openSanctuaryDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

async function deleteItem(storeName: string, id: string): Promise<void> {
  const db = await openSanctuaryDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// Public API
export const localSanctuaryDb = {
  // Metadata & Config
  getMetadata: async (): Promise<SanctuaryMetadata | null> => {
    const item = await getItem<{ id: string; data: SanctuaryMetadata }>('metadata', 'sanctuary_meta');
    return item ? item.data : null;
  },

  setMetadata: async (data: SanctuaryMetadata): Promise<void> => {
    await putItem('metadata', { id: 'sanctuary_meta', data });
  },

  // Events
  getAllEvents: () => getAllItems<LocalCalendarEvent>('events'),
  saveEvent: (event: LocalCalendarEvent) => putItem('events', event),
  deleteEvent: (id: string) => deleteItem('events', id),

  // Lists
  getAllLists: async (): Promise<LocalList[]> => {
    const lists = await getAllItems<LocalList>('lists');
    const allItems = await getAllItems<LocalListItem>('list_items');
    return lists.map((l) => ({
      ...l,
      items: allItems
        .filter((i) => i.listId === l.id)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    }));
  },
  saveList: (list: LocalList) => putItem('lists', list),
  deleteList: async (listId: string) => {
    await deleteItem('lists', listId);
    const allItems = await getAllItems<LocalListItem>('list_items');
    for (const item of allItems.filter((i) => i.listId === listId)) {
      await deleteItem('list_items', item.id);
    }
  },
  saveListItem: (item: LocalListItem) => putItem('list_items', item),
  deleteListItem: (id: string) => deleteItem('list_items', id),

  // Memories
  getAllMemories: () => getAllItems<LocalMemory>('memories'),
  saveMemory: (memory: LocalMemory) => putItem('memories', memory),
  deleteMemory: (id: string) => deleteItem('memories', id),

  // Preferences
  getAllPreferences: () => getAllItems<LocalPreference>('preferences'),
  savePreference: (pref: LocalPreference) => putItem('preferences', pref),
  deletePreference: (id: string) => deleteItem('preferences', id),

  // Love Notes
  getAllNotes: () => getAllItems<LocalLoveNote>('notes'),
  saveNote: (note: LocalLoveNote) => putItem('notes', note),
  deleteNote: (id: string) => deleteItem('notes', id),

  // Checkins
  getCheckin: (id: string) => getItem<LocalCheckin>('checkins', id),
  saveCheckin: (checkin: LocalCheckin) => putItem('checkins', checkin),

  // Cycle
  getLatestCycle: async (): Promise<LocalCycle | null> => {
    const cycles = await getAllItems<LocalCycle>('cycles');
    if (cycles.length === 0) return null;
    return cycles.sort(
      (a, b) => new Date(b.cycleStartDate).getTime() - new Date(a.cycleStartDate).getTime()
    )[0];
  },
  saveCycle: (cycle: LocalCycle) => putItem('cycles', cycle),

  // Outbox (Offline Sync Queue)
  getOutbox: () => getAllItems<SyncEvent>('outbox'),
  enqueueSyncEvent: (event: SyncEvent) => putItem('outbox', event),
  removeSyncEvent: (id: string) => deleteItem('outbox', id),
};

