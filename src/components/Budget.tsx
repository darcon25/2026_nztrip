import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Car, Hotel, CreditCard } from 'lucide-react';
import { useData } from '../DataContext';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function Budget() {
  const { budget: familyBudgets } = useData();
  const [selectedFamilyId, setSelectedFamilyId] = useState(familyBudgets[0]?.id);

  useEffect(() => {
    if (familyBudgets.length > 0 && !familyBudgets.find(f => f.id === selectedFamilyId)) {
      setSelectedFamilyId(familyBudgets[0].id);
    }
  }, [familyBudgets]);

  const selectedFamily = useMemo(() => 
    familyBudgets.find(f => f.id === selectedFamilyId) || familyBudgets[0]
  , [selectedFamilyId]);

  const chartData = {
    labels: ['租車分攤', '住宿費用'],
    datasets: [
      {
        data: [selectedFamily.car, selectedFamily.hotel],
        backgroundColor: ['#0284c7', '#4338ca'],
        borderColor: ['#ffffff', '#ffffff'],
        borderWidth: 4,
        hoverOffset: 10
      }
    ]
  };

  const chartOptions = {
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          font: {
            family: 'Noto Sans TC',
            weight: 'bold' as const
          },
          padding: 20
        }
      }
    },
    maintainAspectRatio: false
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      <div className="bg-slate-900/50 backdrop-blur-sm p-8 rounded-[2.5rem] border border-slate-800 shadow-sm">
        <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tighter">家族預算分攤表</h2>
        <p className="text-slate-400 mb-8 font-medium italic leading-relaxed">
          租車費用 NZD 3,600 已依各家庭實際使用天數進行權重分攤。FJZH (9天), Richard (8天), MAX (7天)。
        </p>
        
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1 w-full">
            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3">請選擇您的家庭：</label>
            <select 
              value={selectedFamilyId}
              onChange={(e) => setSelectedFamilyId(e.target.value)}
              className="w-full bg-slate-800 border-2 border-transparent rounded-2xl px-6 py-4 font-black text-sky-400 focus:bg-slate-700 focus:border-sky-500 focus:outline-none transition-all shadow-inner"
            >
              {familyBudgets.map(f => (
                <option key={f.id} value={f.id} className="bg-slate-800 text-white">{f.name}</option>
              ))}
            </select>

            <div className="mt-8 space-y-4">
              <div className="bg-slate-800/50 p-5 rounded-2xl border border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-sky-900/50 p-2 rounded-lg border border-sky-800"><Car className="w-5 h-5 text-sky-400" /></div>
                  <span className="font-bold text-slate-300">租車分攤</span>
                </div>
                <span className="font-black text-sky-400 text-lg">NZD {selectedFamily.car}</span>
              </div>
              <div className="bg-slate-800/50 p-5 rounded-2xl border border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-indigo-900/50 p-2 rounded-lg border border-indigo-800"><Hotel className="w-5 h-5 text-indigo-400" /></div>
                  <span className="font-bold text-slate-300">住宿費用</span>
                </div>
                <span className="font-black text-indigo-400 text-lg">NZD {selectedFamily.hotel}</span>
              </div>
              <div className="bg-sky-600 p-6 rounded-2xl text-slate-900 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-6 h-6 text-slate-900 opacity-70" />
                  <span className="font-black text-xl">總計金額</span>
                </div>
                <span className="font-black text-2xl">NZD {selectedFamily.total}</span>
              </div>
            </div>
          </div>

          <div className="flex-1 w-full h-[300px] md:h-[400px]">
            <Pie data={chartData} options={{
              ...chartOptions,
              plugins: {
                ...chartOptions.plugins,
                legend: {
                  ...chartOptions.plugins.legend,
                  labels: {
                    ...chartOptions.plugins.legend.labels,
                    color: '#94a3b8'
                  }
                }
              }
            }} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
