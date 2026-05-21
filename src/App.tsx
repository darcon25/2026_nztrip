import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Overview from './components/Overview';
import Itinerary from './components/Itinerary';
import Budget from './components/Budget';
import Visa from './components/Visa';
import { cn } from './lib/utils';
import { useData } from './DataContext';

export default function App() {
  const { activeTab, setActiveTab } = useData();

  const tabs = [
    { id: 'overview', short: '總覽', long: '總覽' },
    { id: 'itinerary', short: '日程', long: '詳細日程' },
    { id: 'budget', short: '預算', long: '預算分攤' },
    { id: 'visa', short: '注意事項', long: '出發前檢查事項' }
  ] as const;

  return (
    <div className="min-h-screen">
      {/* Header & Navigation */}
      <header className="sticky top-0 z-50 glass-effect border-b border-slate-800/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between py-3 sm:py-0 sm:h-20 gap-4 sm:gap-0">
            {/* Logo */}
            <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
              <div className="bg-sky-500 p-2 rounded-xl shadow-lg shadow-sky-500/20">
                <span className="text-slate-950 font-black italic tracking-tighter text-sm">NZ</span>
              </div>
              <span className="font-black text-xl tracking-tighter text-white">
                2026 南島家族旅遊
              </span>
            </div>

            {/* Centered Modern Glassmorphic Pill Navigation */}
            <nav className="relative flex p-1.5 bg-slate-950/60 backdrop-blur-md rounded-2xl border border-slate-800/80 shadow-2xl max-w-full overflow-x-auto scrollbar-none gap-1 sm:gap-2">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "relative py-2.5 px-3.5 sm:px-6 rounded-xl text-xs sm:text-sm font-black tracking-tight transition-colors duration-200 whitespace-nowrap shrink-0 cursor-pointer z-10",
                      isActive ? "text-slate-950" : "text-slate-400 hover:text-slate-200"
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                        className="absolute inset-0 bg-sky-400 rounded-xl -z-10 shadow-lg shadow-sky-500/30"
                      />
                    )}
                    <span className="sm:hidden">{tab.short}</span>
                    <span className="hidden sm:inline">{tab.long}</span>
                  </button>
                );
              })}
            </nav>
            
            {/* Right side empty or decorative spacer for desktop visual symmetry */}
            <div className="hidden lg:block w-32 shrink-0 text-right">
              <span className="text-[10px] font-black text-sky-500 tracking-widest uppercase italic">NZ 2026</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && <Overview key="overview" />}
          {activeTab === 'itinerary' && <Itinerary key="itinerary" />}
          {activeTab === 'budget' && <Budget key="budget" />}
          {activeTab === 'visa' && <Visa key="visa" />}
        </AnimatePresence>
      </main>

      <footer className="max-w-6xl mx-auto px-6 py-12 text-center text-slate-500 text-xs font-bold italic tracking-wide">
        <p>© 2026 New Zealand South Island Family Trip. Crafted for the adventure.</p>
      </footer>
    </div>
  );
}
