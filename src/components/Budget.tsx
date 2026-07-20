import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Car, Hotel, CreditCard, Wallet } from 'lucide-react';
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
        backgroundColor: ['#A9682F', '#4C6B3C'],
        borderColor: ['#F7F2E7', '#F7F2E7'],
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
      <div className="bg-camp-card p-6 md:p-8 rounded-[2.5rem] border border-camp-border shadow-sm">
        <h2 className="text-2xl font-black text-camp-text mb-2 tracking-tighter">家族預算分攤表</h2>
        <p className="text-camp-muted mb-8 font-medium leading-relaxed text-sm">
          租車費用 NZD 3,600 已依各家庭實際使用天數進行權重分攤。FJZH (9天), Richard (8天), MAX (7天)。
        </p>

        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1 w-full">
            <label className="block text-xs font-black text-camp-muted uppercase tracking-widest mb-3">請選擇您的家庭：</label>
            <select
              value={selectedFamilyId}
              onChange={(e) => setSelectedFamilyId(e.target.value)}
              className="w-full min-h-[52px] bg-camp-bg border-2 border-camp-border rounded-2xl px-6 py-4 font-black text-camp-brown focus:border-camp-brown focus:outline-none transition-all shadow-inner"
            >
              {familyBudgets.map(f => (
                <option key={f.id} value={f.id} className="bg-camp-card text-camp-text">{f.name}</option>
              ))}
            </select>

            <div className="mt-8 space-y-4">
              <div className="bg-camp-bg p-5 rounded-2xl border border-camp-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-camp-brown/15 p-2 rounded-lg border border-camp-brown/30"><Car className="w-5 h-5 text-camp-brown" /></div>
                  <span className="font-bold text-camp-text">租車分攤</span>
                </div>
                <span className="font-black text-camp-brown text-lg">NZD {selectedFamily.car}</span>
              </div>
              <div className="bg-camp-bg p-5 rounded-2xl border border-camp-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-camp-green/15 p-2 rounded-lg border border-camp-green/30"><Hotel className="w-5 h-5 text-camp-green" /></div>
                  <span className="font-bold text-camp-text">住宿費用</span>
                </div>
                <span className="font-black text-camp-green text-lg">NZD {selectedFamily.hotel}</span>
              </div>
              <div className="bg-camp-brown p-6 rounded-2xl text-camp-card flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-6 h-6 text-camp-card opacity-80" />
                  <span className="font-black text-xl">總計金額</span>
                </div>
                <span className="font-black text-2xl">NZD {selectedFamily.total}</span>
              </div>
              {selectedFamily.prepaid > 0 && (
                <>
                  <div className="bg-camp-bg p-5 rounded-2xl border border-camp-border flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-camp-accent/15 p-2 rounded-lg border border-camp-accent/30"><Wallet className="w-5 h-5 text-camp-accent" /></div>
                      <span className="font-bold text-camp-text">已預付</span>
                    </div>
                    <span className="font-black text-camp-accent text-lg">NZD {selectedFamily.prepaid}</span>
                  </div>
                  <div className="bg-camp-green p-6 rounded-2xl text-camp-card flex items-center justify-between shadow-lg">
                    <div className="flex items-center gap-3">
                      <Wallet className="w-6 h-6 text-camp-card opacity-80" />
                      <span className="font-black text-xl">尚需支付</span>
                    </div>
                    <span className="font-black text-2xl">NZD {selectedFamily.total - selectedFamily.prepaid}</span>
                  </div>
                </>
              )}
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
                    color: '#4A2C17'
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
