import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Receipt, Plus, Trash2, Clock, ArrowRight, Wallet, Calculator, RotateCcw } from 'lucide-react';
import { useData } from '../DataContext';

interface Expense {
  id: number;
  payer_family: string;
  amount_nzd: number;
  description: string;
  splits: Record<string, number>;
  timestamp: string;
}

interface Transfer {
  from: string;
  to: string;
  amount: number;
}

type SplitMode = 'even' | 'custom';

function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export default function Expenses() {
  const { budget: families } = useData();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [payerFamily, setPayerFamily] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [mode, setMode] = useState<SplitMode>('even');
  const [evenFamilies, setEvenFamilies] = useState<string[]>([]);
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showSettlement, setShowSettlement] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const nameOf = (id: string) => families.find(f => f.id === id)?.name || id;

  useEffect(() => {
    if (families.length > 0) {
      if (!payerFamily) setPayerFamily(families[0].id);
      if (evenFamilies.length === 0) setEvenFamilies(families.map(f => f.id));
    }
  }, [families]);

  const fetchExpenses = async () => {
    try {
      const res = await fetch('/api/expenses');
      if (res.ok) setExpenses(await res.json());
    } catch (error) {
      console.error('Failed to fetch expenses:', error);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const toggleEven = (id: string) => {
    setEvenFamilies(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const amountNzd = parseFloat(amount) || 0;

  const evenShare = useMemo(() => {
    if (mode !== 'even' || evenFamilies.length === 0) return 0;
    return round2(amountNzd / evenFamilies.length);
  }, [mode, amountNzd, evenFamilies]);

  const customAllocated = useMemo(() => {
    return families.reduce((sum, f) => sum + (parseFloat(customAmounts[f.id]) || 0), 0);
  }, [customAmounts, families]);

  const customRemaining = round2(amountNzd - customAllocated);

  const buildSplits = (): Record<string, number> | null => {
    if (mode === 'even') {
      if (evenFamilies.length === 0 || !(amountNzd > 0)) return null;
      const base = Math.floor((amountNzd / evenFamilies.length) * 100) / 100;
      const splits: Record<string, number> = {};
      evenFamilies.forEach(id => { splits[id] = base; });
      const remainder = round2(amountNzd - base * evenFamilies.length);
      splits[evenFamilies[0]] = round2(splits[evenFamilies[0]] + remainder);
      return splits;
    }
    const splits: Record<string, number> = {};
    families.forEach(f => {
      const v = parseFloat(customAmounts[f.id]) || 0;
      if (v > 0) splits[f.id] = round2(v);
    });
    if (Object.keys(splits).length === 0) return null;
    return splits;
  };

  const customBalanced = mode === 'custom' && amountNzd > 0 && Math.abs(customRemaining) <= 0.01;
  const canSubmit =
    !!payerFamily &&
    amountNzd > 0 &&
    !!description.trim() &&
    (mode === 'even' ? evenFamilies.length > 0 : customBalanced);

  const resetForm = () => {
    setAmount('');
    setDescription('');
    setEvenFamilies(families.map(f => f.id));
    setCustomAmounts({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const splits = buildSplits();
    if (!canSubmit || !splits) return;

    setIsLoading(true);
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payerFamily,
          amountNzd,
          description: description.trim(),
          splits,
        }),
      });
      if (res.ok) {
        resetForm();
        fetchExpenses();
      }
    } catch (error) {
      console.error('Failed to post expense:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
      if (res.ok) fetchExpenses();
    } catch (error) {
      console.error('Failed to delete expense:', error);
    }
  };

  const handleClearAll = async () => {
    try {
      const res = await fetch('/api/expenses', { method: 'DELETE' });
      if (res.ok) {
        setConfirmClear(false);
        setShowSettlement(false);
        fetchExpenses();
      }
    } catch (error) {
      console.error('Failed to clear expenses:', error);
    }
  };

  const settlement = useMemo(() => {
    const net: Record<string, number> = {};
    families.forEach(f => { net[f.id] = 0; });

    for (const exp of expenses) {
      net[exp.payer_family] = (net[exp.payer_family] ?? 0) + exp.amount_nzd;
      for (const [fid, share] of Object.entries(exp.splits) as [string, number][]) {
        net[fid] = (net[fid] ?? 0) - share;
      }
    }

    const creditors = Object.entries(net)
      .filter(([, v]) => v > 0.005)
      .map(([id, v]) => ({ id, amount: v }));
    const debtors = Object.entries(net)
      .filter(([, v]) => v < -0.005)
      .map(([id, v]) => ({ id, amount: -v }));

    creditors.sort((a, b) => b.amount - a.amount);
    debtors.sort((a, b) => b.amount - a.amount);

    const transfers: Transfer[] = [];
    let ci = 0;
    let di = 0;
    while (ci < creditors.length && di < debtors.length) {
      const c = creditors[ci];
      const d = debtors[di];
      const pay = Math.min(c.amount, d.amount);
      transfers.push({ from: d.id, to: c.id, amount: round2(pay) });
      c.amount -= pay;
      d.amount -= pay;
      if (c.amount < 0.005) ci++;
      if (d.amount < 0.005) di++;
    }

    return { net, transfers };
  }, [expenses, families]);

  return (
    <div className="space-y-8">
      <div className="bg-camp-card p-6 md:p-8 rounded-[2.5rem] border border-camp-border shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-camp-brown/15 p-2 rounded-xl border border-camp-brown/30">
            <Receipt className="w-5 h-5 text-camp-brown" />
          </div>
          <h3 className="text-xl font-black text-camp-text tracking-tight">新增消費</h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-camp-muted uppercase tracking-widest mb-2">誰墊的</label>
              <select
                value={payerFamily}
                onChange={(e) => setPayerFamily(e.target.value)}
                className="w-full min-h-[48px] bg-camp-bg border-2 border-camp-border rounded-2xl px-4 py-3 text-sm font-bold text-camp-brown focus:border-camp-brown focus:outline-none transition-all"
              >
                {families.map(f => (
                  <option key={f.id} value={f.id} className="bg-camp-card text-camp-text">{f.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-black text-camp-muted uppercase tracking-widest mb-2">金額 (NZD)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full min-h-[48px] bg-camp-bg border-2 border-camp-border rounded-2xl px-4 py-3 text-sm font-bold text-camp-text placeholder:text-camp-muted focus:border-camp-brown focus:outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-camp-muted uppercase tracking-widest mb-2">這筆是什麼</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="這筆消費是什麼？例如：Fergburger 晚餐、超市採買"
              className="w-full min-h-[48px] bg-camp-bg border-2 border-camp-border rounded-2xl px-4 py-3 text-sm font-medium text-camp-text placeholder:text-camp-muted focus:border-camp-brown focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-camp-muted uppercase tracking-widest mb-3">分攤方式</label>
            <div className="flex gap-2 mb-4">
              {([['even', '均分'], ['custom', '指定金額']] as [SplitMode, string][]).map(([m, label]) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`flex-1 min-h-[44px] px-4 py-2 rounded-2xl text-sm font-black border-2 transition-all ${
                    mode === m
                      ? 'bg-camp-brown text-camp-card border-camp-brown shadow-sm'
                      : 'bg-camp-bg text-camp-muted border-camp-border'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {mode === 'even' ? (
              <div>
                <div className="flex flex-wrap gap-2">
                  {families.map(f => {
                    const active = evenFamilies.includes(f.id);
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => toggleEven(f.id)}
                        className={`min-h-[44px] px-4 py-2 rounded-full text-sm font-bold border-2 transition-all ${
                          active
                            ? 'bg-camp-green text-camp-card border-camp-green shadow-sm'
                            : 'bg-camp-bg text-camp-muted border-camp-border'
                        }`}
                      >
                        {f.name}
                      </button>
                    );
                  })}
                </div>
                {evenFamilies.length > 0 && amountNzd > 0 && (
                  <p className="mt-3 text-sm font-bold text-camp-brown">
                    每家 NZD {evenShare.toFixed(2)}
                  </p>
                )}
              </div>
            ) : (
              <div>
                <div className="space-y-2">
                  {families.map(f => (
                    <div key={f.id} className="flex items-center gap-3">
                      <span className="flex-1 text-sm font-bold text-camp-text">{f.name}</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={customAmounts[f.id] ?? ''}
                        onChange={(e) =>
                          setCustomAmounts(prev => ({ ...prev, [f.id]: e.target.value }))
                        }
                        placeholder="0.00"
                        className="w-32 min-h-[44px] bg-camp-bg border-2 border-camp-border rounded-2xl px-4 py-2 text-sm font-bold text-camp-text placeholder:text-camp-muted focus:border-camp-brown focus:outline-none transition-all text-right"
                      />
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-sm font-bold text-camp-muted">
                  已分配 NZD {round2(customAllocated).toFixed(2)} / 總額 NZD {amountNzd.toFixed(2)}、
                  <span className={Math.abs(customRemaining) <= 0.01 ? 'text-camp-green' : 'text-red-600'}>
                    {' '}剩餘 NZD {customRemaining.toFixed(2)}
                  </span>
                </p>
                {amountNzd > 0 && !customBalanced && (
                  <p className="mt-1 text-xs font-bold text-red-600">
                    各家分攤總和需等於總額才能送出。
                  </p>
                )}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || !canSubmit}
            className="w-full min-h-[52px] bg-camp-brown text-camp-card rounded-2xl px-6 font-black text-base flex items-center justify-center gap-2 shadow-lg hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-50"
          >
            <Plus className="w-5 h-5" />
            記一筆
          </button>
        </form>
      </div>

      <div className="bg-camp-card p-6 md:p-8 rounded-[2.5rem] border border-camp-border shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-camp-green/15 p-2 rounded-xl border border-camp-green/30">
            <Wallet className="w-5 h-5 text-camp-green" />
          </div>
          <h3 className="text-xl font-black text-camp-text tracking-tight">結算</h3>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <button
            type="button"
            onClick={() => setShowSettlement(prev => !prev)}
            className="flex-1 min-h-[44px] px-5 py-2 rounded-2xl text-sm font-black flex items-center justify-center gap-2 bg-camp-green text-camp-card border-2 border-camp-green shadow-sm hover:opacity-90 active:scale-[0.99] transition-all"
          >
            <Calculator className="w-4 h-4" />
            {showSettlement ? '收合結算' : '結算'}
          </button>

          {confirmClear ? (
            <div className="flex-1 flex items-center gap-2 min-h-[44px] px-3 py-2 rounded-2xl bg-camp-brown/10 border-2 border-camp-brown/40">
              <span className="text-sm font-black text-camp-brown">確定要清空全部消費？</span>
              <div className="ml-auto flex gap-2">
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="min-h-[36px] px-3 py-1 rounded-xl text-sm font-black bg-camp-brown text-camp-card border-2 border-camp-brown active:scale-[0.99] transition-all"
                >
                  確定
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmClear(false)}
                  className="min-h-[36px] px-3 py-1 rounded-xl text-sm font-black bg-camp-bg text-camp-muted border-2 border-camp-border active:scale-[0.99] transition-all"
                >
                  取消
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmClear(true)}
              className="flex-1 min-h-[44px] px-5 py-2 rounded-2xl text-sm font-black flex items-center justify-center gap-2 bg-camp-bg text-camp-brown border-2 border-camp-brown/50 hover:bg-camp-brown/10 active:scale-[0.99] transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              已結清歸零
            </button>
          )}
        </div>

        {showSettlement && (
          expenses.length === 0 ? (
            <p className="text-center text-sm text-camp-muted font-medium py-6">
              還沒有消費紀錄
            </p>
          ) : settlement.transfers.length === 0 ? (
            <p className="text-center text-sm text-camp-muted font-medium py-6">
              帳目已平衡，大家互不相欠 🎉
            </p>
          ) : (
            <div className="space-y-3">
              {settlement.transfers.map((t, i) => (
                <div
                  key={i}
                  className="bg-camp-bg p-4 rounded-2xl border border-camp-border flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2 flex-wrap text-sm font-black text-camp-text">
                    <span>{nameOf(t.from)}</span>
                    <ArrowRight className="w-4 h-4 text-camp-brown" />
                    <span>{nameOf(t.to)}</span>
                  </div>
                  <span className="font-black text-camp-brown text-base whitespace-nowrap">NZD {t.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      <div className="bg-camp-card p-6 md:p-8 rounded-[2.5rem] border border-camp-border shadow-sm">
        <h3 className="text-xl font-black text-camp-text tracking-tight mb-6">消費紀錄</h3>
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {expenses.map((exp) => (
              <motion.div
                key={exp.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-camp-bg p-4 rounded-2xl border border-camp-border"
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-black text-camp-text">{exp.description}</span>
                      <span className="text-sm font-black text-camp-brown whitespace-nowrap">NZD {exp.amount_nzd.toFixed(2)}</span>
                    </div>
                    <p className="mt-1 text-sm text-camp-muted font-medium">
                      <span className="font-bold text-camp-text">{nameOf(exp.payer_family)}</span> 墊付
                    </p>
                    <p className="mt-1 text-sm text-camp-muted font-medium">
                      分攤：{(Object.entries(exp.splits) as [string, number][]).map(([fid, v]) => `${nameOf(fid)} NZD ${v.toFixed(2)}`).join('、')}
                    </p>
                    <div className="mt-2 flex items-center gap-1.5 text-xs font-black text-camp-muted uppercase tracking-widest">
                      <Clock className="w-3 h-3" />
                      {new Date(exp.timestamp).toLocaleString('zh-TW', {
                        month: 'numeric',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(exp.id)}
                    className="p-2 text-camp-muted hover:text-red-600 hover:bg-red-500/10 rounded-lg transition-all shrink-0"
                    title="刪除消費"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {expenses.length === 0 && (
            <p className="text-center text-sm text-camp-muted font-medium py-4">
              尚無消費紀錄。
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
