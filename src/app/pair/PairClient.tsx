'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  createCoupleAction,
  joinCoupleAction,
  unlinkCoupleAction,
  logOutAction,
} from '@/lib/actions/auth';
import {
  Heart,
  Copy,
  Check,
  Link2,
  Calendar,
  LogOut,
  RefreshCw,
  AlertCircle,
  Users,
} from 'lucide-react';

interface PairClientProps {
  userName: string;
  currentCouple: {
    coupleId: string;
    role: 'creator' | 'partner';
    status: 'pending' | 'paired';
    inviteCode: string;
    anniversaryDate: string | null;
  } | null;
}

export default function PairClient({ userName, currentCouple }: PairClientProps) {
  const router = useRouter();
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [anniversaryDate, setAnniversaryDate] = useState('');
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (currentCouple?.status === 'pending') {
      const interval = setInterval(() => {
        router.refresh();
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [currentCouple, router]);

  const handleCopyCode = () => {
    if (!currentCouple?.inviteCode) return;
    navigator.clipboard.writeText(currentCouple.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCreateCouple = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await createCoupleAction({ anniversaryDate: anniversaryDate || undefined });
      if (res.success) {
        router.refresh();
      } else {
        setError(res.error || 'Failed to create couple space.');
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinCouple = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await joinCoupleAction({ inviteCode: inviteCodeInput.trim() });
      if (res.success) {
        router.push('/');
        router.refresh();
      } else {
        setError(res.error || 'Failed to join couple space.');
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelPending = async () => {
    if (!confirm('Are you sure you want to cancel this invite code?')) return;
    setLoading(true);
    try {
      await unlinkCoupleAction();
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logOutAction();
    router.push('/login');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-warmth-100 flex flex-col justify-between p-4 sm:p-6 text-warmth-900">
      {/* Top bar */}
      <div className="max-w-md w-full mx-auto flex items-center justify-between py-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-warmth-200 text-warmth-800 flex items-center justify-center font-bold text-xs">
            {userName.charAt(0).toUpperCase()}
          </div>
          <span className="text-xs font-medium text-warmth-800">{userName}</span>
        </div>
        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-1.5 text-xs text-warmth-600 hover:text-warmth-900 transition py-1 px-2.5 rounded hover:bg-warmth-200"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign out</span>
        </button>
      </div>

      {/* Main card */}
      <div className="max-w-md w-full mx-auto my-auto">
        {/* State A: Couple created, waiting for partner */}
        {currentCouple?.status === 'pending' ? (
          <div className="bg-white rounded-xl p-6 sm:p-7 border border-warmth-200 text-center space-y-4">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-warmth-100 text-warmth-800 mb-1">
              <Users className="w-6 h-6" />
            </div>

            <div>
              <h2 className="text-lg font-serif font-bold text-warmth-900">
                Waiting for Partner
              </h2>
              <p className="mt-1 text-xs text-warmth-600 leading-relaxed">
                Share this invite code with your partner. Once they sign up and enter the code, your shared space will unlock automatically.
              </p>
            </div>

            {/* Invite code display box */}
            <div className="p-4 rounded-lg bg-warmth-50 border border-warmth-300 flex flex-col items-center gap-2.5">
              <span className="text-[10px] uppercase font-semibold tracking-wider text-warmth-500">
                Couple Invite Code
              </span>
              <div className="text-2xl font-mono font-bold tracking-widest text-warmth-900 select-all">
                {currentCouple.inviteCode}
              </div>
              <button
                onClick={handleCopyCode}
                className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold bg-rosewood-700 hover:bg-rosewood-800 text-white transition active:scale-95"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Code</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center justify-center gap-1.5 text-xs text-warmth-500 pt-1">
              <RefreshCw className="w-3 h-3 animate-spin text-warmth-400" />
              <span>Checking for partner connection</span>
            </div>

            <div className="pt-3 border-t border-warmth-200">
              <button
                onClick={handleCancelPending}
                disabled={loading}
                className="text-xs text-warmth-500 hover:text-rosewood-700 underline transition"
              >
                Cancel and create a new code
              </button>
            </div>
          </div>
        ) : (
          /* State B: Not in a couple space yet -> Create or Join */
          <div className="bg-white rounded-xl p-6 sm:p-7 border border-warmth-200">
            <div className="text-center mb-5">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-warmth-100 text-warmth-800 mb-2">
                <Users className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-serif font-bold text-warmth-900">
                Link with Your Partner
              </h2>
              <p className="mt-0.5 text-xs text-warmth-600">
                Duo is designed exclusively for two partners
              </p>
            </div>

            {/* Mode switcher tabs */}
            <div className="grid grid-cols-2 p-1 bg-warmth-100 rounded-lg mb-5">
              <button
                type="button"
                onClick={() => {
                  setMode('create');
                  setError(null);
                }}
                className={`py-1.5 text-xs font-semibold rounded transition ${
                  mode === 'create'
                    ? 'bg-white text-warmth-900 shadow-sm'
                    : 'text-warmth-600 hover:text-warmth-900'
                }`}
              >
                Create new space
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('join');
                  setError(null);
                }}
                className={`py-1.5 text-xs font-semibold rounded transition ${
                  mode === 'join'
                    ? 'bg-white text-warmth-900 shadow-sm'
                    : 'text-warmth-600 hover:text-warmth-900'
                }`}
              >
                Enter invite code
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rosewood-700 shrink-0 mt-0.5" />
                <p className="text-xs font-semibold text-rosewood-900">{error}</p>
              </div>
            )}

            {mode === 'create' ? (
              <form onSubmit={handleCreateCouple} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-warmth-800 uppercase tracking-wider mb-1">
                    Anniversary / First Date (Optional)
                  </label>
                  <div className="relative rounded-lg">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-warmth-400">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <input
                      type="date"
                      value={anniversaryDate}
                      onChange={(e) => setAnniversaryDate(e.target.value)}
                      className="block w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-warmth-300 bg-warmth-50/50 text-warmth-900 focus:outline-none focus:ring-2 focus:ring-warmth-400 transition"
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-warmth-500">
                    Used to track days together on your dashboard.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-lg text-xs font-semibold text-white bg-rosewood-700 hover:bg-rosewood-800 active:scale-[0.98] transition shadow-sm disabled:opacity-50 mt-1"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>Create Space & Get Code</span>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleJoinCouple} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-warmth-800 uppercase tracking-wider mb-1">
                    Partner&apos;s Invite Code
                  </label>
                  <div className="relative rounded-lg">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-warmth-400">
                      <Link2 className="h-4 w-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={inviteCodeInput}
                      onChange={(e) => setInviteCodeInput(e.target.value.toUpperCase())}
                      placeholder="e.g. DUO-LOVE"
                      className="block w-full pl-9 pr-3 py-2 text-xs font-mono tracking-wider uppercase rounded-lg border border-warmth-300 bg-warmth-50/50 text-warmth-900 placeholder-warmth-400 focus:outline-none focus:ring-2 focus:ring-warmth-400 transition"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-lg text-xs font-semibold text-white bg-rosewood-700 hover:bg-rosewood-800 active:scale-[0.98] transition shadow-sm disabled:opacity-50 mt-1"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>Join Partner</span>
                  )}
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center py-2 text-xs text-warmth-400">
        Duo • Local Space for Two
      </div>
    </div>
  );
}
