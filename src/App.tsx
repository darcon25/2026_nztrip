import React from 'react';
import { Users, Map, Sparkles, UtensilsCrossed, Home, Wallet } from 'lucide-react';
import Overview from './components/Overview';
import Budget from './components/Budget';
import Expenses from './components/Expenses';
import Itinerary from './components/Itinerary';

import { DataProvider } from './DataContext';

const quickLinks = [
  { id: 'flights', label: '人員班機', icon: Users },
  { id: 'duty', label: '餐廳輪值', icon: UtensilsCrossed },
  { id: 'lodging', label: '住房資訊', icon: Home },
  { id: 'budget', label: '費用分攤', icon: Wallet },
];

function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
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

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="text-xl md:text-2xl font-black text-camp-text mb-4 tracking-tight px-1">{title}</h2>
      {children}
    </section>
  );
}

export default function App() {
  return (
    <DataProvider>
      <div className="min-h-screen">
        <img
          src="/banner.png"
          alt="2026 南島家族旅遊 橫幅"
          className="w-full max-h-[280px] object-cover"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />

        <nav className="sticky top-0 z-50 glass-effect border-b border-camp-border">
          <div className="max-w-6xl mx-auto px-2">
            <div className="grid grid-cols-4 gap-1">
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
          <Section id="map" title="互動地圖">
            <Placeholder title="互動地圖" icon={Map} />
          </Section>

          <Section id="highlights" title="景點 × 活動">
            <Itinerary />
          </Section>

          <Section id="flights" title="人員班機">
            <Overview />
          </Section>

          <Section id="duty" title="餐廳及煮飯輪值">
            <Placeholder title="餐廳及煮飯輪值" icon={UtensilsCrossed} />
          </Section>

          <Section id="lodging" title="住房資訊">
            <Placeholder title="住房資訊" icon={Home} />
          </Section>

          <Section id="budget" title="費用分攤 & 記帳">
            <Budget />
            <h3 className="text-lg md:text-xl font-black text-camp-text mt-10 mb-4 tracking-tight px-1">旅途記帳</h3>
            <Expenses />
          </Section>
        </main>

        <footer className="max-w-6xl mx-auto px-4 py-12 text-center text-camp-muted text-sm font-medium">
          <p>© 2026 New Zealand South Island Family Trip. Crafted for the adventure.</p>
        </footer>
      </div>
    </DataProvider>
  );
}
