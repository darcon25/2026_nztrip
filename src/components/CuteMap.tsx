import React from 'react';
import { motion } from 'motion/react';
import { 
  Plane, 
  Camera, 
  Waves, 
  Bird, 
  Sparkles,
  Cloud,
  Sun,
  Compass,
  Tent,
  Utensils,
  ShoppingBag,
  Mountain,
  MapPin
} from 'lucide-react';

// Cartoon Character Component
const FamilyMember = ({ x, y, type }: { x: number, y: number, type: 'dad' | 'mom' | 'kid' }) => {
  const colors = {
    dad: 'text-blue-500',
    mom: 'text-pink-500',
    kid: 'text-orange-500'
  };
  
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{ left: `${x}%`, top: `${y}%` }}
      className="absolute -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none"
    >
      <div className={`flex flex-col items-center ${colors[type]}`}>
        <div className="bg-white/90 p-1 rounded-full shadow-sm border border-slate-200">
          <div className="w-6 h-6 flex items-center justify-center">
            {type === 'dad' && <Camera className="w-4 h-4" />}
            {type === 'mom' && <ShoppingBag className="w-4 h-4" />}
            {type === 'kid' && <Sparkles className="w-4 h-4" />}
          </div>
        </div>
        <div className="w-4 h-4 rounded-full bg-current mt-1 border-2 border-white" />
      </div>
    </motion.div>
  );
};

const locations = [
  { 
    id: 'chc-airport', 
    name: '基督城機場', 
    x: 75, y: 35, 
    icon: <Plane className="w-6 h-6" />, 
    color: 'bg-[#fce7f3]', // Pink
    label: '冒險起點',
    desc: '領取 Hiace 車隊'
  },
  { 
    id: 'chc-city', 
    name: '基督城市區', 
    x: 82, y: 40, 
    icon: <Utensils className="w-6 h-6" />, 
    color: 'bg-[#dcfce7]', // Green
    label: '花園城市',
    desc: '超市採買/慶功宴'
  },
  { 
    id: 'tekapo', 
    name: '蒂咖波湖', 
    x: 55, y: 55, 
    icon: <Sparkles className="w-6 h-6" />, 
    color: 'bg-[#fef9c3]', // Yellow
    label: '星空小鎮',
    desc: '溫泉/牧羊人教堂'
  },
  { 
    id: 'mtcook', 
    name: '庫克山', 
    x: 42, y: 65, 
    icon: <Mountain className="w-6 h-6" />, 
    color: 'bg-[#e0f2fe]', // Blue
    label: '冰川奇景',
    desc: 'Tasman 健行'
  },
  { 
    id: 'wanaka', 
    name: '瓦納卡', 
    x: 35, y: 75, 
    icon: <Camera className="w-6 h-6" />, 
    color: 'bg-[#ffedd5]', // Orange
    label: '悠閒時光',
    desc: '孤獨樹/Puzzling World'
  },
  { 
    id: 'milford', 
    name: '米爾福德峽灣', 
    x: 15, y: 90, 
    icon: <Waves className="w-6 h-6" />, 
    color: 'bg-[#cffafe]', // Cyan
    label: '世界遺產',
    desc: '峽灣巡航'
  },
  { 
    id: 'oamaru', 
    name: '奧馬魯', 
    x: 70, y: 80, 
    icon: <Bird className="w-6 h-6" />, 
    color: 'bg-[#f5f3ff]', // Purple
    label: '企鵝小鎮',
    desc: '藍企鵝歸巢' 
  },
];

export default function CuteMap() {
  return (
    <div className="bg-white p-4 md:p-8 rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight italic flex items-center gap-2">
            <Compass className="w-6 h-6 text-sky-500" />
            家族冒險・南島手繪地圖
          </h3>
          <p className="text-slate-500 text-sm font-medium">2026 Winter Adventure Infographic</p>
        </div>
        <div className="hidden sm:block bg-sky-100 px-4 py-1.5 rounded-full text-xs font-black text-sky-700 uppercase tracking-widest shadow-sm">
          South Island NZ
        </div>
      </div>

      <div className="relative w-full aspect-[4/5] max-w-3xl mx-auto bg-[#f0f9ff] rounded-[3rem] border-4 md:border-8 border-white shadow-2xl overflow-hidden">
        {/* Real Map Background (Google Maps Style) */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-90"
          style={{ 
            backgroundImage: "url('https://images.unsplash.com/photo-1589802829985-817e51181b92?auto=format&fit=crop&q=80&w=1200')",
            filter: 'brightness(1.1) contrast(0.9) saturate(0.8)'
          }}
        />
        
        {/* Overlay to make it look more like a clean map */}
        <div className="absolute inset-0 bg-sky-500/10 mix-blend-multiply pointer-events-none" />

        {/* Dotted Route Path - Adjusted for real map layout */}
        <svg viewBox="0 0 100 125" className="absolute inset-0 w-full h-full pointer-events-none z-10">
          <path 
            d="M75,35 L82,40 L55,55 L42,65 L35,75 L15,90 M35,75 L70,80 L82,40" 
            fill="none" 
            stroke="#0284c7" 
            strokeWidth="2" 
            strokeDasharray="6 6"
            strokeLinecap="round"
            className="opacity-50"
          />
        </svg>

        {/* Decorative Cartoon Icons */}
        <motion.div 
          animate={{ y: [0, -5, 0] }} 
          transition={{ duration: 3, repeat: Infinity }}
          className="absolute top-10 left-15 text-white/80 z-20"
        >
          <Cloud className="w-10 h-10" />
        </motion.div>
        
        {/* Family Members scattered on the map */}
        <FamilyMember x={78} y={38} type="dad" />
        <FamilyMember x={58} y={52} type="mom" />
        <FamilyMember x={32} y={78} type="kid" />
        <FamilyMember x={18} y={88} type="kid" />

        {/* Location Markers & Labels (Cartoon Style) */}
        {locations.map((loc, idx) => (
          <motion.div
            key={loc.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 + idx * 0.1, type: 'spring' }}
            style={{ left: `${loc.x}%`, top: `${loc.y}%` }}
            className="absolute -translate-x-1/2 -translate-y-1/2 z-30"
          >
            <div className="relative flex flex-col items-center group">
              {/* Cartoon Label */}
              <div className="absolute bottom-full mb-3 opacity-100 transition-all duration-300 pointer-events-none">
                <div className="bg-white/95 backdrop-blur-sm px-3 py-1 rounded-xl shadow-lg border-2 border-sky-100 whitespace-nowrap flex flex-col items-center">
                  <p className="text-[10px] font-black text-slate-900 leading-tight">{loc.name}</p>
                  <p className="text-[8px] font-bold text-sky-500 leading-tight">{loc.desc}</p>
                </div>
                <div className="w-2 h-2 bg-white border-r-2 border-b-2 border-sky-100 rotate-45 mx-auto -mt-1"></div>
              </div>

              {/* Cartoon Icon Container */}
              <div className={`
                ${loc.color} p-2.5 rounded-2xl shadow-xl border-2 border-white 
                transform transition-all duration-300 group-hover:scale-125 group-hover:rotate-6
                flex items-center justify-center text-slate-700
              `}>
                {loc.icon}
              </div>
            </div>
          </motion.div>
        ))}

        {/* Compass Rose */}
        <div className="absolute top-6 left-6 z-20">
          <div className="bg-white/80 backdrop-blur-sm p-2 rounded-full shadow-md border border-white">
            <Compass className="w-6 h-6 text-sky-600 animate-spin-slow" />
          </div>
        </div>
      </div>
      
      {/* Legend / Key */}
      <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
          <div className="bg-blue-500 w-2 h-2 rounded-full" />
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">爸爸 (攝影組)</p>
        </div>
        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
          <div className="bg-pink-500 w-2 h-2 rounded-full" />
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">媽媽 (採購組)</p>
        </div>
        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
          <div className="bg-orange-500 w-2 h-2 rounded-full" />
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">小孩 (放電組)</p>
        </div>
        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
          <Tent className="w-4 h-4 text-sky-600" />
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">露營車冒險</p>
        </div>
      </div>
    </div>
  );
}


