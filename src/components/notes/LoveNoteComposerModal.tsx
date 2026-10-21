'use client';

import { useState } from 'react';
import { X, Sparkles, Send, Heart } from 'lucide-react';
import { createLoveNoteAction } from '@/lib/actions/loveNotes';

interface LoveNoteComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
  partnerName: string;
  onNoteCreated?: (note: any) => void;
}

const PAPER_STYLES = [
  { id: 'butter', name: 'Butter Linen', bg: 'bg-[#FCF9EE]', border: 'border-amber-200', tape: 'washi-tape-butter' },
  { id: 'rose', name: 'Vintage Rose', bg: 'bg-[#FFF5F5]', border: 'border-rose-200', tape: 'washi-tape-rose' },
  { id: 'sage', name: 'Matcha Sage', bg: 'bg-[#F4F8F4]', border: 'border-emerald-200', tape: 'washi-tape-sage' },
  { id: 'classic', name: 'Whipped Cream', bg: 'bg-[#FFFDF9]', border: 'border-warmth-200', tape: 'washi-tape-rose' },
];

const TITLE_PRESETS = [
  'Morning Love Note',
  'Thinking of You',
  'A Little Reminder',
  'Midnight Whisper',
  'Just Because ❤️',
];

const SIGNOFF_PRESETS = [
  '— Forever yours',
  '— With all my love',
  '— Your favorite person',
  '— Always & always',
];

export default function LoveNoteComposerModal({
  isOpen,
  onClose,
  partnerName,
  onNoteCreated,
}: LoveNoteComposerModalProps) {
  const [title, setTitle] = useState('Morning Love Note');
  const [content, setContent] = useState('');
  const [signOff, setSignOff] = useState('— Forever yours');
  const [paperStyle, setPaperStyle] = useState<'butter' | 'rose' | 'sage' | 'classic'>('butter');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentPaper = PAPER_STYLES.find((p) => p.id === paperStyle) || PAPER_STYLES[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setError('Please write a message before sending your capsule.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await createLoveNoteAction({
        title: title.trim() || 'Morning Love Note',
        content: content.trim(),
        signOff: signOff.trim() || '— Forever yours',
        paperStyle,
      });

      if (res.success && res.data) {
        onNoteCreated?.(res.data);
        onClose();
      } else {
        setError(res.error || 'Failed to seal love note');
      }
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 animate-in fade-in duration-150 overflow-y-auto">
      <div className="relative bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-warmth-200 overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-warmth-200 bg-[#FAF7F2]">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-rose-50 text-rosewood-700 border border-rosewood-200">
              <Heart className="w-4 h-4 fill-rosewood-600 text-rosewood-600" />
            </span>
            <div>
              <h3 className="text-base font-serif font-bold text-warmth-900">
                Write a Love Note
              </h3>
              <p className="text-[11px] text-warmth-600">
                Seal a handwritten capsule for {partnerName}
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

          {/* Paper Style Selector */}
          <div>
            <label className="block text-xs font-semibold text-warmth-800 mb-1.5">
              Choose Paper Texture
            </label>
            <div className="grid grid-cols-4 gap-2">
              {PAPER_STYLES.map((style) => (
                <button
                  type="button"
                  key={style.id}
                  onClick={() => setPaperStyle(style.id as any)}
                  className={`p-2 rounded-xl border text-center transition ${style.bg} ${
                    paperStyle === style.id
                      ? 'border-rosewood-600 ring-2 ring-rosewood-400 font-bold text-warmth-900 shadow-2xs'
                      : 'border-warmth-200 hover:border-warmth-300 text-warmth-700'
                  }`}
                >
                  <span className="text-[11px] block truncate">{style.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Note Title Presets & Input */}
          <div>
            <label className="block text-xs font-semibold text-warmth-800 mb-1.5">
              Note Title
            </label>
            <div className="flex gap-1.5 overflow-x-auto pb-1.5 no-scrollbar">
              {TITLE_PRESETS.map((p) => (
                <button
                  type="button"
                  key={p}
                  onClick={() => setTitle(p)}
                  className={`px-2.5 py-1 rounded-full text-[11px] whitespace-nowrap transition border ${
                    title === p
                      ? 'bg-rosewood-50 text-rosewood-800 border-rosewood-300 font-semibold'
                      : 'bg-warmth-50 hover:bg-warmth-100 text-warmth-600 border-warmth-200'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Good morning my love"
              className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-warmth-300 bg-warmth-50/50 text-warmth-900 focus:outline-none focus:ring-1 focus:ring-rosewood-400"
            />
          </div>

          {/* Note Body (Live Letter Preview Container) */}
          <div>
            <label className="block text-xs font-semibold text-warmth-800 mb-1.5">
              Your Handwritten Message
            </label>
            <div
              className={`relative rounded-xl p-4 border ${currentPaper.bg} ${currentPaper.border} shadow-inner transition-colors`}
            >
              <textarea
                rows={4}
                required
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={`Write something tender or sweet for ${partnerName}...`}
                className="w-full bg-transparent font-handwriting text-2xl text-warmth-900 placeholder:text-warmth-400 focus:outline-none resize-none leading-relaxed tracking-wide"
              />
            </div>
          </div>

          {/* Sign-off */}
          <div>
            <label className="block text-xs font-semibold text-warmth-800 mb-1.5">
              Sign-off
            </label>
            <div className="flex gap-1.5 overflow-x-auto pb-1.5 no-scrollbar">
              {SIGNOFF_PRESETS.map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => setSignOff(s)}
                  className={`px-2.5 py-1 rounded-full text-[11px] whitespace-nowrap transition border ${
                    signOff === s
                      ? 'bg-rosewood-50 text-rosewood-800 border-rosewood-300 font-semibold'
                      : 'bg-warmth-50 hover:bg-warmth-100 text-warmth-600 border-warmth-200'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={signOff}
              onChange={(e) => setSignOff(e.target.value)}
              placeholder="e.g. — Forever yours"
              className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-warmth-300 bg-warmth-50/50 text-warmth-900 focus:outline-none focus:ring-1 focus:ring-rosewood-400"
            />
          </div>

          {/* Action Buttons */}
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
              disabled={submitting || !content.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rosewood-700 hover:bg-rosewood-800 active:scale-95 transition shadow-sm disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? 'Sealing...' : 'Seal & Send Note'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
