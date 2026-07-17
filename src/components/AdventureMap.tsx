import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Map, MapPin, Tent, Compass } from 'lucide-react';

type Spot = {
  id: string;
  day: number;
  name: string;
  en: string;
  mx: number; // viewBox X (0-100)
  my: number; // viewBox Y (0-125)
};

// 座標對應南島大致地理方位（viewBox 100 x 125，與 SVG 底圖共用）
const spots: Spot[] = [
  { id: 'christchurch', day: 1, name: '基督城', en: 'Christchurch', mx: 74, my: 52 },
  { id: 'tekapo', day: 2, name: '蒂卡波', en: 'Lake Tekapo', mx: 54, my: 64 },
  { id: 'mtcook', day: 3, name: '庫克山', en: 'Mt Cook', mx: 44, my: 70 },
  { id: 'wanaka', day: 4, name: '瓦納卡', en: 'Wanaka', mx: 40, my: 80 },
  { id: 'queenstown', day: 5, name: '皇后鎮', en: 'Queenstown', mx: 33, my: 88 },
  { id: 'milford', day: 6, name: '米爾福德', en: 'Milford Sound', mx: 16, my: 86 },
  { id: 'teanau', day: 7, name: '蒂阿瑙', en: 'Te Anau', mx: 26, my: 96 },
  { id: 'dunedin', day: 8, name: '但尼丁', en: 'Dunedin', mx: 66, my: 92 },
  { id: 'oamaru', day: 9, name: '奧瑪魯', en: 'Oamaru', mx: 70, my: 76 },
  { id: 'akaroa', day: 10, name: '阿卡羅阿', en: 'Akaroa', mx: 82, my: 56 },
];

// 簡化南島輪廓（viewBox 0 0 100 125，北方朝上）
const islandPath =
  'M 62 10 C 72 14, 76 20, 79 28 C 82 38, 85 46, 86 52 L 93 55 L 86 59 ' +
  'C 84 67, 78 73, 74 80 C 72 88, 72 92, 70 96 C 66 104, 58 108, 46 111 ' +
  'C 36 113, 28 110, 22 105 C 16 100, 13 95, 14 90 C 15 82, 18 78, 20 72 ' +
  'C 23 62, 25 55, 27 48 C 29 40, 30 34, 33 28 C 36 22, 40 18, 45 15 ' +
  'C 50 13, 56 11, 62 10 Z';

const routeD =
  `M ${spots[0].mx} ${spots[0].my} ` +
  spots.slice(1).map((s) => `L ${s.mx} ${s.my}`).join(' ') +
  ` L ${spots[0].mx} ${spots[0].my}`;

// viewBox Y(0-125) → 容器高度百分比
const toTop = (my: number) => (my / 125) * 100;

function scrollToHighlights() {
  document.getElementById('highlights')?.scrollIntoView({ behavior: 'smooth' });
}

export default function AdventureMap() {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const activeSpot = selectedDay
    ? spots.find((s) => s.day === selectedDay) ?? spots[0]
    : spots[0];

  return (
    <div className="bg-camp-card p-4 md:p-8 rounded-[2.5rem] shadow-sm border border-camp-border overflow-hidden">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h3 className="text-2xl font-black text-camp-text tracking-tight flex items-center gap-2">
            <Map className="w-6 h-6 text-camp-brown" />
            互動地圖
          </h3>
          <p className="text-camp-muted text-sm font-medium mt-1">
            點日期看公主走到哪一站，點站點跳到亮點卡片
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 bg-camp-green/15 border border-camp-green/30 px-4 py-1.5 rounded-full text-xs font-black text-camp-green uppercase tracking-widest">
          <Compass className="w-4 h-4" />
          South Island
        </div>
      </div>

      {/* Day 篩選 chips */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3 mb-4">
        <button
          onClick={() => setSelectedDay(null)}
          className={`shrink-0 min-h-[44px] px-4 rounded-full text-sm font-black border transition-colors ${
            selectedDay === null
              ? 'bg-camp-brown text-camp-card border-camp-brown'
              : 'bg-camp-bg text-camp-text border-camp-border hover:bg-camp-brown/10'
          }`}
        >
          全部
        </button>
        {spots.map((s) => (
          <button
            key={s.id}
            onClick={() => setSelectedDay(s.day)}
            className={`shrink-0 min-h-[44px] px-4 rounded-full text-sm font-black border transition-colors ${
              selectedDay === s.day
                ? 'bg-camp-brown text-camp-card border-camp-brown'
                : 'bg-camp-bg text-camp-text border-camp-border hover:bg-camp-brown/10'
            }`}
          >
            Day {s.day}
          </button>
        ))}
      </div>

      <div className="relative w-full aspect-[4/5] max-w-2xl mx-auto bg-camp-bg rounded-[2rem] border-4 border-camp-card shadow-inner overflow-hidden">
        {/* 底圖：程式繪製南島（日後可被 public/map.png 蓋過） */}
        <svg
          viewBox="0 0 100 125"
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="xMidYMid meet"
        >
          <path d={islandPath} fill="#C7D2B4" stroke="#4C6B3C" strokeWidth="1.2" strokeLinejoin="round" />
          <path d={islandPath} fill="none" stroke="#F7F2E7" strokeWidth="0.4" opacity="0.6" />
          {/* 南阿爾卑斯山脊示意 */}
          <path
            d="M 30 34 L 34 44 L 30 50 L 36 58 L 30 66 L 38 74 L 32 82"
            fill="none"
            stroke="#8A9E77"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.7"
          />
        </svg>

        {/* 手繪地圖底圖：放到 public/map.png 就會自動蓋上；沒有檔案則隱藏 */}
        <img
          src="/map.png"
          alt="手繪南島地圖"
          className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />

        {/* SVG 虛線路線 */}
        <svg viewBox="0 0 100 125" className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="xMidYMid meet">
          <path
            d={routeD}
            fill="none"
            stroke="#A9682F"
            strokeWidth="1.4"
            strokeDasharray="3 3"
            strokeLinecap="round"
            opacity="0.7"
          />
        </svg>

        {/* 地點標記 */}
        {spots.map((s, idx) => {
          const active = selectedDay === s.day;
          return (
            <motion.button
              key={s.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15 + idx * 0.05, type: 'spring', stiffness: 220, damping: 18 }}
              onClick={scrollToHighlights}
              style={{ left: `${s.mx}%`, top: `${toTop(s.my)}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center min-w-[44px] min-h-[44px] justify-center group"
              aria-label={`Day ${s.day} ${s.name}`}
            >
              <div
                className={`flex items-center justify-center rounded-full border-2 border-camp-card shadow-md font-black transition-all ${
                  active
                    ? 'w-9 h-9 bg-camp-brown text-camp-card scale-110 ring-4 ring-camp-brown/25'
                    : 'w-7 h-7 bg-camp-green text-camp-card group-hover:scale-110'
                }`}
              >
                <span className="text-xs leading-none">{s.day}</span>
              </div>
              <span
                className={`mt-1 px-1.5 py-0.5 rounded-md text-xs font-black whitespace-nowrap shadow-sm border ${
                  active
                    ? 'bg-camp-brown text-camp-card border-camp-brown'
                    : 'bg-camp-card/90 text-camp-text border-camp-border'
                }`}
              >
                {s.name}
              </span>
            </motion.button>
          );
        })}

        {/* 角色/指標（公主 PNG 到位前用露營風佔位） */}
        <motion.div
          animate={{ left: `${activeSpot.mx}%`, top: `${toTop(activeSpot.my)}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 16 }}
          style={{ left: `${activeSpot.mx}%`, top: `${toTop(activeSpot.my)}%` }}
          className="absolute -translate-x-1/2 z-30 pointer-events-none"
        >
          <div className="relative flex flex-col items-center -translate-y-full pb-1">
            <div className="relative w-11 h-11">
              {/* 佔位圖示；放到 public/princess.png 會自動蓋上 */}
              <div className="absolute inset-0 flex items-center justify-center bg-camp-accent rounded-full border-2 border-camp-card shadow-lg">
                <Tent className="w-5 h-5 text-camp-card" />
              </div>
              <img
                src="/princess.png"
                alt="愛蓮那公主"
                className="absolute inset-0 w-full h-full object-contain drop-shadow-lg"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
            <MapPin className="w-4 h-4 text-camp-accent -mt-0.5" fill="#C88A3C" />
          </div>
        </motion.div>
      </div>

      <p className="mt-4 text-center text-sm text-camp-muted font-medium">
        {selectedDay
          ? `Day ${selectedDay}・${activeSpot.name}（${activeSpot.en}）`
          : '選一個 Day，看看今天走到哪一站'}
      </p>
    </div>
  );
}
