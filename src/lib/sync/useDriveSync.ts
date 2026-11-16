/**
 * React Hook for Duo Google Drive Synchronization
 * Manages connection, auto-sync intervals, and tactile UI indicators.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { driveSync } from './driveSync';
import { SyncState, GoogleUser } from '../drive/types';
import { getStoredGoogleUser, signInWithGoogle, clearGoogleUser } from '../drive/auth';

export function useDriveSync(clientId?: string) {
  const [syncState, setSyncState] = useState<SyncState>(driveSync.getState());
  const [currentUser, setCurrentUser] = useState<GoogleUser | null>(null);

  useEffect(() => {
    // 1. Load stored user on mount
    const stored = getStoredGoogleUser();
    if (stored) {
      setCurrentUser(stored);
      driveSync.setUser(stored);
    }

    // 2. Subscribe to sync state changes
    const unsubscribe = driveSync.subscribe((state) => {
      setSyncState(state);
    });

    // 3. Auto-sync on window focus / visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        driveSync.sync();
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', () => driveSync.sync());

    return () => {
      unsubscribe();
      window.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const connectGoogle = useCallback(
    async (webClientId: string) => {
      try {
        const user = await signInWithGoogle(webClientId);
        setCurrentUser(user);
        driveSync.setUser(user);
        return user;
      } catch (err) {
        console.error('Failed to sign in with Google:', err);
        throw err;
      }
    },
    []
  );

  const disconnectGoogle = useCallback(() => {
    clearGoogleUser();
    setCurrentUser(null);
    driveSync.setUser(null);
  }, []);

  const triggerSync = useCallback(() => {
    return driveSync.sync();
  }, []);

  return {
    currentUser,
    syncState,
    connectGoogle,
    disconnectGoogle,
    triggerSync,
    isConnected: !!currentUser && !!syncState.folderId,
  };
}

