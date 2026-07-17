import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  MapPin, Coffee, Utensils, Moon, Car, ShoppingCart, Users,
  Snowflake, Home, Star, Clock, Camera, Mountain, Ship, Flame,
  Sandwich, Gift, Heart, Navigation, MessageSquare, UtensilsCrossed, ExternalLink
} from 'lucide-react';
import { useData } from '../DataContext';
import { cn } from '../lib/utils';
import CommentSection from './CommentSection';
import type { DayData, ItineraryItem } from '../services/googleSheetService';

const iconMap: Record<string, React.ReactNode> = {
  'Car': <Car className="w-6 h-6" />,
  'ShoppingCart': <ShoppingCart className="w-6 h-6" />,
  'Users': <Users className="w-6 h-6" />,
  'Utensils': <Utensils className="w-6 h-6" />,
  'Snowflake': <Snowflake className="w-6 h-6" />,
  'Home': <Home className="w-6 h-6" />,
  'Star': <Star className="w-6 h-6" />,
  'Clock': <Clock className="w-6 h-6" />,
  'Camera': <Camera className="w-6 h-6" />,
  'Mountain': <Mountain className="w-6 h-6" />,
  'Coffee': <Coffee className="w-6 h-6" />,
  'Ship': <Ship className="w-6 h-6" />,
  'Flame': <Flame className="w-6 h-6" />,
  'Sandwich': <Sandwich className="w-6 h-6" />,
  'Gift': <Gift className="w-6 h-6" />,
  'Heart': <Heart className="w-6 h-6" />,
  'Moon': <Moon className="w-6 h-6" />,
  'MapPin': <MapPin className="w-6 h-6" />,
};

function itemIcon(item: ItineraryItem) {
  return (item.icon && iconMap[item.icon]) || <MapPin className="w-6 h-6" />;
}

function openGoogleMap(location: string) {
  const query = encodeURIComponent(location);
  window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
}

const HighlightCard: React.FC<{ day: number; item: ItineraryItem; idx: number }> = ({ day, item, idx }) => {
  const [imgError, setImgError] = useState(false);
  const [showComments, setShowComments] = useState(false);

  const target = item.map || item.label;
  const photoSrc = item.photoUrl || `/api/place-photo?query=${encodeURIComponent(target)}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.4 }}
      className="bg-camp-card rounded-[1.75rem] border border-camp-border shadow-sm overflow-hidden flex flex-col"
    >
      <div className="relative aspect-video bg-camp-bg">
        {imgError ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-camp-muted">
            <div className="text-camp-brown">{itemIcon(item)}</div>
            <span className="text-sm font-bold px-4 text-center">{item.label}</span>
          </div>
        ) : (
          <img
            src={photoSrc}
            alt={item.label}
            loading="lazy"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover"
          />
        )}
        <span className="absolute top-3 left-3 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-camp-brown text-camp-card text-xs font-black shadow">
          Day {day}
        </span>
      </div>

      <div className="p-4 md:p-6 flex flex-col gap-3 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-black text-camp-text text-lg tracking-tight leading-snug">{item.label}</h4>
          {item.time && (
            <span className="flex-shrink-0 inline-flex items-center gap-1 text-xs font-black text-camp-brown bg-camp-brown/10 px-2 py-1 rounded-lg">
              <Clock className="w-3.5 h-3.5" />
              {item.time}
            </span>
          )}
        </div>

        {item.detail && (
          <p
            className="text-sm text-camp-muted font-medium leading-relaxed"
            dangerouslySetInnerHTML={{ __html: item.detail }}
          />
        )}

        {(item.foodRec || item.menuUrl) && (
          <div className="flex flex-col gap-2 bg-camp-bg rounded-xl border border-camp-border p-3">
            {item.foodRec && (
              <p className="text-sm font-bold text-camp-green flex items-start gap-1.5">
                <Flame className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>熱推：{item.foodRec}</span>
              </p>
            )}
            {item.menuUrl && (
              <a
                href={item.menuUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-black text-camp-brown hover:underline"
              >
                <UtensilsCrossed className="w-4 h-4" />
                看菜單
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        )}

        <div className="mt-auto flex flex-col sm:flex-row gap-2 pt-1">
          <button
            onClick={() => openGoogleMap(target)}
            className="flex-1 inline-flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-xl bg-camp-brown text-camp-card text-sm font-black shadow-sm hover:bg-camp-brown-dark transition-colors"
          >
            <Navigation className="w-4 h-4" />
            開啟導航
          </button>
          <button
            onClick={() => setShowComments((v) => !v)}
            className={cn(
              'flex-1 inline-flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-xl text-sm font-black border-2 transition-colors',
              showComments
                ? 'bg-camp-green/10 text-camp-green border-camp-green/40'
                : 'bg-camp-bg text-camp-text border-camp-border hover:border-camp-brown'
            )}
          >
            <MessageSquare className="w-4 h-4" />
            留言
          </button>
        </div>

        {showComments && <CommentSection dayId={day} itemIdx={idx} />}
      </div>
    </motion.div>
  );
};

function DayHeader({ day }: { day: DayData }) {
  const meals = [
    { icon: <Coffee className="w-4 h-4" />, label: '早', value: day.meals.b },
    { icon: <Utensils className="w-4 h-4" />, label: '午', value: day.meals.l },
    { icon: <Moon className="w-4 h-4" />, label: '晚', value: day.meals.d },
  ];
  return (
    <div className="bg-camp-brown/10 rounded-2xl border border-camp-border p-4 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-camp-brown text-camp-card text-sm font-black">
          Day {day.day}
        </span>
        <span className="text-sm font-black text-camp-text">{day.date}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {meals.map((m) => (
          <span key={m.label} className="inline-flex items-center gap-1.5 text-xs font-bold text-camp-muted bg-camp-card px-2.5 py-1 rounded-lg border border-camp-border">
            <span className="text-camp-brown">{m.icon}</span>
            {m.label}・{m.value}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function Itinerary() {
  const { days } = useData();
  const [selectedDay, setSelectedDay] = useState<number | 'all'>('all');

  const visibleDays = selectedDay === 'all' ? days : days.filter((d) => d.day === selectedDay);

  return (
    <div className="space-y-6">
      <div className="flex overflow-x-auto gap-2 pb-2 no-scrollbar">
        <button
          onClick={() => setSelectedDay('all')}
          className={cn(
            'flex-shrink-0 min-h-[44px] px-5 rounded-full text-sm font-black border-2 transition-colors',
            selectedDay === 'all'
              ? 'bg-camp-brown text-camp-card border-camp-brown'
              : 'bg-camp-card text-camp-text border-camp-border hover:border-camp-brown'
          )}
        >
          全部
        </button>
        {days.map((d) => (
          <button
            key={d.day}
            onClick={() => setSelectedDay(d.day)}
            className={cn(
              'flex-shrink-0 min-h-[44px] px-5 rounded-full text-sm font-black border-2 transition-colors',
              selectedDay === d.day
                ? 'bg-camp-brown text-camp-card border-camp-brown'
                : 'bg-camp-card text-camp-text border-camp-border hover:border-camp-brown'
            )}
          >
            Day {d.day}
          </button>
        ))}
      </div>

      <div className="space-y-8">
        {visibleDays.map((day) => (
          <div key={day.day} className="space-y-4">
            <DayHeader day={day} />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {day.items.map((item, idx) => (
                <HighlightCard key={idx} day={day.day} item={item} idx={idx} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
