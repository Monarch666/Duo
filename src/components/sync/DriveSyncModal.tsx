'use client';

import { useState } from 'react';
import { useDriveSync } from '@/lib/sync/useDriveSync';
import { driveSync } from '@/lib/sync/driveSync';
import { X, Cloud, ShieldCheck, Heart, RefreshCw, CheckCircle, ExternalLink } from 'lucide-react';

interface DriveSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DriveSyncModal({ isOpen, onClose }: DriveSyncModalProps) {
  const { currentUser, syncState, isConnected, connectGoogle, disconnectGoogle, triggerSync } =
    useDriveSync();
  const [clientId, setClientId] = useState(
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''
  );
  const [sanctuaryName, setSanctuaryName] = useState('Our Sanctuary');
  const [partnerEmail, setPartnerEmail] = useState('');
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConnect = async () => {
    setErrorMessage(null);
    try {
      if (!clientId.trim()) {
        setErrorMessage('Please provide your Google OAuth Client ID to connect.');
        return;
      }
      await connectGoogle(clientId.trim());
      setSuccessMessage('Connected to Google Account! 🌿');
    } catch (err: any) {
      setErrorMessage(err.message || 'Google Sign-In failed');
    }
  };

  const handleCreateSanctuary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setIsSettingUp(true);
    setErrorMessage(null);

    try {
      const { folderId } = await driveSync.setupSanctuary(sanctuaryName, partnerEmail);
      setSuccessMessage(`Sanctuary created in Google Drive! Folder ID: ${folderId}`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create Drive sanctuary');
    } finally {
      setIsSettingUp(false);
    }
  };

  const handleJoinSanctuary = async () => {
    if (!currentUser) return;
    setIsSettingUp(true);
    setErrorMessage(null);

    try {
      const meta = await driveSync.joinSharedSanctuary();
      if (meta) {
        setSuccessMessage(`Joined ${meta.sanctuaryName}! Synced all memories.`);
      } else {
        setErrorMessage('No shared Duo Sanctuary folder found in your Google Drive yet.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to join shared sanctuary');
    } finally {
      setIsSettingUp(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-warmth-900/40 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-warmth-50 border border-warmth-300 rounded-3xl p-6 sm:p-8 shadow-2xl text-warmth-900">
        {/* Washi Tape Metaphor */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-28 h-6 bg-rosewood-200/80 rounded-sm shadow-sm border-t border-b border-rosewood-300/40 pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-warmth-200/60 text-warmth-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6 pt-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-warmth-200 text-rosewood-700 mb-3 shadow-inner">
            <Cloud className="w-6 h-6" />
          </div>
          <h2 className="font-serif text-2xl font-bold tracking-tight text-warmth-900">
            Private Google Drive Sanctuary
          </h2>
          <p className="text-xs sm:text-sm text-warmth-600 mt-1">
            Zero company servers. 15GB free storage for your photos & check-ins.
          </p>
        </div>

        {/* Status / Feedback */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rosewood-50 border border-rosewood-200 text-xs text-rosewood-800">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 rounded-xl bg-sage-50 border border-sage-200 text-xs text-sage-800 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-sage-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Step 1: Connect Google Account */}
        {!currentUser ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-warmth-100 border border-warmth-200 text-xs space-y-2 text-warmth-700">
              <div className="flex items-center gap-2 font-medium text-warmth-900">
                <ShieldCheck className="w-4 h-4 text-sage-700" />
                <span>Minimal Scoped Permissions</span>
              </div>
              <p>
                Duo only requests the <code className="text-rosewood-700">drive.file</code> scope. It
                can <strong>never</strong> access your personal photos or documents—only files created
                inside Duo.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-warmth-800 uppercase tracking-wider mb-1.5">
                Google Web Client ID
              </label>
              <input
                type="text"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="e.g. 123456789-xyz.apps.googleusercontent.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-warmth-300 bg-white text-xs text-warmth-900 focus:outline-none focus:ring-2 focus:ring-rosewood-500/40"
              />
              <p className="text-[11px] text-warmth-500 mt-1">
                Configure in Google Cloud Console with your app domain or Android package.
              </p>
            </div>

            <button
              onClick={handleConnect}
              className="w-full py-3 rounded-xl bg-rosewood-700 hover:bg-rosewood-800 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-[0.99]"
            >
              <Cloud className="w-4 h-4" />
              <span>Sign in with Google</span>
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {/* User Profile Badge */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-warmth-100 border border-warmth-200">
              <div className="flex items-center gap-3">
                {currentUser.imageUrl ? (
                  <img
                    src={currentUser.imageUrl}
                    alt={currentUser.name}
                    className="w-9 h-9 rounded-full border border-warmth-300"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-rosewood-100 text-rosewood-800 flex items-center justify-center font-bold text-xs">
                    {currentUser.name.charAt(0)}
                  </div>
                )}
                <div>
                  <div className="text-xs font-semibold text-warmth-900">{currentUser.name}</div>
                  <div className="text-[11px] text-warmth-600">{currentUser.email}</div>
                </div>
              </div>
              <button
                onClick={disconnectGoogle}
                className="text-xs text-rosewood-700 hover:text-rosewood-900 underline font-medium"
              >
                Disconnect
              </button>
            </div>

            {/* Sync Controls */}
            {isConnected ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-sage-50/70 border border-sage-200 text-xs text-sage-900 space-y-1.5">
                  <div className="font-semibold flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-sage-700" />
                    <span>Sanctuary Folder Active</span>
                  </div>
                  <p className="text-[11px] text-sage-800">
                    Folder ID: <span className="font-mono">{syncState.folderId}</span>
                  </p>
                  <p className="text-[11px] text-sage-700">
                    Changes are automatically backed up to your Google Drive when online.
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => triggerSync()}
                    disabled={syncState.isSyncing}
                    className="flex-1 py-2.5 rounded-xl bg-warmth-200 hover:bg-warmth-300 text-warmth-900 font-medium text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${syncState.isSyncing ? 'animate-spin' : ''}`} />
                    <span>{syncState.isSyncing ? 'Syncing...' : 'Sync Now'}</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Setup or Join Form */
              <div className="space-y-4">
                <form onSubmit={handleCreateSanctuary} className="space-y-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-warmth-700">
                    Create New Couple Sanctuary
                  </div>
                  <div>
                    <label className="block text-xs text-warmth-700 mb-1">Sanctuary Name</label>
                    <input
                      type="text"
                      value={sanctuaryName}
                      onChange={(e) => setSanctuaryName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-warmth-300 bg-white text-xs text-warmth-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-warmth-700 mb-1">
                      Partner's Google Email (for automatic sharing)
                    </label>
                    <input
                      type="email"
                      value={partnerEmail}
                      onChange={(e) => setPartnerEmail(e.target.value)}
                      placeholder="partner@gmail.com"
                      className="w-full px-3 py-2 rounded-xl border border-warmth-300 bg-white text-xs text-warmth-900"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSettingUp}
                    className="w-full py-2.5 rounded-xl bg-rosewood-700 hover:bg-rosewood-800 text-white font-medium text-xs flex items-center justify-center gap-2 transition-transform active:scale-[0.99] disabled:opacity-50"
                  >
                    <Heart className="w-3.5 h-3.5" />
                    <span>{isSettingUp ? 'Creating Folder...' : 'Create Sanctuary Folder'}</span>
                  </button>
                </form>

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-warmth-200" />
                  <span className="flex-shrink mx-3 text-[11px] text-warmth-500 uppercase">Or</span>
                  <div className="flex-grow border-t border-warmth-200" />
                </div>

                <div>
                  <button
                    onClick={handleJoinSanctuary}
                    disabled={isSettingUp}
                    className="w-full py-2.5 rounded-xl border border-warmth-300 hover:bg-warmth-100 text-warmth-800 font-medium text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                  >
                    <span>Join Shared Sanctuary from Partner</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

