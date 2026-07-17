import React from 'react';
import { motion } from 'motion/react';
import { ChefHat, Coffee, Sandwich, UtensilsCrossed, Utensils, ExternalLink, Flame } from 'lucide-react';
import { useData } from '../DataContext';

function Meal({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 bg-camp-bg p-3 rounded-2xl border border-camp-border">
      <div className="bg-camp-brown/15 p-2 rounded-lg border border-camp-brown/30 shrink-0">
        <Icon className="w-4 h-4 text-camp-brown" />
      </div>
      <div>
        <p className="text-xs font-black text-camp-muted uppercase tracking-widest">{label}</p>
        <p className="text-sm font-bold text-camp-text leading-snug">{value}</p>
      </div>
    </div>
  );
}

export default function Duty() {
  const { duty } = useData();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="grid grid-cols-1 md:grid-cols-2 gap-6"
    >
      {duty.map((d, idx) => (
        <div key={idx} className="bg-camp-card p-5 md:p-6 rounded-[2rem] border border-camp-border shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-camp-green/15 text-camp-green text-xs font-black border border-camp-green/30">
                {d.dayId}
              </span>
              <span className="text-lg font-black text-camp-text tracking-tight">{d.date}</span>
            </div>
            {d.cookFamily && (
              <div className="inline-flex items-center gap-2 bg-camp-brown text-camp-card px-3 py-1.5 rounded-full text-sm font-black shadow-sm">
                <ChefHat className="w-4 h-4" />
                {d.cookFamily} 掌廚
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3">
            <Meal icon={Coffee} label="早餐" value={d.breakfast} />
            <Meal icon={Sandwich} label="午餐" value={d.lunch} />
            <Meal icon={Utensils} label="晚餐" value={d.dinner} />
          </div>

          {(d.restaurant || d.foodRec) && (
            <div className="bg-camp-bg p-4 rounded-2xl border border-camp-border space-y-3">
              {d.restaurant && (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <UtensilsCrossed className="w-4 h-4 text-camp-brown shrink-0" />
                    <span className="text-sm font-black text-camp-text truncate">{d.restaurant}</span>
                  </div>
                  {d.menuUrl && (
                    <a
                      href={d.menuUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 min-h-[44px] px-4 rounded-full bg-camp-green/15 text-camp-green text-sm font-black border border-camp-green/30 hover:bg-camp-green/25 active:bg-camp-green/35 transition-colors shrink-0"
                    >
                      <ExternalLink className="w-4 h-4" />
                      看菜單
                    </a>
                  )}
                </div>
              )}
              {d.foodRec && (
                <div className="flex items-start gap-2">
                  <Flame className="w-4 h-4 text-camp-brown shrink-0 mt-0.5" />
                  <p className="text-sm font-bold text-camp-brown leading-snug">熱推：{d.foodRec}</p>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </motion.div>
  );
}
