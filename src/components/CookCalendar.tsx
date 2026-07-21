import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChefHat, UtensilsCrossed, Home } from 'lucide-react';
import { useData } from '../DataContext';
import { CookAssignment } from '../services/googleSheetService';

const MEAL_LABEL: Record<string, string> = { '早': '早餐', '中': '午餐', '午': '午餐', '晚': '晚餐' };
const QUICK_DISHES = ['火鍋', '白飯', '烤肉', '炒青菜', '湯'];
const WEEKDAY_LABEL = ['日', '一', '二', '三', '四', '五', '六'];
const IDENTITY_KEY = 'nztrip.cookFamily';
const TRIP_YEAR = 2026;

const FAMILY_COLOR_PALETTE = [
  { border: 'border-sky-500', bg: 'bg-sky-500/10', text: 'text-sky-700', hover: 'hover:bg-sky-500/20' },
  { border: 'border-amber-500', bg: 'bg-amber-500/10', text: 'text-amber-700', hover: 'hover:bg-amber-500/20' },
  { border: 'border-purple-500', bg: 'bg-purple-500/10', text: 'text-purple-700', hover: 'hover:bg-purple-500/20' },
  { border: 'border-teal-500', bg: 'bg-teal-500/10', text: 'text-teal-700', hover: 'hover:bg-teal-500/20' },
  { border: 'border-indigo-500', bg: 'bg-indigo-500/10', text: 'text-indigo-700', hover: 'hover:bg-indigo-500/20' },
  { border: 'border-orange-500', bg: 'bg-orange-500/10', text: 'text-orange-700', hover: 'hover:bg-orange-500/20' },
];
const MAX_FAMILY_COLOR = { border: 'border-pink-500', bg: 'bg-pink-500/10', text: 'text-pink-700', hover: 'hover:bg-pink-500/20' };

function familyColor(family: string, idx: number) {
  if (family.trim().toLowerCase() === 'max') return MAX_FAMILY_COLOR;
  return FAMILY_COLOR_PALETTE[idx % FAMILY_COLOR_PALETTE.length];
}

function mealLabel(meal: string) {
  return MEAL_LABEL[meal] ?? meal;
}

interface CookDishRow {
  id: number;
  day_id: string;
  meal: string;
  family: string;
  dish: string;
  note: string | null;
  updated: string;
}

interface Resolved {
  dish?: string;
  note?: string;
}

function parseDate(dateStr: string): Date | null {
  const parts = dateStr.trim().split('/');
  if (parts.length !== 2) return null;
  const month = parseInt(parts[0], 10);
  const day = parseInt(parts[1], 10);
  if (!month || !day) return null;
  return new Date(TRIP_YEAR, month - 1, day);
}

export default function CookCalendar() {
  const { cookAssignments, days } = useData();
  const [cookDishes, setCookDishes] = useState<CookDishRow[]>([]);
  const [identity, setIdentity] = useState<string | null>(null);
  const [showFamilyModal, setShowFamilyModal] = useState(false);
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ dayId: string; meal: string } | null>(null);
  const [dishDraft, setDishDraft] = useState('');
  const [noteDraft, setNoteDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [pendingEdit, setPendingEdit] = useState<{ dayId: string; meal: string; family: string } | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(IDENTITY_KEY);
    if (saved) setIdentity(saved);
  }, []);

  const fetchCookDishes = async () => {
    try {
      const res = await fetch('/api/cook-dishes');
      if (res.ok) setCookDishes(await res.json());
    } catch (error) {
      console.error('Failed to fetch cook dishes:', error);
    }
  };

  useEffect(() => {
    fetchCookDishes();
  }, []);

  const families = useMemo(() => Array.from(new Set(cookAssignments.map(a => a.family))), [cookAssignments]);

  // 各家固定顏色：依 families 順序分配（Max 家固定粉紅、其餘輪流 palette），
  // 選家庭視窗與明細卡片共用同一份，確保每家顏色一致
  const familyColorMap = useMemo(() => {
    const map = new Map<string, ReturnType<typeof familyColor>>();
    let paletteIdx = 0;
    for (const f of families) {
      map.set(f, familyColor(f, paletteIdx));
      if (f.trim().toLowerCase() !== 'max') paletteIdx += 1;
    }
    return map;
  }, [families]);

  const dishMap = useMemo(() => {
    const map = new Map<string, Resolved>();
    for (const row of cookDishes) {
      map.set(`${row.day_id}|${row.meal}|${row.family}`, { dish: row.dish, note: row.note ?? undefined });
    }
    return map;
  }, [cookDishes]);

  const resolvedFor = (a: CookAssignment): Resolved => {
    const backend = dishMap.get(`${a.dayId}|${a.meal}|${a.family}`);
    if (backend) return backend;
    return { dish: a.dish, note: a.note };
  };

  const chooseIdentity = (family: string) => {
    localStorage.setItem(IDENTITY_KEY, family);
    setIdentity(family);
    setShowFamilyModal(false);
    if (pendingEdit && pendingEdit.family === family) {
      const assignment = cookAssignments.find(
        a => a.dayId === pendingEdit.dayId && a.meal === pendingEdit.meal && a.family === family
      );
      if (assignment) startEdit(pendingEdit.dayId, pendingEdit.meal, resolvedFor(assignment));
    }
    setPendingEdit(null);
  };

  const handleFillClick = (dayId: string, meal: string, family: string, resolved: Resolved) => {
    if (identity === family) {
      startEdit(dayId, meal, resolved);
    } else if (!identity) {
      setPendingEdit({ dayId, meal, family });
      setShowFamilyModal(true);
    }
  };

  const dayGroups = useMemo(() => {
    const map = new Map<string, { dayId: string; date: string; meals: Map<string, CookAssignment[]> }>();
    for (const a of cookAssignments) {
      if (!map.has(a.dayId)) map.set(a.dayId, { dayId: a.dayId, date: a.date, meals: new Map() });
      const group = map.get(a.dayId)!;
      if (!group.meals.has(a.meal)) group.meals.set(a.meal, []);
      group.meals.get(a.meal)!.push(a);
    }
    return map;
  }, [cookAssignments]);

  const dateToDayId = useMemo(() => {
    const map = new Map<string, string>();
    for (const group of dayGroups.values()) map.set(group.date.trim(), group.dayId);
    return map;
  }, [dayGroups]);

  const calendarCells = useMemo(() => {
    const dates = [...dayGroups.values()]
      .map(g => parseDate(g.date))
      .filter((d): d is Date => d !== null);
    if (dates.length === 0) return [];
    const min = new Date(Math.min(...dates.map(d => d.getTime())));
    const max = new Date(Math.max(...dates.map(d => d.getTime())));
    const start = new Date(min);
    start.setDate(start.getDate() - start.getDay());
    const end = new Date(max);
    end.setDate(end.getDate() + (6 - end.getDay()));

    const cells: Date[] = [];
    const cur = new Date(start);
    while (cur <= end) {
      cells.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }
    return cells;
  }, [dayGroups]);

  const pending = useMemo(() => {
    if (!identity) return [];
    return cookAssignments
      .filter(a => a.family === identity && !resolvedFor(a).dish)
      .map(a => ({ dayId: a.dayId, date: a.date, meal: a.meal }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cookAssignments, identity, dishMap]);

  const hotelFor = (dayId: string) => {
    const num = parseInt(dayId.replace('D', ''), 10);
    return days.find(d => d.day === num)?.hotel;
  };

  const startEdit = (dayId: string, meal: string, current: Resolved) => {
    setSelectedDayId(dayId);
    setEditing({ dayId, meal });
    setDishDraft(current.dish ?? '');
    setNoteDraft(current.note ?? '');
  };

  const cancelEdit = () => {
    setEditing(null);
    setDishDraft('');
    setNoteDraft('');
  };

  const handleSave = async () => {
    if (!editing || !identity || !dishDraft.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/cook-dishes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dayId: editing.dayId,
          meal: editing.meal,
          family: identity,
          dish: dishDraft.trim(),
          note: noteDraft.trim() || undefined,
        }),
      });
      if (res.ok) {
        await fetchCookDishes();
        cancelEdit();
      }
    } catch (error) {
      console.error('Failed to save cook dish:', error);
    } finally {
      setSaving(false);
    }
  };

  if (cookAssignments.length === 0) {
    return (
      <div className="bg-camp-card p-8 rounded-[2rem] border border-camp-border shadow-sm text-center">
        <p className="text-camp-muted font-medium">目前沒有自煮分工資料。</p>
      </div>
    );
  }

  const selectedGroup = selectedDayId ? dayGroups.get(selectedDayId) : undefined;

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {showFamilyModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-camp-text/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              className="bg-camp-card rounded-[2rem] p-6 md:p-8 max-w-sm w-full border border-camp-border shadow-lg"
            >
              <h3 className="text-lg font-black text-camp-text mb-1 text-center">你是哪一家？</h3>
              <p className="text-sm text-camp-muted text-center mb-5 font-medium">選好後才能填寫你家要煮什麼</p>
              <div className="grid grid-cols-2 gap-3">
                {families.map(f => {
                  const color = familyColorMap.get(f)!;
                  return (
                    <button
                      key={f}
                      type="button"
                      onClick={() => chooseIdentity(f)}
                      className={`min-h-[52px] rounded-2xl border-2 ${color.border} ${color.bg} ${color.text} font-black text-base ${color.hover} active:scale-[0.99] transition-all`}
                    >
                      {f} 家
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowFamilyModal(false);
                  setPendingEdit(null);
                }}
                className="w-full min-h-[44px] mt-4 rounded-2xl text-sm font-bold text-camp-muted hover:text-camp-text hover:bg-camp-bg transition-all"
              >
                先不選，回到上一頁
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-camp-card p-6 md:p-8 rounded-[2.5rem] border border-camp-border shadow-sm">
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-camp-green/15 p-2 rounded-xl border border-camp-green/30">
              <ChefHat className="w-5 h-5 text-camp-green" />
            </div>
            <h3 className="text-xl font-black text-camp-text tracking-tight">自煮行事曆</h3>
          </div>
          {identity && (
            <button
              type="button"
              onClick={() => setShowFamilyModal(true)}
              className="min-h-[36px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-camp-brown/15 text-camp-brown text-xs font-black border border-camp-brown/30 hover:bg-camp-brown/25 transition-all"
            >
              你是 {identity} 家
            </button>
          )}
        </div>

        <div className="grid grid-cols-7 gap-1.5 mb-1.5">
          {WEEKDAY_LABEL.map(w => (
            <div key={w} className="text-center text-xs font-black text-camp-muted py-1">
              {w}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {calendarCells.map(cell => {
            const dateStr = `${cell.getMonth() + 1}/${cell.getDate()}`;
            const dayId = dateToDayId.get(dateStr);
            const isCookDay = !!dayId;
            const group = dayId ? dayGroups.get(dayId) : undefined;
            const isSelected = selectedDayId === dayId;

            return (
              <button
                key={cell.toISOString()}
                type="button"
                disabled={!isCookDay}
                onClick={() => dayId && setSelectedDayId(prev => (prev === dayId ? null : dayId))}
                className={`min-h-[64px] rounded-2xl border-2 flex flex-col items-center justify-center gap-1 p-1 transition-all ${
                  isCookDay
                    ? isSelected
                      ? 'bg-camp-green text-camp-card border-camp-green shadow-sm'
                      : 'bg-camp-green/15 text-camp-green border-camp-green/40 hover:bg-camp-green/25'
                    : 'bg-camp-bg text-camp-muted/40 border-transparent cursor-default'
                }`}
              >
                <span className="text-sm font-black">{cell.getDate()}</span>
                {isCookDay && group && (
                  <>
                    <span className="text-[10px] font-black uppercase tracking-wide">自煮</span>
                    <div className="flex flex-wrap justify-center gap-0.5 max-w-full">
                      {[...group.meals.entries()].flatMap(([meal, assignments]) => {
                        const filled = assignments.filter(a => !!resolvedFor(a).dish).length;
                        return assignments.map((_, i) => (
                          <span
                            key={`${meal}-${i}`}
                            className={`w-1.5 h-1.5 rounded-full ${i < filled ? 'bg-current' : 'bg-current/25'}`}
                          />
                        ));
                      })}
                    </div>
                  </>
                )}
              </button>
            );
          })}
        </div>

        {identity && (
          <div className="mt-6 bg-camp-brown/10 border border-camp-brown/30 rounded-2xl p-4">
            <p className="text-sm font-black text-camp-brown mb-2">你還沒填的（{pending.length}）</p>
            {pending.length === 0 ? (
              <p className="text-sm text-camp-muted font-medium">都填好了！</p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {pending.map((p, i) => (
                  <li key={i}>
                    <button
                      type="button"
                      onClick={() => setSelectedDayId(p.dayId)}
                      className="min-h-[36px] px-3 py-1.5 rounded-full text-sm font-bold text-camp-brown bg-camp-card border-2 border-camp-brown/40 hover:bg-camp-brown/10 transition-all"
                    >
                      {p.date}・{mealLabel(p.meal)}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedGroup && (
          <motion.div
            key={selectedGroup.dayId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="bg-camp-card p-5 md:p-6 rounded-[2rem] border border-camp-border shadow-sm flex flex-col gap-4"
          >
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-camp-green/15 text-camp-green text-xs font-black border border-camp-green/30">
                {selectedGroup.dayId}
              </span>
              <span className="text-lg font-black text-camp-text tracking-tight">{selectedGroup.date}</span>
            </div>

            {[...selectedGroup.meals.entries()].map(([meal, assignments]) => (
              <div key={meal} className="bg-camp-bg p-4 rounded-2xl border border-camp-border">
                <div className="flex items-center gap-2 mb-3">
                  <UtensilsCrossed className="w-4 h-4 text-camp-brown shrink-0" />
                  <span className="text-sm font-black text-camp-text">{mealLabel(meal)}・自煮</span>
                </div>
                <div className="flex flex-col gap-3">
                  {assignments.map(a => {
                    const resolved = resolvedFor(a);
                    const isMine = identity === a.family;
                    const color = familyColorMap.get(a.family)!;
                    const isEditingThis = isMine && editing?.dayId === selectedGroup.dayId && editing?.meal === meal;
                    return (
                      <div
                        key={a.family}
                        className={`rounded-2xl border-2 p-3 bg-camp-card ${color.border} ${
                          isMine ? 'ring-2 ring-camp-brown/40' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2 min-h-[36px]">
                            <span className={`inline-flex items-center gap-1.5 shrink-0 text-xs font-black px-2.5 py-1 rounded-full border ${color.border} ${color.bg} ${color.text}`}>
                              <ChefHat className="w-3 h-3" />
                              {a.family} 家
                            </span>
                            {resolved.dish ? (
                              <span className="text-sm font-bold text-camp-text">{resolved.dish}</span>
                            ) : (
                              <span className="text-sm font-medium text-camp-muted italic">還沒填</span>
                            )}
                          </div>
                          {(isMine || !identity) && !isEditingThis && (
                            <button
                              type="button"
                              onClick={() => handleFillClick(selectedGroup.dayId, meal, a.family, resolved)}
                              className="min-h-[36px] px-4 py-1.5 rounded-full text-xs font-black bg-camp-brown text-camp-card hover:opacity-90 active:scale-[0.99] transition-all"
                            >
                              填寫
                            </button>
                          )}
                        </div>
                        {resolved.note && !isEditingThis && (
                          <p className="mt-1.5 text-xs text-camp-muted font-medium">（{resolved.note}）</p>
                        )}

                        <AnimatePresence>
                          {isEditingThis && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="mt-3 pt-3 border-t border-camp-border space-y-3">
                                <input
                                  type="text"
                                  maxLength={60}
                                  value={dishDraft}
                                  onChange={e => setDishDraft(e.target.value)}
                                  placeholder="要煮什麼？"
                                  className="w-full min-h-[44px] bg-camp-bg border-2 border-camp-border rounded-2xl px-4 py-2 text-sm font-bold text-camp-text placeholder:text-camp-muted focus:border-camp-brown focus:outline-none transition-all"
                                />
                                <div className="flex flex-wrap gap-2">
                                  {QUICK_DISHES.map(q => (
                                    <button
                                      key={q}
                                      type="button"
                                      onClick={() => setDishDraft(q)}
                                      className="min-h-[36px] px-3 rounded-full text-xs font-bold border-2 border-camp-border text-camp-muted bg-camp-card hover:border-camp-brown hover:text-camp-brown transition-all"
                                    >
                                      {q}
                                    </button>
                                  ))}
                                </div>
                                <input
                                  type="text"
                                  value={noteDraft}
                                  onChange={e => setNoteDraft(e.target.value)}
                                  placeholder="備註（選填）"
                                  className="w-full min-h-[40px] bg-camp-bg border-2 border-camp-border rounded-2xl px-4 py-2 text-sm font-medium text-camp-text placeholder:text-camp-muted focus:border-camp-brown focus:outline-none transition-all"
                                />
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={handleSave}
                                    disabled={saving || !dishDraft.trim()}
                                    className="flex-1 min-h-[44px] bg-camp-brown text-camp-card rounded-2xl font-black text-sm disabled:opacity-50 hover:opacity-90 active:scale-[0.99] transition-all"
                                  >
                                    儲存
                                  </button>
                                  <button
                                    type="button"
                                    onClick={cancelEdit}
                                    className="min-h-[44px] px-4 rounded-2xl border-2 border-camp-border text-camp-muted font-bold text-sm"
                                  >
                                    取消
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {hotelFor(selectedGroup.dayId) && (
              <div className="flex items-center gap-2 text-sm text-camp-muted font-medium">
                <Home className="w-4 h-4 text-camp-brown shrink-0" />
                住宿：{hotelFor(selectedGroup.dayId)}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
