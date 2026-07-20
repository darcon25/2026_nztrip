import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Home, MapPin, KeyRound, BedDouble, Navigation } from 'lucide-react';
import { useData } from '../DataContext';
import type { LodgingData } from '../services/googleSheetService';

function openNavigation(address: string) {
  window.open('https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(address), '_blank');
}

type PhotoStage = 'primary' | 'fallback' | 'failed';

function LodgingPhoto({ l }: { l: LodgingData }) {
  const [stage, setStage] = useState<PhotoStage>('primary');

  const primaryTarget = l.address;
  const fallbackTarget = l.name && l.name.trim() !== '' && l.name !== l.address ? l.name : null;
  const target = stage === 'fallback' && fallbackTarget ? fallbackTarget : primaryTarget;
  const photoSrc = `/api/place-photo?query=${encodeURIComponent(target)}`;

  const handleError = () => {
    if (stage === 'primary' && fallbackTarget) {
      setStage('fallback');
    } else {
      setStage('failed');
    }
  };

  if (stage === 'failed') {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-camp-muted">
        <Home className="w-8 h-8 text-camp-brown" />
        <span className="text-sm font-bold px-4 text-center">{l.name}</span>
      </div>
    );
  }

  return (
    <img
      src={photoSrc}
      alt={l.name}
      loading="lazy"
      onError={handleError}
      className="w-full h-full object-cover"
    />
  );
}

export default function Lodging() {
  const { lodging } = useData();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="grid grid-cols-1 md:grid-cols-2 gap-6"
    >
      {lodging.map((l, idx) => (
        <div key={idx} className="bg-camp-card rounded-[2rem] border border-camp-border shadow-sm overflow-hidden flex flex-col gap-4">
          <div className="relative aspect-video bg-camp-bg">
            <LodgingPhoto l={l} />
          </div>

          <div className="px-5 md:px-6 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-camp-green/15 text-camp-green text-xs font-black border border-camp-green/30 mb-2">
                {l.dateRange}
              </span>
              <h3 className="text-lg font-black text-camp-text tracking-tight flex items-center gap-2">
                <Home className="w-5 h-5 text-camp-brown shrink-0" />
                {l.name}
              </h3>
            </div>
          </div>

          <div className="px-5 md:px-6 flex flex-col gap-4 pb-5 md:pb-6">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-camp-brown shrink-0 mt-0.5" />
              <p className="text-sm font-bold text-camp-muted leading-snug">{l.address}</p>
            </div>

            <button
              onClick={() => openNavigation(l.address)}
              className="inline-flex items-center justify-center gap-2 min-h-[44px] w-full rounded-full bg-camp-brown text-camp-card text-sm font-black shadow-sm hover:opacity-90 active:opacity-80 transition-opacity"
            >
              <Navigation className="w-4 h-4" />
              開啟導航
            </button>

            {l.checkin && (
              <div className="flex items-start gap-3 bg-camp-bg p-3 rounded-2xl border border-camp-border">
                <div className="bg-camp-brown/15 p-2 rounded-lg border border-camp-brown/30 shrink-0">
                  <KeyRound className="w-4 h-4 text-camp-brown" />
                </div>
                <div>
                  <p className="text-xs font-black text-camp-muted uppercase tracking-widest">入住資訊</p>
                  <p className="text-sm font-bold text-camp-text leading-snug">{l.checkin}</p>
                </div>
              </div>
            )}

            {l.roomNote && (
              <div className="flex items-start gap-3 bg-camp-bg p-3 rounded-2xl border border-camp-border">
                <div className="bg-camp-green/15 p-2 rounded-lg border border-camp-green/30 shrink-0">
                  <BedDouble className="w-4 h-4 text-camp-green" />
                </div>
                <div>
                  <p className="text-xs font-black text-camp-muted uppercase tracking-widest">誰住這裡</p>
                  <p className="text-sm font-bold text-camp-text leading-snug">{l.roomNote}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </motion.div>
  );
}
