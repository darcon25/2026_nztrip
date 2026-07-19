import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Images, Upload, Download, Trash2, Cloud, ImageOff } from 'lucide-react';
import PhotoLightbox from './PhotoLightbox';

export interface Photo {
  id: number;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  has_thumb: boolean;
  has_display: boolean;
  synced_at: string | null;
  timestamp: string;
  reactions: Record<string, number>;
}

const REACTIONS_STORAGE_KEY = 'nztrip.photoReactions';

function loadMyReactions(): Record<number, string[]> {
  try {
    const raw = localStorage.getItem(REACTIONS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveMyReactions(data: Record<number, string[]>) {
  try {
    localStorage.setItem(REACTIONS_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage 不可用（例如無痕模式關掉儲存）就不記，不影響按表情本身
  }
}

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function PhotoGallery() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [myReactionsMap, setMyReactionsMap] = useState<Record<number, string[]>>({});

  useEffect(() => {
    setMyReactionsMap(loadMyReactions());
  }, []);

  const fetchPhotos = async () => {
    try {
      const res = await fetch('/api/photos');
      if (res.ok) setPhotos(await res.json());
    } catch (error) {
      console.error('Failed to fetch photos:', error);
    }
  };

  useEffect(() => {
    fetchPhotos();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadError('');
    setIsUploading(true);
    try {
      const form = new FormData();
      // as File：專案沒裝 @types/react，import React 型別退化成 any，e.target.files 也連帶變 any；
      // Array.from(any) 推斷出 unknown[] 而非 File[]，需明確斷言。實際執行時就是瀏覽器原生 File。
      Array.from(files).forEach((file) => form.append('photos', file as File));
      const res = await fetch('/api/photos', { method: 'POST', body: form });
      if (res.ok) {
        await fetchPhotos();
      } else {
        const body = await res.json().catch(() => ({}));
        setUploadError(body.error || '上傳失敗，請再試一次');
      }
    } catch (error) {
      console.error('Failed to upload photos:', error);
      setUploadError('上傳失敗，請再試一次');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/photos/${id}`, { method: 'DELETE' });
      if (res.ok) fetchPhotos();
    } catch (error) {
      console.error('Failed to delete photo:', error);
    }
  };

  const handleReact = async (photoId: number, emoji: string) => {
    const mine = myReactionsMap[photoId] ?? [];
    const isRemoving = mine.includes(emoji);
    const delta = isRemoving ? -1 : 1;

    const nextMine = isRemoving ? mine.filter((e) => e !== emoji) : [...mine, emoji];
    const nextMap = { ...myReactionsMap, [photoId]: nextMine };
    setMyReactionsMap(nextMap);
    saveMyReactions(nextMap);

    setPhotos((prev) =>
      prev.map((p) => {
        if (p.id !== photoId) return p;
        const nextCount = Math.max(0, (p.reactions[emoji] || 0) + delta);
        const nextReactions = { ...p.reactions };
        if (nextCount > 0) nextReactions[emoji] = nextCount;
        else delete nextReactions[emoji];
        return { ...p, reactions: nextReactions };
      })
    );

    try {
      const res = await fetch(`/api/photos/${photoId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji, delta }),
      });
      if (!res.ok) throw new Error('reaction request failed');
      const { reactions } = await res.json();
      setPhotos((prev) => prev.map((p) => (p.id === photoId ? { ...p, reactions } : p)));
    } catch (error) {
      console.error('Failed to update reaction:', error);
      const revertMine = isRemoving ? [...mine] : mine.filter((e) => e !== emoji);
      const revertMap = { ...myReactionsMap, [photoId]: revertMine };
      setMyReactionsMap(revertMap);
      saveMyReactions(revertMap);
      fetchPhotos();
    }
  };

  const lightboxPhoto = lightboxIndex !== null ? photos[lightboxIndex] : null;

  return (
    <div className="bg-camp-card p-6 md:p-8 rounded-[2.5rem] border border-camp-border shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-camp-brown/15 p-2 rounded-xl border border-camp-brown/30">
          <Images className="w-5 h-5 text-camp-brown" />
        </div>
        <h3 className="text-xl font-black text-camp-text tracking-tight">旅行相簿</h3>
      </div>

      <label className="flex flex-col items-center justify-center gap-2 min-h-[120px] border-2 border-dashed border-camp-border rounded-2xl cursor-pointer hover:border-camp-brown hover:bg-camp-brown/5 transition-all mb-6">
        <Upload className="w-6 h-6 text-camp-brown" />
        <span className="text-sm font-bold text-camp-text">
          {isUploading ? '上傳中…' : '點這裡上傳照片'}
        </span>
        <input
          type="file"
          multiple
          accept="image/*,.heic,.heif"
          className="hidden"
          disabled={isUploading}
          onChange={handleUpload}
        />
      </label>

      {uploadError && (
        <p className="mb-4 text-sm font-bold text-red-600">{uploadError}</p>
      )}

      {photos.length === 0 ? (
        <p className="text-center text-sm text-camp-muted font-medium py-6">
          還沒有人上傳照片，來傳第一張吧！
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          <AnimatePresence initial={false}>
            {photos.map((photo, idx) => (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="rounded-2xl border border-camp-border overflow-hidden bg-camp-bg"
              >
                <button
                  type="button"
                  onClick={() => setLightboxIndex(idx)}
                  className="relative aspect-square w-full block"
                >
                  {photo.has_thumb ? (
                    <img
                      src={`/api/photos/${photo.id}/thumb`}
                      alt={photo.original_name}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-camp-muted p-2">
                      <ImageOff className="w-6 h-6" />
                      <span className="text-xs font-bold text-center break-all">{photo.original_name}</span>
                    </div>
                  )}

                  {photo.synced_at && (
                    <div className="absolute top-2 right-2 bg-camp-text/60 rounded-full p-1">
                      <Cloud className="w-3.5 h-3.5 text-camp-card" />
                    </div>
                  )}

                  {Object.keys(photo.reactions).length > 0 && (
                    <div className="absolute bottom-2 left-2 bg-camp-text/60 rounded-full px-2 py-0.5 flex items-center gap-1.5">
                      {Object.entries(photo.reactions).map(([emoji, count]) => (
                        <span key={emoji} className="text-xs text-camp-card font-bold whitespace-nowrap">
                          {emoji}{count}
                        </span>
                      ))}
                    </div>
                  )}
                </button>

                <p className="px-2 pt-1.5 text-[10px] text-camp-muted font-bold truncate">
                  {photo.original_name} · {formatSize(photo.size_bytes)}
                </p>

                <div className="grid grid-cols-2 border-t border-camp-border mt-1.5">
                  <a
                    href={`/api/photos/${photo.id}/file`}
                    download
                    className="min-h-[44px] flex items-center justify-center gap-1 text-camp-brown hover:bg-camp-brown/10 text-xs font-black transition-colors"
                  >
                    <Download className="w-4 h-4" /> 下載
                  </a>
                  <button
                    onClick={() => handleDelete(photo.id)}
                    className="min-h-[44px] flex items-center justify-center gap-1 text-camp-muted hover:text-red-600 hover:bg-red-500/10 text-xs font-black border-l border-camp-border transition-colors"
                  >
                    <Trash2 className="w-4 h-4" /> 刪除
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <PhotoLightbox
        photos={photos}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onNavigate={setLightboxIndex}
        myReactions={lightboxPhoto ? myReactionsMap[lightboxPhoto.id] ?? [] : []}
        onReact={handleReact}
      />
    </div>
  );
}
