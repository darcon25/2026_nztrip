import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAllData, DayData, BudgetData, ArrivalData, DutyData, LodgingData } from './services/googleSheetService';
import { days as fallbackDays, familyBudgets as fallbackBudget } from './constants';

interface DataContextType {
  days: DayData[];
  budget: BudgetData[];
  arrivals: ArrivalData[];
  duty: DutyData[];
  lodging: LodgingData[];
  loading: boolean;
  error: string | null;
}

const fallbackDuty: DutyData[] = [
  {
    date: '7/22', dayId: 'D1', cookFamily: 'Fenix 家',
    breakfast: '機上早餐', lunch: '基督城機場輕食', dinner: '自煮 咖哩雞飯',
    restaurant: 'New World 超市採買', foodRec: '紐西蘭羊排、奇異果'
  },
  {
    date: '7/24', dayId: 'D3', cookFamily: 'Max 家',
    breakfast: '住宿自備', lunch: 'Tekapo 湖邊三明治', dinner: '外食',
    restaurant: 'Kohan 日本料理', menuUrl: 'https://www.kohantekapo.co.nz',
    foodRec: '鮭魚丼飯、天婦羅'
  },
  {
    date: '7/26', dayId: 'D5', cookFamily: 'Richard 家',
    breakfast: '飯店', lunch: 'Fairlie 鮭魚派', dinner: '自煮 BBQ',
    restaurant: 'Fairlie Bakehouse', menuUrl: 'https://www.fairliebakehouse.co.nz',
    foodRec: '三文魚派、鹿肉派'
  },
  {
    date: '7/28', dayId: 'D7',
    breakfast: '自備', lunch: '皇后鎮湖畔野餐', dinner: '外食',
    restaurant: 'Fergburger', menuUrl: 'https://fergburger.com',
    foodRec: 'Fergburger 漢堡、藍鱈魚'
  }
];

const fallbackLodging: LodgingData[] = [
  {
    dateRange: '7/22-7/24', name: '25 Teesdale Street',
    address: '25 Teesdale Street, Christchurch, New Zealand',
    checkin: '15:00 後自助入住，門鎖密碼另發',
    roomNote: '一樓 Fenix 家、Jerry 家；二樓 Ziv 家、Cathy 家'
  },
  {
    dateRange: '7/24-7/26', name: 'Lake Tekapo 湖景小屋',
    address: 'Lakeside Drive, Lake Tekapo, New Zealand',
    checkin: '16:00 後入住，鑰匙置物箱密碼 2026',
    roomNote: 'A 棟：Richard 家、Max 家；B 棟：其餘家庭'
  },
  {
    dateRange: '7/26-7/29', name: '皇后鎮 Airbnb 大宅',
    address: 'Fernhill, Queenstown, New Zealand',
    checkin: '自助入住，屋主會傳門鎖密碼',
    roomNote: '主臥 Cathy 家、次臥 Fenix 家、閣樓小孩房'
  },
  {
    dateRange: '7/29-7/31', name: '奧瑪魯 Airbnb',
    address: 'Thames Street, Oamaru, New Zealand',
    checkin: '15:00 後入住，看藍企鵝步行 5 分鐘',
    roomNote: 'FJZH 三家共用，房間現場協調'
  }
];

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<{ days: DayData[]; budget: BudgetData[]; arrivals: ArrivalData[]; duty: DutyData[]; lodging: LodgingData[] }>({
    days: fallbackDays.map(d => ({ ...d, items: d.items.map(i => ({ ...i, day: d.day })) })),
    budget: fallbackBudget,
    arrivals: [
      { type: 'First Arrival', time: '7/22 13:25', detail: 'Fenix 家 (2大)\nJerry 家 (2大1小)\nZiv 家 (2大1小)', color: 'bg-sky-600' },
      { type: '2nd Arrival', time: '7/22 14:35', detail: 'Cathy 家 (4大)', color: 'bg-sky-400' },
      { type: '3rd Arrival', time: '7/23 00:20', detail: 'Richard 家 (2大2小)', color: 'bg-sky-300' },
      { type: 'Final Arrival', time: '7/24 14:35', detail: 'Max 家 (2大1小)', color: 'bg-indigo-600' }
    ],
    duty: fallbackDuty,
    lodging: fallbackLodging
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const result = await getAllData();
        if (result) {
          setData(prev => ({
            days: result.days || prev.days,
            budget: result.budget || prev.budget,
            arrivals: result.arrivals || prev.arrivals,
            duty: result.duty || prev.duty,
            lodging: result.lodging || prev.lodging
          }));
        }
      } catch (err) {
        console.error('Failed to load data from Google Sheets:', err);
        setError('無法從 Google 試算表載入資料，將使用預設資料。');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <DataContext.Provider value={{ ...data, loading, error }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
