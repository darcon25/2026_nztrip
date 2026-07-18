import { useState } from 'react';
import { ChevronDown, Home, Clock } from 'lucide-react';
import { useData } from '../DataContext';
import { cn } from '../lib/utils';

function cleanTitle(title: string) {
  return String(title ?? '')
    .replace(/[\s　]*[（(]?\s*Day\s*\d+\s*[)）]?\s*$/i, '')
    .trim();
}

function parseHighlights(raw?: string) {
  return String(raw ?? '')
    .split(/[,，、]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function DailySummary() {
  const { days } = useData();
  const [openDay, setOpenDay] = useState<number | null>(null);

  const sortedDays = [...days].sort((a, b) => a.day - b.day);

  return (
    <div className="bg-camp-card rounded-[2rem] border border-camp-border shadow-sm overflow-hidden divide-y divide-camp-border">
      {sortedDays.map((d) => {
        const open = openDay === d.day;
        const chips = parseHighlights(d.highlights);
        return (
          <div key={d.day}>
            <button
              onClick={() => setOpenDay(open ? null : d.day)}
              aria-expanded={open}
              className="w-full min-h-[44px] px-4 py-3 flex items-center gap-2.5 text-left hover:bg-camp-brown/5 active:bg-camp-brown/10 transition-colors"
            >
              <span className="shrink-0 w-10 text-xs font-black text-camp-muted">{d.date}</span>
              <span className="shrink-0 inline-flex items-center justify-center px-2.5 py-0.5 rounded-full bg-camp-brown text-camp-card text-xs font-black">
                Day {d.day}
              </span>
              <span className="flex-1 text-sm font-black text-camp-text leading-snug">
                {cleanTitle(d.title)}
              </span>
              <ChevronDown
                className={cn(
                  'w-5 h-5 shrink-0 text-camp-brown transition-transform',
                  open && 'rotate-180'
                )}
              />
            </button>

            {open && (
              <div className="px-4 pb-4 pt-1 flex flex-col gap-3 bg-camp-bg/60">
                {chips.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {chips.map((c, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center px-2.5 py-1 rounded-lg bg-camp-card border border-camp-border text-xs font-bold text-camp-text"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs font-medium text-camp-muted">尚未安排</p>
                )}

                {d.hotel && (
                  <p className="flex items-center gap-1.5 text-xs font-bold text-camp-muted">
                    <Home className="w-4 h-4 shrink-0 text-camp-brown" />
                    {d.hotel}
                  </p>
                )}

                {d.deadline && (
                  <p className="flex items-center gap-1.5 text-xs font-bold text-camp-muted">
                    <Clock className="w-4 h-4 shrink-0 text-camp-brown" />
                    {d.deadline}
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
