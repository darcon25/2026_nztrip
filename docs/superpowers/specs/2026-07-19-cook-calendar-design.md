# 自煮分工行事曆 設計文件

> 日期：2026-07-19　狀態：待實作
> 介面設計稿：https://claude.ai/code/artifact/fbdbb047-2311-47bd-8400-56fe48c86ab7

## 目標

讓各家庭在手機上自己填「這餐我要煮什麼」，並看得到別家煮什麼（避免五家都煮火鍋）。以行事曆呈現，一眼看出哪幾天要自煮、還有誰沒填。

## 資料架構：兩邊分工，互不打架

| 資料 | 存放位置 | 誰維護 | 讀寫 |
|------|----------|--------|------|
| **誰負責哪一餐** | Google Sheet「自煮分工」分頁 | 使用者本人 | 程式唯讀 |
| **煮什麼、備註** | 網站後端 SQLite | 各家庭在網站上填 | 程式讀寫 |
| **我是哪一家** | 瀏覽器 localStorage | 使用者自己選 | 不上傳 |

沿用分帳的既定決策：**不寫回 Google Sheet**，零額外設定、無 OAuth。

### Sheet 分頁

gid `2142763341`，欄位 `day_id, date, meal, family, dish, note`。**程式只讀前四欄**（`dish`、`note` 由網站接管，Sheet 上留空即可）。

現有資料：D4(7/25)、D6(7/27)、D8(7/29) 三個晚餐，各五家（Fenix、Jerry、Ziv、Howard、Richard）。Max、James 負責早餐，目前不在此表，**選單只列出現在此表中的家庭**，日後 Sheet 加了早餐分工會自動出現。

### 後端資料表

```sql
CREATE TABLE IF NOT EXISTS cook_dishes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  day_id TEXT NOT NULL,
  meal TEXT NOT NULL,
  family TEXT NOT NULL,
  dish TEXT NOT NULL,
  note TEXT,
  updated DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(day_id, meal, family)
)
```

`UNIQUE(day_id, meal, family)` 讓同一家在同一餐只有一筆，用 `INSERT ... ON CONFLICT DO UPDATE` 覆寫。

### API

沿用既有 `/api/expenses` 的風格：

- `GET /api/cook-dishes` → 回傳全部，前端自行對應
- `POST /api/cook-dishes` → body `{ dayId, meal, family, dish, note }`，upsert

## 介面

新元件 `src/components/CookCalendar.tsx`，掛在 App 的「餐廳輪值」區塊位置，取代目前寫死的 `fallbackDuty` 假資料。

### 畫面一：選家庭（跳出提示）

localStorage 沒有身分時才跳。背景行事曆模糊，下方 modal 列出所有家庭做成大按鈕。選完寫入 localStorage。

**不設唯一限制**：多支手機可以選同一家（使用者明確要求）。副作用是同一家在兩支手機同時編輯時**後存的覆蓋先存的**，以實際使用情境判斷可接受，不做鎖定。

### 畫面二：行事曆總覽

- 依 Days 分頁的日期範圍產生月曆格（7/22～7/31），週日為每週第一天
- 行程外的日期淡出、不可點
- 有自煮的日子標成 `camp-green`、顯示「自煮」標籤、**下方小圓點代表該餐家數，已填的點亮**
- 只有自煮日可點
- 下方摘要列出「你還沒填的」餐次
- 右上角常駐「你是 ○○ 家」，點擊可重選身分

### 畫面三：某一餐的分工

- 該餐所有家庭列成一排，顯示各家菜色；未填顯示灰字「還沒填」
- **自己那一列有橘框、右側有「填寫」鈕**；其他家唯讀
- 底部顯示當天住宿（取自 Days 分頁 `hotel` 欄）

### 畫面四：填寫

- 菜色輸入框 + 常見菜色快捷按鈕（減少手機打字）
- 備註欄選填
- 儲存後回到畫面三

**待確認**：快捷按鈕目前暫定「火鍋／白飯／烤肉／炒青菜／湯」，等使用者提供實際品項再換。

## 權限

只能編輯自己家的資料。前端以 localStorage 的身分判斷，**後端不驗證**——這是家族內部工具，防呆而非防駭。

## 明確不做

- 寫回 Google Sheet
- 帳號密碼登入
- 編輯衝突鎖定
- 早餐／午餐分工（Sheet 目前只有晚餐；介面已預留，Sheet 加了就會自動出現）

## 驗證方式

1. `npm run lint` 通過
2. 瀏覽器實測：
   - 首次進入跳出選家庭提示；選完重整不再跳
   - 行事曆只有 7/25、7/27、7/29 可點，其餘不可點
   - 填寫菜色後，圓點數量增加，重整後資料還在
   - 切換身分後，可編輯的列跟著換
   - 別家的列點不動
3. 手機寬度下確認月曆格與 modal 的觸控目標（需用 DevTools 裝置模式）
