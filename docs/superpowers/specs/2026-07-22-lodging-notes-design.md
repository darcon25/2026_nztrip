# 住宿註記（Lodging Notes）功能設計

> 日期：2026-07-22　狀態：設計定案，待寫實作計畫

## 目標

在住宿卡片新增一個**匿名、自由文字**的註記區，讓家人可以在 app 內貼上該住宿的門禁密碼、WiFi 密碼、垃圾怎麼倒等資訊，資料存網站後端。

## 背景與現況

- 住宿卡片（`src/components/Lodging.tsx`）的資料**完全來自 Google Sheet**，由 `googleSheetService.ts` 的 `deriveLodging()` 即時用「飯店＋地址＋家庭」組出，**沒有固定 id**。`LodgingData` 欄位：`dateRange`、`name`、`address`、`checkin?`、`roomNote?`。
- app 已有匿名留言機制：`comments` 表（`server.ts`）＋ `GET/POST/DELETE /api/comments`，用在景點卡片留言板。本功能**直接沿用同一套模式**，降低風險。
- 使用者可變資料（留言、分帳、照片、煮飯菜色）一律存後端 SQLite `comments.db`，不寫回 Sheet。本功能遵循此決策。

## 已確認的決策

- **自由文字**、**匿名**（與景點留言板、使用手冊「留言匿名」一致）。
- 存後端 SQLite（`comments.db`）新表 `lodging_notes`，**不寫回 Google Sheet**。
- 以**住宿地址**（`address` 去頭尾空白）當識別 key；`address` 為空時退回 `name`。
- **只做新增與刪除，不做編輯**（與 `comments` 一致）。
- **不做**：加密、權限控管、具名、結構化欄位（門禁/WiFi 分欄）。皆為 YAGNI，之後需要再議。

## 安全性與隱私（已與使用者確認可接受）

網站無登入，任何取得網址者可見全部內容，**包含往後貼上的密碼**。使用手冊已警告「網址勿外流、留在家族群組」。本功能不加密、不隱藏。可選：在註記區顯示一行小灰字提醒「僅供家族內部，請勿外流」（列為選配，實作計畫可決定是否納入）。

## 資料模型

在 `server.ts` 既有的 `db.exec(CREATE TABLE ...)` 區塊新增：

```sql
CREATE TABLE IF NOT EXISTS lodging_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lodging_key TEXT NOT NULL,
  text TEXT NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

## 後端 API（仿 `/api/comments` 三支）

- `GET /api/lodging-notes/:key`
  回傳該 `lodging_key` 的所有註記，依 `timestamp DESC`。`key` 由前端 `encodeURIComponent` 編碼，後端 `req.params.key` 取用。
- `POST /api/lodging-notes`
  body `{ key, text }`。`text` 去空白為空 → 回 `400 { error }`。成功回新註記物件（含 `id`、`lodging_key`、`text`、`timestamp`）。
- `DELETE /api/lodging-notes/:id`
  依 `id` 刪除，回 `{ success: true }`。

三支直接複製現有 `comments` 對應端點改表名/欄名/路徑即可。

## 前端

新增元件 `src/components/LodgingNotes.tsx`（把邏輯獨立，`Lodging.tsx` 引入），props：`{ lodgingKey: string }`。

- UI 沿用景點留言板的互動：卡片底部一個可展開的「📝 註記」toggle；展開後上方一個文字輸入框＋「新增」按鈕，下方列出註記（新→舊），每則右側刪除鈕。
- 掛載時 `GET /api/lodging-notes/:key` 載入；`POST` 成功後把新註記加到列表最前面；`DELETE` 成功後從列表移除。
- 在 `Lodging.tsx` 每張卡片內計算 `lodgingKey = (l.address?.trim() || l.name?.trim() || '')`，傳給 `<LodgingNotes lodgingKey={lodgingKey} />`；`lodgingKey` 為空字串時不顯示註記區（理論上不會發生）。

## 資料流

讀 Google Sheet 組住宿卡片（**維持不變**）＋ 每張卡片另外向後端要「該地址的註記」顯示。使用者新增的註記寫入後端 SQLite。兩條路獨立，互不影響。

## 錯誤處理

- 後端：沿用現有 Express 行為；`text` 空白回 400。
- 前端：`fetch` 失敗時於註記區顯示一行簡短錯誤字樣，不影響卡片其他部分；載入中可顯示簡單 loading 或直接空白。

## 已知小限制（可接受）

- 若日後在 Sheet 把某住宿的**地址改字**，該卡片的舊註記會因 key 改變而對不上（與照片快取同理）。很少發生，可接受；若真的要，日後可加「地址變更時搬移註記」機制。

## 驗證方式（本專案無測試框架）

- 型別：`npm run lint`（`tsc --noEmit`）零錯誤。
- 後端：本機 `npm run dev` 後 `curl`：
  - `POST /api/lodging-notes`（正常）→ 回新物件；再 `GET` 該 key → 取得該筆。
  - `POST` 空白 `text` → 400。
  - `DELETE /api/lodging-notes/:id` → 再 `GET` 該筆消失。
- 前端：本機開 http://localhost:3000 ，在住宿卡片展開註記區，新增/刪除一則，重整後仍在。
```
