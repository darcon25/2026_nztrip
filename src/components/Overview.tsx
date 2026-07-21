import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Plane, Info } from 'lucide-react';
import { useData } from '../DataContext';
import { cn } from '../lib/utils';

export default function Overview() {
  const { arrivals } = useData();
  const [countdown, setCountdown] = useState<string>('--');

  useEffect(() => {
    const targetDate = new Date('2026-07-22T00:00:00');

    const updateCountdown = () => {
      const now = new Date();
      const diff = targetDate.getTime() - now.getTime();

      if (diff <= 0) {
        setCountdown('已出發！');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      setCountdown(`${days} 天`);
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000 * 60 * 60); // Update every hour
    return () => clearInterval(timer);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      <div className="bg-camp-card p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-camp-border">
        <h2 className="text-2xl font-black text-camp-text mb-4 tracking-tight flex items-center gap-2">
          <Info className="w-6 h-6 text-camp-brown" />
          旅程概覽
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-camp-bg p-6 rounded-3xl border border-camp-border flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-camp-green/15 text-camp-green text-xs font-bold mb-4 border border-camp-green/30">
                2026/07/22 - 07/31
              </div>
              <h1 className="text-4xl font-black text-camp-text mb-2 leading-tight tracking-tighter">
                露營小隊<br />遠征紐西蘭
              </h1>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="bg-camp-card p-4 rounded-2xl shadow-sm border border-camp-border animate-pulse-soft">
                <p className="text-xs font-black text-camp-muted uppercase tracking-widest mb-1 text-center">出發倒數</p>
                <p className="text-3xl font-black text-camp-brown text-center">{countdown}</p>
              </div>
              <div className="bg-camp-card p-4 rounded-2xl shadow-sm border border-camp-border">
                <p className="text-xs font-black text-camp-muted uppercase tracking-widest mb-1 text-center">參與人數</p>
                <p className="text-3xl font-black text-camp-text text-center">22<span className="text-sm ml-1 text-camp-muted">人</span></p>
              </div>
            </div>
          </div>

          <div className="bg-camp-bg p-6 md:p-8 rounded-3xl border border-camp-border shadow-sm">
            <h3 className="text-xl font-black mb-6 tracking-tight flex items-center gap-2 text-camp-text">
              <Plane className="w-6 h-6 text-camp-brown" />
              抵達班機時間
            </h3>
            <div className="space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-camp-border">
              {arrivals.map((arrival, idx) => (
                <div key={idx} className="relative pl-8">
                  <div className={cn("absolute left-0 top-1.5 w-6 h-6 rounded-full border-4 border-camp-card shadow-sm z-10", arrival.color)} />
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-camp-brown">
                      {arrival.type}
                    </p>
                    <p className="text-sm font-black text-camp-text">{arrival.time}</p>
                    <p className="text-sm text-camp-muted font-bold mt-1 whitespace-pre-line">{arrival.detail}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-4 border-t border-camp-border flex justify-between items-center">
              <p className="text-sm font-black text-camp-muted">總計共 16大 6小</p>
              <div className="bg-camp-brown text-camp-card px-4 py-1 rounded-full text-xs font-black">
                22 人
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
