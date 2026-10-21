'use client';

import { useState } from 'react';
import {
  ArrowLeft,
  Check,
  Trash2,
  Heart,
  Sparkles,
} from 'lucide-react';
import {
  addListItemAction,
  toggleListItemAction,
  deleteListItemAction,
} from '@/lib/actions/lists';

interface ListItem {
  id: string;
  listId: string;
  content: string;
  isCompleted: boolean;
  completedAt: Date | string | null;
  completedByUserId: string | null;
  sortOrder: number;
}

interface ListDetailViewProps {
  list: {
    id: string;
    title: string;
    category: string;
    icon: string | null;
  };
  items: ListItem[];
  currentUserId: string;
  partnerName: string;
  onBack: () => void;
  onDeleteList: (listId: string) => void;
  onItemAdded?: (item: ListItem) => void;
  onItemToggled?: (item: ListItem) => void;
  onItemDeleted?: (itemId: string) => void;
}

export default function ListDetailView({
  list,
  items,
  currentUserId,
  partnerName,
  onBack,
  onDeleteList,
  onItemAdded,
  onItemToggled,
  onItemDeleted,
}: ListDetailViewProps) {
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [newContent, setNewContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const total = items.length;
  const completedCount = items.filter((i) => i.isCompleted).length;
  const percent = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  const filteredItems = items.filter((item) => {
    if (filter === 'active') return !item.isCompleted;
    if (filter === 'completed') return item.isCompleted;
    return true;
  });

  const handleToggle = async (item: ListItem) => {
    const nextCompleted = !item.isCompleted;

    const updated = {
      ...item,
      isCompleted: nextCompleted,
      completedAt: nextCompleted ? new Date().toISOString() : null,
      completedByUserId: nextCompleted ? currentUserId : null,
    };
    onItemToggled?.(updated);

    try {
      await toggleListItemAction({
        itemId: item.id,
        isCompleted: nextCompleted,
      });
    } catch {
      onItemToggled?.(item);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = newContent.trim();
    if (!content) return;

    setSubmitting(true);
    setNewContent('');

    try {
      const res = await addListItemAction({
        listId: list.id,
        content,
      });

      if (res.success && res.data) {
        onItemAdded?.(res.data);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    onItemDeleted?.(itemId);
    await deleteListItemAction(itemId);
  };

  return (
    <div className="relative bg-white rounded-2xl border border-warmth-200 p-5 sm:p-6 space-y-5 shadow-sm overflow-hidden">
      {/* Decorative Washi Tape */}
      <div className="washi-tape-rose -top-2.5 left-6" />

      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-warmth-200 pt-1">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg text-warmth-600 hover:text-warmth-900 hover:bg-warmth-100 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-serif font-bold text-warmth-900">{list.title}</h2>
              <span className="text-[10px] uppercase font-semibold text-rosewood-800 bg-rose-50 px-2 py-0.5 rounded border border-rosewood-200">
                {list.category.replace('_', ' ')}
              </span>
            </div>
            <p className="text-xs text-warmth-600 mt-0.5">
              {completedCount} of {total} completed ({percent}%)
            </p>
          </div>
        </div>

        <button
          onClick={() => onDeleteList(list.id)}
          className="p-1.5 rounded-lg text-warmth-400 hover:text-rosewood-700 hover:bg-warmth-100 transition text-xs font-medium"
          title="Delete list"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-warmth-100 h-2 rounded-full overflow-hidden p-0.5 border border-warmth-200">
        <div
          className="bg-rosewood-700 h-full rounded-full transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 border-b border-warmth-200 pb-2">
        {[
          { id: 'all', label: `All (${total})` },
          { id: 'active', label: `To Do (${total - completedCount})` },
          { id: 'completed', label: `Completed (${completedCount})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id as any)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
              filter === tab.id
                ? 'bg-rosewood-50 text-rosewood-800 border border-rosewood-200 font-semibold'
                : 'text-warmth-600 hover:text-warmth-900 hover:bg-warmth-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Checkable Items List */}
      <div className="space-y-2">
        {filteredItems.length === 0 ? (
          <div className="py-8 text-center text-xs text-warmth-500 bg-warmth-50/50 rounded-xl border border-warmth-200">
            {filter === 'completed'
              ? 'No completed dreams yet.'
              : filter === 'active'
              ? 'All dreams accomplished! ✨'
              : 'This bucket list is empty. Add your first shared dream below.'}
          </div>
        ) : (
          filteredItems.map((item) => {
            const isCompletedByMe = item.completedByUserId === currentUserId;
            return (
              <div
                key={item.id}
                className={`group p-3 rounded-xl border transition flex items-center justify-between gap-3 ${
                  item.isCompleted
                    ? 'bg-warmth-50/60 border-warmth-200 text-warmth-500'
                    : 'bg-white border-warmth-200 hover:border-warmth-300 text-warmth-900 shadow-2xs'
                }`}
              >
                <div
                  onClick={() => handleToggle(item)}
                  className="flex items-center gap-3 cursor-pointer flex-1 select-none"
                >
                  <div className="shrink-0">
                    {item.isCompleted ? (
                      <div className="w-5 h-5 rounded-full bg-rose-50 text-rosewood-600 flex items-center justify-center border border-rosewood-200 transition-transform active:scale-90">
                        <Heart className="w-3.5 h-3.5 fill-rosewood-600 text-rosewood-600 animate-in zoom-in-75 duration-150" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full border border-warmth-300 bg-white hover:border-rosewood-400 flex items-center justify-center transition-all hover:scale-105">
                        <Heart className="w-3 h-3 text-warmth-300 group-hover:text-rosewood-400 transition-colors" />
                      </div>
                    )}
                  </div>

                  <div>
                    <span
                      className={`text-xs leading-relaxed ${
                        item.isCompleted ? 'line-through text-warmth-500' : 'text-warmth-900 font-medium'
                      }`}
                    >
                      {item.content}
                    </span>
                    {item.isCompleted && (
                      <p className="text-[10px] text-warmth-400 mt-0.5">
                        Completed by {isCompletedByMe ? 'you' : partnerName}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteItem(item.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-warmth-400 hover:text-rosewood-700 transition"
                  title="Delete item"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Quick Add Form */}
      <form onSubmit={handleAddItem} className="pt-2">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="Add an item to this list..."
            className="flex-1 px-3 py-2 text-xs rounded-lg border border-warmth-300 bg-warmth-50/50 text-warmth-900 placeholder-warmth-400 focus:outline-none focus:ring-2 focus:ring-warmth-400 transition"
          />
          <button
            type="submit"
            disabled={submitting || !newContent.trim()}
            className="px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-rosewood-700 hover:bg-rosewood-800 active:scale-95 transition disabled:opacity-50"
          >
            Add
          </button>
        </div>
      </form>
    </div>
  );
}
