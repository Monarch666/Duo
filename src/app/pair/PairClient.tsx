'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
  Sparkles,
  ArrowRight,
  MessageCircle,
  Lock,
  ShieldCheck,
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
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const codeParam = params.get('code');
      if (codeParam) {
        setInviteCodeInput(codeParam.trim().toUpperCase());
        setMode('join');
      }
    }
  }, []);

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
        router.push('/onboarding');
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
            <div className="w-20 h-20 mx-auto rounded-2xl bg-white border-2 border-rosewood-200 p-1 shadow-sm overflow-hidden flex items-center justify-center">
              <img
                src="/images/otter-mascot.png"
                alt="Duo Mascot Otters"
                className="w-full h-full object-contain"
              />
            </div>

            <div>
              <h2 className="text-lg font-serif font-bold text-warmth-900">
                Holding Hands Across the Distance
              </h2>
              <p className="mt-1 text-xs text-warmth-600 leading-relaxed">
                Like sea otters holding hands so ocean tides never separate them, Duo keeps you tethered. Share your secret couple key so your partner otter can lock in!
              </p>
            </div>

            {/* Unique Couple Secret Key display box */}
            <div className="p-4 rounded-xl bg-warmth-50 border-2 border-dashed border-rosewood-300 flex flex-col items-center gap-2.5">
              <span className="text-[10px] uppercase font-bold tracking-widest text-rosewood-700 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5" />
                Your Unique Couple Secret Key
              </span>
              <div className="text-2xl sm:text-3xl font-mono font-bold tracking-widest text-warmth-900 select-all py-1 px-4 bg-white rounded-lg border border-warmth-200 shadow-2xs">
                {currentCouple.inviteCode}
              </div>
              <p className="text-[11px] text-warmth-600 leading-relaxed max-w-xs">
                Send this secret key to your partner. When entered on their phone, both apps permanently couple and sync together.
              </p>
              <div className="flex items-center gap-2 w-full pt-1">
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold bg-white hover:bg-warmth-100 border border-warmth-300 text-warmth-800 transition active:scale-95 shadow-2xs"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-warmth-600" />
                      <span>Copy Key</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const text = `Hey my love 💕 Here is our private Duo Couple Secret Key: ${currentCouple.inviteCode}\n\nDownload Duo and enter this key so our apps lock into our private 2-person chamber!`;
                    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold bg-[#25D366] hover:bg-[#20bd5a] text-white transition active:scale-95 shadow-2xs"
                >
                  <MessageCircle className="w-3.5 h-3.5 fill-white" />
                  <span>Send WhatsApp</span>
                </button>
              </div>
            </div>

            {/* Prepare Sanctuary Callout */}
            <div className="p-3.5 rounded-xl bg-rosewood-50/70 border border-rosewood-200 text-left space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-rosewood-700 shrink-0" />
                <h3 className="text-xs font-serif font-bold text-rosewood-900">
                  Prepare Your Shared Sanctuary
                </h3>
              </div>
              <p className="text-[11px] text-warmth-700 leading-relaxed">
                While you wait for your partner to join, answer 5 quick questions to set up your love language, dream dates, and leave a sealed welcome note.
              </p>
              <Link
                href="/onboarding"
                className="inline-flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-lg text-xs font-semibold bg-rosewood-700 hover:bg-rosewood-800 text-white transition active:scale-[0.98] shadow-sm"
              >
                <span>Fill Out Love Blueprint (Q&A)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
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
              <div className="w-16 h-16 mx-auto rounded-2xl bg-white border border-rosewood-200 p-1 mb-2 shadow-2xs overflow-hidden flex items-center justify-center">
                <img
                  src="/images/otter-mascot.png"
                  alt="Duo Mascot Otters"
                  className="w-full h-full object-contain"
                />
              </div>
              <h2 className="text-lg font-serif font-bold text-warmth-900">
                Link with Your Partner
              </h2>
              <p className="mt-0.5 text-xs text-warmth-600">
                Like sea otters holding hands • Duo connects two hearts
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
                className={`py-2 text-xs font-semibold rounded-lg transition ${
                  mode === 'create'
                    ? 'bg-white text-warmth-900 shadow-sm font-bold'
                    : 'text-warmth-600 hover:text-warmth-900'
                }`}
              >
                1. Create Space (Get Key)
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('join');
                  setError(null);
                }}
                className={`py-2 text-xs font-semibold rounded-lg transition ${
                  mode === 'join'
                    ? 'bg-white text-warmth-900 shadow-sm font-bold'
                    : 'text-warmth-600 hover:text-warmth-900'
                }`}
              >
                2. Enter Partner&apos;s Key
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
                    Partner&apos;s Secret Couple Key
                  </label>
                  <div className="relative rounded-lg">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-warmth-400">
                      <Lock className="h-4 w-4 text-rosewood-600" />
                    </div>
                    <input
                      type="text"
                      required
                      value={inviteCodeInput}
                      onChange={(e) => setInviteCodeInput(e.target.value.toUpperCase())}
                      placeholder="e.g. DUO-7K2M"
                      className="block w-full pl-9 pr-3 py-2.5 text-xs font-mono tracking-widest uppercase rounded-lg border border-warmth-300 bg-white text-warmth-900 placeholder-warmth-400 focus:outline-none focus:ring-2 focus:ring-rosewood-400 transition"
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-warmth-600 leading-relaxed">
                    Paste the key your partner sent you. Once entered, both of your apps will sync together into your private 2-person sanctuary.
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
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Unlock & Couple Apps Together</span>
                    </span>
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
