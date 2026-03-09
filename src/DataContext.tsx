import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAllData, DayData, BudgetData, ArrivalData } from './services/googleSheetService';
import { days as fallbackDays, familyBudgets as fallbackBudget } from './constants';

interface DataContextType {
  days: DayData[];
  budget: BudgetData[];
  arrivals: ArrivalData[];
  loading: boolean;
  error: string | null;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<{ days: DayData[]; budget: BudgetData[]; arrivals: ArrivalData[] }>({
    days: fallbackDays.map(d => ({ ...d, items: d.items.map(i => ({ ...i, day: d.day })) })),
    budget: fallbackBudget,
    arrivals: [
      { type: 'First Arrival', time: '7/22 13:25', detail: 'Fenix 家 (2大)\nJerry 家 (2大1小)\nZiv 家 (2大1小)', color: 'bg-sky-600' },
      { type: '2nd Arrival', time: '7/22 14:35', detail: 'Cathy 家 (4大)', color: 'bg-sky-400' },
      { type: '3rd Arrival', time: '7/23 00:20', detail: 'Richard 家 (2大2小)', color: 'bg-sky-300' },
      { type: 'Final Arrival', time: '7/24 14:35', detail: 'Max 家 (2大1小)', color: 'bg-indigo-600' }
    ]
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
            arrivals: result.arrivals || prev.arrivals
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
