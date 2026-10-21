'use client';

import { useState } from 'react';
import {
  Smile,
  Lock,
  Unlock,
  CheckCircle2,
  Clock,
  History,
  ShieldCheck,
} from 'lucide-react';
import { submitCheckinAction, getCheckinHistoryAction } from '@/lib/actions/checkins';

interface CheckinData {
  id: string;
  year: number;
  weekNumber: number;
  promptOne: string;
  promptTwo: string;
  status: 'pending' | 'revealed';
  revealedAt: Date | string | null;
  isRevealed: boolean;
  partnerSubmitted: boolean;
  canReveal: boolean;
  myAnswer: {
    id: string;
    mood: number;
    answerOne: string;
    answerTwo: string;
    submittedAt: Date | string;
    userName: string;
  } | null;
  partnerAnswer: {
    id: string;
    mood: number;
    answerOne: string;
    answerTwo: string;
    submittedAt: Date | string;
    userName: string;
  } | null;
}

interface CheckinViewProps {
  checkin: CheckinData;
  currentUserId: string;
  currentUserName: string;
  partnerName: string;
  onCheckinUpdated?: (updated: any) => void;
}

const MOODS = [
  { value: 1, emoji: '🌧️', label: 'Overwhelmed', desc: 'Need gentle tenderness' },
  { value: 2, emoji: '🥱', label: 'Tired', desc: 'Running on cozy fumes' },
  { value: 3, emoji: '🌿', label: 'Steady', desc: 'Balanced and calm' },
  { value: 4, emoji: '🌸', label: 'Connected', desc: 'Affectionate and close' },
  { value: 5, emoji: '✨', label: 'Joyful', desc: 'Deeply happy and fulfilled' },
];

export default function CheckinView({
  checkin,
  currentUserId,
  currentUserName,
  partnerName,
  onCheckinUpdated,
}: CheckinViewProps) {
  const [mood, setMood] = useState<number>(checkin?.myAnswer?.mood || 5);
  const [answerOne, setAnswerOne] = useState(checkin?.myAnswer?.answerOne || '');
  const [answerTwo, setAnswerTwo] = useState(checkin?.myAnswer?.answerTwo || '');
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const hasMyAnswer = !!checkin?.myAnswer;
  const isRevealed = checkin?.isRevealed;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answerOne.trim() || !answerTwo.trim()) {
      setError('Please answer both prompts before submitting.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await submitCheckinAction({
        checkinId: checkin.id,
        mood,
        answerOne: answerOne.trim(),
        answerTwo: answerTwo.trim(),
      });

      if (res.success) {
        setIsEditing(false);
        const updatedMyAnswer = {
          id: checkin.myAnswer?.id || 'temp',
          mood,
          answerOne: answerOne.trim(),
          answerTwo: answerTwo.trim(),
          submittedAt: new Date().toISOString(),
          userName: currentUserName,
        };

        const updated = {
          ...checkin,
          myAnswer: updatedMyAnswer,
          isRevealed: res.revealedNow || isRevealed,
        };
        onCheckinUpdated?.(updated);
      } else {
        setError(res.error || 'Failed to submit reflection');
      }
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenHistory = async () => {
    setHistoryOpen(true);
    setLoadingHistory(true);
    try {
      const res = await getCheckinHistoryAction();
      if (res.success && res.data) {
        setHistoryList(res.data);
      }
    } finally {
      setLoadingHistory(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="relative bg-white p-5 sm:p-6 rounded-2xl border border-warmth-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 overflow-hidden">
        <div className="washi-tape-butter -top-2.5 left-6" />
        <div className="flex items-center gap-3 pt-1">
          <span className="p-2 rounded-xl bg-rosewood-50 text-rosewood-800 border border-rosewood-200">
            <Smile className="w-5 h-5 text-rosewood-700" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-serif font-bold text-warmth-900">
                Weekly Rituals & Check-in
              </h2>
              {checkin?.weekNumber && (
                <span className="text-[10px] font-mono font-semibold bg-rose-50 text-rosewood-800 border border-rosewood-200 px-2.5 py-0.5 rounded-full">
                  Week {checkin.weekNumber} • {checkin.year}
                </span>
              )}
            </div>
            <p className="text-xs text-warmth-600">
              Wax-sealed weekly prompts to pause, reflect, and stay emotionally attuned
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenHistory}
          className="inline-flex items-center gap-1.5 py-2 px-3.5 rounded-xl text-xs font-semibold border border-warmth-300 text-warmth-700 hover:bg-warmth-100 transition shadow-2xs"
        >
          <History className="w-3.5 h-3.5 text-warmth-500" />
          <span>Ritual Archives</span>
        </button>
      </div>

      {/* STATE A: REVEALED */}
      {isRevealed ? (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Banner */}
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                <Unlock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-emerald-950">
                  Envelopes Unsealed & Revealed
                </h3>
                <p className="text-xs text-emerald-800">
                  Both partners have completed this week&apos;s ritual. Reflections are revealed below.
                </p>
              </div>
            </div>
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-white px-2.5 py-1 rounded border border-emerald-200">
              Revealed
            </span>
          </div>

          {/* Mood Comparison */}
          <div className="bg-white p-5 rounded-2xl border border-warmth-200 shadow-sm">
            <h4 className="text-xs font-bold text-warmth-700 uppercase tracking-wider mb-3">
              Heart Energy & State of Being
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Partner 1 Mood */}
              <div className="p-4 rounded-xl bg-warmth-50/70 border border-warmth-200 flex items-center gap-3.5">
                <span className="text-2xl p-2 bg-white rounded-xl border border-warmth-200 shadow-2xs">
                  {MOODS.find((m) => m.value === checkin.myAnswer?.mood)?.emoji || '✨'}
                </span>
                <div>
                  <span className="text-xs font-bold text-warmth-900 block">
                    You ({currentUserName})
                  </span>
                  <span className="text-xs text-warmth-600 font-medium">
                    {MOODS.find((m) => m.value === checkin.myAnswer?.mood)?.label} —{' '}
                    <span className="italic text-warmth-500">{MOODS.find((m) => m.value === checkin.myAnswer?.mood)?.desc}</span>
                  </span>
                </div>
              </div>

              {/* Partner 2 Mood */}
              <div className="p-4 rounded-xl bg-rose-50/40 border border-rose-200/80 flex items-center gap-3.5">
                <span className="text-2xl p-2 bg-white rounded-xl border border-rose-200 shadow-2xs">
                  {MOODS.find((m) => m.value === checkin.partnerAnswer?.mood)?.emoji || '🌸'}
                </span>
                <div>
                  <span className="text-xs font-bold text-warmth-900 block">
                    {partnerName}
                  </span>
                  <span className="text-xs text-warmth-600 font-medium">
                    {MOODS.find((m) => m.value === checkin.partnerAnswer?.mood)?.label} —{' '}
                    <span className="italic text-warmth-500">{MOODS.find((m) => m.value === checkin.partnerAnswer?.mood)?.desc}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Prompt 1 */}
          <div className="bg-white p-5 rounded-xl border border-warmth-200 space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-warmth-100 text-warmth-800 flex items-center justify-center text-xs font-bold">
                1
              </span>
              <h4 className="text-xs font-bold text-warmth-900">
                {checkin.promptOne}
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="p-3.5 rounded-lg bg-warmth-50 border border-warmth-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-warmth-500 block mb-1">
                  Your Answer
                </span>
                <p className="text-xs text-warmth-800 whitespace-pre-line leading-relaxed">
                  &ldquo;{checkin.myAnswer?.answerOne}&rdquo;
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-warmth-50 border border-warmth-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-warmth-600 block mb-1">
                  {partnerName}&apos;s Answer
                </span>
                <p className="text-xs text-warmth-800 whitespace-pre-line leading-relaxed">
                  &ldquo;{checkin.partnerAnswer?.answerOne}&rdquo;
                </p>
              </div>
            </div>
          </div>

          {/* Prompt 2 */}
          <div className="bg-white p-5 rounded-xl border border-warmth-200 space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-warmth-100 text-warmth-800 flex items-center justify-center text-xs font-bold">
                2
              </span>
              <h4 className="text-xs font-bold text-warmth-900">
                {checkin.promptTwo}
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="p-3.5 rounded-lg bg-warmth-50 border border-warmth-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-warmth-500 block mb-1">
                  Your Answer
                </span>
                <p className="text-xs text-warmth-800 whitespace-pre-line leading-relaxed">
                  &ldquo;{checkin.myAnswer?.answerTwo}&rdquo;
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-warmth-50 border border-warmth-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-warmth-600 block mb-1">
                  {partnerName}&apos;s Answer
                </span>
                <p className="text-xs text-warmth-800 whitespace-pre-line leading-relaxed">
                  &ldquo;{checkin.partnerAnswer?.answerTwo}&rdquo;
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : hasMyAnswer && !isEditing ? (
        /* STATE B: Submitted by me, waiting for partner (Wax-Sealed Envelope) */
        <div className="relative bg-[#FFFDF9] rounded-2xl p-7 sm:p-8 border border-warmth-200 text-center max-w-md mx-auto space-y-4 shadow-sm overflow-hidden">
          {/* Top Washi Tape */}
          <div className="washi-tape-rose -top-2.5 left-1/2 -translate-x-1/2" />

          {/* Wax Seal Emblem */}
          <div className="w-14 h-14 rounded-full bg-rosewood-800 text-rosewood-100 flex items-center justify-center mx-auto shadow-md border-2 border-rosewood-900 font-serif text-xl font-bold animate-pulse">
            ✦
          </div>

          <div className="space-y-1 pt-1">
            <h3 className="text-lg font-serif font-bold text-warmth-900">
              Envelope Sealed & Stamped
            </h3>
            <p className="text-xs text-warmth-600 leading-relaxed max-w-xs mx-auto">
              Your weekly reflection is safely resting in the sanctuary. Both envelopes will unseal together the moment{' '}
              <strong className="text-warmth-900 font-semibold">{partnerName}</strong> completes theirs.
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <div className="p-3 rounded-xl bg-white border border-warmth-200 flex items-center justify-between text-xs shadow-2xs">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold text-warmth-800">Your sealed reflection</span>
              </div>
              <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded text-[11px] border border-emerald-200">
                Safely Sealed
              </span>
            </div>

            <div className="p-3 rounded-xl bg-white border border-warmth-200 flex items-center justify-between text-xs shadow-2xs">
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-rosewood-500 shrink-0" />
                <span className="font-semibold text-warmth-800">
                  Waiting for {partnerName}
                </span>
              </div>
              <span className="text-warmth-500 text-[11px] font-mono">In Transit...</span>
            </div>
          </div>

          <button
            onClick={() => setIsEditing(true)}
            className="text-xs font-semibold text-rosewood-700 hover:text-rosewood-900 hover:underline pt-2 block mx-auto"
          >
            Scribble an edit before reveal
          </button>
        </div>
      ) : (
        /* STATE C: Form input */
        <div className="relative bg-white rounded-2xl p-5 sm:p-7 border border-warmth-200 shadow-sm space-y-5 overflow-hidden">
          <div className="washi-tape-sage -top-2.5 left-6" />
          <div className="border-b border-warmth-200 pb-3 pt-1">
            <h3 className="text-base font-serif font-bold text-warmth-900">
              {isEditing ? 'Update Your Reflections' : 'Weekly Check-in Envelope'}
            </h3>
            <p className="text-xs text-warmth-600 mt-0.5">
              Your words stay private until both of you complete this ritual.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs font-semibold text-rosewood-900">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Mood selector with cute expressive emojis */}
            <div>
              <label className="block text-xs font-bold text-warmth-800 uppercase tracking-wider mb-2.5">
                Heart Energy & Mood this Week
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {MOODS.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setMood(m.value)}
                    className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-1.5 active:scale-95 ${
                      mood === m.value
                        ? 'border-rosewood-600 bg-rose-50/70 text-rosewood-900 font-bold shadow-2xs ring-1 ring-rosewood-500'
                        : 'border-warmth-200 bg-warmth-50/50 hover:bg-white text-warmth-700'
                    }`}
                  >
                    <span className="text-2xl">{m.emoji}</span>
                    <span className="text-xs font-semibold">{m.label}</span>
                    <span className="text-[10px] text-warmth-500 leading-tight">
                      {m.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Prompt 1 */}
            <div>
              <label className="block text-xs font-semibold text-warmth-800 uppercase tracking-wider mb-1.5">
                1. {checkin?.promptOne || 'What made you feel appreciated this week?'}
              </label>
              <textarea
                rows={3}
                required
                value={answerOne}
                onChange={(e) => setAnswerOne(e.target.value)}
                placeholder="Write your reflection here..."
                className="block w-full p-3 text-xs rounded-lg border border-warmth-300 bg-warmth-50/50 text-warmth-900 placeholder-warmth-400 focus:outline-none focus:ring-2 focus:ring-warmth-400 transition resize-none leading-relaxed"
              />
            </div>

            {/* Prompt 2 */}
            <div>
              <label className="block text-xs font-semibold text-warmth-800 uppercase tracking-wider mb-1.5">
                2. {checkin?.promptTwo || 'What is one thing I can do to support you next week?'}
              </label>
              <textarea
                rows={3}
                required
                value={answerTwo}
                onChange={(e) => setAnswerTwo(e.target.value)}
                placeholder="Write your reflection here..."
                className="block w-full p-3 text-xs rounded-lg border border-warmth-300 bg-warmth-50/50 text-warmth-900 placeholder-warmth-400 focus:outline-none focus:ring-2 focus:ring-warmth-400 transition resize-none leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              {isEditing && (
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3.5 py-2 rounded-lg text-xs font-medium text-warmth-700 hover:bg-warmth-100 transition"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-1.5 py-2 px-4 rounded-lg text-xs font-semibold text-white bg-rosewood-700 hover:bg-rosewood-800 active:scale-95 transition shadow-sm disabled:opacity-50"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{submitting ? 'Saving...' : 'Submit Reflection'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Past History Modal */}
      {historyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/35 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl p-6 sm:p-7 max-w-lg w-full shadow-lg border border-warmth-300 max-h-[85vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-warmth-200">
              <h3 className="text-base font-serif font-bold text-warmth-900">
                Check-in Archive
              </h3>
              <button
                onClick={() => setHistoryOpen(false)}
                className="text-xs font-medium text-warmth-500 hover:text-warmth-900"
              >
                Close
              </button>
            </div>

            {loadingHistory ? (
              <div className="py-6 text-center text-xs text-warmth-500">Loading archive...</div>
            ) : historyList.length === 0 ? (
              <div className="py-6 text-center text-xs text-warmth-500">
                No past check-ins archived yet.
              </div>
            ) : (
              <div className="space-y-3">
                {historyList.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-lg border border-warmth-200 bg-warmth-50 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-warmth-900">
                        Week {item.weekNumber} • {item.year}
                      </span>
                      <span className="text-[10px] text-warmth-500">
                        {new Date(item.revealedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-warmth-800">{item.promptOne}</p>
                    <p className="text-xs text-warmth-600 italic">
                      &ldquo;{item.myAnswer?.answerOne}&rdquo;
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
