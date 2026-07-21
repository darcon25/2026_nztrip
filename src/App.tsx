import React, { useState, useEffect } from 'react';
import { Users, Map, Sparkles, UtensilsCrossed, Home, Wallet, Images, ArrowUp } from 'lucide-react';
import Overview from './components/Overview';
import Budget from './components/Budget';
import Expenses from './components/Expenses';
import Itinerary from './components/Itinerary';
import CookCalendar from './components/CookCalendar';
import Lodging from './components/Lodging';
import AdventureMap from './components/AdventureMap';
import DailySummary from './components/DailySummary';
import PhotoGallery from './components/PhotoGallery';

import { DataProvider } from './DataContext';

const quickLinks = [
  { id: 'flights', label: '人員班機', icon: Users },
  { id: 'duty', label: '煮飯輪值', icon: UtensilsCrossed },
  { id: 'lodging', label: '住房資訊', icon: Home },
  { id: 'budget', label: '費用分攤', icon: Wallet },
  { id: 'photos', label: '相簿', icon: Images },
];

function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // Google Sheet 資料是非同步載入的，點擊當下版面可能還沒到最終高度（尤其下方的
  // 住房資訊、費用分攤），資料回來後版面變高會讓原本捲的位置偏掉，這裡補幾次校正。
  // scroll-mt-24 讓對齊位置不是 top:0，所以要拿 scroll-margin-top 當基準比對，不能直接比 0。
  [300, 900, 1800].forEach((delay) => {
    setTimeout(() => {
      const target = document.getElementById(id);
      if (!target) return;
      const expectedTop = parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
      const actualTop = target.getBoundingClientRect().top;
      if (Math.abs(actualTop - expectedTop) > 4) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, delay);
  });
}

function Placeholder({ title, icon: Icon }: { title: string; icon: React.ElementType }) {
  return (
    <div className="bg-camp-card p-8 rounded-[2rem] border border-camp-border shadow-sm flex flex-col items-center justify-center text-center gap-3 min-h-[180px]">
      <Icon className="w-8 h-8 text-camp-brown" />
      <p className="text-lg font-black text-camp-text">{title}</p>
      <p className="text-sm text-camp-muted font-medium">建置中，敬請期待</p>
    </div>
  );
}

function SiteHeader() {
  return (
    <header className="bg-[#2E1B0E] px-3 py-3 sm:px-5 sm:py-4">
      <div className="max-w-4xl mx-auto rounded-lg bg-gradient-to-b from-[#F6F0E1] to-[#E7DCC2] border border-[#C9B896]">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 px-4 py-4 sm:py-5">
          <p className="order-2 sm:order-1 text-2xl sm:text-3xl font-black leading-tight text-center text-[#3A2415] tracking-tight">
            EX LCFC<br className="hidden sm:block" />
            <span className="sm:hidden"> · </span>露營小隊
          </p>

          <img
            src="/badge.png"
            alt="EX-LCFC Outdoor Camping &amp; Drinking Squad 徽章"
            className="order-1 sm:order-2 w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-full drop-shadow-sm"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />

          <p className="order-3 text-center leading-tight text-[#3A2415]">
            <span className="block text-sm sm:text-base font-bold text-camp-brown">2026</span>
            <span className="block text-2xl sm:text-3xl font-black tracking-tight">勇闖南半球</span>
          </p>
        </div>
      </div>
    </header>
  );
}

function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleClick = () => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
  };

  if (!visible) return null;

  return (
    <button
      onClick={handleClick}
      aria-label="回到頂部"
      className="fixed bottom-6 right-4 z-40 w-14 h-14 rounded-full bg-camp-brown text-camp-card shadow-lg flex items-center justify-center hover:opacity-90 active:scale-95 transition-all"
    >
      <ArrowUp className="w-6 h-6" />
    </button>
  );
}

function Section({ id, title, children }: { id: string; title?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
      {title && (
        <h2 className="text-xl md:text-2xl font-black text-camp-text mb-4 tracking-tight px-1">{title}</h2>
      )}
      {children}
    </section>
  );
}

export default function App() {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  return (
    <DataProvider>
      <div className="min-h-screen">
        <SiteHeader />

        <nav className="sticky top-0 z-50 glass-effect border-b border-camp-border">
          <div className="max-w-6xl mx-auto px-2">
            <div className="grid grid-cols-5 gap-1">
              {quickLinks.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => scrollToSection(id)}
                  className="flex flex-col items-center justify-center gap-1 min-h-[56px] px-1 py-2 rounded-xl text-camp-text hover:bg-camp-brown/10 active:bg-camp-brown/20 transition-colors"
                >
                  <Icon className="w-5 h-5 text-camp-brown" />
                  <span className="text-xs font-bold leading-tight text-center">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </nav>

        <main className="max-w-6xl mx-auto px-4 py-8 space-y-12">
          <Section id="map">
            <AdventureMap selectedDay={selectedDay} onSelectDay={setSelectedDay} />
          </Section>

          <Section id="summary" title="每日行程摘要">
            <DailySummary />
          </Section>

          <Section id="highlights" title="景點 × 活動">
            <Itinerary selectedDay={selectedDay} onSelectDay={setSelectedDay} />
          </Section>

          <Section id="flights" title="人員班機">
            <Overview />
          </Section>

          <Section id="duty" title="煮飯輪值">
            <CookCalendar />
          </Section>

          <Section id="lodging" title="住房資訊">
            <Lodging />
          </Section>

          <Section id="expenses" title="旅途記帳">
            <Expenses />
          </Section>

          <Section id="photos" title="旅行相簿">
            <PhotoGallery />
          </Section>

          <Section id="budget">
            <Budget />
          </Section>
        </main>

        <footer className="max-w-6xl mx-auto px-4 py-12 text-center text-camp-muted text-sm font-medium">
          <p>© 2026 New Zealand South Island Family Trip. Crafted for the adventure.</p>
        </footer>

        <BackToTop />
      </div>
    </DataProvider>
  );
}
