# 每日行程摘要 + 地圖連動 實作計畫

> **給執行者（agentic worker）：** 必要子技能：用 `superpowers:subagent-driven-development`（建議）或 `superpowers:executing-plans` 逐任務執行本計畫。步驟用 checkbox（`- [ ]`）語法追蹤。

**目標：** 在互動地圖下方新增手風琴式「每日行程摘要」，並把互動地圖與亮點卡片的 Day 選擇合併成單一來源，讓兩排 Day 按鈕永遠同步。

**架構：** 新增獨立元件 `DailySummary.tsx`（自持展開狀態，不與任何人共享）；把 `selectedDay` 從 `AdventureMap` 與 `Itinerary` 各自的 local state 提升（lift up）到 `App.tsx`，用 props 往下傳。自動捲動的責任放在 `AdventureMap` 內部（誰觸發誰負責捲），`Itinerary` 只改狀態不捲動。

**技術棧：** React 19 + TypeScript（`tsc --noEmit` 檢查）、Vite、Tailwind CSS v4（`@theme` 定義 `camp-*` 色票）、lucide-react 圖示、motion/react 動畫、資料來自 Google Sheet（`useData()`）。

---

## 名詞白話說明（給初學者）

計畫中會用到的專有名詞，先解釋一次，後面不再重複：

- **state（狀態）**：元件自己記住的一個值，改變時畫面會自動重畫。例如「現在選了 Day 5」就是一個 state。
- **lift state up（狀態提升）**：兩個元件需要看同一個值時，把這個值搬到它們共同的父元件保管，再往下傳。本專案的父元件是 `App.tsx`。
- **props**：父元件傳給子元件的參數，像函式的參數一樣。子元件只能讀，不能直接改。
- **callback（回呼函式）**：父元件把一個「函式」當 props 傳下去，子元件想改父元件的狀態時就呼叫它。這裡叫 `onSelectDay`。
- **accordion（手風琴）**：一列一列的清單，點一列展開內容、再點收起，一次只開一個。
- **chip（標籤片）**：小小的圓角膠囊，裡面放一個短詞，多個時會自動換行排列。
- **regex（正規表示式）**：一段用來比對文字模式的規則字串，這裡用來砍掉標題結尾多餘的「Day 4」。
- **TypeScript 的 `number | null`**：這個值「要嘛是數字、要嘛是 null（空）」。這裡 `null` 代表「全部天數，不篩選」。
- **`npm run lint`**：本專案的 lint 就是 `tsc --noEmit`，只做型別檢查、不產生檔案。它會抓出「props 少傳了」「型別對不上」這類錯誤。

## 關於測試方式（重要，執行前先讀）

本專案**沒有安裝任何測試框架**（`package.json` 無 vitest/jest，無 `tests/` 目錄）。標準 TDD 流程（先寫失敗的測試）在這裡無法執行，而專案規範明訂「不建立不必要的新檔案」，因此**本計畫不引入測試框架**。

取而代之，每個任務的驗證循環是設計文件第 110 行明訂的方式：

1. `npm run lint` 必須通過（型別檢查會抓到絕大多數跨檔案改動的破綻，這是本計畫的第一道防線）
2. 瀏覽器實測，每個任務都列出「操作 → 預期畫面」的具體檢查項

每個任務都以「lint 通過 + 瀏覽器檢查項全過 → commit」收尾。

## 全域限制（Global Constraints）

以下是專案硬性規範，**每個任務都適用**：

- 所有文件、回覆、程式中的使用者可見文字一律**繁體中文**
- **手機優先（mobile-first）**：先寫手機版樣式，桌機版用 Tailwind 的 `sm:` / `md:` 前綴加上去
- 所有可點擊元素**最小高度 44px**（`min-h-[44px]`），符合觸控目標尺寸
- 只能使用現有 `camp-*` 色票（定義在 `src/index.css` 的 `@theme`）：`camp-bg` `camp-card` `camp-text` `camp-muted` `camp-border` `camp-brown` `camp-brown-dark` `camp-green` `camp-green-dark` `camp-accent`。**不得自創新色、不得直接寫 hex 色碼**
- **不加多餘註解**；只有「為什麼這樣寫」不明顯時才寫一行
- **不建立不必要的新檔案**（本計畫只新增一個 `DailySummary.tsx`）
- 每次改完**必須跑 `npm run lint`（= `tsc --noEmit`）通過才能 commit**
- `tsconfig.json` 的 `jsx` 是 `react-jsx`，**不需要 `import React`**，只有用到 `React.ReactNode` 這類型別時才 import
- 從 lucide-react 匯入圖示時，**若圖示名稱與 JS 內建物件撞名（如 `Map`）必須 alias**（`docs/進度.md` 記載過這個坑，`AdventureMap.tsx` 已 alias 成 `MapIcon`）
- Google Sheet 是行程的唯一真實來源，**程式端不過濾任何列**（包含已知的 `D11,8/1,測試` 測試列，由使用者自行在 Sheet 刪除）
- 啟動開發伺服器：`npm run dev`（port 3000）
- **瀏覽器截圖驗證前確認分頁在前景**（`document.visibilityState === 'visible'`），否則地圖標記的 motion 進場動畫會被 Chrome 節流凍結在半透明狀態，看起來像 bug（`docs/進度.md` 已記載）

## 檔案結構

| 檔案 | 動作 | 責任 |
|------|------|------|
| `src/components/DailySummary.tsx` | 新增 | 手風琴式每日摘要。自持 `openDay` 展開狀態，唯讀 `useData()` 的 `days`。不與地圖/亮點卡片有任何連動 |
| `src/App.tsx` | 修改 | 版面組裝 + 持有共用的 `selectedDay` state，往下傳給 `AdventureMap` 與 `Itinerary`；掛載 `DailySummary` |
| `src/components/AdventureMap.tsx` | 修改 | 移除自持的 `selectedDay`，改吃 props；Day 按鈕與地點標記點擊後負責觸發自動捲動 |
| `src/components/Itinerary.tsx` | 修改 | 移除自持的 `selectedDay`，型別由 `number \| 'all'` 改為 `number \| null`；改吃 props；**不做任何捲動** |

不動的檔案：`src/DataContext.tsx`、`src/services/googleSheetService.ts`、`src/index.css`（不新增色票）、`src/constants.ts`。

---

## Task 1：新增每日行程摘要元件

新增 `DailySummary.tsx` 並掛到 `App.tsx` 互動地圖下方。這個任務**完全獨立**，不碰任何既有元件的邏輯，先做完可以先看到成果。

**Files:**
- Create: `src/components/DailySummary.tsx`
- Modify: `src/App.tsx`（第 1-11 行 import 區；第 99-105 行 `<Section id="map">` 之後）

**Interfaces:**
- Consumes: `useData()` from `src/DataContext.tsx`，取其中的 `days: DayData[]`。`DayData` 定義在 `src/services/googleSheetService.ts:15-25`，本任務用到的欄位：`day: number`、`date: string`、`title: string`、`hotel: string`、`deadline?: string`（對應 Sheet 的 `alert` 欄）、`highlights?: string`（逗號分隔字串）
- Produces: `export default function DailySummary()`，**不接收任何 props**。後續 Task 2、3 不會用到它。

- [ ] **Step 1：建立 `src/components/DailySummary.tsx`**

完整檔案內容如下，照抄：

```tsx
import { useState } from 'react';
import { ChevronDown, Home, Clock } from 'lucide-react';
import { useData } from '../DataContext';
import { cn } from '../lib/utils';

function cleanTitle(title: string) {
  return String(title ?? '')
    .replace(/[\s　]*[（(]?\s*Day\s*\d+\s*[)）]?\s*$/i, '')
    .trim();
}

function parseHighlights(raw?: string) {
  return String(raw ?? '')
    .split(/[,，、]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function DailySummary() {
  const { days } = useData();
  const [openDay, setOpenDay] = useState<number | null>(null);

  const sortedDays = [...days].sort((a, b) => a.day - b.day);

  return (
    <div className="bg-camp-card rounded-[2rem] border border-camp-border shadow-sm overflow-hidden divide-y divide-camp-border">
      {sortedDays.map((d) => {
        const open = openDay === d.day;
        const chips = parseHighlights(d.highlights);
        return (
          <div key={d.day}>
            <button
              onClick={() => setOpenDay(open ? null : d.day)}
              aria-expanded={open}
              className="w-full min-h-[44px] px-4 py-3 flex items-center gap-2.5 text-left hover:bg-camp-brown/5 active:bg-camp-brown/10 transition-colors"
            >
              <span className="shrink-0 w-10 text-xs font-black text-camp-muted">{d.date}</span>
              <span className="shrink-0 inline-flex items-center justify-center px-2.5 py-0.5 rounded-full bg-camp-brown text-camp-card text-xs font-black">
                Day {d.day}
              </span>
              <span className="flex-1 text-sm font-black text-camp-text leading-snug">
                {cleanTitle(d.title)}
              </span>
              <ChevronDown
                className={cn(
                  'w-5 h-5 shrink-0 text-camp-brown transition-transform',
                  open && 'rotate-180'
                )}
              />
            </button>

            {open && (
              <div className="px-4 pb-4 pt-1 flex flex-col gap-3 bg-camp-bg/60">
                {chips.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {chips.map((c, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center px-2.5 py-1 rounded-lg bg-camp-card border border-camp-border text-xs font-bold text-camp-text"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs font-medium text-camp-muted">尚未安排</p>
                )}

                {d.hotel && (
                  <p className="flex items-center gap-1.5 text-xs font-bold text-camp-muted">
                    <Home className="w-4 h-4 shrink-0 text-camp-brown" />
                    {d.hotel}
                  </p>
                )}

                {d.deadline && (
                  <p className="flex items-center gap-1.5 text-xs font-bold text-camp-muted">
                    <Clock className="w-4 h-4 shrink-0 text-camp-brown" />
                    {d.deadline}
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
```

實作重點說明：
- `cleanTitle` 的 regex 砍掉標題**結尾**的 `Day 4`、`(Day 4)`、`（Day 4）` 及其前方空白（含全形空白 `　`）。`基督城集結 Day 1` → `基督城集結`；`探險起點：Tekapo (Day 4)` → `探險起點：Tekapo`；`蒂阿瑙螢火蟲` 不含 Day 番號，原樣保留。`i` 旗標讓 `day 4` 小寫也能砍到。
- `parseHighlights` 同時吃半形逗號、全形逗號、頓號三種分隔符（Sheet 是人手打的，分隔符不一定統一），`filter(Boolean)` 濾掉分割後的空字串。
- `openDay` 是單一數字而非陣列，天生就是「一次只展開一天」；點已展開的那天會設回 `null`（收起）。
- 排序用 `[...days]` 複製再排，不要直接 `days.sort()`——那會就地修改 Context 裡的陣列，是 React 的常見地雷。

- [ ] **Step 2：在 `App.tsx` 掛載 DailySummary**

在 `src/App.tsx` 第 9 行 `import AdventureMap from './components/AdventureMap';` 之後加一行：

```tsx
import DailySummary from './components/DailySummary';
```

然後把第 99-101 行的地圖區塊：

```tsx
          <Section id="map">
            <AdventureMap />
          </Section>
```

改成（在其後新增一個 Section）：

```tsx
          <Section id="map">
            <AdventureMap />
          </Section>

          <Section id="summary" title="每日行程摘要">
            <DailySummary />
          </Section>
```

註：`Section` 元件的 `title` 是選填的（`src/App.tsx:64`），這裡給標題讓使用者知道這區是什麼。`id="summary"` 供日後錨點連結使用，本次不加進頂部導覽（`quickLinks` 保持四格不動）。

- [ ] **Step 3：跑型別檢查**

```bash
cd /Users/mmfamily/Projects/2026_nztrip && npm run lint
```

預期：無任何輸出、exit code 0。若出現 `Cannot find module './components/DailySummary'`，代表檔案路徑或檔名打錯。

- [ ] **Step 4：瀏覽器實測**

```bash
cd /Users/mmfamily/Projects/2026_nztrip && npm run dev
```

開 `http://localhost:3000`，捲到互動地圖下方，逐項確認：

1. 「每日行程摘要」區塊出現在互動地圖正下方，是一張米色圓角卡片，內含一列一列的日期
2. 預設**全部收合**，看不到任何 chip
3. 點 Day 4 那列 → 展開，出現活動 chip、住宿（房子圖示）、出發時間（時鐘圖示）；右側箭頭轉 180 度朝上
4. 接著點 Day 5 那列 → Day 4 **自動收起**，只有 Day 5 展開（一次只開一天）
5. 再點一次 Day 5 那列 → 收起，回到全部收合
6. 展開 Day 2（`highlights` 空）→ 顯示灰字「尚未安排」，且 Day 2 那列**沒有被隱藏**
7. Day 4 收合列的標題**不出現重複的 Day 番號**（不該看到「Day 4 探險起點：Tekapo (Day 4)」）

- [ ] **Step 5：手機寬度確認**

用 Chrome DevTools 的裝置模式（Device Toolbar，快捷鍵 Cmd+Shift+M）切到 iPhone SE（375px 寬）確認：

1. 活動 chip 在窄螢幕會**自動換行**，不會被擠爆或橫向溢出
2. 收合列整體高度 ≥ 44px，手指好點
3. 標題文字過長時折行，不撐破卡片

註：`docs/進度.md` 記載 **Claude in Chrome 的視窗縮放無法真正模擬手機寬度**（`innerWidth` 卡在 1281），Tailwind 的 `sm:` 是看 viewport 的 media query，改 `body.style.width` 也無效。這一步**必須由使用者用真的 DevTools 裝置模式操作**，執行者無法自行完成，請在此暫停請使用者確認。

- [ ] **Step 6：Commit**

```bash
cd /Users/mmfamily/Projects/2026_nztrip
git add src/components/DailySummary.tsx src/App.tsx
git commit -m "feat: 新增每日行程摘要手風琴區塊"
```

---

## Task 2：把 selectedDay 提升到 App.tsx（跨檔案破壞性改動）

這是本計畫風險最高的任務：同時改三個檔案，且把 `Itinerary` 的 `'all'` 字串改成 `null`。`npm run lint` 是主要防線——只要有一處 props 沒接上或型別沒改乾淨，`tsc` 就會報錯。

**受影響的所有位置（改動前先確認清單完整）：**

| 檔案:行 | 現況 | 改成 |
|---------|------|------|
| `App.tsx:1` | `import React from 'react'` | `import React, { useState } from 'react'` |
| `App.tsx:76` | `export default function App() {` 無 state | 新增 `const [selectedDay, setSelectedDay] = useState<number \| null>(null)` |
| `App.tsx:100` | `<AdventureMap />` | `<AdventureMap selectedDay={...} onSelectDay={...} />` |
| `App.tsx:104` | `<Itinerary />` | `<Itinerary selectedDay={...} onSelectDay={...} />` |
| `AdventureMap.tsx:1` | `import React, { useMemo, useState }` | `import { useMemo, useState }`（`useState` 仍給 `isaLoaded` 用；`React` 未被當識別字使用可移除） |
| `AdventureMap.tsx:61` | `export default function AdventureMap() {` | 加上 props 型別 |
| `AdventureMap.tsx:63` | `const [selectedDay, setSelectedDay] = useState<number \| null>(null)` | **刪除**（改吃 props） |
| `AdventureMap.tsx:119` | `onClick={() => setSelectedDay(null)}` | `onClick={() => onSelectDay(null)}` |
| `AdventureMap.tsx:131` | `onClick={() => setSelectedDay(d.day)}` | `onClick={() => { onSelectDay(d.day); scrollToHighlights(); }}` |
| `Itinerary.tsx:1` | `import React, { useState }` | `import React from 'react'`（`useState` 仍被 `HighlightCard` 的 `imgError`/`showComments` 使用，**不可整個移除**，只移除 `Itinerary` 函式內那一個） |
| `Itinerary.tsx:173` | `export default function Itinerary() {` | 加上 props 型別 |
| `Itinerary.tsx:175` | `const [selectedDay, setSelectedDay] = useState<number \| 'all'>('all')` | **刪除** |
| `Itinerary.tsx:177` | `selectedDay === 'all' ? days : ...` | `selectedDay === null ? days : ...` |
| `Itinerary.tsx:183` | `onClick={() => setSelectedDay('all')}` | `onClick={() => onSelectDay(null)}` |
| `Itinerary.tsx:186` | `selectedDay === 'all'`（按鈕選中樣式） | `selectedDay === null` |
| `Itinerary.tsx:196` | `onClick={() => setSelectedDay(d.day)}` | `onClick={() => onSelectDay(d.day)}`（**不加捲動**） |

注意 `Itinerary.tsx` 第 1 行的 `useState` 有兩個使用者：`HighlightCard`（第 44-45 行的 `imgError`、`showComments`）和 `Itinerary` 本身。只刪 `Itinerary` 裡那個，`useState` 的 import 必須保留。

**Files:**
- Modify: `src/App.tsx:1`, `src/App.tsx:75-105`
- Modify: `src/components/AdventureMap.tsx:1`, `61-63`, `117-141`
- Modify: `src/components/Itinerary.tsx:1`, `173-207`

**Interfaces:**
- Produces（後續 Task 3 會用到這兩個 props 型別，名稱必須完全一致）：
  ```ts
  type AdventureMapProps = { selectedDay: number | null; onSelectDay: (day: number | null) => void };
  type ItineraryProps   = { selectedDay: number | null; onSelectDay: (day: number | null) => void };
  ```
  `null` 一律代表「全部，不篩選」。
- Consumes: 無（不依賴 Task 1 的產出）

- [ ] **Step 1：改 `App.tsx` — 加入共用 state**

`src/App.tsx` 第 1 行：

```tsx
import React, { useState } from 'react';
```

第 75-77 行，`export default function App() {` 之後、`return (` 之前插入一行：

```tsx
export default function App() {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  return (
```

第 99-105 行的兩個 Section 改成傳 props（若 Task 1 已完成，`summary` Section 夾在中間，保持原位不動）：

```tsx
          <Section id="map">
            <AdventureMap selectedDay={selectedDay} onSelectDay={setSelectedDay} />
          </Section>

          <Section id="summary" title="每日行程摘要">
            <DailySummary />
          </Section>

          <Section id="highlights" title="景點 × 活動">
            <Itinerary selectedDay={selectedDay} onSelectDay={setSelectedDay} />
          </Section>
```

- [ ] **Step 2：改 `AdventureMap.tsx` — 改吃 props 並負責捲動**

第 1 行改成（移除未使用的 `React` 識別字，`useState` 留給 `isaLoaded`）：

```tsx
import { useMemo, useState } from 'react';
```

第 61-64 行改成：

```tsx
type AdventureMapProps = {
  selectedDay: number | null;
  onSelectDay: (day: number | null) => void;
};

export default function AdventureMap({ selectedDay, onSelectDay }: AdventureMapProps) {
  const { days } = useData();
  const [isaLoaded, setIsaLoaded] = useState(true);
```

（原本第 63 行的 `const [selectedDay, setSelectedDay] = useState<number | null>(null);` 整行刪掉。）

第 117-141 行的 Day 篩選 chips 區塊改成：

```tsx
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3 mb-4">
        <button
          onClick={() => onSelectDay(null)}
          className={`shrink-0 min-h-[44px] px-4 rounded-full text-sm font-black border transition-colors ${
            selectedDay === null
              ? 'bg-camp-brown text-camp-card border-camp-brown'
              : 'bg-camp-bg text-camp-text border-camp-border hover:bg-camp-brown/10'
          }`}
        >
          全部
        </button>
        {sortedDays.map((d) => (
          <button
            key={d.day}
            onClick={() => { onSelectDay(d.day); scrollToHighlights(); }}
            className={`shrink-0 min-h-[44px] px-4 rounded-full text-sm font-black border transition-colors ${
              selectedDay === d.day
                ? 'bg-camp-brown text-camp-card border-camp-brown'
                : 'bg-camp-bg text-camp-text border-camp-border hover:bg-camp-brown/10'
            }`}
          >
            Day {d.day}
          </button>
        ))}
      </div>
```

設計決策：**「全部」按鈕不觸發捲動**。設計文件第 100 行寫的是「在地圖選 Day N → 捲到亮點卡片區」，「全部」不是某一天，使用者按它多半是想取消篩選、繼續看地圖，此時把畫面搶走會很煩躁。

`scrollToHighlights()` 已定義在同檔第 57-59 行，不需新增。

- [ ] **Step 3：改 `Itinerary.tsx` — 改吃 props，`'all'` 全面改 `null`**

第 1 行**保持** `import React, { useState } from 'react';`（`useState` 仍被 `HighlightCard` 使用，`React` 被第 13 行的 `Record<string, React.ReactNode>` 與第 43 行的 `React.FC` 使用）。

第 173-207 行改成：

```tsx
type ItineraryProps = {
  selectedDay: number | null;
  onSelectDay: (day: number | null) => void;
};

export default function Itinerary({ selectedDay, onSelectDay }: ItineraryProps) {
  const { days } = useData();

  const visibleDays = selectedDay === null ? days : days.filter((d) => d.day === selectedDay);

  return (
    <div className="space-y-6">
      <div className="flex overflow-x-auto gap-2 pb-2 no-scrollbar">
        <button
          onClick={() => onSelectDay(null)}
          className={cn(
            'flex-shrink-0 min-h-[44px] px-5 rounded-full text-sm font-black border-2 transition-colors',
            selectedDay === null
              ? 'bg-camp-brown text-camp-card border-camp-brown'
              : 'bg-camp-card text-camp-text border-camp-border hover:border-camp-brown'
          )}
        >
          全部
        </button>
        {days.map((d) => (
          <button
            key={d.day}
            onClick={() => onSelectDay(d.day)}
            className={cn(
              'flex-shrink-0 min-h-[44px] px-5 rounded-full text-sm font-black border-2 transition-colors',
              selectedDay === d.day
                ? 'bg-camp-brown text-camp-card border-camp-brown'
                : 'bg-camp-card text-camp-text border-camp-border hover:border-camp-brown'
            )}
          >
            Day {d.day}
          </button>
        ))}
      </div>
```

（第 209 行以後的 `<div className="space-y-8">` 渲染區塊完全不動。）

**這裡絕對不可以呼叫 `scrollToHighlights()` 或任何 `scrollIntoView`**——設計文件第 102 行明訂：在亮點卡片選 Day 不捲動，因為使用者已經在這一區，捲動會讓畫面莫名其妙跳一下。

- [ ] **Step 4：跑型別檢查**

```bash
cd /Users/mmfamily/Projects/2026_nztrip && npm run lint
```

預期：無輸出、exit code 0。

若看到 `Property 'selectedDay' is missing in type '{}' but required in type 'AdventureMapProps'`，代表 `App.tsx` 忘了傳 props。
若看到 `This comparison appears to be unintentional because the types 'number | null' and 'string' have no overlap`，代表 `Itinerary.tsx` 還有漏改的 `'all'` ——用下列指令找出來：

```bash
cd /Users/mmfamily/Projects/2026_nztrip && grep -n "'all'" src/components/Itinerary.tsx
```

預期輸出：**空的**（一個 `'all'` 都不該剩）。

- [ ] **Step 5：瀏覽器實測**

`npm run dev` 後開 `http://localhost:3000`：

1. 頁面正常載入，**沒有白畫面**（白畫面通常是 JS 執行期錯誤，開 DevTools Console 看紅字）
2. 地圖與亮點卡片**兩排 Day 按鈕都還在**
3. 在地圖選 Day 5 → 畫面**平滑捲到亮點卡片區**，且亮點卡片只剩 Day 5、亮點卡片那排的 Day 5 按鈕**同時變成選中的深棕色**
4. 往上捲回地圖，地圖那排的 Day 5 也是選中狀態（兩排狀態一致）
5. 在亮點卡片那排選 Day 7 → 卡片切成 Day 7，**畫面完全不跳動**；往上捲看地圖，Isa 已移到米爾福德、地圖那排 Day 7 也是選中
6. 按任一排的「全部」→ 兩排都回到「全部」選中，亮點卡片顯示所有天數，Isa 回到起點（基督城）

- [ ] **Step 6：Commit**

```bash
cd /Users/mmfamily/Projects/2026_nztrip
git add src/App.tsx src/components/AdventureMap.tsx src/components/Itinerary.tsx
git commit -m "refactor: selectedDay 提升到 App，地圖與亮點卡片共用 Day 選擇"
```

---

## Task 3：地圖地點標記點擊 → 篩到該地點的第一天

目前點地圖上的地點標記只呼叫 `scrollToHighlights()` 捲動、不篩選（`AdventureMap.tsx:187`）。改成「篩到該地點對應的第一天並捲動」。

**為什麼是「第一天」**：一個地點可能涵蓋好幾天（例如皇后鎮涵蓋 Day 5-8），但篩選一次只能選一天。取最小的那天最符合直覺——使用者點皇后鎮，想看的是「到了皇后鎮之後」的行程，從第一天開始看最自然。

**Files:**
- Modify: `src/components/AdventureMap.tsx:79-87`（在 `visitedPlaces` 之後新增 `placeFirstDay`）、`src/components/AdventureMap.tsx:179-190`（標記的 `onClick`）

**Interfaces:**
- Consumes（來自 Task 2）：`onSelectDay: (day: number | null) => void` props。以及同檔既有的 `dayPlace: Map<number, Place>`（第 69-76 行）、`sortedDays: DayData[]`（第 66 行，已依 `day` 升冪排序）、`scrollToHighlights()`（第 57-59 行）
- Produces：`placeFirstDay: Map<string, number>`，key 是 `Place['id']`（如 `'queenstown'`），value 是該地點對應的最小天數

- [ ] **Step 1：新增 placeFirstDay 對照表**

在 `AdventureMap.tsx` 的 `visitedPlaces` useMemo 之後（原第 87 行 `}, [sortedDays, dayPlace]);` 的下一行）、`routeD` useMemo 之前，插入：

```tsx
  // 一個地點可能涵蓋多天（例如皇后鎮 Day 5-8），點標記時篩到最早的那天
  const placeFirstDay = useMemo(() => {
    const m = new Map<string, number>();
    sortedDays.forEach(d => {
      const p = dayPlace.get(d.day);
      if (p && !m.has(p.id)) m.set(p.id, d.day);
    });
    return m;
  }, [sortedDays, dayPlace]);
```

因為 `sortedDays` 已經依天數由小到大排好（第 66 行），從頭掃一遍、`!m.has(p.id)` 只記第一次遇到的，自然就是最小的那天。

- [ ] **Step 2：改標記的 onClick**

把第 187 行：

```tsx
              onClick={scrollToHighlights}
```

改成：

```tsx
              onClick={() => {
                const firstDay = placeFirstDay.get(p.id);
                if (firstDay != null) onSelectDay(firstDay);
                scrollToHighlights();
              }}
```

`if (firstDay != null)` 這道保護是必要的：`visitedPlaces` 在沒有任何地點比對成功時會退回顯示全部 `PLACES`（第 86 行），這些後備地點在 `placeFirstDay` 裡查不到天數，此時只捲動、不亂改篩選。

- [ ] **Step 3：跑型別檢查**

```bash
cd /Users/mmfamily/Projects/2026_nztrip && npm run lint
```

預期：無輸出、exit code 0。若報 `Cannot find name 'onSelectDay'`，代表 Task 2 沒完成，先回頭做 Task 2。

- [ ] **Step 4：瀏覽器實測**

`npm run dev` 後開 `http://localhost:3000`。**先確認分頁在前景**（背景分頁會讓標記的進場動畫凍結在半透明，看起來像壞掉，`docs/進度.md` 記載過）：

1. 點地圖上的「皇后鎮」標記 → 畫面捲到亮點卡片區，且只顯示皇后鎮對應的**第一天**（依 Sheet 目前資料是 Day 5-8 中的 Day 5；若 Sheet 排程有變，以「該地點出現的最小天數」為準）
2. 兩排 Day 按鈕的選中狀態**同步跟上**那一天
3. 點「米爾福德」標記 → 篩到米爾福德對應的第一天並捲動
4. 點「基督城」標記（涵蓋行程頭尾多天）→ 篩到 Day 1，不是最後一天
5. 被選中那天對應的地圖標記變成深棕色放大，Isa 站在那個標記上

- [ ] **Step 5：Commit**

```bash
cd /Users/mmfamily/Projects/2026_nztrip
git add src/components/AdventureMap.tsx
git commit -m "feat: 點地圖地點標記篩選到該地點的第一天"
```

---

## 完工後最終驗收

三個任務都完成後，跑一次設計文件第 110-119 行的完整驗證清單：

```bash
cd /Users/mmfamily/Projects/2026_nztrip && npm run lint && git status --short
```

預期：lint 無輸出；`git status` 顯示乾淨（全部已 commit）。

瀏覽器完整走查：

- [ ] 摘要展開/收合正常，一次只開一天
- [ ] Day 2 展開顯示「尚未安排」
- [ ] Day 4 標題不出現重複的 Day 番號
- [ ] 地圖選 Day 5 → 自動捲到亮點卡片且只剩 Day 5
- [ ] 亮點卡片選 Day 7 → 地圖 Isa 移到米爾福德，畫面不跳動
- [ ] 點地圖皇后鎮標記 → 篩到皇后鎮的第一天並捲動
- [ ] DevTools 裝置模式（375px）下 chip 換行正常、觸控目標 ≥ 44px

## 已知且不處理的事項

- Sheet Days 分頁最後一列 `D11,8/1,測試` 是測試資料，會讓摘要與地圖都多出一個 Day 11。依「行程以 Google Sheet 為準」的既定決策，**程式端不過濾**，請使用者自行在 Sheet 刪除該列。
- `Itinerary` 的 `days` 未排序（直接用 Context 的原始順序），本次不動；`AdventureMap` 與 `DailySummary` 都有自己排序，不受影響。
- 摘要區塊**不加入頂部 sticky 導覽**（維持四格：人員班機/餐廳輪值/住房資訊/費用分攤）。
- 摘要區塊**不與地圖或亮點卡片連動**（設計文件第 65、81 行明訂）。

## 完工後請更新

`docs/進度.md` 的「已完成」與「各區塊現況」兩節，加上本次變更（新增每日行程摘要、Day 選擇已打通）。這一步**不在任何任務的 commit 裡**，等使用者確認驗收通過後再更新。
