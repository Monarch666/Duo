'use client';

import { useState } from 'react';
import { X, Sparkles, Heart, Flame, Moon, Coffee } from 'lucide-react';
import { logCycleAction } from '@/lib/actions/cycle';
import { COMMON_SYMPTOMS } from '@/lib/utils/cycle';

interface LogCycleModalProps {
  isOpen: boolean;
  onClose: () => void;
  latestCycle?: any;
  onCycleSaved: (cycle: any) => void;
}

export default function LogCycleModal({
  isOpen,
  onClose,
  latestCycle,
  onCycleSaved,
}: LogCycleModalProps) {
  const [startDate, setStartDate] = useState(
    latestCycle?.startDate || new Date().toISOString().split('T')[0]
  );
  const [periodLength, setPeriodLength] = useState<number>(latestCycle?.periodLength || 5);
  const [cycleLength, setCycleLength] = useState<number>(latestCycle?.cycleLength || 28);
  const [flow, setFlow] = useState<'light' | 'medium' | 'heavy' | 'spotting'>(
    latestCycle?.flow || 'medium'
  );
  
  let initialSymptoms: string[] = [];
  try {
    initialSymptoms = typeof latestCycle?.symptoms === 'string'
      ? JSON.parse(latestCycle.symptoms)
      : (latestCycle?.symptoms || []);
  } catch {
    initialSymptoms = [];
  }

  const [symptoms, setSymptoms] = useState<string[]>(initialSymptoms);
  const [mood, setMood] = useState(latestCycle?.mood || 'sensitive');
  const [comfortRequest, setComfortRequest] = useState(latestCycle?.comfortRequest || '');
  const [notes, setNotes] = useState(latestCycle?.notes || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleSymptom = (id: string) => {
    setSymptoms((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await logCycleAction({
      startDate,
      periodLength,
      cycleLength,
      flow,
      symptoms,
      mood,
      comfortRequest,
      notes,
    });

    setLoading(false);
    if (res.success && res.data) {
      onCycleSaved(res.data);
      onClose();
    } else {
      setError(res.error || 'Failed to record cycle details.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-warmth-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-warmth-50 border border-warmth-200/90 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 p-1 rounded-full text-warmth-400 hover:text-warmth-700 hover:bg-warmth-200/50 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <div className="w-9 h-9 rounded-xl bg-rosewood-100 border border-rosewood-200 flex items-center justify-center text-rosewood-700 shadow-sm">
            🌸
          </div>
          <div>
            <h2 className="text-lg font-serif font-bold text-warmth-900 leading-tight">
              Log Period & Cycle
            </h2>
            <p className="text-xs text-warmth-600">
              Helps track her body phases & gives caring advice to partner
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rosewood-50 border border-rosewood-200 text-xs text-rosewood-800 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          {/* Start Date */}
          <div>
            <label className="block text-xs font-semibold text-warmth-800 uppercase tracking-wider mb-1">
              Period Start Date
            </label>
            <input
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-warmth-300 bg-white text-warmth-900 focus:outline-none focus:ring-2 focus:ring-rosewood-400 transition"
            />
          </div>

          {/* Period & Cycle Length Sliders */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex justify-between text-xs font-semibold text-warmth-800 mb-1">
                <span>Period Length</span>
                <span className="text-rosewood-700">{periodLength} days</span>
              </div>
              <input
                type="range"
                min={3}
                max={10}
                value={periodLength}
                onChange={(e) => setPeriodLength(parseInt(e.target.value, 10))}
                className="w-full accent-rosewood-700 cursor-pointer"
              />
              <span className="text-[10px] text-warmth-500">Typically 4–6 days</span>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-warmth-800 mb-1">
                <span>Cycle Length</span>
                <span className="text-rosewood-700">{cycleLength} days</span>
              </div>
              <input
                type="range"
                min={21}
                max={38}
                value={cycleLength}
                onChange={(e) => setCycleLength(parseInt(e.target.value, 10))}
                className="w-full accent-rosewood-700 cursor-pointer"
              />
              <span className="text-[10px] text-warmth-500">Typically 26–30 days</span>
            </div>
          </div>

          {/* Flow Level */}
          <div>
            <label className="block text-xs font-semibold text-warmth-800 uppercase tracking-wider mb-1.5">
              Flow Intensity
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'spotting', label: 'Spotting 💧' },
                { id: 'light', label: 'Light 🩸' },
                { id: 'medium', label: 'Medium 🩸🩸' },
                { id: 'heavy', label: 'Heavy 🩸🩸🩸' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFlow(f.id as any)}
                  className={`py-2 px-1 text-xs rounded-xl border font-medium transition ${
                    flow === f.id
                      ? 'bg-rosewood-700 text-white border-rosewood-700 shadow-sm'
                      : 'bg-white text-warmth-800 border-warmth-200 hover:bg-warmth-100'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Symptoms Checklist */}
          <div>
            <label className="block text-xs font-semibold text-warmth-800 uppercase tracking-wider mb-1.5">
              Current Symptoms & Feelings
            </label>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_SYMPTOMS.map((s) => {
                const selected = symptoms.includes(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleSymptom(s.id)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition ${
                      selected
                        ? 'bg-rosewood-100 text-rosewood-900 border-rosewood-300 font-semibold shadow-xs'
                        : 'bg-white text-warmth-700 border-warmth-200 hover:bg-warmth-100'
                    }`}
                  >
                    <span>{s.emoji}</span>
                    <span>{s.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Comfort Request to Partner */}
          <div>
            <label className="block text-xs font-semibold text-warmth-800 uppercase tracking-wider mb-1">
              Direct Comfort Request for Boyfriend
            </label>
            <input
              type="text"
              value={comfortRequest}
              onChange={(e) => setComfortRequest(e.target.value)}
              placeholder="e.g. Warm ginger tea & back rub tonight please"
              className="w-full px-3 py-2 text-xs rounded-xl border border-warmth-300 bg-white text-warmth-900 placeholder-warmth-400 focus:outline-none focus:ring-2 focus:ring-rosewood-400 transition"
            />
            <span className="text-[10px] text-warmth-500 mt-0.5 block">
              This will gently pop up on your boyfriend’s dashboard with care instructions.
            </span>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-warmth-800 uppercase tracking-wider mb-1">
              Private Diary Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any other bodily feelings, cravings, or memories..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-warmth-300 bg-white text-warmth-900 placeholder-warmth-400 focus:outline-none focus:ring-2 focus:ring-rosewood-400 transition resize-none"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-warmth-600 hover:text-warmth-800 hover:bg-warmth-200/50 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 text-xs font-semibold text-white bg-rosewood-700 hover:bg-rosewood-800 rounded-xl shadow-sm transition active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Sanctuary Cycle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
