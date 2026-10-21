'use client';

import { useState } from 'react';
import { X, Sparkles, Send } from 'lucide-react';
import { createDailyPromptAction } from '@/lib/actions/dailyPrompts';

interface DailyPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  partnerName: string;
  onPromptCreated?: (prompt: any) => void;
}

const INSPIRATION_PROMPTS = [
  'If we had 48 hours with zero responsibilities, what would our dream weekend look like?',
  'What is one song that immediately reminds you of our story?',
  'What is your favorite quiet, ordinary memory we shared together?',
  'What is a tiny gesture of mine that always makes you feel cherished?',
  'Where in the world should our next big adventure be?',
  'What is your favorite meal we’ve ever cooked or eaten together?',
];

export default function DailyPromptModal({
  isOpen,
  onClose,
  partnerName,
  onPromptCreated,
}: DailyPromptModalProps) {
  const [promptText, setPromptText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptText.trim()) {
      setError('Please enter a question for both of you.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await createDailyPromptAction({ promptText: promptText.trim() });
      if (res.success && res.data) {
        onPromptCreated?.(res.data);
        onClose();
      } else {
        setError(res.error || 'Failed to set prompt');
      }
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 animate-in fade-in duration-150">
      <div className="relative bg-white rounded-2xl max-w-md w-full shadow-2xl border border-warmth-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-warmth-200 bg-[#FAF7F2]">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
              <Sparkles className="w-4 h-4 text-emerald-700" />
            </span>
            <div>
              <h3 className="text-base font-serif font-bold text-warmth-900">
                Ask a Question for Two
              </h3>
              <p className="text-[11px] text-warmth-600">
                Set today&apos;s reflection prompt for you & {partnerName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-warmth-400 hover:text-warmth-800 hover:bg-warmth-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs font-semibold text-rosewood-900">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-warmth-800 mb-1.5">
              Romantic Suggestions
            </label>
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {INSPIRATION_PROMPTS.map((p, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setPromptText(p)}
                  className="w-full text-left p-2 rounded-lg border border-warmth-200 bg-warmth-50 hover:bg-rose-50/60 hover:border-rose-200 text-xs text-warmth-800 transition line-clamp-1 italic"
                >
                  &ldquo;{p}&rdquo;
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-warmth-800 mb-1.5">
              Today&apos;s Question
            </label>
            <textarea
              rows={3}
              required
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder="e.g. What is one small thing that made you smile today?"
              className="w-full p-3 text-xs rounded-xl border border-warmth-300 bg-warmth-50/50 text-warmth-900 focus:outline-none focus:ring-1 focus:ring-rosewood-400 resize-none font-serif leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-warmth-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-warmth-700 hover:bg-warmth-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !promptText.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rosewood-700 hover:bg-rosewood-800 active:scale-95 transition shadow-sm disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? 'Setting...' : 'Set Question for Two'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
