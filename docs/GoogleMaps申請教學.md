# Google Maps API Key 申請教學

> 用途：讓亮點卡片顯示各景點的真實照片。沒有這把 key 網站也能正常運作，只是照片會顯示米色佔位圖。

## 先看這裡：三件你該知道的事

1. **需要綁信用卡**。Google 規定即使用免費額度也必須綁定付款方式，卡片只是驗證身分，不手動升級成付費帳戶就不會扣款。
2. **本站幾乎不可能超出免費額度**。Google 給的額度是**每個 SKU（計費項目）每月 10,000 次免費呼叫**，另有 $300 美元 / 90 天的試用抵免額。而程式會把抓過的照片**存在自己的伺服器上**，同一個景點只會跟 Google 要一次——整趟行程約 10～30 個景點，實際用量是**幾十次**，差了兩個數量級。
3. **一定要選「Places API (New)」**，不是舊的「Places API」。Google 從 2025 年 3 月起不讓新專案啟用舊版，選錯會一直失敗。

**名詞白話解釋**
- **API**：一個網站提供給其他程式取用資料的窗口。這裡是跟 Google 要景點照片。
- **API key**：一串像密碼的英數字，用來證明「是你在跟 Google 要資料」，好讓 Google 記帳。
- **專案（Project）**：Google Cloud 上的一個資料夾，用來分開管理不同用途的服務。

## 步驟

### 1. 開啟 Google Cloud Console
到 https://console.cloud.google.com/ ，用你的 Google 帳號登入。

### 2. 建立新專案
- 點畫面**最上方左邊**的專案選單（會顯示目前專案名稱或「Select a project」）
- 點「**新增專案 / New Project**」
- 名稱隨便取，例如 `nztrip`
- 按「建立」，等幾秒鐘
- **建立完成後，記得把上方的專案選單切換到這個新專案**（很容易忘，忘了會設定到別的專案上）

### 3. 啟用付款帳戶
- 左上角選單（三條橫線）→「**帳單 / Billing**」
- 依指示綁定信用卡
- 這步驟不做的話，後面拿到的 key 呼叫時會直接失敗

### 4. 啟用 Places API (New)
- 左上角選單 →「**API 和服務 / APIs & Services**」→「**程式庫 / Library**」
- 搜尋 `Places API (New)`
- **請確認你點進去的標題後面有 `(New)`**
- 點「**啟用 / Enable**」

### 5. 建立 API key
- 左上角選單 →「API 和服務」→「**憑證 / Credentials**」
- 上方「**+ 建立憑證 / Create Credentials**」→ 選「**API 金鑰 / API key**」
- 畫面會跳出一串英數字，**先複製起來**

### 6. 限制這把 key（重要，避免被盜用）
在剛剛跳出的視窗點「**編輯 API 金鑰**」，或回憑證頁點那把 key：

- **應用程式限制 / Application restrictions**：先選「**無 / None**」
  （這把 key 是在你的伺服器上使用，不會出現在網頁原始碼裡。日後正式部署到 Zeabur 後，可以改成限制 Zeabur 的 IP 位址。）
- **API 限制 / API restrictions**：選「**限制金鑰 / Restrict key**」，然後只勾「**Places API (New)**」
  （這樣就算 key 外流，別人也只能用來查地點照片，不能拿去用別的付費服務。）
- 按「儲存」

### 7. 設定預算警示（建議做，兩分鐘）
- 左上角選單 →「帳單」→「**預算和快訊 / Budgets & alerts**」
- 建立一個預算，金額設你能接受的上限（例如 NT$100）
- 這樣一旦有異常用量，Google 會寄信通知你

### 8. 填進專案
在專案根目錄 `~/Projects/2026_nztrip` 建立一個檔案叫 **`.env.local`**，內容一行：

```
GOOGLE_MAPS_API_KEY=你剛剛複製的那串金鑰
```

注意：
- 等號兩邊**不要有空格**，金鑰**不要加引號**
- 檔名開頭有一個點，不要打成 `env.local`
- 這個檔案已在 `.gitignore` 裡，不會被上傳到 GitHub

### 9. 重新啟動
把正在跑的開發伺服器停掉（終端機按 `Ctrl + C`），再重新執行：

```
npm run dev
```

打開網站往下捲到亮點卡片，照片就會陸續出現。第一次載入會慢一點（正在跟 Google 要圖），之後因為有快取就會很快。

## 沒出現照片怎麼辦

依序檢查：

| 症狀 | 可能原因 |
|------|----------|
| 全部都是米色佔位圖 | `.env.local` 檔名或位置錯了，或沒重新啟動伺服器 |
| 只有部分景點沒照片 | 正常。Google 上找不到該地點的照片，程式會自動退回佔位圖 |
| 一直失敗 | 多半是啟用成舊版「Places API」而不是「Places API (New)」；或帳單沒綁定；或忘了把專案選單切到新專案 |

要看詳細錯誤，在跑 `npm run dev` 的終端機視窗找紅字訊息，貼給我看。

## 技術備註（給接手的人）

- 端點：`POST https://places.googleapis.com/v1/places:searchText`（帶 `X-Goog-Api-Key`、`X-Goog-FieldMask: places.photos`），取得 `places[0].photos[0].name` 後再打 `GET https://places.googleapis.com/v1/{name}/media?maxWidthPx=800&key=...`
- 實作在 `server.ts` 的 `/api/place-photo`
- 照片存成檔案 + SQLite `place_photos` 表記錄對應關係，同一 query 只會呼叫一次 Google
- 沒有 key 時端點直接回 404，前端 `onError` 自動換成米色佔位圖，不會壞版
