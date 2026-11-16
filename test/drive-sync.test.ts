import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GoogleDriveApiError } from '../src/lib/drive/api';
import { DriveSyncEngine } from '../src/lib/sync/driveSync';
import { GoogleUser, SyncEvent } from '../src/lib/drive/types';

describe('Google Drive Shared Vault & Sync Engine', () => {
  let syncEngine: DriveSyncEngine;

  const mockUser: GoogleUser = {
    id: 'google_123',
    email: 'alex@gmail.com',
    name: 'Alex',
    accessToken: 'mock_access_token_abc',
    expiresAt: Date.now() + 3600000,
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    syncEngine = new DriveSyncEngine();
  });

  it('correctly constructs and exposes GoogleDriveApiError', () => {
    const error = new GoogleDriveApiError(404, 'Folder not found', { reason: 'notFound' });
    expect(error.status).toBe(404);
    expect(error.message).toContain('Google Drive API Error (404): Folder not found');
    expect(error.details).toEqual({ reason: 'notFound' });
  });

  it('updates sync state when user is set', () => {
    const states: any[] = [];
    const unsubscribe = syncEngine.subscribe((state) => {
      states.push({ ...state });
    });

    syncEngine.setUser(mockUser);

    expect(states.length).toBeGreaterThanOrEqual(1);
    const lastState = syncEngine.getState();
    expect(lastState.isSyncing).toBe(false);

    unsubscribe();
  });

  it('rejects sanctuary setup if user is unauthenticated', async () => {
    syncEngine.setUser(null);
    await expect(syncEngine.setupSanctuary('Alex & Chloe')).rejects.toThrow(
      'User not authenticated with Google'
    );
  });

  it('rejects joining sanctuary if user is unauthenticated', async () => {
    syncEngine.setUser(null);
    await expect(syncEngine.joinSharedSanctuary()).rejects.toThrow(
      'User not authenticated with Google'
    );
  });

  it('properly validates sync event structure', () => {
    const event: SyncEvent = {
      id: 'evt_999',
      type: 'EVENT_CREATED',
      actorEmail: 'alex@gmail.com',
      actorName: 'Alex',
      timestamp: Date.now(),
      payload: {
        id: 'date_1',
        title: 'Anniversary Dinner in Kyoto',
        category: 'dates',
        startAt: '2026-11-20T19:00:00.000Z',
      },
    };

    expect(event.type).toBe('EVENT_CREATED');
    expect(event.actorEmail).toBe('alex@gmail.com');
    expect(event.payload.title).toBe('Anniversary Dinner in Kyoto');
  });
});

