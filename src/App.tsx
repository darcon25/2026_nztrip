import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Overview from './components/Overview';
import Itinerary from './components/Itinerary';
import Budget from './components/Budget';
import Visa from './components/Visa';
import { cn } from './lib/utils';

import { DataProvider } from './DataContext';

type Tab = 'overview' | 'itinerary' | 'budget' | 'visa';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  return (
    <DataProvider>
      <div className="min-h-screen">
      {/* Header & Navigation */}
      <header className="sticky top-0 z-50 glass-effect border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="bg-sky-500 p-1.5 rounded-lg shadow-lg">
                <span className="text-white font-black italic">NZ</span>
              </div>
              <span className="font-black text-xl tracking-tighter text-white hidden sm:block">
                2026 南島家族旅遊
              </span>
            </div>
            <nav className="flex space-x-6">
              {(['overview', 'itinerary', 'budget', 'visa'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "py-5 text-sm font-bold transition-all border-b-2 border-transparent",
                    activeTab === tab 
                      ? "border-sky-500 text-sky-400" 
                      : "text-slate-400 hover:text-sky-400"
                  )}
                >
                  {tab === 'overview' ? '總覽' : 
                   tab === 'itinerary' ? '詳細日程' : 
                   tab === 'budget' ? '預算分攤' : '簽證'}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && <Overview key="overview" />}
          {activeTab === 'itinerary' && <Itinerary key="itinerary" />}
          {activeTab === 'budget' && <Budget key="budget" />}
          {activeTab === 'visa' && <Visa key="visa" />}
        </AnimatePresence>
      </main>
// ... existing footer ...

      <footer className="max-w-6xl mx-auto px-4 py-12 text-center text-slate-400 text-xs font-medium italic">
        <p>© 2026 New Zealand South Island Family Trip. Crafted for the adventure.</p>
      </footer>
    </div>
    </DataProvider>
  );
}
