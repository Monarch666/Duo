'use client';

import { useState, useMemo } from 'react';
import { User, Plus, Edit2, Trash2, Heart } from 'lucide-react';
import PreferenceModal from './PreferenceModal';
import { deletePreferenceAction } from '@/lib/actions/preferences';

interface PreferenceItem {
  id: string;
  coupleId: string;
  userId: string;
  category: string;
  title: string;
  content: string;
  userName: string;
  updatedAt: Date | string;
}

interface PreferencesViewProps {
  preferences: PreferenceItem[];
  currentUserId: string;
  partnerName: string;
  onPreferenceSaved?: (pref: PreferenceItem) => void;
  onPreferenceDeleted?: (id: string) => void;
}

export default function PreferencesView({
  preferences,
  currentUserId,
  partnerName,
  onPreferenceSaved,
  onPreferenceDeleted,
}: PreferencesViewProps) {
  const [activeTab, setActiveTab] = useState<'partner' | 'mine'>('partner');
  const [modalOpen, setModalOpen] = useState(false);
  const [prefToEdit, setPrefToEdit] = useState<PreferenceItem | undefined>(undefined);

  const uniquePreferences = useMemo(() => {
    const seen = new Set<string>();
    const unique: PreferenceItem[] = [];
    for (const p of preferences) {
      if (p.id && !seen.has(p.id)) {
        seen.add(p.id);
        unique.push(p);
      }
    }
    return unique;
  }, [preferences]);

  const partnerPrefs = uniquePreferences.filter((p) => p.userId !== currentUserId);
  const myPrefs = uniquePreferences.filter((p) => p.userId === currentUserId);

  const displayList = activeTab === 'partner' ? partnerPrefs : myPrefs;

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this preference?')) return;
    onPreferenceDeleted?.(id);
    await deletePreferenceAction(id);
  };

  const handleEdit = (pref: PreferenceItem) => {
    setPrefToEdit(pref);
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-xl border border-warmth-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <span className="p-1.5 rounded-lg bg-warmth-100 text-warmth-700">
            <User className="w-4 h-4" />
          </span>
          <div>
            <h2 className="text-base font-serif font-bold text-warmth-900">
              Partner Preferences
            </h2>
            <p className="text-xs text-warmth-600">
              Personal preferences, favorites, coffee orders, and wishlist ideas
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setPrefToEdit(undefined);
            setModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold text-white bg-rosewood-700 hover:bg-rosewood-800 active:scale-95 transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add Preference</span>
        </button>
      </div>

      {/* Vault Switcher Tabs */}
      <div className="grid grid-cols-2 p-1 bg-warmth-100 rounded-lg border border-warmth-200 max-w-sm">
        <button
          onClick={() => setActiveTab('partner')}
          className={`py-1.5 px-3 rounded text-xs font-semibold transition ${
            activeTab === 'partner'
              ? 'bg-white text-warmth-900 shadow-sm'
              : 'text-warmth-600 hover:text-warmth-900'
          }`}
        >
          {partnerName}&apos;s List ({partnerPrefs.length})
        </button>
        <button
          onClick={() => setActiveTab('mine')}
          className={`py-1.5 px-3 rounded text-xs font-semibold transition ${
            activeTab === 'mine'
              ? 'bg-white text-warmth-900 shadow-sm'
              : 'text-warmth-600 hover:text-warmth-900'
          }`}
        >
          My Preferences ({myPrefs.length})
        </button>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {displayList.length === 0 ? (
          <div className="col-span-full bg-white p-8 rounded-xl border border-warmth-200 text-center">
            <User className="w-8 h-8 text-warmth-300 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-warmth-900">
              {activeTab === 'partner'
                ? `${partnerName} has not added preferences yet`
                : 'You have not added any preferences yet'}
            </h3>
            <p className="text-xs text-warmth-600 mt-1 max-w-sm mx-auto">
              {activeTab === 'partner'
                ? `${partnerName} can list their coffee order, comfort foods, and love languages here.`
                : 'Add your exact coffee order, favorite meals, or wishlist notes.'}
            </p>
            {activeTab === 'mine' && (
              <button
                onClick={() => {
                  setPrefToEdit(undefined);
                  setModalOpen(true);
                }}
                className="mt-4 inline-flex items-center gap-1.5 py-1.5 px-3.5 rounded-lg text-xs font-semibold text-white bg-rosewood-700 hover:bg-rosewood-800 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Add Preference</span>
              </button>
            )}
          </div>
        ) : (
          displayList.map((pref) => {
            const isMine = pref.userId === currentUserId;
            return (
              <div
                key={pref.id}
                className="bg-white p-4 sm:p-5 rounded-xl border border-warmth-200 hover:border-warmth-300 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-warmth-600 bg-warmth-100 px-2 py-0.5 rounded">
                      {pref.category.replace('_', ' ')}
                    </span>

                    {isMine && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEdit(pref)}
                          className="p-1 rounded text-warmth-400 hover:text-warmth-700 hover:bg-warmth-100"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(pref.id)}
                          className="p-1 rounded text-warmth-400 hover:text-rosewood-700 hover:bg-warmth-100"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  <h3 className="text-xs font-bold text-warmth-900 mt-1">
                    {pref.title}
                  </h3>

                  <p className="mt-2 text-xs text-warmth-700 whitespace-pre-line leading-relaxed">
                    {pref.content}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-warmth-100 flex items-center justify-between text-[10px] text-warmth-400">
                  <span>{pref.userName}</span>
                  <span>
                    Updated {new Date(pref.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <PreferenceModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          prefToEdit={prefToEdit}
          onSaved={(saved) => {
            onPreferenceSaved?.(saved);
          }}
        />
      )}
    </div>
  );
}
