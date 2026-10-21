'use client';

import { useState } from 'react';
import { X, User } from 'lucide-react';
import { upsertPreferenceAction } from '@/lib/actions/preferences';

interface PreferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefToEdit?: any;
  onSaved: (pref: any) => void;
}

const CATEGORIES = [
  { id: 'favorite_food', label: 'Favorite Foods & Treats' },
  { id: 'love_language', label: 'Love Languages' },
  { id: 'coffee_order', label: 'Coffee / Tea Order' },
  { id: 'gift_ideas', label: 'Gift Ideas / Wishlist' },
  { id: 'comfort_movies', label: 'Comfort Movies / Shows' },
  { id: 'pet_peeves', label: 'Pet Peeves' },
  { id: 'custom', label: 'Custom Note' },
];

export default function PreferenceModal({
  isOpen,
  onClose,
  prefToEdit,
  onSaved,
}: PreferenceModalProps) {
  const isEditing = !!prefToEdit;
  const [category, setCategory] = useState<any>(prefToEdit?.category || 'favorite_food');
  const [title, setTitle] = useState(prefToEdit?.title || '');
  const [content, setContent] = useState(prefToEdit?.content || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError('Please fill in both a title and details.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await upsertPreferenceAction({
        id: prefToEdit?.id,
        category,
        title: title.trim(),
        content: content.trim(),
      });

      if (res.success) {
        onSaved(res.data);
        onClose();
      } else {
        setError(res.error || 'Failed to save preference');
      }
    } catch {
      setError('An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/35 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl p-6 sm:p-7 max-w-md w-full shadow-lg border border-warmth-300">
        <div className="flex items-center justify-between pb-4 border-b border-warmth-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-warmth-100 text-warmth-800 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <h3 className="text-base font-serif font-bold text-warmth-900">
              {isEditing ? 'Edit Preference' : 'Add Preference'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-warmth-400 hover:text-warmth-700 hover:bg-warmth-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs font-semibold text-rosewood-900">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-warmth-800 uppercase tracking-wider mb-1.5">
              Category
            </label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`p-2 rounded-lg text-xs font-medium border text-left transition ${
                    category === cat.id
                      ? 'border-warmth-800 bg-warmth-100 text-warmth-900 font-semibold'
                      : 'border-warmth-200 bg-white text-warmth-700 hover:bg-warmth-50'
                  }`}
                >
                  <span className="truncate block">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-warmth-800 uppercase tracking-wider mb-1">
              Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Daily Coffee Order"
              className="block w-full px-3.5 py-2 text-xs rounded-lg border border-warmth-300 bg-warmth-50/50 text-warmth-900 placeholder-warmth-400 focus:outline-none focus:ring-2 focus:ring-warmth-400 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-warmth-800 uppercase tracking-wider mb-1">
              Details
            </label>
            <textarea
              rows={3}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="e.g. Iced oat latte with light ice."
              className="block w-full px-3.5 py-2 text-xs rounded-lg border border-warmth-300 bg-warmth-50/50 text-warmth-900 placeholder-warmth-400 focus:outline-none focus:ring-2 focus:ring-warmth-400 transition resize-none leading-relaxed"
            />
          </div>

          <div className="pt-3 border-t border-warmth-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-warmth-700 hover:bg-warmth-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-rosewood-700 hover:bg-rosewood-800 active:scale-95 transition shadow-sm disabled:opacity-50"
            >
              {loading ? 'Saving...' : isEditing ? 'Save Changes' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
