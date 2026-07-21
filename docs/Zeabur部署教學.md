# Zeabur 部署教學

> 用途：把這個網站從「只有前端能動的 Vercel」搬到 Zeabur，讓照片、留言、分帳、自煮分工這些需要後端的功能全部正常運作，資料也不會因為重新部署而消失。
> 前提：你已經有 Zeabur 付費帳號（Dev 方案），GitHub repo 已經是最新版（https://github.com/darcon25/2026_nztrip ）。

## 先看這裡：三件你該知道的事

1. **這次不用選方案**。你已經是付費帳號，量小基本不會超過額度。
2. **程式碼已經改好、本機測試過**，你不需要動任何程式碼，只需要在 Zeabur 網站上操作。
3. **一定要記得掛 Volume（見步驟 4）**。這步驟漏掉的話，網站看起來會正常，但資料庫跟照片會在下次重新部署時整個消失——這是最容易漏掉、也最重要的一步。

**名詞白話解釋**
- **Service（服務）**：Zeabur 上「一個會執行你的程式」的單位，這個網站前後端是同一份程式，只會有一個 Service。
- **環境變數（Environment Variables）**：不寫在程式碼裡、部署時另外設定的密碼/設定值（例如 API 金鑰），這樣金鑰不會外流到 GitHub 上。
- **Volume（永久儲存空間）**：一塊「不會因為重新部署就被清空」的硬碟空間，資料庫檔案跟大家上傳的照片要放在這裡才不會不見。

## 步驟

### 1. 建立新專案、連接 GitHub

- 登入 https://zeabur.com/ ，進到 Dashboard
- 點「**Create Project**」（建立新專案）
- 選「**Deploy New Service**」→「**Git**」，把 GitHub 帳號授權給 Zeabur（如果之前沒授權過會跳出 GitHub 的授權畫面）
- 找到 `darcon25/2026_nztrip` 這個 repo，選它、選 `main` 分支
- Zeabur 會自動偵測這是 Node.js 專案，開始第一次建置（可以先讓它跑，等一下再回來調整設定）

### 2. 確認啟動指令是 `npm run start`

Zeabur 通常會自動讀 `package.json` 抓到正確的建置/啟動方式（`npm run build` 建置、`npm run start` 啟動），這兩個指令已經在專案裡設定好了，多數狀況不用手動改。

**如果部署完打開網址是空白頁或錯誤畫面**，才需要手動指定：
- 進到這個 Service 的設定頁，找「**Build**」或「**Settings**」裡的 Start Command（啟動指令）欄位
- 手動填入：`npm run start`
- 如果介面上找不到這個欄位，也可以在專案根目錄新增一個 `zbpack.json` 檔案，內容：
  ```json
  { "start_command": "npm run start" }
  ```
  改完要 commit、push，Zeabur 才會抓到。

### 3. 設定環境變數

進到 Service 的「**Variables**」分頁，點「**Add Variables**」（或用「Edit as Raw」一次貼多筆，格式跟 `.env` 檔一樣），填入：

| 變數名稱 | 填什麼 | 必填？ |
|---|---|---|
| `DATA_DIR` | `/data` | ✅ 必填，要跟步驟 4 掛 Volume 的路徑完全一樣 |
| `GOOGLE_MAPS_API_KEY` | 複製你電腦上 `~/Projects/2026_nztrip/.env.local` 裡 `GOOGLE_MAPS_API_KEY=` 後面那串值，貼過來 | ✅ 必填，沒填的話全站景點/住宿照片都抓不到 |
| `N8N_PHOTO_WEBHOOK_URL` | 你的 n8n webhook 網址（如果有設定旅行相簿自動同步 Google Drive 的話） | 選填，沒有就跳過，其他功能不受影響 |
| `N8N_PHOTO_WEBHOOK_TOKEN` | 對應的驗證 token（如果 webhook 有設驗證的話） | 選填 |

**不用填**（`.env.example` 裡雖然有列，但程式裡完全沒有用到，是舊範本殘留）：`GEMINI_API_KEY`、`APP_URL`、`VITE_GOOGLE_SHEET_ID`。

`PORT` 不用自己填，Zeabur 會自動注入，程式已經改好會自動讀取。

### 4. 掛 Volume（永久儲存空間）——這步驟最容易漏、也最重要

進到 Service 的「**Volumes**」分頁：
- 點「**Add Volume**」
- **Mount Directory（掛載路徑）填 `/data`**——要跟步驟 3 設定的 `DATA_DIR` 一模一樣
- 儲存

**為什麼這步驟這麼重要**：這個網站的資料庫（分帳紀錄、留言、自煮分工的菜色）跟大家上傳的照片，都是直接寫在程式執行環境的硬碟上。Zeabur（跟大部分雲端平台一樣）預設每次重新部署都會換一台全新的機器，沒有掛 Volume 的話，硬碟上寫的東西會跟著舊機器一起消失。掛了 Volume 之後，`/data` 這個資料夾會被「接」到一塊獨立、永久保留的儲存空間，不管重新部署幾次，裡面的資料都還在。

**注意**：Zeabur 官方文件提到，剛掛上 Volume 的當下，那個資料夾**會被清空一次**。因為這是全新部署、`/data` 裡本來就還沒有任何資料，所以不用擔心——但如果你之後想「換一顆 Volume」或調整掛載路徑，要先想辦法把舊資料備份出來，不要直接重掛。

### 5. 產生對外網址

進到 Service 的「**Domains**」分頁：
- 點「**Generate Domain**」，Zeabur 會給你一個 `你取的名字.zeabur.app` 的網址（名字可以自己取，只要沒被別人用掉）
- 這就是之後大家會用的網址，之後也可以在這裡改接你自己買的網域（如果有的話）

### 6. 確認部署成功

打開 Zeabur 給你的網址（`xxx.zeabur.app`）：
- **首頁看得到**：代表前端網站有正常上線
- **往下捲到「景點 × 活動」，隨便一張卡片看得到照片（不是米色圖示佔位圖）**：代表後端 API 跟環境變數都設定成功
- 試著在「餐廳輪值」填一筆菜色、或在「費用分攤」記一筆消費，重新整理頁面資料還在：代表資料庫跟 Volume 都正常運作

如果照片看不到，或填的資料重整就不見，看下面「常見問題」。

## 常見問題

| 症狀 | 可能原因 |
|---|---|
| 打開網址整個空白、或顯示錯誤畫面 | 啟動指令沒抓對，回步驟 2 手動指定 `npm run start` |
| 首頁正常，但全部照片都是米色佔位圖 | `GOOGLE_MAPS_API_KEY` 沒填對，回步驟 3 檢查有沒有複製完整、有沒有多餘空白 |
| 填的資料（菜色、消費紀錄）重新整理就不見 | Volume 沒掛，或掛載路徑跟 `DATA_DIR` 對不起來，回步驟 3、4 確認兩邊都是 `/data` |
| 部署一直卡在建置中、或建置失敗 | 到 Service 的「**Logs**」分頁看紅字錯誤訊息，截圖給我看 |

## 技術備註（給接手的人）

- `package.json` 已有 `"start": "NODE_ENV=production tsx server.ts"`，`tsx` 已從 devDependencies 移到 dependencies（正式環境安裝套件通常會跳過 devDependencies，漏移的話啟動指令會找不到 `tsx`）。
- `server.ts` 開頭讀 `DATA_DIR` 環境變數（沒設定時預設用專案根目錄，本機開發行為不變），`comments.db`、`.uploads/`、`.photo-cache/` 都放在這個路徑下面，方便一個 Volume 全部涵蓋。
- `server.ts` 的 `PORT` 已改成 `Number(process.env.PORT) || 3000`，本機沒設 `PORT` 時仍是 3000，Zeabur 注入 `PORT` 時會自動改聽那個 port。
- 本機已實測過：`npm run build` → `npm run start` 可以正常開機、首頁與 API 都回 200；`DATA_DIR` 設成別的路徑時，資料庫與上傳資料夾確實會建立在指定路徑下。
- Zeabur 這幾個功能（Variables、Volumes、Domains 分頁的確切位置與按鈕名稱）是查詢 2026 年當時的官方文件整理的，**Zeabur 介面偶爾會改版，如果畫面跟這份文件對不上，以你實際看到的畫面為準**，多半只是選單位置或按鈕名稱換了，功能邏輯不會差太多。
