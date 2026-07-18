import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Map as MapIcon, MapPin, Tent, Compass } from 'lucide-react';
import { useData } from '../DataContext';
import { DayData } from '../services/googleSheetService';

type Place = {
  id: string;
  name: string;
  en: string;
  aliases: string[];
  mx: number; // viewBox X (0-100)
  my: number; // viewBox Y (0-125)
};

// 固定地點：座標已對齊手繪底圖 public/map.png 的地形（viewBox 100 x 125，北方朝上）
// 換底圖的話這 7 組座標要重新校正；下面的 islandPath 只是底圖載入失敗時的備援輪廓。
// 「哪天去哪」由 Google Sheet 決定，這裡只定義地點與位置。
const PLACES: Place[] = [
  { id: 'christchurch', name: '基督城', en: 'Christchurch', aliases: ['基督城', 'Christchurch', 'Chch', 'CHC'], mx: 65, my: 58.8 },
  { id: 'tekapo', name: '蒂卡波', en: 'Lake Tekapo', aliases: ['蒂卡波', '蒂咖波', 'Tekapo'], mx: 52, my: 66.3 },
  { id: 'mtcook', name: '庫克山', en: 'Mt Cook', aliases: ['庫克山', 'Mt Cook', 'Cook', 'Pukaki', 'Tasman'], mx: 47.5, my: 57.5 },
  { id: 'oamaru', name: '奧瑪魯', en: 'Oamaru', aliases: ['奧瑪魯', '奧馬魯', 'Oamaru', 'Omaru', 'Moeraki'], mx: 57, my: 76.3 },
  { id: 'queenstown', name: '皇后鎮', en: 'Queenstown', aliases: ['皇后鎮', 'Queenstown', 'Skyline', 'Fergburger'], mx: 30, my: 81.3 },
  { id: 'teanau', name: '蒂阿瑙', en: 'Te Anau', aliases: ['蒂阿瑙', 'Te Anau', '螢火蟲', 'Glowworm'], mx: 23, my: 87.5 },
  { id: 'milford', name: '米爾福德', en: 'Milford Sound', aliases: ['米爾福德', 'Milford', '峽灣'], mx: 17.5, my: 78.8 },
];

// 簡化南島輪廓（viewBox 0 0 100 125，北方朝上）
const islandPath =
  'M 62 10 C 72 14, 76 20, 79 28 C 82 38, 85 46, 86 52 L 93 55 L 86 59 ' +
  'C 84 67, 78 73, 74 80 C 72 88, 72 92, 70 96 C 66 104, 58 108, 46 111 ' +
  'C 36 113, 28 110, 22 105 C 16 100, 13 95, 14 90 C 15 82, 18 78, 20 72 ' +
  'C 23 62, 25 55, 27 48 C 29 40, 30 34, 33 28 C 36 22, 40 18, 45 15 ' +
  'C 50 13, 56 11, 62 10 Z';

// viewBox Y(0-125) → 容器高度百分比
const toTop = (my: number) => (my / 125) * 100;

function matchPlace(text: string): Place | undefined {
  if (!text) return undefined;
  return PLACES.find(p => p.aliases.some(a => text.includes(a)));
}

// 依一天的行程比對出地圖地點：優先用 Sheet 的 map_place 欄；否則先看標題（當天主題），
// 標題判斷不出來才看行程細項（避免途中經過的地點蓋過當天目的地）
function placeForDay(day: DayData): Place | undefined {
  if (day.mapPlace) {
    const key = String(day.mapPlace).trim();
    const explicit = PLACES.find(p => p.id === key || p.name === key || p.en === key);
    if (explicit) return explicit;
  }
  return matchPlace(day.title || '')
    ?? matchPlace((day.items ?? []).map(i => `${i.label} ${i.map}`).join(' '));
}

function scrollToHighlights() {
  document.getElementById('highlights')?.scrollIntoView({ behavior: 'smooth' });
}

type AdventureMapProps = {
  selectedDay: number | null;
  onSelectDay: (day: number | null) => void;
};

export default function AdventureMap({ selectedDay, onSelectDay }: AdventureMapProps) {
  const { days } = useData();
  const [isaLoaded, setIsaLoaded] = useState(true);

  const sortedDays = useMemo(() => [...days].sort((a, b) => a.day - b.day), [days]);

  // 每天 → 地點（讀 Sheet 決定，順序改了地圖就跟著改）
  const dayPlace = useMemo(() => {
    const m = new Map<number, Place>();
    sortedDays.forEach(d => {
      const p = placeForDay(d);
      if (p) m.set(d.day, p);
    });
    return m;
  }, [sortedDays]);

  // 有被造訪的地點（去重，供標記顯示）
  const visitedPlaces = useMemo(() => {
    const seen = new Set<string>();
    const list: Place[] = [];
    sortedDays.forEach(d => {
      const p = dayPlace.get(d.day);
      if (p && !seen.has(p.id)) { seen.add(p.id); list.push(p); }
    });
    return list.length > 0 ? list : PLACES;
  }, [sortedDays, dayPlace]);

  // 一個地點可能涵蓋多天（例如皇后鎮 Day 5-8），點標記時篩到最早的那天
  const placeFirstDay = useMemo(() => {
    const m = new Map<string, number>();
    sortedDays.forEach(d => {
      const p = dayPlace.get(d.day);
      if (p && !m.has(p.id)) m.set(p.id, d.day);
    });
    return m;
  }, [sortedDays, dayPlace]);

  // 路線：依每天順序串起地點（去掉連續重複）
  const routeD = useMemo(() => {
    const seq: Place[] = [];
    sortedDays.forEach(d => {
      const p = dayPlace.get(d.day);
      if (p && (seq.length === 0 || seq[seq.length - 1].id !== p.id)) seq.push(p);
    });
    if (seq.length < 2) return '';
    return `M ${seq[0].mx} ${seq[0].my} ` + seq.slice(1).map(s => `L ${s.mx} ${s.my}`).join(' ');
  }, [sortedDays, dayPlace]);

  const homePlace = visitedPlaces[0] ?? PLACES[0];
  const activePlace = selectedDay != null ? dayPlace.get(selectedDay) ?? homePlace : homePlace;

  return (
    <div className="bg-camp-card p-4 md:p-8 rounded-[2.5rem] shadow-sm border border-camp-border overflow-hidden">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <p className="text-camp-muted text-sm font-medium flex items-center gap-2">
          <MapIcon className="w-5 h-5 text-camp-brown shrink-0" />
          點日期看 Isa 走到哪一站，點站點跳到亮點卡片
        </p>
        <div className="hidden sm:flex items-center gap-2 bg-camp-green/15 border border-camp-green/30 px-4 py-1.5 rounded-full text-xs font-black text-camp-green uppercase tracking-widest">
          <Compass className="w-4 h-4" />
          South Island
        </div>
      </div>

      {/* Day 篩選 chips（依 Sheet 的天數產生） */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3 mb-4">
        <button
          onClick={() => onSelectDay(null)}
          className={`shrink-0 min-h-[44px] px-4 rounded-full text-sm font-black border transition-colors ${
            selectedDay === null
              ? 'bg-camp-brown text-camp-card border-camp-brown'
              : 'bg-camp-bg text-camp-text border-camp-border hover:bg-camp-brown/10'
          }`}
        >
          全部
        </button>
        {sortedDays.map((d) => (
          <button
            key={d.day}
            onClick={() => { onSelectDay(d.day); scrollToHighlights(); }}
            className={`shrink-0 min-h-[44px] px-4 rounded-full text-sm font-black border transition-colors ${
              selectedDay === d.day
                ? 'bg-camp-brown text-camp-card border-camp-brown'
                : 'bg-camp-bg text-camp-text border-camp-border hover:bg-camp-brown/10'
            }`}
          >
            Day {d.day}
          </button>
        ))}
      </div>

      <div className="relative w-full aspect-[4/5] max-w-2xl mx-auto bg-camp-bg rounded-[2rem] border-4 border-camp-card shadow-inner overflow-hidden">
        {/* 底圖：程式繪製南島（日後把手繪底圖放到 public/map.png 就會自動蓋上） */}
        <svg
          viewBox="0 0 100 125"
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="xMidYMid meet"
        >
          <path d={islandPath} fill="#C7D2B4" stroke="#4C6B3C" strokeWidth="1.2" strokeLinejoin="round" />
          <path d={islandPath} fill="none" stroke="#F7F2E7" strokeWidth="0.4" opacity="0.6" />
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
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />

        {/* 路線（依 Sheet 每天順序） */}
        {routeD && (
          <svg viewBox="0 0 100 125" className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="xMidYMid meet">
            <path d={routeD} fill="none" stroke="#8A5222" strokeWidth="0.7" strokeDasharray="1.6 2.2" strokeLinecap="round" opacity="0.85" />
          </svg>
        )}

        {/* 地點標記 */}
        {visitedPlaces.map((p, idx) => {
          const active = activePlace.id === p.id;
          return (
            <motion.button
              key={p.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15 + idx * 0.05, type: 'spring', stiffness: 220, damping: 18 }}
              onClick={() => {
                const firstDay = placeFirstDay.get(p.id);
                if (firstDay != null) onSelectDay(firstDay);
                scrollToHighlights();
              }}
              style={{ left: `${p.mx}%`, top: `${toTop(p.my)}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center min-w-[44px] min-h-[44px] justify-center group"
              aria-label={p.name}
            >
              <div
                className={`flex items-center justify-center rounded-full border-2 border-camp-card shadow-md transition-all ${
                  active
                    ? 'w-6 h-6 bg-camp-brown scale-110 ring-4 ring-camp-brown/25'
                    : 'w-5 h-5 bg-camp-green group-hover:scale-110'
                }`}
              >
                <MapPin className="w-3 h-3 text-camp-card" />
              </div>
              <span
                className={`mt-1 px-1.5 py-0.5 rounded-md text-xs font-black whitespace-nowrap shadow-sm border ${
                  active
                    ? 'bg-camp-brown text-camp-card border-camp-brown'
                    : 'bg-camp-card/90 text-camp-text border-camp-border'
                }`}
              >
                {p.name}
              </span>
            </motion.button>
          );
        })}

        {/* Isa 角色：day 選擇時移動（公主 PNG 到位前用露營風佔位） */}
        <motion.div
          animate={{ left: `${activePlace.mx}%`, top: `${toTop(activePlace.my)}%` }}
          transition={{ type: 'spring', stiffness: 260, damping: 26 }}
          style={{ left: `${activePlace.mx}%`, top: `${toTop(activePlace.my)}%` }}
          className="absolute -translate-x-1/2 z-30 pointer-events-none"
        >
          <div className="relative flex flex-col items-center -translate-y-full pb-1">
            <div className="relative w-14 h-14">
              {/* isa.png 載入失敗才顯示的露營風暫代圖示 */}
              {!isaLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-camp-accent rounded-full border-2 border-camp-card shadow-lg">
                  <Tent className="w-5 h-5 text-camp-card" />
                </div>
              )}
              <img
                src="/isa.png"
                alt="Isa"
                className="absolute inset-0 w-full h-full object-contain drop-shadow-lg"
                onError={() => setIsaLoaded(false)}
              />
            </div>
            <MapPin className="w-4 h-4 text-camp-accent -mt-0.5" fill="#C88A3C" />
          </div>
        </motion.div>
      </div>

      <p className="mt-4 text-center text-sm text-camp-muted font-medium">
        {selectedDay != null
          ? `Day ${selectedDay}・${activePlace.name}（${activePlace.en}）`
          : '選一個 Day，看看 Isa 今天走到哪一站'}
      </p>
    </div>
  );
}
