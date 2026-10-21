'use client';

import { useState, useRef } from 'react';
import { X, Camera, Upload } from 'lucide-react';
import { createMemoryAction } from '@/lib/actions/memories';
import { compressImageOnClient, savePhotoLocally } from '@/lib/storage/clientPhotos';

interface MemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMemoryCreated: (memory: any) => void;
}

export default function MemoryModal({
  isOpen,
  onClose,
  onMemoryCreated,
}: MemoryModalProps) {
  const [title, setTitle] = useState('');
  const [memoryDate, setMemoryDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [note, setNote] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      setError('Please choose an image file (JPEG, PNG, WEBP, or GIF)');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setError('Image must be under 15MB');
      return;
    }

    setError(null);
    setPhotoFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPhotoPreview(objectUrl);
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please enter a memory title.');
      return;
    }

    setUploading(true);
    setError(null);

    let photoPath: string | undefined = undefined;

    try {
      if (photoFile) {
        // Compress locally on client device without server upload
        const compressedDataUrl = await compressImageOnClient(photoFile);
        const localId = `local_photo_${Date.now()}`;
        await savePhotoLocally(localId, compressedDataUrl);
        photoPath = compressedDataUrl;
      }

      const res = await createMemoryAction({
        title: title.trim(),
        memoryDate,
        note: note.trim() || undefined,
        photoPath,
      });

      if (res.success) {
        onMemoryCreated(res.data);
        onClose();
      } else {
        setError(res.error || 'Failed to save memory');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/35 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl p-6 sm:p-7 max-w-lg w-full shadow-lg border border-warmth-300 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-warmth-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-warmth-100 text-warmth-800 flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <h3 className="text-base font-serif font-bold text-warmth-900">
              Record a Memory
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
              Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Afternoon picnic by the lake"
              className="block w-full px-3.5 py-2 text-xs rounded-lg border border-warmth-300 bg-warmth-50/50 text-warmth-900 placeholder-warmth-400 focus:outline-none focus:ring-2 focus:ring-warmth-400 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-warmth-800 uppercase tracking-wider mb-1">
              Date
            </label>
            <input
              type="date"
              required
              value={memoryDate}
              onChange={(e) => setMemoryDate(e.target.value)}
              className="block w-full px-3 py-1.5 text-xs rounded-lg border border-warmth-300 bg-warmth-50/50 text-warmth-900 focus:outline-none focus:ring-2 focus:ring-warmth-400 transition"
            />
          </div>

          {/* Photo Upload */}
          <div>
            <label className="block text-xs font-semibold text-warmth-800 uppercase tracking-wider mb-1.5">
              Photograph (Optional)
            </label>

            {photoPreview ? (
              <div className="relative rounded-lg overflow-hidden border border-warmth-300 bg-warmth-50 max-h-52 flex items-center justify-center">
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="w-full h-44 object-cover"
                />
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white hover:bg-black/80 transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer border border-dashed border-warmth-300 hover:border-warmth-500 rounded-lg p-5 text-center bg-warmth-50/40 hover:bg-warmth-50 transition"
              >
                <Upload className="w-4 h-4 text-warmth-500 mx-auto mb-1.5" />
                <p className="text-xs font-medium text-warmth-800">
                  Select a photo to attach
                </p>
                <p className="text-[11px] text-warmth-500 mt-0.5">
                  Stored securely on your client device (never sent to server)
                </p>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Note / Story */}
          <div>
            <label className="block text-xs font-semibold text-warmth-800 uppercase tracking-wider mb-1">
              Notes / Story (Optional)
            </label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What made this moment memorable..."
              className="block w-full px-3 py-2 text-xs rounded-lg border border-warmth-300 bg-warmth-50/50 text-warmth-900 placeholder-warmth-400 focus:outline-none focus:ring-2 focus:ring-warmth-400 transition resize-none leading-relaxed"
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
              disabled={uploading}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-rosewood-700 hover:bg-rosewood-800 active:scale-95 transition shadow-sm disabled:opacity-50"
            >
              {uploading ? 'Saving...' : 'Save Memory'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
