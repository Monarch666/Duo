'use client';

import { useState, useMemo } from 'react';
import { Camera, Plus, Trash2, ZoomIn, X } from 'lucide-react';
import MemoryModal from './MemoryModal';
import { deleteMemoryAction } from '@/lib/actions/memories';

interface MemoryItem {
  id: string;
  coupleId: string;
  createdByUserId: string;
  creatorName: string;
  title: string;
  memoryDate: string;
  note: string | null;
  photoPath: string | null;
  createdAt: Date | string;
}

interface MemoriesViewProps {
  memories: MemoryItem[];
  currentUserId: string;
  partnerName: string;
  onMemoryCreated?: (memory: MemoryItem) => void;
  onMemoryDeleted?: (id: string) => void;
}

export default function MemoriesView({
  memories,
  currentUserId,
  partnerName,
  onMemoryCreated,
  onMemoryDeleted,
}: MemoriesViewProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [zoomedPhoto, setZoomedPhoto] = useState<string | null>(null);

  const uniqueMemories = useMemo(() => {
    const seen = new Set<string>();
    const unique: MemoryItem[] = [];
    for (const m of memories) {
      if (m.id && !seen.has(m.id)) {
        seen.add(m.id);
        unique.push(m);
      }
    }
    return unique;
  }, [memories]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this memory?')) return;
    onMemoryDeleted?.(id);
    await deleteMemoryAction(id);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="relative bg-white p-5 sm:p-6 rounded-2xl border border-warmth-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 overflow-hidden">
        <div className="washi-tape-sage -top-2.5 left-6" />
        <div className="flex items-center gap-3 pt-1">
          <span className="p-2 rounded-xl bg-rosewood-50 text-rosewood-800 border border-rosewood-200">
            <Camera className="w-5 h-5 text-rosewood-700" />
          </span>
          <div>
            <h2 className="text-base sm:text-lg font-serif font-bold text-warmth-900">
              Polaroid Keepsake Vault
            </h2>
            <p className="text-xs text-warmth-600">
              Hand-pinned snapshots and love stories captured in time
            </p>
          </div>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-1.5 py-2 px-3.5 rounded-xl text-xs font-semibold text-white bg-rosewood-700 hover:bg-rosewood-800 active:scale-95 transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Pin New Memory</span>
        </button>
      </div>

      {/* Timeline Feed - Polaroid Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {uniqueMemories.length === 0 ? (
          <div className="md:col-span-2 bg-white p-10 rounded-2xl border border-warmth-200 text-center space-y-3">
            <Camera className="w-10 h-10 text-warmth-300 mx-auto" />
            <h3 className="text-base font-serif font-bold text-warmth-900">Our Keepsake Album is Waiting</h3>
            <p className="text-xs text-warmth-600 max-w-sm mx-auto">
              Pin your favorite photographs and handwritten notes from your dates, trips, and everyday quiet moments together.
            </p>
            <button
              onClick={() => setModalOpen(true)}
              className="mt-2 inline-flex items-center gap-1.5 py-2 px-4 rounded-xl text-xs font-semibold text-white bg-rosewood-700 hover:bg-rosewood-800 transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Pin Our First Polaroid</span>
            </button>
          </div>
        ) : (
          uniqueMemories.map((mem, idx) => {
            const dateObj = new Date(mem.memoryDate);
            const formattedDate = dateObj.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });
            const tapeType = idx % 3 === 0 ? 'washi-tape-rose' : idx % 3 === 1 ? 'washi-tape-sage' : 'washi-tape-butter';

            return (
              <div
                key={mem.id}
                className="polaroid-frame relative flex flex-col justify-between group hover:shadow-md transition-shadow"
              >
                {/* Washi tape pin on polaroid top */}
                <div className={`${tapeType} -top-3 left-1/2 -translate-x-1/2 z-10`} />

                <div>
                  {/* Photo or placeholder */}
                  {mem.photoPath ? (
                    <div className="relative w-full h-56 bg-warmth-100 rounded overflow-hidden group/img">
                      <img
                        src={mem.photoPath.startsWith('data:') ? mem.photoPath : `/api/uploads/${mem.photoPath}`}
                        alt={mem.title}
                        className="w-full h-full object-cover group-hover/img:scale-102 transition-transform duration-300"
                      />
                      <button
                        onClick={() => setZoomedPhoto(mem.photoPath!.startsWith('data:') ? mem.photoPath! : `/api/uploads/${mem.photoPath}`)}
                        className="absolute inset-0 bg-black/25 opacity-0 group-hover/img:opacity-100 transition flex items-center justify-center text-white"
                        title="Enlarge photograph"
                      >
                        <ZoomIn className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-full h-40 bg-warmth-100/70 rounded border border-dashed border-warmth-300 flex items-center justify-center text-warmth-400">
                      <Camera className="w-8 h-8 opacity-40" />
                    </div>
                  )}

                  {/* Handwritten Polaroid Caption */}
                  <div className="pt-3 px-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-handwriting text-2xl text-warmth-900 leading-tight">
                        {mem.title}
                      </h3>
                      <button
                        onClick={() => handleDelete(mem.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-warmth-400 hover:text-rosewood-700 transition"
                        title="Delete memory"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {mem.note && (
                      <p className="mt-1.5 font-handwriting text-lg text-warmth-700 leading-relaxed whitespace-pre-line">
                        &ldquo;{mem.note}&rdquo;
                      </p>
                    )}
                  </div>
                </div>

                {/* Polaroid Footer */}
                <div className="pt-3 mt-3 border-t border-warmth-200/60 flex items-center justify-between text-[11px] text-warmth-500 font-mono">
                  <span>{formattedDate}</span>
                  <span className="font-sans text-[10px] text-warmth-400">
                    Pinned by {mem.creatorName}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Photo Zoom Modal - Clean, no blur */}
      {zoomedPhoto && (
        <div
          onClick={() => setZoomedPhoto(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-in fade-in cursor-zoom-out"
        >
          <div className="relative max-w-3xl max-h-[90vh]">
            <img
              src={zoomedPhoto}
              alt="Zoomed"
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
            />
            <button
              onClick={() => setZoomedPhoto(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black/90 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Add Memory Modal */}
      {modalOpen && (
        <MemoryModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onMemoryCreated={(newMem) => {
            onMemoryCreated?.(newMem);
          }}
        />
      )}
    </div>
  );
}
