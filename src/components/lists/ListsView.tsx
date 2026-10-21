'use client';

import { useState, useMemo } from 'react';
import {
  CheckSquare,
  Plus,
  ChevronRight,
  List as ListIcon,
} from 'lucide-react';
import NewListModal from './NewListModal';
import ListDetailView from './ListDetailView';
import { deleteListAction, getListWithItemsAction } from '@/lib/actions/lists';

interface SharedList {
  id: string;
  title: string;
  category: 'date_ideas' | 'gift_ideas' | 'bucket_list' | 'groceries' | 'custom';
  icon: string | null;
  totalItems: number;
  completedItems: number;
  items?: any[];
}

interface ListsViewProps {
  lists: SharedList[];
  currentUserId: string;
  partnerName: string;
  onListCreated?: (list: SharedList) => void;
  onListDeleted?: (listId: string) => void;
  onItemAdded?: (item: any) => void;
  onItemToggled?: (item: any) => void;
  onItemDeleted?: (itemId: string) => void;
}

const CATEGORY_TABS = [
  { id: 'all', label: 'All Lists' },
  { id: 'date_ideas', label: 'Date Ideas' },
  { id: 'bucket_list', label: 'Bucket List' },
  { id: 'groceries', label: 'Groceries' },
  { id: 'gift_ideas', label: 'Gift Ideas' },
  { id: 'custom', label: 'Custom' },
];

export default function ListsView({
  lists,
  currentUserId,
  partnerName,
  onListCreated,
  onListDeleted,
  onItemAdded,
  onItemToggled,
  onItemDeleted,
}: ListsViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [activeListDetails, setActiveListDetails] = useState<any | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const filteredLists = useMemo(() => {
    const seen = new Set<string>();
    const unique: SharedList[] = [];
    for (const l of lists) {
      if (l.id && !seen.has(l.id)) {
        seen.add(l.id);
        unique.push(l);
      }
    }
    if (selectedCategory === 'all') return unique;
    return unique.filter((l) => l.category === selectedCategory);
  }, [lists, selectedCategory]);

  const handleOpenList = async (list: SharedList) => {
    setActiveListId(list.id);
    try {
      const res = await getListWithItemsAction(list.id);
      if (res.success && res.data) {
        setActiveListDetails(res.data);
      }
    } catch {
      // ignore
    }
  };

  const handleDeleteList = async (listId: string) => {
    if (!confirm('Are you sure you want to delete this list and all its items?')) return;
    await deleteListAction(listId);
    onListDeleted?.(listId);
    if (activeListId === listId) {
      setActiveListId(null);
      setActiveListDetails(null);
    }
  };

  if (activeListId && activeListDetails) {
    return (
      <ListDetailView
        list={activeListDetails}
        items={activeListDetails.items || []}
        currentUserId={currentUserId}
        partnerName={partnerName}
        onBack={() => {
          setActiveListId(null);
          setActiveListDetails(null);
        }}
        onDeleteList={handleDeleteList}
        onItemAdded={(item) => {
          setActiveListDetails((prev: any) => {
            if (!prev) return prev;
            const alreadyExists = prev.items?.some((i: any) => i.id === item.id);
            if (alreadyExists) return prev;
            return {
              ...prev,
              items: [item, ...(prev.items || [])],
              totalItems: (prev.totalItems || 0) + 1,
            };
          });
          onItemAdded?.(item);
        }}
        onItemToggled={(item) => {
          setActiveListDetails((prev: any) => ({
            ...prev,
            items: (prev?.items || []).map((i: any) => (i.id === item.id ? item : i)),
            completedItems: (prev?.items || []).filter((i: any) =>
              i.id === item.id ? item.isCompleted : i.isCompleted
            ).length,
          }));
          onItemToggled?.(item);
        }}
        onItemDeleted={(itemId) => {
          setActiveListDetails((prev: any) => ({
            ...prev,
            items: (prev?.items || []).filter((i: any) => i.id !== itemId),
            totalItems: Math.max(0, (prev?.totalItems || 1) - 1),
          }));
          onItemDeleted?.(itemId);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-xl border border-warmth-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-warmth-100 text-warmth-700">
            <CheckSquare className="w-4 h-4" />
          </span>
          <div>
            <h2 className="text-base font-serif font-bold text-warmth-900">
              Shared Lists
            </h2>
            <p className="text-xs text-warmth-600">
              Date ideas, bucket lists, gifts, and groceries
            </p>
          </div>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold text-white bg-rosewood-700 hover:bg-rosewood-800 active:scale-95 transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>New List</span>
        </button>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {CATEGORY_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedCategory(tab.id)}
            className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition ${
              selectedCategory === tab.id
                ? 'bg-rosewood-700 text-white font-semibold'
                : 'bg-white text-warmth-700 border border-warmth-200 hover:bg-warmth-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Lists Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {filteredLists.length === 0 ? (
          <div className="col-span-full bg-white p-8 rounded-xl border border-warmth-200 text-center">
            <ListIcon className="w-8 h-8 text-warmth-300 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-warmth-900">No lists in this category</h3>
            <p className="text-xs text-warmth-600 mt-1">
              Create a list to share items with your partner.
            </p>
            <button
              onClick={() => setModalOpen(true)}
              className="mt-4 inline-flex items-center gap-1.5 py-1.5 px-3.5 rounded-lg text-xs font-semibold text-white bg-rosewood-700 hover:bg-rosewood-800 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Create List</span>
            </button>
          </div>
        ) : (
          filteredLists.map((list) => {
            const total = list.totalItems || 0;
            const completed = list.completedItems || 0;
            const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

            return (
              <div
                key={list.id}
                onClick={() => handleOpenList(list)}
                className="bg-white p-4 rounded-xl border border-warmth-200 hover:border-warmth-400 transition cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-warmth-400" />
                      <h3 className="text-xs font-bold text-warmth-900 truncate">
                        {list.title}
                      </h3>
                    </div>

                    <ChevronRight className="w-3.5 h-3.5 text-warmth-400" />
                  </div>

                  <span className="text-[10px] uppercase font-semibold text-warmth-500 pl-4 block">
                    {list.category.replace('_', ' ')}
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-warmth-100">
                  <div className="flex items-center justify-between text-[11px] text-warmth-600 mb-1.5">
                    <span>
                      {completed} of {total} done
                    </span>
                    <span className="font-mono text-warmth-700 font-semibold">{pct}%</span>
                  </div>
                  <div className="w-full bg-warmth-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-rosewood-700 h-full rounded-full transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* New List Modal */}
      {modalOpen && (
        <NewListModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onListCreated={(newList) => {
            onListCreated?.(newList);
          }}
        />
      )}
    </div>
  );
}
