import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { Car, Hotel, CreditCard, CheckCircle, Clock3, Banknote } from 'lucide-react';
import { useData } from '../DataContext';

function statusBadge(paid: boolean) {
  return {
    label: paid ? '已匯款' : '待匯款',
    className: paid ? 'bg-emerald-500 text-emerald-900' : 'bg-amber-400 text-amber-950',
    Icon: paid ? CheckCircle : Clock3
  };
}

export default function Budget() {
  const { budget: familyBudgets } = useData();
  const [selectedFamilyId, setSelectedFamilyId] = useState(familyBudgets[0]?.id);
  const [localBudgets, setLocalBudgets] = useState(familyBudgets);

  useEffect(() => {
    if (familyBudgets.length > 0 && !familyBudgets.find(f => f.id === selectedFamilyId)) {
      setSelectedFamilyId(familyBudgets[0].id);
    }
    setLocalBudgets(familyBudgets);
  }, [familyBudgets]);

  const updatePaymentStatus = (familyId: string, field: string, paid: boolean) => {
    setLocalBudgets(prev => prev.map(family =>
      family.id === familyId ? { ...family, [field]: paid } : family
    ));
  };

  const selectedFamily = useMemo(() =>
    localBudgets.find(f => f.id === selectedFamilyId) || localBudgets[0]
  , [selectedFamilyId, localBudgets]);

  const carDeposit = selectedFamily.carBooking;
  const carBalance = Math.max(0, selectedFamily.car - selectedFamily.carBooking);
  const accommodationDeposit = selectedFamily.accommodationBooking;
  const accommodationBalance = Math.max(0, selectedFamily.accommodation - selectedFamily.accommodationBooking);

  const budgetSections = [
    {
      title: '租車',
      total: selectedFamily.car,
      icon: Car,
      accent: 'sky',
      deposit: {
        label: '租車訂金',
        amount: carDeposit,
        paid: !!selectedFamily.carDepositPaid
      },
      balance: {
        label: '租車尾款',
        amount: carBalance,
        paid: !!selectedFamily.carBalancePaid
      }
    },
    {
      title: '住宿',
      total: selectedFamily.accommodation,
      icon: Hotel,
      accent: 'indigo',
      deposit: {
        label: '住宿訂金',
        amount: accommodationDeposit,
        paid: !!selectedFamily.accommodationDepositPaid
      },
      balance: {
        label: '住宿尾款',
        amount: accommodationBalance,
        paid: !!selectedFamily.accommodationBalancePaid
      }
    }
  ];

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
          目前預算只顯示兩大項：租車與住宿，並分成訂金與尾款兩部份，方便追蹤匯款狀態。
        </p>

        <div className="flex flex-col gap-8">
          <div className="w-full">
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

            <div className="mt-8 space-y-6">
              {budgetSections.map((section) => {
                const Icon = section.icon;
                return (
                  <div key={section.title} className="bg-slate-800/50 p-6 rounded-[2rem] border border-slate-700 shadow-sm">
                    <div className="flex items-center justify-between mb-6 gap-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-2xl border ${section.accent === 'sky' ? 'bg-sky-900/60 border-sky-800' : 'bg-indigo-900/60 border-indigo-800'}`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-slate-300 font-black text-lg">{section.title}</p>
                          <p className="text-slate-500 text-sm">總額 NZD {section.total.toFixed(1)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      {[section.deposit, section.balance].map((item) => {
                        const badge = statusBadge(item.paid);
                        const IconStatus = badge.Icon;
                        const fieldName = section.title === '租車' 
                          ? (item.label.includes('訂金') ? 'carDepositPaid' : 'carBalancePaid')
                          : (item.label.includes('訂金') ? 'accommodationDepositPaid' : 'accommodationBalancePaid');
                        
                        return (
                          <div key={item.label} className="bg-slate-900/70 p-5 rounded-3xl border border-slate-700">
                            <div className="flex items-start justify-between gap-3 mb-4">
                              <div>
                                <p className="text-slate-400 uppercase tracking-[0.2em] text-[11px] font-bold">{item.label}</p>
                                <p className="mt-3 font-black text-xl text-white">NZD {item.amount.toFixed(1)}</p>
                              </div>
                              <select
                                value={item.paid ? 'paid' : 'pending'}
                                onChange={(e) => updatePaymentStatus(selectedFamilyId, fieldName, e.target.value === 'paid')}
                                className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-bold cursor-pointer transition-all ${badge.className}`}
                              >
                                <option value="pending">待匯款</option>
                                <option value="paid">匯款完成</option>
                              </select>
                            </div>
                            <div className="text-slate-500 text-xs leading-5">
                              {item.paid ? '已完成匯款，請保留收據備查。' : '尚未匯款，請儘速完成尾款或訂金。'}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-slate-400 text-sm">家庭成員</span>
                  <span className="font-black text-slate-300">{selectedFamily.hc} 人</span>
                </div>
                <div className="text-xs text-slate-500 font-medium italic">
                  {selectedFamily.remark}
                </div>
              </div>

              <div className="bg-sky-600 p-6 rounded-2xl text-slate-900 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-6 h-6 text-slate-900 opacity-70" />
                  <span className="font-black text-xl">總計金額</span>
                </div>
                <span className="font-black text-2xl">NZD {selectedFamily.total.toFixed(1)}</span>
              </div>

              {/* 訂金與尾款總計區塊 */}
              <div className="bg-gradient-to-r from-slate-600 to-slate-700 p-6 rounded-2xl text-white shadow-lg border border-slate-500">
                <div className="flex items-center gap-3 mb-4">
                  <CreditCard className="w-6 h-6 text-white opacity-80" />
                  <h3 className="font-black text-xl uppercase tracking-wider">付款階段總計</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/15 p-4 rounded-xl backdrop-blur-sm">
                    <p className="text-slate-200 text-sm font-medium mb-2">訂金總額</p>
                    <p className="font-black text-2xl">NZD {(carDeposit + accommodationDeposit).toFixed(1)}</p>
                    <p className="text-slate-300 text-xs mt-1">租車 + 住宿訂金</p>
                  </div>
                  <div className="bg-white/15 p-4 rounded-xl backdrop-blur-sm">
                    <p className="text-slate-200 text-sm font-medium mb-2">尾款總額</p>
                    <p className="font-black text-2xl">NZD {(carBalance + accommodationBalance).toFixed(1)}</p>
                    <p className="text-slate-300 text-xs mt-1">租車 + 住宿尾款</p>
                  </div>
                </div>
                <p className="text-slate-300 text-sm mt-4 font-medium italic">
                  訂金與尾款付款時間不同，請分階段匯款
                </p>
              </div>

              {/* 匯款資訊區塊 */}
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-8 rounded-2xl text-white shadow-lg border border-emerald-500">
                <div className="flex items-center gap-4 mb-4">
                  <Banknote className="w-8 h-8 text-white" />
                  <h3 className="font-black text-2xl uppercase tracking-wider">匯款資訊</h3>
                </div>
                <div className="space-y-3">
                  <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm">
                    <p className="text-emerald-100 text-sm font-medium mb-2">銀行名稱</p>
                    <p className="font-black text-3xl tracking-wider">中國信託（822）</p>
                  </div>
                  <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm">
                    <p className="text-emerald-100 text-sm font-medium mb-2">帳號</p>
                    <p className="font-black text-3xl tracking-[0.2em]">0000134540000782</p>
                  </div>
                </div>
                <p className="text-emerald-100 text-sm mt-4 font-medium italic">
                  請在匯款完成後更新上方各項目的狀態
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
