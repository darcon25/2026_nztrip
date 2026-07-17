import React from 'react';
import { motion } from 'motion/react';
import { FileText, Globe, Clock, DollarSign, PlaneTakeoff, AlertCircle } from 'lucide-react';

export default function Visa() {
  const visaData = [
    {
      country: '紐西蘭 (New Zealand)',
      type: 'NZeTA (電子旅行授權)',
      duration: '最快 72 小時內 (建議提早 1 週)',
      cost: 'APP 申請 NZD $17 / 網頁申請 NZD $23 + IVL 稅金 NZD $100',
      note: '持有台灣護照（有身分證字號）免簽證，但必須申請 NZeTA。IVL 為國際旅客保育及旅遊稅。',
      icon: <Globe className="w-6 h-6 text-sky-600" />
    },
    {
      country: '澳洲 (Australia)',
      type: 'ETA (電子觀光簽證 - 601 類別)',
      duration: '通常幾分鐘至幾天內',
      cost: 'AUD $20 (僅能透過 AustralianETA APP 辦理)',
      note: '台灣護照持有人適用。若在澳洲轉機超過 8 小時或需入境領行李，皆需辦理。',
      icon: <PlaneTakeoff className="w-6 h-6 text-indigo-600" />
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <h2 className="text-2xl font-black text-slate-900 mb-6 tracking-tight flex items-center gap-2">
          <FileText className="w-6 h-6 text-sky-600" />
          簽證辦理指南 (持台灣護照)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {visaData.map((visa, idx) => (
            <div key={idx} className="bg-stone-50 p-6 rounded-3xl border border-slate-100 space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-white p-3 rounded-2xl shadow-sm">
                  {visa.icon}
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-900">{visa.country}</h3>
                  <p className="text-sky-600 font-bold text-sm">{visa.type}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-slate-400 mt-1 shrink-0" />
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">辦理時間</p>
                    <p className="text-sm font-bold text-slate-700">{visa.duration}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <DollarSign className="w-4 h-4 text-slate-400 mt-1 shrink-0" />
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">預估費用</p>
                    <p className="text-sm font-bold text-slate-700">{visa.cost}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/50 p-4 rounded-2xl border border-slate-100">
                <p className="text-xs text-slate-500 leading-relaxed italic">
                  {visa.note}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 p-6 bg-amber-50 rounded-3xl border border-amber-100">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <h4 className="font-black text-amber-900">澳洲轉機/短暫停留特別提醒</h4>
          </div>
          <ul className="space-y-2 text-sm text-amber-800 font-medium list-disc list-inside">
            <li>若在澳洲轉機時間 <span className="font-black">少於 8 小時</span> 且不離開過境區，通常不需簽證。</li>
            <li>若需 <span className="font-black">入境領取行李</span> 或轉機時間 <span className="font-black">超過 8 小時</span>，必須持有有效 ETA 或轉機簽證。</li>
            <li>建議所有經澳洲轉機的成員皆辦理 ETA，以應對航班延誤或臨時入境需求，費用僅 AUD $20 且效期一年。</li>
            <li>紐西蘭 NZeTA 效期為兩年，可多次入境。</li>
          </ul>
        </div>
      </div>
    </motion.div>
  );
}
