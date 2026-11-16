'use client';

import { useState } from 'react';
import { useDriveSync } from '@/lib/sync/useDriveSync';
import { Cloud, CloudCheck, RefreshCw, AlertCircle } from 'lucide-react';
import DriveSyncModal from './DriveSyncModal';

export default function DriveSyncPill() {
  const { syncState, isConnected, triggerSync } = useDriveSync();
  const [modalOpen, setModalOpen] = useState(false);

  // Formatting last synced time
  const formatTime = (ts: number | null) => {
    if (!ts) return 'Never';
    const diffMin = Math.floor((Date.now() - ts) / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!isConnected) {
    return (
      <>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full bg-warmth-200/80 hover:bg-warmth-300/80 text-warmth-800 border border-warmth-300 transition-colors shadow-sm"
          title="Connect to personal Google Drive to sync memories"
        >
          <Cloud className="w-3.5 h-3.5 text-rosewood-700" />
          <span>Connect Drive</span>
        </button>

        {modalOpen && <DriveSyncModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />}
      </>
    );
  }

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full bg-warmth-100 hover:bg-warmth-200/70 text-warmth-800 border border-warmth-300 transition-colors shadow-sm"
        title={`Google Drive Vault Active. Last synced: ${formatTime(syncState.lastSyncedAt)}`}
      >
        {syncState.isSyncing ? (
          <>
            <RefreshCw className="w-3.5 h-3.5 text-warmth-600 animate-spin" />
            <span className="hidden sm:inline">Syncing...</span>
          </>
        ) : !syncState.isOnline ? (
          <>
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="hidden sm:inline">Offline (Cached)</span>
          </>
        ) : syncState.lastError ? (
          <>
            <AlertCircle className="w-3.5 h-3.5 text-rosewood-600" />
            <span className="hidden sm:inline">Sync paused</span>
          </>
        ) : (
          <>
            <span className="w-2 h-2 rounded-full bg-sage-500" />
            <span className="hidden sm:inline">Drive Synced</span>
          </>
        )}
      </button>

      {modalOpen && <DriveSyncModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />}
    </>
  );
}

