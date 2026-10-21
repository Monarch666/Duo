'use client';

import { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  MapPin,
  List,
  Grid,
  Edit2,
} from 'lucide-react';
import EventModal from './EventModal';

interface CalendarEvent {
  id: string;
  coupleId: string;
  createdByUserId: string;
  creatorName: string;
  title: string;
  description: string | null;
  category: 'anniversary' | 'date_night' | 'trip' | 'reminder' | 'other';
  startAt: string;
  endAt: string | null;
  isAllDay: boolean;
  location: string | null;
  color: string;
}

interface CalendarViewProps {
  events: CalendarEvent[];
  currentUserId: string;
  partnerName: string;
  onEventCreated?: (event: CalendarEvent) => void;
  onEventUpdated?: (event: CalendarEvent) => void;
  onEventDeleted?: (id: string) => void;
}

const CATEGORIES = [
  { id: 'all', label: 'All Dates' },
  { id: 'date_night', label: 'Date Nights' },
  { id: 'anniversary', label: 'Anniversaries' },
  { id: 'trip', label: 'Trips' },
  { id: 'reminder', label: 'Reminders' },
];

export default function CalendarView({
  events,
  currentUserId,
  partnerName,
  onEventCreated,
  onEventUpdated,
  onEventDeleted,
}: CalendarViewProps) {
  const [viewMode, setViewMode] = useState<'month' | 'list'>('month');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDayEvents, setSelectedDayEvents] = useState<{
    dateStr: string;
    events: CalendarEvent[];
  } | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<CalendarEvent | undefined>(undefined);
  const [selectedDateForModal, setSelectedDateForModal] = useState<string | undefined>(undefined);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDayEvents(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDayEvents(null);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
    setSelectedDayEvents(null);
  };

  const filteredEvents = useMemo(() => {
    const seen = new Set<string>();
    const unique: CalendarEvent[] = [];
    for (const e of events) {
      if (e.id && !seen.has(e.id)) {
        seen.add(e.id);
        unique.push(e);
      }
    }
    if (selectedCategory === 'all') return unique;
    return unique.filter((e) => e.category === selectedCategory);
  }, [events, selectedCategory]);

  const { daysMatrix, monthName } = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const totalDays = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const monthName = firstDay.toLocaleString('default', { month: 'long', year: 'numeric' });

    const formatLocalDate = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    const matrix: Array<{
      date: Date;
      isCurrentMonth: boolean;
      dateStr: string;
      events: CalendarEvent[];
      isToday: boolean;
    }> = [];

    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthLastDay - i);
      const dateStr = formatLocalDate(d);
      matrix.push({
        date: d,
        isCurrentMonth: false,
        dateStr,
        events: filteredEvents.filter((e) => e.startAt.startsWith(dateStr)),
        isToday: false,
      });
    }

    const todayStr = formatLocalDate(new Date());
    for (let i = 1; i <= totalDays; i++) {
      const d = new Date(year, month, i);
      const dateStr = formatLocalDate(d);
      matrix.push({
        date: d,
        isCurrentMonth: true,
        dateStr,
        events: filteredEvents.filter((e) => e.startAt.startsWith(dateStr)),
        isToday: dateStr === todayStr,
      });
    }

    const remaining = 35 - matrix.length > 0 ? 35 - matrix.length : 42 - matrix.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      const dateStr = formatLocalDate(d);
      matrix.push({
        date: d,
        isCurrentMonth: false,
        dateStr,
        events: filteredEvents.filter((e) => e.startAt.startsWith(dateStr)),
        isToday: false,
      });
    }

    return { daysMatrix: matrix, monthName };
  }, [year, month, filteredEvents]);

  const handleOpenCreateModal = (dateStr?: string) => {
    setEventToEdit(undefined);
    const todayFormatted = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;
    setSelectedDateForModal(dateStr || todayFormatted);
    setModalOpen(true);
  };

  const handleEditEvent = (event: CalendarEvent) => {
    setEventToEdit(event);
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Controls */}
      <div className="relative bg-white p-5 sm:p-6 rounded-2xl border border-warmth-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 overflow-hidden">
        <div className="washi-tape-rose -top-2.5 left-6" />
        <div className="pt-1">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-rosewood-50 text-rosewood-800 border border-rosewood-200">
              <CalendarIcon className="w-5 h-5 text-rosewood-700" />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-serif font-bold text-warmth-900">
                Shared Dates & Adventures
              </h2>
              <p className="text-xs text-warmth-600">
                Postcards, date nights, weekend trips, and anniversaries
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="inline-flex p-1 rounded-xl bg-warmth-100 border border-warmth-200">
            <button
              onClick={() => setViewMode('month')}
              className={`p-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                viewMode === 'month'
                  ? 'bg-white text-rosewood-900 shadow-2xs font-bold'
                  : 'text-warmth-600 hover:text-warmth-900'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Calendar</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                viewMode === 'list'
                  ? 'bg-white text-rosewood-900 shadow-2xs font-bold'
                  : 'text-warmth-600 hover:text-warmth-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Postcards</span>
            </button>
          </div>

          <button
            onClick={() => handleOpenCreateModal()}
            className="inline-flex items-center gap-1.5 py-2 px-3.5 rounded-xl text-xs font-semibold text-white bg-rosewood-700 hover:bg-rosewood-800 active:scale-95 transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Plan Date</span>
          </button>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition ${
              selectedCategory === cat.id
                ? 'bg-rosewood-700 text-white font-semibold'
                : 'bg-white text-warmth-700 border border-warmth-200 hover:bg-warmth-100'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* MONTH VIEW */}
      {viewMode === 'month' && (
        <div className="bg-white rounded-xl border border-warmth-200 overflow-hidden">
          {/* Navigation Bar */}
          <div className="px-5 py-3.5 border-b border-warmth-200 flex items-center justify-between">
            <h3 className="text-sm font-serif font-bold text-warmth-900">
              {monthName}
            </h3>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleToday}
                className="px-2.5 py-1 text-xs font-medium rounded border border-warmth-300 text-warmth-700 hover:bg-warmth-100 transition"
              >
                Today
              </button>
              <button
                onClick={handlePrevMonth}
                className="p-1 rounded border border-warmth-300 text-warmth-700 hover:bg-warmth-100 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-1 rounded border border-warmth-300 text-warmth-700 hover:bg-warmth-100 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 border-b border-warmth-200 bg-warmth-50 text-center text-[11px] font-semibold uppercase tracking-wider text-warmth-500 py-2">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Month Days Grid */}
          <div className="grid grid-cols-7 divide-x divide-y divide-warmth-200">
            {daysMatrix.map((cell, idx) => (
              <div
                key={idx}
                onClick={() => {
                  setSelectedDayEvents({
                    dateStr: cell.dateStr,
                    events: cell.events,
                  });
                }}
                className={`min-h-[72px] sm:min-h-[88px] p-1.5 sm:p-2 cursor-pointer transition flex flex-col justify-between ${
                  !cell.isCurrentMonth
                    ? 'bg-warmth-50/40 text-warmth-400'
                    : 'bg-white hover:bg-warmth-50/80'
                } ${cell.isToday ? 'ring-1 ring-inset ring-rosewood-500 bg-rose-50/20' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center justify-center w-5 h-5 text-xs font-semibold rounded ${
                      cell.isToday
                        ? 'bg-rosewood-700 text-white'
                        : cell.isCurrentMonth
                        ? 'text-warmth-900'
                        : 'text-warmth-400'
                    }`}
                  >
                    {cell.date.getDate()}
                  </span>
                  {cell.events.length > 0 && (
                    <span className="hidden sm:inline-block text-[10px] text-warmth-500 font-medium">
                      {cell.events.length}
                    </span>
                  )}
                </div>

                <div className="space-y-1 mt-1 overflow-hidden">
                  {cell.events.slice(0, 2).map((evt) => (
                    <div
                      key={evt.id}
                      style={{ borderLeftColor: evt.color || '#B93844' }}
                      className="px-1.5 py-0.5 rounded text-[10px] font-medium truncate border-l-2 bg-warmth-100 text-warmth-900"
                    >
                      {evt.title}
                    </div>
                  ))}
                  {cell.events.length > 2 && (
                    <p className="text-[9px] text-warmth-500 font-medium pl-1">
                      +{cell.events.length - 2} more
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Selected Day Detail Pop-out */}
          {selectedDayEvents && (
            <div className="p-4 border-t border-warmth-200 bg-warmth-50">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-warmth-900">
                  Events on {selectedDayEvents.dateStr}
                </h4>
                <button
                  onClick={() => handleOpenCreateModal(selectedDayEvents.dateStr)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-rosewood-700 hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add event for this day</span>
                </button>
              </div>

              {selectedDayEvents.events.length === 0 ? (
                <div className="py-3 text-center text-xs text-warmth-500 bg-white rounded border border-warmth-200">
                  No events scheduled for this day.
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedDayEvents.events.map((evt) => (
                    <div
                      key={evt.id}
                      className="p-3 bg-white rounded-lg border border-warmth-200 flex items-center justify-between shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-2.5 h-7 rounded"
                          style={{ backgroundColor: evt.color || '#B93844' }}
                        />
                        <div>
                          <p className="text-xs font-semibold text-warmth-900">{evt.title}</p>
                          <p className="text-[11px] text-warmth-600">
                            {evt.isAllDay ? 'All Day' : evt.startAt.slice(11, 16)}
                            {evt.location ? ` • ${evt.location}` : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-semibold text-warmth-600 bg-warmth-100 px-2 py-0.5 rounded">
                          {evt.category.replace('_', ' ')}
                        </span>
                        <button
                          onClick={() => handleEditEvent(evt)}
                          className="p-1 rounded text-warmth-400 hover:text-warmth-700 hover:bg-warmth-100"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* LIST VIEW */}
      {viewMode === 'list' && (
        <div className="space-y-3">
          {filteredEvents.length === 0 ? (
            <div className="bg-white p-8 rounded-xl border border-warmth-200 text-center">
              <CalendarIcon className="w-8 h-8 text-warmth-300 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-warmth-900">No events found</h3>
              <p className="text-xs text-warmth-600 mt-1">
                Schedule a date or upcoming event to see it here.
              </p>
              <button
                onClick={() => handleOpenCreateModal()}
                className="mt-4 inline-flex items-center gap-1.5 py-1.5 px-3.5 rounded-lg text-xs font-semibold text-white bg-rosewood-700 hover:bg-rosewood-800 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Create Event</span>
              </button>
            </div>
          ) : (
            filteredEvents.map((evt) => (
              <div
                key={evt.id}
                className="bg-white p-4 rounded-xl border border-warmth-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-warmth-300 transition"
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className="w-11 h-11 rounded-lg flex flex-col items-center justify-center text-white shrink-0"
                    style={{ backgroundColor: evt.color || '#B93844' }}
                  >
                    <span className="text-[10px] font-bold uppercase leading-none">
                      {new Date(evt.startAt).toLocaleString('default', { month: 'short' })}
                    </span>
                    <span className="text-sm font-bold font-mono leading-tight mt-0.5">
                      {new Date(evt.startAt).getDate()}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-warmth-900">{evt.title}</h4>
                      <span className="text-[10px] uppercase font-semibold text-warmth-600 bg-warmth-100 px-1.5 py-0.5 rounded">
                        {evt.category.replace('_', ' ')}
                      </span>
                    </div>

                    {evt.description && (
                      <p className="mt-1 text-xs text-warmth-600 leading-relaxed">
                        {evt.description}
                      </p>
                    )}

                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-warmth-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-warmth-400" />
                        {evt.isAllDay ? 'All Day' : evt.startAt.slice(11, 16)}
                      </span>
                      {evt.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-warmth-500" />
                          {evt.location}
                        </span>
                      )}
                      <span className="text-[11px] text-warmth-400">
                        Added by {evt.creatorName || (evt.createdByUserId === currentUserId ? 'You' : partnerName)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="sm:self-center">
                  <button
                    onClick={() => handleEditEvent(evt)}
                    className="inline-flex items-center gap-1 py-1 px-2.5 rounded text-xs font-medium border border-warmth-300 text-warmth-700 hover:bg-warmth-100 transition"
                  >
                    <Edit2 className="w-3 h-3 text-warmth-500" />
                    <span>Edit</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <EventModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          eventToEdit={eventToEdit}
          defaultDate={selectedDateForModal}
          onEventSaved={(saved) => {
            if (eventToEdit) {
              onEventUpdated?.(saved);
            } else {
              onEventCreated?.(saved);
            }
          }}
          onEventDeleted={(id) => {
            onEventDeleted?.(id);
          }}
        />
      )}
    </div>
  );
}
