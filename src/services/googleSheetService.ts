import Papa from 'papaparse';

export interface ItineraryItem {
  day: number;
  time: string;
  label: string;
  detail: string;
  map: string;
  icon?: string;
  photoUrl?: string;
  menuUrl?: string;
  foodRec?: string;
}

export interface DayData {
  day: number;
  date: string;
  title: string;
  hotel: string;
  meals: { b: string; l: string; d: string };
  deadline?: string;
  highlights?: string;
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

export interface DutyData {
  date: string; dayId: string; cookFamily?: string;
  breakfast?: string; lunch?: string; dinner?: string;
  restaurant?: string; menuUrl?: string; foodRec?: string;
}

export interface LodgingData {
  dateRange: string; name: string; address: string;
  checkin?: string; roomNote?: string;
}

const BASE_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTYDbyWoOERQKg5uBjh6MmVl2gPGVy7CAG9XV1VbjAi3DK-vNIOjn50RYek4c8dV9PBjNf9tohYGF8Y/pub';

const DUTY_GID = '';
const LODGING_GID = '';

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

    const days: DayData[] = daysRaw.map(row => {
      const dayNum = parseInt(String(row.day_id).replace('D', ''));
      return {
        day: dayNum,
        date: row.date,
        title: row.title,
        hotel: row.hotel,
        meals: { b: row.meal_b, l: row.meal_l, d: row.meal_d },
        deadline: row.alert,
        highlights: row.highlights,
        items: itemsRaw
          .filter(item => item.day_id === row.day_id)
          .map(item => ({
            day: dayNum,
            time: item.time,
            label: item.activity,
            detail: item.desc,
            map: item.location,
            icon: item.icon,
            photoUrl: item.photo_url,
            menuUrl: item.menu_url,
            foodRec: item.food_rec
          }))
      };
    });

    // Hardcoded arrivals for now as they are not in the provided sheets
    const arrivals: ArrivalData[] = [
      { type: 'First Arrival', time: '7/22 13:25', detail: 'Fenix 家 (2大)\nJerry 家 (2大1小)\nZiv 家 (2大1小)', color: 'bg-sky-600' },
      { type: '2nd Arrival', time: '7/22 14:35', detail: 'Cathy 家 (4大)', color: 'bg-sky-400' },
      { type: '3rd Arrival', time: '7/23 00:20', detail: 'Richard 家 (2大2小)', color: 'bg-sky-300' },
      { type: 'Final Arrival', time: '7/24 14:35', detail: 'Max 家 (2大1小)', color: 'bg-indigo-600' }
    ];

    let duty: DutyData[] | undefined;
    if (DUTY_GID) {
      const dutyRaw = await fetchCSV(DUTY_GID);
      duty = dutyRaw.map(row => ({
        date: String(row.date),
        dayId: String(row.day_id),
        cookFamily: row.cook_family || undefined,
        breakfast: row.breakfast || undefined,
        lunch: row.lunch || undefined,
        dinner: row.dinner || undefined,
        restaurant: row.restaurant || undefined,
        menuUrl: row.menu_url || undefined,
        foodRec: row.food_rec || undefined
      }));
    }

    let lodging: LodgingData[] | undefined;
    if (LODGING_GID) {
      const lodgingRaw = await fetchCSV(LODGING_GID);
      lodging = lodgingRaw.map(row => ({
        dateRange: String(row.date_range),
        name: String(row.name),
        address: String(row.address),
        checkin: row.checkin || undefined,
        roomNote: row.room_note || undefined
      }));
    }

    return { days, budget, arrivals, duty, lodging };
  } catch (error) {
    console.error('Error fetching Google Sheet data:', error);
    return null;
  }
}
