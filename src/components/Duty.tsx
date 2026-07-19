import { useMemo } from 'react';
import { motion } from 'motion/react';
import { ChefHat, UtensilsCrossed } from 'lucide-react';
import { useData } from '../DataContext';
import { CookAssignment } from '../services/googleSheetService';

const MEAL_LABEL: Record<string, string> = { '早': '早餐', '中': '午餐', '午': '午餐', '晚': '晚餐' };

function mealLabel(meal: string) {
  return MEAL_LABEL[meal] ?? meal;
}

export default function Duty() {
  const { cookAssignments } = useData();

  const days = useMemo(() => {
    const byDay = new Map<string, { dayId: string; date: string; meals: Map<string, CookAssignment[]> }>();
    for (const a of cookAssignments) {
      if (!byDay.has(a.dayId)) byDay.set(a.dayId, { dayId: a.dayId, date: a.date, meals: new Map() });
      const day = byDay.get(a.dayId)!;
      if (!day.meals.has(a.meal)) day.meals.set(a.meal, []);
      day.meals.get(a.meal)!.push(a);
    }
    return [...byDay.values()].sort((a, b) => {
      const na = parseInt(a.dayId.replace('D', ''), 10) || 0;
      const nb = parseInt(b.dayId.replace('D', ''), 10) || 0;
      return na - nb;
    });
  }, [cookAssignments]);

  if (days.length === 0) {
    return (
      <div className="bg-camp-card p-8 rounded-[2rem] border border-camp-border shadow-sm text-center">
        <p className="text-camp-muted font-medium">目前沒有自煮分工資料。</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="grid grid-cols-1 md:grid-cols-2 gap-6"
    >
      {days.map((day) => (
        <div key={day.dayId} className="bg-camp-card p-5 md:p-6 rounded-[2rem] border border-camp-border shadow-sm flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-camp-green/15 text-camp-green text-xs font-black border border-camp-green/30">
              {day.dayId}
            </span>
            <span className="text-lg font-black text-camp-text tracking-tight">{day.date}</span>
          </div>

          {[...day.meals.entries()].map(([meal, assignments]) => (
            <div key={meal} className="bg-camp-bg p-4 rounded-2xl border border-camp-border">
              <div className="flex items-center gap-2 mb-3">
                <UtensilsCrossed className="w-4 h-4 text-camp-brown shrink-0" />
                <span className="text-sm font-black text-camp-text">{mealLabel(meal)}・自煮</span>
              </div>
              <div className="flex flex-col gap-2">
                {assignments.map((a, i) => (
                  <div key={i} className="flex items-center gap-2 min-h-[36px]">
                    <span className="inline-flex items-center gap-1.5 shrink-0 text-xs font-black text-camp-card bg-camp-brown px-2.5 py-1 rounded-full">
                      <ChefHat className="w-3 h-3" />
                      {a.family} 家
                    </span>
                    {a.dish ? (
                      <span className="text-sm font-bold text-camp-text">{a.dish}</span>
                    ) : (
                      <span className="text-sm font-medium text-camp-muted italic">尚未安排</span>
                    )}
                    {a.note && (
                      <span className="text-xs text-camp-muted">（{a.note}）</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}
    </motion.div>
  );
}
