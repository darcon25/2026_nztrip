import React from 'react';
import { motion } from 'motion/react';
import { FileText, Globe, Clock, DollarSign, PlaneTakeoff, AlertCircle, CreditCard, Zap } from 'lucide-react';

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

  const preDepartureChecks = [
    {
      title: '設定信用卡 PIN Code',
      icon: <CreditCard className="w-5 h-5 text-emerald-600" />,
      content: (
        <div className="space-y-3">
          <p className="text-slate-700 font-medium">
            澳洲與紐西蘭的刷卡系統與台灣不同，<span className="font-black text-emerald-700">所有刷卡交易皆需要輸入 PIN Code</span>，無法使用簽名方式。
          </p>
          <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
            <h5 className="font-bold text-emerald-900 mb-2">設定方式：</h5>
            <ul className="text-sm text-emerald-800 space-y-1 list-disc list-inside">
              <li>聯絡您的發卡銀行客服</li>
              <li>提供身分證明文件</li>
              <li>設定 4-6 位數字的 PIN Code</li>
              <li>建議在出發前 1-2 週完成設定</li>
            </ul>
          </div>
          <p className="text-xs text-slate-500 italic">
            💡 記得 PIN Code 並妥善保管，避免與他人分享
          </p>
        </div>
      )
    },
    {
      title: '電源插座與電器用品',
      icon: <Zap className="w-5 h-5 text-amber-600" />,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
              <h5 className="font-bold text-amber-900 mb-3">🇦🇺 澳洲電壓規格：</h5>
              <ul className="text-sm text-amber-800 space-y-2">
                <li><span className="font-semibold">標準電壓：</span>230V</li>
                <li><span className="font-semibold">頻率：</span>50Hz</li>
                <li><span className="font-semibold">插座標準：</span>Type I (AS/NZS 3112)</li>
                <li><span className="font-semibold">腳位配置：</span>兩平腳 + 一圓接地腳</li>
              </ul>
            </div>
            <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
              <h5 className="font-bold text-amber-900 mb-3">🇹🇼 台灣 vs 🇦🇺 澳洲：</h5>
              <div className="space-y-2">
                <div className="bg-white/50 p-2 rounded">
                  <p className="text-xs text-amber-700 font-medium">台灣</p>
                  <p className="text-sm text-amber-800">110V / 60Hz</p>
                </div>
                <div className="bg-white/50 p-2 rounded">
                  <p className="text-xs text-amber-700 font-medium">澳洲</p>
                  <p className="text-sm text-amber-800">230V / 50Hz</p>
                </div>
                <p className="text-xs text-red-600 font-bold mt-2">⚠️ 電壓與頻率皆不同！</p>
              </div>
            </div>
          </div>

          <div className="bg-red-50 p-4 rounded-xl border border-red-100">
            <h5 className="font-bold text-red-900 mb-3">⚠️ 重要安全提醒：</h5>
            <div className="space-y-2 text-sm text-red-800">
              <p><span className="font-semibold">電壓差異：</span>澳洲 230V vs 台灣 110V，電器可能過熱損壞</p>
              <p><span className="font-semibold">轉接頭必需：</span>所有台灣電器都需要澳規轉接頭</p>
              <p><span className="font-semibold">建議準備：</span>手機充電器、筆電電源、相機充電器等</p>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h5 className="font-bold text-slate-900 mb-3">澳規轉接頭 (Type I) 外觀：</h5>
            <div className="flex flex-col md:flex-row justify-center items-center gap-6">
              <div className="text-center w-full md:w-1/2">
                <div className="inline-block bg-white p-4 rounded-lg border-2 border-slate-300 shadow-sm">
                  <img
                    src="https://www.isec.com.tw/data/uploader/images/20241107_163049.jpg"
                    alt="澳洲 Type I 插座"
                    className="max-w-full h-auto rounded-lg"
                  />
                </div>
                <p className="text-xs text-slate-600 font-medium mt-3">澳洲插座 Type I</p>
              </div>
              <div className="text-center w-full md:w-1/2">
                <div className="inline-block bg-white p-4 rounded-lg border-2 border-slate-300 shadow-sm">
                  <div className="text-center mb-3">
                    <div className="inline-block bg-slate-100 rounded-sm p-4">
                      <div className="mx-auto w-10 h-12 relative">
                        <div className="absolute left-0 top-1 w-1.5 h-3 bg-slate-600 rounded-sm"></div>
                        <div className="absolute right-0 top-1 w-1.5 h-3 bg-slate-600 rounded-sm"></div>
                        <div className="absolute left-1/2 top-8 -translate-x-1/2 w-1.5 h-5 bg-slate-600 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 font-medium">轉接頭</p>
                  <p className="text-xs text-slate-500 mt-1">台灣→澳洲</p>
                  <p className="text-xs text-slate-400 mt-1">Type A → Type I</p>
                </div>
              </div>
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs text-blue-800 font-medium text-center">
                💡 購買地點：台灣各大電器行、網路商店（如 PChome、蝦皮）或機場免稅店
              </p>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-xl border border-green-200">
            <h5 className="font-bold text-green-900 mb-2">✅ 檢查清單：</h5>
            <ul className="text-sm text-green-800 space-y-1">
              <li>• 確認所有電器支援 100-240V 輸入</li>
              <li>• 準備足夠數量的澳規轉接頭</li>
              <li>• 檢查電器是否需要變壓器</li>
              <li>• 確認充電器有自動電壓調整功能</li>
            </ul>
          </div>
        </div>
      )
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
          出發前檢查 (持台灣護照)
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

      {/* 出發前檢查事項 */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <h2 className="text-2xl font-black text-slate-900 mb-6 tracking-tight flex items-center gap-2">
          <AlertCircle className="w-6 h-6 text-emerald-600" />
          出發前檢查事項
        </h2>

        <div className="space-y-6">
          {preDepartureChecks.map((check, idx) => (
            <div key={idx} className="bg-slate-50 p-6 rounded-3xl border border-slate-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-white p-2 rounded-xl shadow-sm">
                  {check.icon}
                </div>
                <h3 className="font-black text-lg text-slate-900">{check.title}</h3>
              </div>
              {check.content}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

