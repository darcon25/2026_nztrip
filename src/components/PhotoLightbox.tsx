import React, { useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import type { Photo } from './PhotoGallery';
import { isIOS } from '../lib/utils';

const REACTION_EMOJIS = ['❤️', '😂', '😍', '👍', '🔥', '🥹'];

interface PhotoLightboxProps {
  photos: Photo[];
  index: number | null;
  onClose: () => void;
  onNavigate: (index: number) => void;
  myReactions: string[];
  onReact: (photoId: number, emoji: string) => void;
}

export default function PhotoLightbox({ photos, index, onClose, onNavigate, myReactions, onReact }: PhotoLightboxProps) {
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    if (index === null) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [index]);

  useEffect(() => {
    if (index === null) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && index > 0) onNavigate(index - 1);
      if (e.key === 'ArrowRight' && index < photos.length - 1) onNavigate(index + 1);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [index, photos.length, onClose, onNavigate]);

  if (index === null) return null;
  const photo = photos[index];
  if (!photo) return null;

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < 50) return;
    if (delta > 0 && index > 0) onNavigate(index - 1);
    if (delta < 0 && index < photos.length - 1) onNavigate(index + 1);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-camp-text/95 flex flex-col animate-fade-in motion-reduce:animate-none"
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="flex items-center justify-end p-4">
        <button
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center text-camp-card rounded-full hover:bg-camp-card/10"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 relative" onClick={(e) => e.stopPropagation()}>
        {index > 0 && (
          <button
            onClick={() => onNavigate(index - 1)}
            className="absolute left-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-camp-card rounded-full hover:bg-camp-card/10 z-10"
          >
            <ChevronLeft className="w-7 h-7" />
          </button>
        )}

        {photo.has_display ? (
          <img
            src={`/api/photos/${photo.id}/display`}
            alt={photo.original_name}
            className="max-h-[70vh] max-w-full object-contain rounded-lg"
          />
        ) : (
          <div className="text-center text-camp-card">
            <p className="mb-3 font-bold">此格式無法預覽，請下載後檢視</p>
            <a
              href={`/api/photos/${photo.id}/file`}
              {...(isIOS
                ? { target: '_blank', rel: 'noopener' }
                : { download: photo.original_name })}
              className="inline-flex items-center gap-2 min-h-[44px] px-4 rounded-full bg-camp-brown text-camp-card font-black"
            >
              <Download className="w-4 h-4" /> {isIOS ? '開圖存相簿' : '下載'}
            </a>
          </div>
        )}

        {index < photos.length - 1 && (
          <button
            onClick={() => onNavigate(index + 1)}
            className="absolute right-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-camp-card rounded-full hover:bg-camp-card/10 z-10"
          >
            <ChevronRight className="w-7 h-7" />
          </button>
        )}
      </div>

      <div
        className="px-4 pb-3 flex items-center justify-center gap-2 flex-wrap"
        onClick={(e) => e.stopPropagation()}
      >
        {REACTION_EMOJIS.map((emoji) => {
          const count = photo.reactions[emoji] || 0;
          const active = myReactions.includes(emoji);
          return (
            <button
              key={emoji}
              onClick={() => onReact(photo.id, emoji)}
              className={`min-w-[44px] min-h-[44px] px-2 rounded-2xl flex flex-col items-center justify-center gap-0.5 border-2 transition-all ${
                active
                  ? 'bg-camp-brown border-camp-brown text-camp-card'
                  : 'bg-transparent border-camp-card/30 text-camp-card'
              }`}
            >
              <span className="text-lg leading-none">{emoji}</span>
              {count > 0 && <span className="text-[10px] font-black leading-none">{count}</span>}
            </button>
          );
        })}
      </div>

      <div
        className="px-4 pb-4 flex items-center justify-between gap-3 text-camp-card"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-xs font-bold truncate flex-1">{photo.original_name}</span>
        <a
          href={`/api/photos/${photo.id}/file`}
          {...(isIOS
            ? { target: '_blank', rel: 'noopener' }
            : { download: photo.original_name })}
          className="min-h-[44px] px-4 rounded-full bg-camp-card/10 flex items-center gap-2 text-xs font-black shrink-0"
        >
          <Download className="w-4 h-4" /> {isIOS ? '開圖存相簿' : '下載原始檔'}
        </a>
      </div>
    </div>
  );
}
