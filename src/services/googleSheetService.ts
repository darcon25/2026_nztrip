import Papa from 'papaparse';

export interface ItineraryItem {
  day: number;
  time: string;
  label: string;
  detail: string;
  map: string;
  icon?: string;
  menuUrl?: string;
  foodRec?: string;
}

export interface DayData {
  day: number;
  date: string;
  title: string;
  hotel: string;
  hotelAddress: string;
  meals: { b: string; l: string; d: string };
  deadline?: string;
  highlights?: string;
  mapPlace?: string;
  items: ItineraryItem[];
}

export interface BudgetData {
  id: string;
  name: string;
  car: number;
  hotel: number;
  total: number;
}

export interface ArrivalData {
  type: string;
  time: string;
  detail: string;
  color: string;
}

export interface CookAssignment {
  dayId: string;
  date: string;
  meal: string;
  family: string;
  dish?: string;
  note?: string;
}

export interface LodgingData {
  dateRange: string; name: string; address: string;
  checkin?: string; roomNote?: string;
}

const BASE_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTYDbyWoOERQKg5uBjh6MmVl2gPGVy7CAG9XV1VbjAi3DK-vNIOjn50RYek4c8dV9PBjNf9tohYGF8Y/pub';

const COOK_ASSIGNMENT_GID = '2142763341'; // 自煮分工

async function fetchCSV(gid: string) {
  const url = `${BASE_URL}?gid=${gid}&single=true&output=csv`;
  const response = await fetch(url);
  const csvText = await response.text();
  return new Promise<any[]>((resolve, reject) => {
    Papa.parse(csvText, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => resolve(results.data),
      error: (error: any) => reject(error),
    });
  });
}

// 把「Hotel description」「Hotel address」都相同的連續幾天合併成一張住宿卡片
function deriveLodging(days: DayData[]): LodgingData[] {
  const sorted = [...days].sort((a, b) => a.day - b.day);
  const groups: DayData[][] = [];
  for (const d of sorted) {
    if (!d.hotel && !d.hotelAddress) continue;
    const last = groups[groups.length - 1];
    const prev = last?.[last.length - 1];
    if (prev && prev.day === d.day - 1 && prev.hotel === d.hotel && prev.hotelAddress === d.hotelAddress) {
      last.push(d);
    } else {
      groups.push([d]);
    }
  }
  return groups.map(group => {
    const first = group[0];
    const lastDay = group[group.length - 1];
    return {
      dateRange: group.length > 1 ? `${first.date}-${lastDay.date}` : first.date,
      name: first.hotel,
      address: first.hotelAddress,
    };
  });
}

export async function getAllData() {
  try {
    const [budgetRaw, daysRaw, itemsRaw] = await Promise.all([
      fetchCSV('0'),           // budget
      fetchCSV('1603960862'),  // Days
      fetchCSV('1143344383')   // Detail daily
    ]);

    const num = (v: unknown) => Number(String(v ?? '').replace(/[^0-9.-]/g, '')) || 0;
    const budget: BudgetData[] = budgetRaw.map(row => ({
      id: String(row.id ?? row.ID ?? row[''] ?? row.name ?? row.Name ?? '').trim(),
      name: String(row.name ?? row.Name ?? '').trim(),
      car: num(row.car ?? row.Car),
      hotel: num(row.hotel ?? row.Hotel_Cost ?? row.accomadation),
      total: num(row.total ?? row.Total)
    }));

    // 同一個 day_id 可能對應多列（出發前幾天不同家庭分開住宿的天數），
    // 先依 day_id 分組，再合併成單一 DayData，避免下游元件出現重複的 Day 按鈕。
    const daysGrouped = new Map<any, any[]>();
    for (const row of daysRaw) {
      const key = row.day_id;
      if (!daysGrouped.has(key)) daysGrouped.set(key, []);
      daysGrouped.get(key)!.push(row);
    }

    const isBlank = (v: unknown) => v === undefined || v === null || String(v).trim() === '';

    // 同一組裡，把非空、彼此不同（逐字完全相同才算重複）的值用「、」串起來
    const joinUnique = (rows: any[], field: string): string => {
      const seen: string[] = [];
      for (const r of rows) {
        const v = r[field];
        if (isBlank(v)) continue;
        const s = String(v);
        if (!seen.includes(s)) seen.push(s);
      }
      return seen.join('、');
    };

    // 同一組裡，由上到下找第一個非空值
    const firstNonBlank = (rows: any[], field: string) => {
      for (const r of rows) {
        const v = r[field];
        if (!isBlank(v)) return v;
      }
      return undefined;
    };

    const days: DayData[] = Array.from(daysGrouped.entries()).map(([dayId, rows]) => {
      const first = rows[0];
      const dayNum = parseInt(String(dayId).replace('D', ''));
      return {
        day: dayNum,
        date: first.date,
        title: first.title,
        hotel: joinUnique(rows, 'Hotel description'),
        hotelAddress: joinUnique(rows, 'Hotel address'),
        meals: {
          b: firstNonBlank(rows, 'meal_b'),
          l: firstNonBlank(rows, 'meal_l'),
          d: firstNonBlank(rows, 'meal_d')
        },
        deadline: firstNonBlank(rows, 'alert'),
        highlights: joinUnique(rows, 'highlights'),
        mapPlace: firstNonBlank(rows, 'map_place'),
        items: itemsRaw
          .filter(item => item.day_id === dayId)
          .map(item => ({
            day: dayNum,
            time: item.time,
            label: item.activity,
            detail: item.desc,
            map: item.location,
            icon: item.icon,
            menuUrl: item.menu_url,
            foodRec: item.food_rec
          }))
      };
    }).sort((a, b) => a.day - b.day);

    // Hardcoded arrivals for now as they are not in the provided sheets
    const arrivals: ArrivalData[] = [
      { type: 'First Arrival', time: '7/22 13:25', detail: 'Fenix 家 (2大)\nJerry 家 (2大1小)\nZiv 家 (2大1小)', color: 'bg-sky-600' },
      { type: '2nd Arrival', time: '7/22 14:35', detail: 'Cathy 家 (4大)', color: 'bg-sky-400' },
      { type: '3rd Arrival', time: '7/23 00:20', detail: 'Richard 家 (2大2小)', color: 'bg-sky-300' },
      { type: 'Final Arrival', time: '7/24 14:35', detail: 'Max 家 (2大1小)', color: 'bg-indigo-600' }
    ];

    const cookAssignmentsRaw = await fetchCSV(COOK_ASSIGNMENT_GID);
    const cookAssignments: CookAssignment[] = cookAssignmentsRaw
      .filter(row => row.day_id && row.family)
      .map(row => ({
        dayId: String(row.day_id),
        date: String(row.date ?? ''),
        meal: String(row.meal ?? ''),
        family: String(row.family),
        dish: row.dish ? String(row.dish).trim() || undefined : undefined,
        note: row.note ? String(row.note).trim() || undefined : undefined
      }));

    const lodging = deriveLodging(days);

    return { days, budget, arrivals, cookAssignments, lodging };
  } catch (error) {
    console.error('Error fetching Google Sheet data:', error);
    return null;
  }
}
