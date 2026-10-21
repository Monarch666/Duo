'use client';

import { useState } from 'react';
import {
  X,
  Calendar as CalendarIcon,
  Trash2,
  MapPin,
  Clock,
} from 'lucide-react';
import { createEventAction, updateEventAction, deleteEventAction } from '@/lib/actions/events';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventToEdit?: any;
  defaultDate?: string;
  onEventSaved: (event: any) => void;
  onEventDeleted: (id: string) => void;
}

const CATEGORIES = [
  { id: 'date_night', label: 'Date Night', color: '#B93844' },
  { id: 'anniversary', label: 'Anniversary', color: '#991B1B' },
  { id: 'trip', label: 'Trip / Getaway', color: '#B45309' },
  { id: 'reminder', label: 'Reminder', color: '#4338CA' },
  { id: 'other', label: 'Other', color: '#57534E' },
];

const QUICK_IDEAS = [
  'Dinner reservation',
  'Movie night',
  'Weekend road trip',
  'Picnic in the park',
  'Cook dinner together',
  'Morning coffee walk',
];

const COLORS = ['#B93844', '#991B1B', '#B45309', '#047857', '#4338CA', '#6B21A8'];

export default function EventModal({
  isOpen,
  onClose,
  eventToEdit,
  defaultDate,
  onEventSaved,
  onEventDeleted,
}: EventModalProps) {
  const isEditing = !!eventToEdit;

  const [title, setTitle] = useState(eventToEdit?.title || '');
  const [category, setCategory] = useState(eventToEdit?.category || 'date_night');
  const [startAt, setStartAt] = useState(() => {
    if (eventToEdit?.startAt) return eventToEdit.startAt;
    if (defaultDate) return `${defaultDate}T19:00`;
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}T19:00`;
  });
  const [endAt, setEndAt] = useState(eventToEdit?.endAt || '');
  const [isAllDay, setIsAllDay] = useState(eventToEdit?.isAllDay || false);
  const [location, setLocation] = useState(eventToEdit?.location || '');
  const [description, setDescription] = useState(eventToEdit?.description || '');
  const [color, setColor] = useState(eventToEdit?.color || '#B93844');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please give your date or event a title.');
      return;
    }

    setLoading(true);
    setError(null);

    const payload = {
      title: title.trim(),
      category,
      startAt: isAllDay ? startAt.slice(0, 10) : startAt,
      endAt: endAt ? (isAllDay ? endAt.slice(0, 10) : endAt) : undefined,
      isAllDay,
      location: location.trim() || undefined,
      description: description.trim() || undefined,
      color,
    };

    try {
      if (isEditing) {
        const res = await updateEventAction({ id: eventToEdit.id, ...payload });
        if (res.success) {
          onEventSaved(res.data);
          onClose();
        } else {
          setError(res.error || 'Failed to update event');
        }
      } else {
        const res = await createEventAction(payload);
        if (res.success) {
          onEventSaved(res.data);
          onClose();
        } else {
          setError(res.error || 'Failed to create event');
        }
      }
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!eventToEdit?.id) return;
    if (!confirm('Are you sure you want to delete this event?')) return;

    setLoading(true);
    try {
      const res = await deleteEventAction(eventToEdit.id);
      if (res.success) {
        onEventDeleted(eventToEdit.id);
        onClose();
      } else {
        setError(res.error || 'Failed to delete event');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/35 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl p-6 sm:p-7 max-w-lg w-full shadow-lg border border-warmth-300 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-warmth-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-warmth-100 text-warmth-800 flex items-center justify-center">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <h3 className="text-base font-serif font-bold text-warmth-900">
              {isEditing ? 'Edit Event' : 'Add Event to Calendar'}
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
          {/* Quick Idea Chips */}
          {!isEditing && (
            <div>
              <span className="text-[11px] font-semibold text-warmth-600 uppercase tracking-wider block mb-2">
                Suggestions
              </span>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_IDEAS.map((idea) => (
                  <button
                    key={idea}
                    type="button"
                    onClick={() => setTitle(idea)}
                    className="text-xs px-2.5 py-1 rounded-md bg-warmth-100 hover:bg-warmth-200 text-warmth-800 border border-warmth-200 transition"
                  >
                    {idea}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-warmth-800 uppercase tracking-wider mb-1">
              Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Dinner by the waterfront"
              className="block w-full px-3.5 py-2 text-xs rounded-lg border border-warmth-300 bg-warmth-50/50 text-warmth-900 placeholder-warmth-400 focus:outline-none focus:ring-2 focus:ring-warmth-400 transition"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-warmth-800 uppercase tracking-wider mb-1.5">
              Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setCategory(cat.id);
                    setColor(cat.color);
                  }}
                  className={`flex items-center gap-2 p-2 rounded-lg text-xs font-medium border transition ${
                    category === cat.id
                      ? 'border-warmth-800 bg-warmth-100 text-warmth-900 font-semibold'
                      : 'border-warmth-200 bg-white text-warmth-700 hover:bg-warmth-50'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="truncate">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-warmth-800 uppercase tracking-wider mb-1">
                Start {isAllDay ? 'Date' : 'Date and Time'}
              </label>
              <input
                type={isAllDay ? 'date' : 'datetime-local'}
                required
                value={isAllDay ? startAt.slice(0, 10) : startAt}
                onChange={(e) => setStartAt(e.target.value)}
                className="block w-full px-3 py-1.5 text-xs rounded-lg border border-warmth-300 bg-warmth-50/50 text-warmth-900 focus:outline-none focus:ring-2 focus:ring-warmth-400 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-warmth-800 uppercase tracking-wider mb-1">
                End {isAllDay ? 'Date' : 'Time (Optional)'}
              </label>
              <input
                type={isAllDay ? 'date' : 'datetime-local'}
                value={isAllDay && endAt ? endAt.slice(0, 10) : endAt}
                onChange={(e) => setEndAt(e.target.value)}
                className="block w-full px-3 py-1.5 text-xs rounded-lg border border-warmth-300 bg-warmth-50/50 text-warmth-900 focus:outline-none focus:ring-2 focus:ring-warmth-400 transition"
              />
            </div>
          </div>

          {/* All Day Switch */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="allDayCheck"
              checked={isAllDay}
              onChange={(e) => setIsAllDay(e.target.checked)}
              className="w-4 h-4 text-warmth-800 rounded border-warmth-300 focus:ring-warmth-400 cursor-pointer"
            />
            <label htmlFor="allDayCheck" className="text-xs text-warmth-700 cursor-pointer select-none">
              All-day event
            </label>
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-semibold text-warmth-800 uppercase tracking-wider mb-1">
              Location
            </label>
            <div className="relative rounded-lg">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-warmth-400">
                <MapPin className="h-3.5 w-3.5" />
              </div>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Waterfront Bistro"
                className="block w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-warmth-300 bg-warmth-50/50 text-warmth-900 placeholder-warmth-400 focus:outline-none focus:ring-2 focus:ring-warmth-400 transition"
              />
            </div>
          </div>

          {/* Color Tag */}
          <div>
            <label className="block text-xs font-semibold text-warmth-800 uppercase tracking-wider mb-1.5">
              Tag Color
            </label>
            <div className="flex items-center gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  style={{ backgroundColor: c }}
                  className={`w-5 h-5 rounded-full transition-transform ${
                    color === c ? 'scale-125 ring-2 ring-offset-2 ring-warmth-600' : 'hover:scale-110'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-warmth-800 uppercase tracking-wider mb-1">
              Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Reservation confirmed under Sarah"
              className="block w-full px-3 py-2 text-xs rounded-lg border border-warmth-300 bg-warmth-50/50 text-warmth-900 placeholder-warmth-400 focus:outline-none focus:ring-2 focus:ring-warmth-400 transition resize-none leading-relaxed"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-warmth-200 flex items-center justify-between gap-3">
            {isEditing ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-rosewood-700 bg-rose-50 hover:bg-rose-100 transition disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
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
                {loading ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Event'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
