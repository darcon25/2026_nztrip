import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Calendar as CalendarIcon, Users, Plane, Info } from 'lucide-react';
import { useData } from '../DataContext';
import { cn } from '../lib/utils';

export default function Overview() {
  const { days, arrivals, setActiveTab, setSelectedDay } = useData();
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
      
      const daysCount = Math.floor(diff / (1000 * 60 * 60 * 24));
      setCountdown(`${daysCount} 天`);
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000 * 60 * 60); // Update every hour
    return () => clearInterval(timer);
  }, []);

  const renderCalendar = (month: number, startDayOffset: number, totalDays: number) => {
    const daysHeader = ['日', '一', '二', '三', '四', '五', '六'];
    const dayCells = [];
    
    // Padding cells
    for (let i = 0; i < startDayOffset; i++) {
      dayCells.push(<div key={`pad-${month}-${i}`} className="aspect-square" />);
    }
    
    // Day cells
    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${month}/${d}`;
      const matchedDay = days.find(day => day.date === dateStr);
      const isTripDay = (month === 7 && d >= 22 && d <= 31) || (month === 8 && d === 1) || !!matchedDay;
      
      const dayOfWeek = (startDayOffset + d - 1) % 7;
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      
      dayCells.push(
        <button
          key={`day-${month}-${d}`}
          onClick={() => {
            if (matchedDay) {
              setSelectedDay(matchedDay);
              setActiveTab('itinerary');
            }
          }}
          disabled={!matchedDay}
          className={cn(
            "w-8 h-8 sm:w-9 sm:h-9 rounded-full flex flex-col items-center justify-center text-xs sm:text-sm transition-all relative border border-transparent select-none group/day mx-auto",
            isTripDay
              ? "border-sky-400 bg-sky-500/5 text-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.25)] font-bold"
              : "text-slate-300 font-medium",
            matchedDay
              ? "hover:bg-sky-400 hover:text-slate-950 hover:border-sky-300 hover:shadow-lg hover:shadow-sky-400/40 hover:scale-110 cursor-pointer"
              : "cursor-default opacity-85",
            !isTripDay && isWeekend && "text-slate-400",
            matchedDay && "ring-1 ring-sky-400/25"
          )}
          title={matchedDay ? `${matchedDay.title} (Day ${matchedDay.day})` : undefined}
        >
          <span>{d}</span>
          {matchedDay && (
            <span className="text-[7px] opacity-90 scale-90 font-black mt-0.5 tracking-tighter group-hover/day:text-slate-950">
              D{matchedDay.day}
            </span>
          )}
        </button>
      );
    }

    return (
      <div className="bg-[#0e1622]/85 border border-[#1e2e42]/60 p-5 rounded-[2rem] shadow-2xl flex-1">
        {/* Month Header styled exactly like mockup */}
        <div className="flex items-center justify-between mb-4 px-2">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black text-white tracking-wide">
              {month === 7 ? 'July' : 'August'}
            </span>
            <span className="text-xs font-bold text-slate-400 tracking-wider">
              2026
            </span>
          </div>
          <div className="flex gap-2">
            <button className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer">
              <span className="text-xs">‹</span>
            </button>
            <button className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer">
              <span className="text-xs">›</span>
            </button>
          </div>
        </div>

        {/* Weekdays styled exactly like mockup */}
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black text-slate-500 mb-2 tracking-widest uppercase">
          {daysHeader.map((h, i) => (
            <div key={h} className={cn("py-1", (i === 0 || i === 6) && "text-slate-550")}>
              {h}
            </div>
          ))}
        </div>

        {/* Day Cells */}
        <div className="grid grid-cols-7 gap-y-2 gap-x-1">
          {dayCells}
        </div>
      </div>
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      <div className="p-4 sm:p-8 rounded-[2.5rem] shadow-2xl border border-[#1a3448]/60" style={{background: 'rgba(8, 22, 42, 0.45)', backdropFilter: 'blur(12px)'}}>
        
        {/* Title / Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Info className="w-7 h-7 text-sky-400" />
            紐西蘭冒險 · 旅程看板
          </h2>
          <div className="bg-sky-500/10 border border-sky-500/30 text-sky-400 px-4 py-1.5 rounded-full text-xs font-black tracking-wide">
            🛫 2026/07/22 - 08/01
          </div>
        </div>

        {/* 60/40 Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-8">
          
          {/* Left Column (60%): Interactive Dual Calendar */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-[#0e1622]/85 p-6 rounded-[2rem] border border-[#1e2e42]/60 shadow-2xl space-y-4">
              <div>
                <h3 className="text-lg font-black text-white mb-1 flex items-center gap-2">
                  🗺️ 互動日程雙月曆
                </h3>
                <p className="text-xs font-bold text-slate-400 leading-relaxed">
                  下方已自動高亮標註旅程區間。<strong>點擊任何高亮的旅遊日期</strong>，可直接深層跳轉至該日的「詳細日程」規劃！
                </p>
              </div>

              {/* Side by side calendars */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pt-2">
                {/* July starts on Wednesday (offset = 3) */}
                {renderCalendar(7, 3, 31)}
                {/* August starts on Saturday (offset = 6) */}
                {renderCalendar(8, 6, 31)}
              </div>

              <div className="flex items-center justify-center gap-4 pt-2 text-[10px] sm:text-xs font-bold text-slate-450 bg-slate-950/40 p-3 rounded-2xl border border-slate-900">
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 rounded-md bg-sky-500/10 border border-sky-500/30 shadow-[0_0_8px_rgba(56,189,248,0.15)]" />
                  <span>旅程期間 (7/22 - 8/1)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 rounded-md border border-sky-400 ring-1 ring-sky-400/20 flex items-center justify-center text-[8px] font-black text-sky-400">D</div>
                  <span>可點擊查看當日行程</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (40%): Stats Grid + Flight Arrival Timeline */}
          <div className="lg:col-span-4 space-y-6 flex flex-col justify-start">
            
            {/* Stats Cards Stacked */}
            <div className="space-y-4">
              <div className="bg-[#0e1622]/85 p-5 rounded-2xl border border-[#1e2e42]/60 shadow-xl flex flex-col justify-center items-start group hover:border-sky-500/30 transition-all">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Countdown</p>
                <p className="text-xl font-bold text-white tracking-tight">
                  出發倒數：<span className="text-2xl font-black text-sky-400 animate-pulse-soft">{countdown}</span>
                </p>
              </div>
              <div className="bg-[#0e1622]/85 p-5 rounded-2xl border border-[#1e2e42]/60 shadow-xl flex flex-col justify-center items-start group hover:border-sky-500/30 transition-all">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Attendees</p>
                <p className="text-xl font-bold text-white tracking-tight">
                  參與人數：<span className="text-2xl font-black text-sky-400">22 人</span>
                </p>
              </div>
            </div>

            {/* Flight Arrivals Card */}
            <div className="bg-[#0e1622]/85 p-6 rounded-[2rem] border border-[#1e2e42]/60 shadow-2xl flex-1 flex flex-col justify-between">
              <div>
                <div className="mb-6">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Flight arrival timeline</p>
                  <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                    <Plane className="w-5 h-5 text-sky-400" />
                    抵達班機時間
                  </h3>
                </div>
                
                {/* Vertical Timeline */}
                <div className="space-y-6 relative before:absolute before:left-[45px] before:top-2 before:bottom-2 before:w-[1.5px] before:bg-slate-800">
                  {arrivals.map((arrival, idx) => {
                    const timeParts = arrival.time.split(' ');
                    const datePart = timeParts[0]; 
                    const hourPart = timeParts[1] || ''; 
                    
                    return (
                      <div key={idx} className="relative flex items-start group/item">
                        {/* Date Left Aligned */}
                        <div className="w-[35px] text-right text-[11px] font-mono font-bold text-slate-400 pt-1">
                          {datePart}
                        </div>
                        
                        {/* Indicator dot centered on the line */}
                        <div className="w-6 flex justify-center pt-1.5 z-10 mx-1">
                          <div className={cn(
                            "w-2.5 h-2.5 rounded-full border border-slate-950 shadow-lg shadow-sky-500/20 transition-transform group-hover/item:scale-125",
                            arrival.color
                          )} />
                        </div>
                        
                        {/* Detail text right aligned */}
                        <div className="flex-1 pl-2">
                          <div className="flex items-baseline gap-2">
                            <p className={cn("text-[9px] font-black uppercase tracking-widest italic", arrival.color.replace('bg-', 'text-'))}>
                              {arrival.type}
                            </p>
                            {hourPart && (
                              <span className="text-[10px] font-black text-slate-500 font-mono">
                                {hourPart}
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-black text-white mt-0.5">{arrival.detail.split('\n')[0]}</p>
                          {arrival.detail.includes('\n') && (
                            <p className="text-[10px] text-slate-400 font-bold mt-0.5 whitespace-pre-line leading-relaxed">
                              {arrival.detail.substring(arrival.detail.indexOf('\n') + 1)}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Attendance Total Indicator */}
              <div className="mt-8 pt-4 border-t border-slate-850 flex justify-between items-center">
                <p className="text-[10px] font-black text-slate-500 italic">總計共 16大 6小</p>
                <div className="bg-sky-500/10 border border-sky-400/40 text-sky-400 px-4 py-1 rounded-full text-xs font-black shadow-[0_0_10px_rgba(56,189,248,0.15)]">
                  22 人
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </motion.div>
  );
}
