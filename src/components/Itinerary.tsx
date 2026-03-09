import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MapPin, AlertCircle, Coffee, Utensils, Moon, 
  Car, ShoppingCart, Users, Snowflake, Home, 
  Star, Clock, Camera, Mountain, Ship, Flame, 
  Sandwich, Gift, Heart
} from 'lucide-react';
import { useData } from '../DataContext';
import { cn } from '../lib/utils';
import CommentSection from './CommentSection';

const iconMap: Record<string, React.ReactNode> = {
  'Car': <Car className="w-5 h-5 text-sky-400" />,
  'ShoppingCart': <ShoppingCart className="w-5 h-5 text-emerald-400" />,
  'Users': <Users className="w-5 h-5 text-indigo-400" />,
  'Utensils': <Utensils className="w-5 h-5 text-orange-400" />,
  'Snowflake': <Snowflake className="w-5 h-5 text-blue-300" />,
  'Home': <Home className="w-5 h-5 text-stone-400" />,
  'Star': <Star className="w-5 h-5 text-amber-300" />,
  'Clock': <Clock className="w-5 h-5 text-slate-400" />,
  'Camera': <Camera className="w-5 h-5 text-rose-400" />,
  'Mountain': <Mountain className="w-5 h-5 text-slate-300" />,
  'Coffee': <Coffee className="w-5 h-5 text-amber-300" />,
  'Ship': <Ship className="w-5 h-5 text-cyan-400" />,
  'Flame': <Flame className="w-5 h-5 text-orange-400" />,
  'Sandwich': <Sandwich className="w-5 h-5 text-yellow-400" />,
  'Gift': <Gift className="w-5 h-5 text-purple-400" />,
  'Heart': <Heart className="w-5 h-5 text-pink-400" />,
  'Moon': <Moon className="w-5 h-5 text-indigo-300" />,
  'MapPin': <MapPin className="w-5 h-5 text-sky-400" />,
};

export default function Itinerary() {
  const { days } = useData();
  const [selectedDay, setSelectedDay] = useState(days[0]);

  useEffect(() => {
    if (days.length > 0 && !days.find(d => d.day === selectedDay?.day)) {
      setSelectedDay(days[0]);
    }
  }, [days]);

  const openGoogleMap = (location: string) => {
    const query = encodeURIComponent(location);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="bg-slate-900/50 backdrop-blur-sm p-8 rounded-3xl shadow-sm border border-slate-800">
        <div className="flex flex-col gap-6">
          <div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar">
            {days.map((d) => (
              <button
                key={d.day}
                onClick={() => setSelectedDay(d)}
                className={cn(
                  "flex-shrink-0 px-8 py-5 rounded-[2rem] font-black transition-all text-lg",
                  selectedDay.day === d.day 
                    ? "bg-sky-500 text-slate-900 shadow-xl scale-105 -translate-y-1" 
                    : "bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 hover:shadow-md"
                )}
              >
                <span className="text-xs block opacity-70 uppercase tracking-widest italic mb-1">Day {d.day}</span>
                {d.date}
              </button>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={selectedDay.day}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="space-y-8 relative"
        >
          {/* Vertical Timeline Line */}
          <div className="absolute left-4 md:left-8 top-0 bottom-0 w-0.5 bg-slate-800 z-0" />

          {selectedDay.deadline && (
            <div className="ml-12 md:ml-20 p-5 bg-orange-900/20 border-l-8 border-orange-500 rounded-r-3xl animate-pulse-soft relative z-10">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className="w-4 h-4 text-orange-400" />
                <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest italic">🚨 重要物流 / 死線提醒</p>
              </div>
              <p className="text-base font-black text-white">{selectedDay.deadline}</p>
            </div>
          )}

          {selectedDay.highlights && (
            <div className="ml-12 md:ml-20 flex flex-wrap gap-2 relative z-10">
              {selectedDay.highlights.split(',').map((tag, i) => (
                <span key={i} className="px-3 py-1 bg-sky-900/30 text-sky-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-sky-800/50">
                  # {tag.trim()}
                </span>
              ))}
            </div>
          )}

          <div className="ml-12 md:ml-20 grid grid-cols-1 md:grid-cols-3 gap-3 mb-4 relative z-10">
            <div className="p-4 bg-amber-900/20 rounded-2xl border border-amber-800 flex items-center gap-3">
              <Coffee className="w-5 h-5 text-amber-400" />
              <div>
                <p className="text-[10px] font-black text-amber-400 uppercase tracking-tighter">早餐計劃</p>
                <p className="text-xs font-bold text-slate-300">{selectedDay.meals.b}</p>
              </div>
            </div>
            <div className="p-4 bg-sky-900/20 rounded-2xl border border-sky-800 flex items-center gap-3">
              <Utensils className="w-5 h-5 text-sky-400" />
              <div>
                <p className="text-[10px] font-black text-sky-400 uppercase tracking-tighter">午餐時間</p>
                <p className="text-xs font-bold text-slate-300">{selectedDay.meals.l}</p>
              </div>
            </div>
            <div className="p-4 bg-indigo-900/20 rounded-2xl border border-indigo-800 flex items-center gap-3 shadow-inner">
              <Moon className="w-5 h-5 text-indigo-400" />
              <div>
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-tighter">晚餐自理</p>
                <p className="text-xs font-bold text-slate-300">{selectedDay.meals.d}</p>
              </div>
            </div>
          </div>

          {selectedDay.items.map((item, idx) => (
            <div key={idx} className="relative flex items-start gap-4 md:gap-8 group">
              {/* Timeline Marker */}
              <div className="flex flex-col items-center flex-shrink-0 w-8 md:w-16 pt-6">
                <div className="w-10 h-10 rounded-2xl bg-slate-800 flex items-center justify-center border border-slate-700 shadow-md z-10 group-hover:scale-110 transition-transform">
                  {item.icon && iconMap[item.icon] ? iconMap[item.icon] : <MapPin className="w-5 h-5 text-sky-500" />}
                </div>
                <span className="mt-2 text-[10px] md:text-xs font-black text-sky-400 font-mono bg-sky-900/30 px-1.5 py-0.5 rounded-md whitespace-nowrap">
                  {item.time}
                </span>
              </div>

              {/* Detail Card */}
              <div className="flex-1 bg-slate-900/50 backdrop-blur-sm p-6 rounded-[2.5rem] shadow-sm border border-slate-800 flex flex-col md:flex-row gap-6 group hover:shadow-md transition-all duration-300 relative z-10">
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-black text-white text-xl tracking-tight group-hover:text-sky-400 transition-colors">
                      {item.label}
                    </h4>
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic hidden sm:block">Timeline View</span>
                  </div>
                  
                  <p className="text-slate-400 text-sm font-medium leading-relaxed mb-6" dangerouslySetInnerHTML={{ __html: item.detail }} />
                  
                  <div className="space-y-4">
                    <button 
                      onClick={() => openGoogleMap(item.map)}
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-800 text-slate-400 border border-transparent rounded-xl text-xs font-black transition-all shadow-sm hover:bg-sky-500 hover:text-slate-900"
                    >
                      <MapPin className="w-3 h-3" />
                      點擊開啟導航
                    </button>
                    
                    <CommentSection dayId={selectedDay.day} itemIdx={idx} />
                  </div>
                </div>

                {/* Real Google Maps Embed Thumbnail */}
                <div className="w-full md:w-72 aspect-video md:aspect-square bg-slate-800 rounded-3xl overflow-hidden border-4 border-slate-700 shadow-inner flex-shrink-0">
                  <iframe
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    style={{ border: 0 }}
                    src={`https://www.google.com/maps?q=${encodeURIComponent(item.map)}&output=embed&z=14`}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="grayscale-[0.5] contrast-[1.2] brightness-[0.8] invert-[0.9] hue-rotate-[180deg]"
                  ></iframe>
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      </AnimatePresence>

    </motion.div>
  );
}
