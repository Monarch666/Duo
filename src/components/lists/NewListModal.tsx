'use client';

import { useState } from 'react';
import { X, CheckSquare } from 'lucide-react';
import { createListAction } from '@/lib/actions/lists';

interface NewListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onListCreated: (list: any) => void;
}

const CATEGORIES = [
  { id: 'date_ideas', label: 'Date Ideas' },
  { id: 'gift_ideas', label: 'Gift Ideas' },
  { id: 'bucket_list', label: 'Bucket List' },
  { id: 'groceries', label: 'Groceries' },
  { id: 'custom', label: 'Custom List' },
];

export default function NewListModal({
  isOpen,
  onClose,
  onListCreated,
}: NewListModalProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<any>('date_ideas');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a title for this list.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await createListAction({
        title: title.trim(),
        category,
        icon: 'List',
      });

      if (res.success) {
        onListCreated(res.data);
        onClose();
      } else {
        setError(res.error || 'Failed to create list');
      }
    } catch {
      setError('An unexpected error occurred.');
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
              <CheckSquare className="w-4 h-4" />
            </div>
            <h3 className="text-base font-serif font-bold text-warmth-900">
              Create a Shared List
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
            <label className="block text-xs font-semibold text-warmth-800 uppercase tracking-wider mb-1">
              List Name
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Movies to watch"
              className="block w-full px-3.5 py-2 text-xs rounded-lg border border-warmth-300 bg-warmth-50/50 text-warmth-900 placeholder-warmth-400 focus:outline-none focus:ring-2 focus:ring-warmth-400 transition"
            />
          </div>

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
                  className={`flex items-center gap-2 p-2 rounded-lg text-xs font-medium border transition ${
                    category === cat.id
                      ? 'border-warmth-800 bg-warmth-100 text-warmth-900 font-semibold'
                      : 'border-warmth-200 bg-white text-warmth-700 hover:bg-warmth-50'
                  }`}
                >
                  <span className="truncate">{cat.label}</span>
                </button>
              ))}
            </div>
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
              {loading ? 'Creating...' : 'Create List'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
