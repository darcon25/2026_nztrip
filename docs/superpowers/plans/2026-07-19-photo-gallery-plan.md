# 旅行相簿實作計畫

> **給執行者（agentic worker）：** 必要子技能：用 `superpowers:subagent-driven-development`（建議）或 `superpowers:executing-plans` 逐任務執行本計畫。步驟用 checkbox（`- [ ]`）語法追蹤。

**目標：** 新增一個「旅行相簿」功能——手機上傳照片（含 HEIC）、縮圖格子牆、燈箱放大檢視、心情 emoji、下載原始檔、自動同步到使用者的 n8n → Google Drive。

**架構：** 後端新增 `photos`／`photo_reactions` 兩張表與 6 個 API 端點，每張照片存三個版本（原始檔／1600px 展示版／400px 縮圖）。前端新增 `PhotoGallery.tsx`（上傳＋格子牆）與 `PhotoLightbox.tsx`（放大檢視＋emoji 按鈕），掛進 `App.tsx` 的頂部導覽與版面。

**Tech Stack：** React 19 + TypeScript（`tsc --noEmit` 檢查）、Express + better-sqlite3、Vite、Tailwind CSS v4、lucide-react、motion/react、新增 `multer`（multipart 上傳）、`sharp`（縮放）、`heic-convert`（HEIC 解碼）。

## 名詞白話說明（給初學者）

- **multipart 上傳**：瀏覽器上傳檔案時用的資料格式，跟一般 JSON 不一樣，需要 `multer` 這個套件幫 Express 解析。
- **multer**：Express 的檔案上傳中介層，負責把上傳的檔案存到磁碟、命名、限制大小。
- **sharp**：Node.js 的影像處理套件，用來把大圖縮小成縮圖／展示版。
- **HEIC/HEIF**：iPhone 預設拍照格式，多數電腦瀏覽器無法直接顯示，需要先轉成 JPEG。
- **fire-and-forget**：呼叫一個非同步函式但不等待它完成、不擋住後續程式碼，常用於「這件事失敗也不該影響主流程」的情境（這裡指同步照片到 n8n）。
- **樂觀更新（optimistic update）**：先把畫面改成使用者按下按鈕後預期的樣子，再送出真正的網路請求；請求失敗才把畫面改回去。目的是讓互動感覺瞬間有反應。
- **`npm run lint`**：本專案的 lint 就是 `tsc --noEmit`，只做型別檢查、不產生檔案。

## 關於測試方式（重要，執行前先讀）

本專案**沒有安裝任何測試框架**，`npm run lint` = `tsc --noEmit` 是唯一的自動化驗證關卡。跟先前「每日行程摘要」計畫（`docs/superpowers/plans/2026-07-19-daily-summary-plan.md`）採用同一套模式：每個任務用 `npm run lint` 做型別檢查，再用 `curl`（後端任務）或瀏覽器操作（前端任務）做行為驗證。**不要為此計畫新增任何測試框架**，那會違反「不建立不必要的新檔案」的專案規範。

## 全域限制（Global Constraints）

以下是專案硬性規範，**每個任務都適用**：

- 所有文件、回覆、程式中的使用者可見文字一律**繁體中文**
- **手機優先（mobile-first）**：先寫手機版樣式，桌機版用 Tailwind 的 `sm:`/`md:` 前綴加上去
- 所有可點擊元素**最小高度 44px**（`min-h-[44px]` 或等效的 `min-w-[44px] min-h-[44px]`），符合觸控目標尺寸——**這是本計畫草稿階段踩過的坑**：縮圖格子上疊小圖示按鈕若只有 28px 就違規，正確做法是把下載/刪除做成照片下方獨立一列的 44px 高按鈕
- 只能使用現有 `camp-*` 色票（定義在 `src/index.css` 的 `@theme`）：`camp-bg` `camp-card` `camp-text` `camp-muted` `camp-border` `camp-brown` `camp-brown-dark` `camp-green` `camp-green-dark` `camp-accent`。**不得自創新色、不得直接寫 hex 色碼**（刪除鍵可沿用專案既有前例 `red-600`/`red-500`，`Expenses.tsx:461`）
- **不加多餘註解**；只有「為什麼這樣寫」不明顯時才寫一行
- **不建立不必要的新檔案**
- 每次改完**必須跑 `npm run lint`（= `tsc --noEmit`）通過才能 commit**
- `tsconfig.json` 的 `jsx` 是 `react-jsx`，**不需要 `import React`**，只有用到 `React.ReactNode`/`React.FormEvent` 等型別時才 import
- **匿名上傳**：不記錄「哪一家上傳的」，任何身分邏輯只限心情 emoji 的「我按過哪些」（存 localStorage，不上傳伺服器）
- **這個功能做在既有的獨立分支上，不是 `main`**：目錄 `/Users/mmfamily/Projects/2026_nztrip/.claude/worktrees/daily-summary`，分支 `worktree-daily-summary`。所有 `git`／`npm`／檔案操作都在這個目錄下執行，**每個任務動手前先 `pwd` 確認**（本 session 先前有 subagent 誤在 `main` 目錄提交過，見 `docs/進度.md`）
- 啟動開發伺服器：`npm run dev`（port 3000）
- **瀏覽器截圖驗證前確認分頁在前景**（`document.visibilityState === 'visible'`），否則 motion 動畫會被 Chrome 節流凍結，看起來像壞掉（`docs/進度.md` 已記載）

## 檔案結構

| 檔案 | 動作 | 責任 |
|------|------|------|
| `server.ts` | 修改 | `photos`／`photo_reactions` 資料表、multer 設定、6 個 API 端點、n8n 同步 |
| `src/components/PhotoGallery.tsx` | 新增 | 上傳區＋縮圖格子牆＋下載/刪除＋唯讀 emoji 統計。自己 `fetch`，不進 `DataContext`（比照 `Expenses.tsx` 的模式：Context 只裝 Google Sheet 唯讀資料） |
| `src/components/PhotoLightbox.tsx` | 新增 | 全螢幕放大檢視＋左右切換（鍵盤／滑動）＋可點的 emoji 按鈕列 |
| `src/App.tsx` | 修改 | import、`quickLinks` 加一項、`grid-cols-4`→`grid-cols-5`、新增 `<Section id="photos">` |
| `src/index.css` | 修改 | 新增 `fade-in` keyframe（沿用既有 `pulse-soft` 的模式），供燈箱開啟時的淡入效果，並對 `prefers-reduced-motion` 使用者關閉 |
| `.gitignore` | 修改 | 加入 `.uploads/` |
| `.env.example` | 修改 | 記錄 n8n webhook 兩個設定項 |
| `package.json` | 修改 | 新增 `multer`、`sharp`、`heic-convert`、`@types/multer` |

不動的檔案：`src/DataContext.tsx`、`src/services/googleSheetService.ts`（這個功能不讀 Google Sheet）。

---

## Task 1：後端——照片儲存管線＋核心 CRUD 端點

新增照片的儲存與讀寫骨幹：三個版本檔案的產生流程、`photos` 資料表、5 個端點（列表／上傳／縮圖／展示版／下載／刪除，其中列表與刪除共用一個端點分類，實際是 6 個 route handler）。**這個任務完成後，用 curl 就能完整測試上傳→列表→縮圖→展示版→下載→刪除的全流程**，不需要前端。

**Files:**
- Modify: `server.ts`（第 1-18 行 import／常數區；第 39-49 行資料表區之後；第 201-203 行之間新增端點）
- Modify: `.gitignore`
- Modify: `package.json`

**Interfaces:**
- Produces（後續任務會用到，型別需完全一致）：
  - 資料表 `photos`：`id, original_name, stored_file, display_file, thumb_file, mime_type, size_bytes, synced_at, timestamp`
  - `GET /api/photos` 回傳陣列，每筆：`{ id, original_name, mime_type, size_bytes, has_thumb, has_display, synced_at, timestamp }`（**不含**內部檔名欄位，前端只用 `id` 組出 `/api/photos/:id/thumb` 等網址）
  - `POST /api/photos`：multipart 欄位名 **`photos`**（前端 Task 4 會用同一個欄位名），可多檔，回傳新增的照片陣列（同上形狀）
  - `DELETE /api/photos/:id`：回傳 `{ success: true }`
- Consumes: 無（第一個任務）

- [ ] **Step 1：安裝套件**

```bash
cd /Users/mmfamily/Projects/2026_nztrip/.claude/worktrees/daily-summary
pwd  # 確認輸出以 .claude/worktrees/daily-summary 結尾
npm install multer sharp heic-convert
npm install -D @types/multer
```

- [ ] **Step 2：`.gitignore` 加入 `.uploads/`**

在 `.photo-cache/` 那一行之後新增一行：

```
node_modules
dist
comments.db
.env.local
.env
.photo-cache/
.uploads/
```

- [ ] **Step 3：`server.ts` 新增 import 與儲存路徑常數**

第 1-8 行的 import 區，在 `import dotenv from "dotenv";` 之後新增：

```ts
import multer from "multer";
import sharp from "sharp";
```

第 16 行 `const PHOTO_CACHE_DIR = path.join(__dirname, ".photo-cache");` 之後新增：

```ts
const UPLOAD_DIR = path.join(__dirname, ".uploads");
const UPLOAD_ORIGINALS_DIR = path.join(UPLOAD_DIR, "originals");
const UPLOAD_DISPLAY_DIR = path.join(UPLOAD_DIR, "display");
const UPLOAD_THUMBS_DIR = path.join(UPLOAD_DIR, "thumbs");
for (const dir of [UPLOAD_ORIGINALS_DIR, UPLOAD_DISPLAY_DIR, UPLOAD_THUMBS_DIR]) {
  fs.mkdirSync(dir, { recursive: true });
}
```

這裡跟 `.photo-cache` 的「第一次用到才 `mkdirSync`」不同，改成啟動時就建立三個目錄——因為 multer 的 `diskStorage.destination` 是同步 callback，需要目錄已經存在。

- [ ] **Step 4：`server.ts` 新增 `photos` 資料表**

第 49 行（`expenses` 資料表的 `` `); `` 結尾）之後新增：

```ts
db.exec(`
  CREATE TABLE IF NOT EXISTS photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    original_name TEXT NOT NULL,
    stored_file TEXT NOT NULL,
    display_file TEXT,
    thumb_file TEXT,
    mime_type TEXT NOT NULL,
    size_bytes INTEGER NOT NULL,
    synced_at DATETIME,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);
```

**絕對不要**像 `expenses` 表那樣在前面加 `DROP TABLE IF EXISTS`——那會讓資料每次重啟伺服器就消失，對照片是災難性的（這是既有程式碼的既有行為，本計畫不修正它，但新表絕不能沿用這個模式）。

- [ ] **Step 5：`server.ts` 新增 multer 設定與縮圖產生函式**

緊接在 Step 4 新增的 `photos` 資料表 SQL 之後、`async function startServer() {` 之前，新增：

```ts
const ALLOWED_PHOTO_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif"];

function isHeic(mimeType: string, filename: string) {
  const ext = path.extname(filename).toLowerCase();
  return mimeType === "image/heic" || mimeType === "image/heif" || ext === ".heic" || ext === ".heif";
}

const photoUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_ORIGINALS_DIR),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${crypto.randomUUID()}${ext}`);
    },
  }),
  limits: { fileSize: 25 * 1024 * 1024, files: 20 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const okMime = file.mimetype.startsWith("image/");
    const okExt = ALLOWED_PHOTO_EXTENSIONS.includes(ext);
    if (okMime || okExt) return cb(null, true);
    cb(new Error("Only image files are allowed"));
  },
});

async function generateDerivatives(
  originalPath: string,
  mimeType: string,
  originalName: string
): Promise<{ displayFile: string | null; thumbFile: string | null }> {
  try {
    let sourceBuffer: Buffer;
    if (isHeic(mimeType, originalName)) {
      const { default: heicConvert } = (await import("heic-convert")) as any;
      const inputBuffer = fs.readFileSync(originalPath);
      sourceBuffer = await heicConvert({ buffer: inputBuffer, format: "JPEG", quality: 0.9 });
    } else {
      sourceBuffer = fs.readFileSync(originalPath);
    }

    const id = crypto.randomUUID();
    const displayFile = `${id}-display.jpg`;
    const thumbFile = `${id}-thumb.jpg`;

    await sharp(sourceBuffer)
      .resize(1600, 1600, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 82 })
      .toFile(path.join(UPLOAD_DISPLAY_DIR, displayFile));

    await sharp(sourceBuffer)
      .resize(400, 400, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 70 })
      .toFile(path.join(UPLOAD_THUMBS_DIR, thumbFile));

    return { displayFile, thumbFile };
  } catch (err) {
    console.error("Failed to generate photo derivatives:", err);
    return { displayFile: null, thumbFile: null };
  }
}
```

`heic-convert` 沒附型別定義，用動態 `import()` + `as any` 繞過 `tsc` 檢查，同時只有真的遇到 HEIC 才會載入這個套件。`generateDerivatives` 整個包在 try/catch 裡——失敗就回傳兩個 null，呼叫端（Step 6）不會因此擋下整筆上傳。

- [ ] **Step 6：`server.ts` 新增 5 個端點**

在第 201 行 `  });`（`/api/place-photo` 端點結尾）之後、第 203 行 `  // Vite middleware for development` 之前，插入：

```ts
  app.get("/api/photos", (req, res) => {
    const rows = db.prepare("SELECT * FROM photos ORDER BY timestamp DESC").all() as any[];
    const photos = rows.map((row) => ({
      id: row.id,
      original_name: row.original_name,
      mime_type: row.mime_type,
      size_bytes: row.size_bytes,
      has_thumb: !!row.thumb_file,
      has_display: !!row.display_file,
      synced_at: row.synced_at,
      timestamp: row.timestamp,
    }));
    res.json(photos);
  });

  app.post("/api/photos", (req, res) => {
    photoUpload.array("photos", 20)(req, res, async (err: any) => {
      if (err) {
        return res.status(400).json({ error: err.message || "Upload failed" });
      }
      const files = (req.files as Express.Multer.File[]) || [];
      if (files.length === 0) {
        return res.status(400).json({ error: "No files uploaded" });
      }

      const created = [];
      for (const file of files) {
        const { displayFile, thumbFile } = await generateDerivatives(file.path, file.mimetype, file.originalname);
        const stmt = db.prepare(
          "INSERT INTO photos (original_name, stored_file, display_file, thumb_file, mime_type, size_bytes) VALUES (?, ?, ?, ?, ?, ?)"
        );
        const info = stmt.run(file.originalname, file.filename, displayFile, thumbFile, file.mimetype, file.size);
        created.push({
          id: info.lastInsertRowid,
          original_name: file.originalname,
          mime_type: file.mimetype,
          size_bytes: file.size,
          has_thumb: !!thumbFile,
          has_display: !!displayFile,
          synced_at: null,
          timestamp: new Date().toISOString(),
        });
      }

      res.json(created);
    });
  });

  app.get("/api/photos/:id/thumb", (req, res) => {
    const row = db.prepare("SELECT thumb_file FROM photos WHERE id = ?").get(req.params.id) as
      | { thumb_file: string | null }
      | undefined;
    if (!row || !row.thumb_file) return res.status(404).end();
    const filePath = path.join(UPLOAD_THUMBS_DIR, row.thumb_file);
    if (!fs.existsSync(filePath)) return res.status(404).end();
    res.setHeader("Content-Type", "image/jpeg");
    res.setHeader("Cache-Control", "public, max-age=2592000");
    fs.createReadStream(filePath).pipe(res);
  });

  app.get("/api/photos/:id/display", (req, res) => {
    const row = db.prepare("SELECT display_file FROM photos WHERE id = ?").get(req.params.id) as
      | { display_file: string | null }
      | undefined;
    if (!row || !row.display_file) return res.status(404).end();
    const filePath = path.join(UPLOAD_DISPLAY_DIR, row.display_file);
    if (!fs.existsSync(filePath)) return res.status(404).end();
    res.setHeader("Content-Type", "image/jpeg");
    res.setHeader("Cache-Control", "public, max-age=2592000");
    fs.createReadStream(filePath).pipe(res);
  });

  app.get("/api/photos/:id/file", (req, res) => {
    const row = db.prepare("SELECT stored_file, original_name, mime_type FROM photos WHERE id = ?").get(
      req.params.id
    ) as { stored_file: string; original_name: string; mime_type: string } | undefined;
    if (!row) return res.status(404).end();
    const filePath = path.join(UPLOAD_ORIGINALS_DIR, row.stored_file);
    if (!fs.existsSync(filePath)) return res.status(404).end();
    res.setHeader("Content-Type", row.mime_type || "application/octet-stream");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename*=UTF-8''${encodeURIComponent(row.original_name)}`
    );
    fs.createReadStream(filePath).pipe(res);
  });

  app.delete("/api/photos/:id", (req, res) => {
    const row = db.prepare("SELECT stored_file, display_file, thumb_file FROM photos WHERE id = ?").get(
      req.params.id
    ) as { stored_file: string; display_file: string | null; thumb_file: string | null } | undefined;
    if (!row) return res.status(404).json({ error: "Not found" });

    const targets: [string, string | null][] = [
      [UPLOAD_ORIGINALS_DIR, row.stored_file],
      [UPLOAD_DISPLAY_DIR, row.display_file],
      [UPLOAD_THUMBS_DIR, row.thumb_file],
    ];
    for (const [dir, file] of targets) {
      if (file) {
        const p = path.join(dir, file);
        if (fs.existsSync(p)) fs.unlinkSync(p);
      }
    }

    db.prepare("DELETE FROM photos WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

```

用 `photoUpload.array("photos", 20)(req, res, callback)` 的呼叫式寫法而非直接當 middleware 陣列註冊，是為了讓檔案過大／格式錯誤時能回傳乾淨的 JSON 400，而不是讓 Express 預設錯誤頁接手。

- [ ] **Step 7：型別檢查**

```bash
cd /Users/mmfamily/Projects/2026_nztrip/.claude/worktrees/daily-summary && npm run lint
```

預期：無任何輸出。若報 `Cannot find module 'multer'` 或 `'sharp'`，代表 Step 1 沒裝成功。

- [ ] **Step 8：curl 端到端驗證**

```bash
cd /Users/mmfamily/Projects/2026_nztrip/.claude/worktrees/daily-summary
lsof -ti:3000 | xargs kill 2>/dev/null
npm run dev &
sleep 4

# 上傳（用專案現成的圖當測資）
curl -s -F "photos=@public/map.png" http://localhost:3000/api/photos
# 預期：JSON 陣列，一筆，has_thumb/has_display 都是 true

# 列表
curl -s http://localhost:3000/api/photos
# 預期：跟上面同一筆

# 縮圖與展示版
curl -s -o /dev/null -w "thumb %{http_code} %{content_type}\n" http://localhost:3000/api/photos/1/thumb
curl -s -o /dev/null -w "display %{http_code} %{content_type}\n" http://localhost:3000/api/photos/1/display
# 兩個都預期 200 image/jpeg

# ★ 關鍵驗證：下載原檔，位元組必須與上傳的完全相同
curl -s -o /tmp/dl-test.png http://localhost:3000/api/photos/1/file
shasum public/map.png /tmp/dl-test.png
# 兩行 hash 必須一模一樣——這證明下載沒有被壓縮或轉檔

# 確認磁碟結構
ls .uploads/originals .uploads/display .uploads/thumbs
# 三個資料夾都應該各有一個檔案

# 刪除
curl -s -X DELETE http://localhost:3000/api/photos/1
curl -s http://localhost:3000/api/photos
# 預期：{"success":true}，列表回到空陣列
ls .uploads/originals .uploads/display .uploads/thumbs
# 三個資料夾應該都是空的了
```

若 hash 比對不一致，或任一步驟回傳非預期結果，**不要進入 Step 9**，回頭檢查 Step 6 的端點程式碼。

- [ ] **Step 9：Commit**

```bash
cd /Users/mmfamily/Projects/2026_nztrip/.claude/worktrees/daily-summary
git add server.ts package.json package-lock.json .gitignore
git commit -m "feat: 旅行相簿後端——照片儲存管線與核心端點"
```

---

## Task 2：後端——心情 emoji

新增 `photo_reactions` 表與計數端點，並讓 `GET /api/photos` 附帶每張照片的 emoji 統計。

**Files:**
- Modify: `server.ts`

**Interfaces:**
- Consumes（來自 Task 1）：`photos` 資料表、`GET /api/photos` 既有回傳形狀、`DELETE /api/photos/:id` 既有 handler
- Produces：
  - `GET /api/photos` 回傳形狀新增一欄 `reactions: Record<string, number>`（例如 `{"❤️":3,"😂":1}`，次數為 0 的表情不會出現在物件裡）
  - `POST /api/photos/:id/reactions`，body `{ emoji: string, delta: 1 | -1 }`，回傳 `{ reactions: Record<string, number> }`（該照片更新後的完整統計）

- [ ] **Step 1：新增白名單常數與資料表**

緊接在 Task 1 Step 4 新增的 `photos` 資料表 SQL 之後，新增：

```ts
const REACTION_EMOJIS = ["❤️", "😂", "😍", "👍", "🔥", "🥹"];

db.exec(`
  CREATE TABLE IF NOT EXISTS photo_reactions (
    photo_id INTEGER NOT NULL,
    emoji TEXT NOT NULL,
    count INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (photo_id, emoji)
  )
`);
```

- [ ] **Step 2：新增查詢輔助函式**

緊接在 Step 1 的 SQL 之後、`async function startServer() {` 之前（也就是 Task 1 Step 5 那個 multer 區塊之後），新增：

```ts
function reactionsByPhotoId(photoIds: number[]): Record<number, Record<string, number>> {
  if (photoIds.length === 0) return {};
  const placeholders = photoIds.map(() => "?").join(",");
  const rows = db
    .prepare(`SELECT photo_id, emoji, count FROM photo_reactions WHERE photo_id IN (${placeholders}) AND count > 0`)
    .all(...photoIds) as { photo_id: number; emoji: string; count: number }[];
  const grouped: Record<number, Record<string, number>> = {};
  for (const row of rows) {
    if (!grouped[row.photo_id]) grouped[row.photo_id] = {};
    grouped[row.photo_id][row.emoji] = row.count;
  }
  return grouped;
}
```

這個函式一次查完所有需要的照片，讓 `GET /api/photos` 不會對每張照片各查一次資料庫。

- [ ] **Step 3：`GET /api/photos` 附帶 reactions**

把 Task 1 Step 6 寫的這個 handler：

```ts
  app.get("/api/photos", (req, res) => {
    const rows = db.prepare("SELECT * FROM photos ORDER BY timestamp DESC").all() as any[];
    const photos = rows.map((row) => ({
      id: row.id,
      original_name: row.original_name,
      mime_type: row.mime_type,
      size_bytes: row.size_bytes,
      has_thumb: !!row.thumb_file,
      has_display: !!row.display_file,
      synced_at: row.synced_at,
      timestamp: row.timestamp,
    }));
    res.json(photos);
  });
```

整段替換成：

```ts
  app.get("/api/photos", (req, res) => {
    const rows = db.prepare("SELECT * FROM photos ORDER BY timestamp DESC").all() as any[];
    const reactionsMap = reactionsByPhotoId(rows.map((r) => r.id));
    const photos = rows.map((row) => ({
      id: row.id,
      original_name: row.original_name,
      mime_type: row.mime_type,
      size_bytes: row.size_bytes,
      has_thumb: !!row.thumb_file,
      has_display: !!row.display_file,
      synced_at: row.synced_at,
      timestamp: row.timestamp,
      reactions: reactionsMap[row.id] || {},
    }));
    res.json(photos);
  });
```

- [ ] **Step 4：新增 `POST /api/photos/:id/reactions` 端點**

在 `app.delete("/api/photos/:id", ...)` 端點（Task 1 Step 6 的最後一個端點）結尾的 `  });` 之後新增：

```ts

  app.post("/api/photos/:id/reactions", (req, res) => {
    const { emoji, delta } = req.body;
    if (!REACTION_EMOJIS.includes(emoji)) {
      return res.status(400).json({ error: "Unknown emoji" });
    }
    if (delta !== 1 && delta !== -1) {
      return res.status(400).json({ error: "delta must be 1 or -1" });
    }
    const photo = db.prepare("SELECT id FROM photos WHERE id = ?").get(req.params.id);
    if (!photo) return res.status(404).json({ error: "Photo not found" });

    db.prepare(
      `INSERT INTO photo_reactions (photo_id, emoji, count) VALUES (?, ?, MAX(0, ?))
       ON CONFLICT(photo_id, emoji) DO UPDATE SET count = MAX(0, count + ?)`
    ).run(req.params.id, emoji, delta, delta);

    const photoId = Number(req.params.id);
    const reactions = reactionsByPhotoId([photoId])[photoId] || {};
    res.json({ reactions });
  });
```

SQLite 的 `MAX(a, b)`（兩個以上參數）是純量函式取最大值，用來把 count 夾在 0 以上——`delta=-1` 且目前是 0 時，`MAX(0, 0-1)` 結果是 0，不會變負數。

- [ ] **Step 5：刪除照片時一併刪除其 reactions**

在 `app.delete("/api/photos/:id", ...)` handler 裡，找到：

```ts
    db.prepare("DELETE FROM photos WHERE id = ?").run(req.params.id);
    res.json({ success: true });
```

改成：

```ts
    db.prepare("DELETE FROM photo_reactions WHERE photo_id = ?").run(req.params.id);
    db.prepare("DELETE FROM photos WHERE id = ?").run(req.params.id);
    res.json({ success: true });
```

- [ ] **Step 6：型別檢查**

```bash
cd /Users/mmfamily/Projects/2026_nztrip/.claude/worktrees/daily-summary && npm run lint
```

- [ ] **Step 7：curl 驗證**

```bash
cd /Users/mmfamily/Projects/2026_nztrip/.claude/worktrees/daily-summary
lsof -ti:3000 | xargs kill 2>/dev/null
npm run dev &
sleep 4

# 先上傳一張測試照片
curl -s -F "photos=@public/map.png" http://localhost:3000/api/photos
# 記下回傳的 id，下面假設是 1

# 白名單外的 emoji 應該被拒絕
curl -s -w "\n%{http_code}\n" -X POST http://localhost:3000/api/photos/1/reactions \
  -H "Content-Type: application/json" -d '{"emoji":"💩","delta":1}'
# 預期：400

# delta 超出範圍應該被拒絕
curl -s -w "\n%{http_code}\n" -X POST http://localhost:3000/api/photos/1/reactions \
  -H "Content-Type: application/json" -d '{"emoji":"❤️","delta":999}'
# 預期：400

# 正常按一次
curl -s -X POST http://localhost:3000/api/photos/1/reactions \
  -H "Content-Type: application/json" -d '{"emoji":"❤️","delta":1}'
# 預期：{"reactions":{"❤️":1}}

# 確認列表也看得到
curl -s http://localhost:3000/api/photos
# 該筆的 reactions 應為 {"❤️":1}

# 取消
curl -s -X POST http://localhost:3000/api/photos/1/reactions \
  -H "Content-Type: application/json" -d '{"emoji":"❤️","delta":-1}'
# 預期：{"reactions":{}}（次數 0 的表情不出現在物件裡）

curl -s -X DELETE http://localhost:3000/api/photos/1
```

- [ ] **Step 8：Commit**

```bash
cd /Users/mmfamily/Projects/2026_nztrip/.claude/worktrees/daily-summary
git add server.ts
git commit -m "feat: 旅行相簿——心情 emoji 後端"
```

---

## Task 3：後端——n8n → Google Drive 同步

上傳成功後，在背景（不擋回應）把原始檔 POST 到使用者的 n8n webhook。

**Files:**
- Modify: `server.ts`
- Modify: `.env.example`

**Interfaces:**
- Consumes（來自 Task 1）：`photos` 表的 `stored_file`／`synced_at` 欄、`POST /api/photos` 的上傳迴圈
- Produces：無新的對外介面（純背景行為），但新增環境變數 `N8N_PHOTO_WEBHOOK_URL`、`N8N_PHOTO_WEBHOOK_TOKEN`

- [ ] **Step 1：新增同步函式**

在 `server.ts` 第 11 行 `dotenv.config();` 之後、`const __filename = ...`（第 13 行）之前，新增：

```ts

async function syncPhotoToN8n(photoId: number, storedFilePath: string, originalName: string, mimeType: string) {
  const webhookUrl = process.env.N8N_PHOTO_WEBHOOK_URL;
  if (!webhookUrl) return;

  try {
    const fileBuffer = fs.readFileSync(storedFilePath);
    const form = new FormData();
    form.append("file", new Blob([fileBuffer], { type: mimeType }), originalName);

    const headers: Record<string, string> = {};
    const token = process.env.N8N_PHOTO_WEBHOOK_TOKEN;
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const resp = await fetch(webhookUrl, { method: "POST", body: form, headers });
    if (!resp.ok) throw new Error(`n8n webhook responded ${resp.status}`);

    db.prepare("UPDATE photos SET synced_at = CURRENT_TIMESTAMP WHERE id = ?").run(photoId);
  } catch (err) {
    console.error(`Failed to sync photo ${photoId} to n8n:`, err);
  }
}
```

`fetch`／`FormData`／`Blob` 都是全域可用（Node 18+ 內建，`server.ts:167` 呼叫 Google Places API 時已經在用 `fetch`，這裡不需要額外 import）。放在檔案最上面是因為它要在 `db` 初始化（第 18 行）之後才能用到 `db.prepare`——實際上放這裡沒問題，因為函式定義本身不會立刻執行，只有真的呼叫時才會存取 `db`，那時候 `db` 早已初始化完成。

- [ ] **Step 2：上傳成功時觸發同步（不等待）**

在 `app.post("/api/photos", ...)` 裡（Task 1 Step 6 寫的），找到：

```ts
        const info = stmt.run(file.originalname, file.filename, displayFile, thumbFile, file.mimetype, file.size);
        created.push({
```

改成：

```ts
        const info = stmt.run(file.originalname, file.filename, displayFile, thumbFile, file.mimetype, file.size);
        const photoId = Number(info.lastInsertRowid);
        syncPhotoToN8n(photoId, file.path, file.originalname, file.mimetype);
        created.push({
```

注意這行**沒有 `await`**——這就是「fire-and-forget」，同步在背景跑，不會拖慢上傳回應。

`created.push({ id: info.lastInsertRowid, ... })` 那段本身不用改，`photoId` 只是給 `syncPhotoToN8n` 用的區域變數。

- [ ] **Step 3：`.env.example` 記錄設定項**

在檔案最後新增：

```

# N8N_PHOTO_WEBHOOK_URL / N8N_PHOTO_WEBHOOK_TOKEN: 旅行相簿照片自動同步到 Google Drive
# （透過使用者自建的 n8n workflow，webhook 節點 + Google Drive 節點）。
# 沒設定就跳過同步，照片上傳功能完全不受影響。
N8N_PHOTO_WEBHOOK_URL=
N8N_PHOTO_WEBHOOK_TOKEN=
```

- [ ] **Step 4：型別檢查**

```bash
cd /Users/mmfamily/Projects/2026_nztrip/.claude/worktrees/daily-summary && npm run lint
```

- [ ] **Step 5：curl 驗證兩種情境**

```bash
cd /Users/mmfamily/Projects/2026_nztrip/.claude/worktrees/daily-summary

# 情境一：沒設定 webhook（.env.local 沒有 N8N_PHOTO_WEBHOOK_URL）
lsof -ti:3000 | xargs kill 2>/dev/null
npm run dev &
sleep 4
curl -s -F "photos=@public/map.png" http://localhost:3000/api/photos
# 預期：上傳成功，synced_at 是 null，終端機沒有跟同步相關的錯誤訊息
curl -s -X DELETE http://localhost:3000/api/photos/1

# 情境二：設定一個故意錯誤的 webhook，確認失敗不影響上傳
N8N_PHOTO_WEBHOOK_URL=http://localhost:9999/nonexistent npm run dev &
sleep 4
curl -s -F "photos=@public/map.png" http://localhost:3000/api/photos
# 預期：上傳仍然成功（HTTP 200，回傳照片資料），因為同步是背景執行、不等待
sleep 1
curl -s http://localhost:3000/api/photos
# 預期：synced_at 仍是 null
# 終端機應該看得到「Failed to sync photo ... to n8n: ...」的錯誤訊息（fetch 連線被拒絕）
curl -s -X DELETE http://localhost:3000/api/photos/1
```

真正接上使用者的 n8n workflow 測試（Drive 資料夾真的多出照片）需要使用者自己先建好 workflow，這部分留給使用者驗證（見計畫最後的「完工後請告知使用者」）。

- [ ] **Step 6：Commit**

```bash
cd /Users/mmfamily/Projects/2026_nztrip/.claude/worktrees/daily-summary
git add server.ts .env.example
git commit -m "feat: 旅行相簿——n8n 背景同步到 Google Drive"
```

---

## Task 4：前端——PhotoGallery.tsx（上傳／格子牆／下載／刪除）＋掛進 App.tsx

新增照片上傳與瀏覽的主要介面，此時**還沒有燈箱**（縮圖只能看、下載、刪除，點擊還沒反應——Task 5 才會加上點擊放大）。完成後這個功能就能在瀏覽器裡完整測試上傳/下載/刪除流程。

**Files:**
- Create: `src/components/PhotoGallery.tsx`
- Modify: `src/App.tsx`（第 1-19 行 import／`quickLinks` 區；第 86 行 `grid-cols-4`；第 126-130 行 budget Section 之後）

**Interfaces:**
- Consumes（來自 Task 1、2）：`GET /api/photos`（含 `reactions`）、`POST /api/photos`（欄位名 `photos`）、`DELETE /api/photos/:id`、`GET /api/photos/:id/thumb`、`GET /api/photos/:id/file`
- Produces（Task 5 會用到）：`export interface Photo { id, original_name, mime_type, size_bytes, has_thumb, has_display, synced_at, timestamp, reactions }`，型別要跟後端回傳形狀完全一致

- [ ] **Step 1：建立 `src/components/PhotoGallery.tsx`**

完整內容：

```tsx
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Images, Upload, Download, Trash2, Cloud, ImageOff } from 'lucide-react';

export interface Photo {
  id: number;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  has_thumb: boolean;
  has_display: boolean;
  synced_at: string | null;
  timestamp: string;
  reactions: Record<string, number>;
}

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function PhotoGallery() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const fetchPhotos = async () => {
    try {
      const res = await fetch('/api/photos');
      if (res.ok) setPhotos(await res.json());
    } catch (error) {
      console.error('Failed to fetch photos:', error);
    }
  };

  useEffect(() => {
    fetchPhotos();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadError('');
    setIsUploading(true);
    try {
      const form = new FormData();
      Array.from(files).forEach((file) => form.append('photos', file));
      const res = await fetch('/api/photos', { method: 'POST', body: form });
      if (res.ok) {
        await fetchPhotos();
      } else {
        const body = await res.json().catch(() => ({}));
        setUploadError(body.error || '上傳失敗，請再試一次');
      }
    } catch (error) {
      console.error('Failed to upload photos:', error);
      setUploadError('上傳失敗，請再試一次');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/photos/${id}`, { method: 'DELETE' });
      if (res.ok) fetchPhotos();
    } catch (error) {
      console.error('Failed to delete photo:', error);
    }
  };

  return (
    <div className="bg-camp-card p-6 md:p-8 rounded-[2.5rem] border border-camp-border shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-camp-brown/15 p-2 rounded-xl border border-camp-brown/30">
          <Images className="w-5 h-5 text-camp-brown" />
        </div>
        <h3 className="text-xl font-black text-camp-text tracking-tight">旅行相簿</h3>
      </div>

      <label className="flex flex-col items-center justify-center gap-2 min-h-[120px] border-2 border-dashed border-camp-border rounded-2xl cursor-pointer hover:border-camp-brown hover:bg-camp-brown/5 transition-all mb-6">
        <Upload className="w-6 h-6 text-camp-brown" />
        <span className="text-sm font-bold text-camp-text">
          {isUploading ? '上傳中…' : '點這裡上傳照片'}
        </span>
        <input
          type="file"
          multiple
          accept="image/*,.heic,.heif"
          className="hidden"
          disabled={isUploading}
          onChange={handleUpload}
        />
      </label>

      {uploadError && (
        <p className="mb-4 text-sm font-bold text-red-600">{uploadError}</p>
      )}

      {photos.length === 0 ? (
        <p className="text-center text-sm text-camp-muted font-medium py-6">
          還沒有人上傳照片，來傳第一張吧！
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          <AnimatePresence initial={false}>
            {photos.map((photo) => (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="rounded-2xl border border-camp-border overflow-hidden bg-camp-bg"
              >
                <div className="relative aspect-square">
                  {photo.has_thumb ? (
                    <img
                      src={`/api/photos/${photo.id}/thumb`}
                      alt={photo.original_name}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-camp-muted p-2">
                      <ImageOff className="w-6 h-6" />
                      <span className="text-xs font-bold text-center break-all">{photo.original_name}</span>
                    </div>
                  )}

                  {photo.synced_at && (
                    <div className="absolute top-2 right-2 bg-camp-text/60 rounded-full p-1">
                      <Cloud className="w-3.5 h-3.5 text-camp-card" />
                    </div>
                  )}

                  {Object.keys(photo.reactions).length > 0 && (
                    <div className="absolute bottom-2 left-2 bg-camp-text/60 rounded-full px-2 py-0.5 flex items-center gap-1.5">
                      {Object.entries(photo.reactions).map(([emoji, count]) => (
                        <span key={emoji} className="text-xs text-camp-card font-bold whitespace-nowrap">
                          {emoji}{count}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <p className="px-2 pt-1.5 text-[10px] text-camp-muted font-bold truncate">
                  {photo.original_name} · {formatSize(photo.size_bytes)}
                </p>

                <div className="grid grid-cols-2 border-t border-camp-border mt-1.5">
                  <a
                    href={`/api/photos/${photo.id}/file`}
                    download
                    className="min-h-[44px] flex items-center justify-center gap-1 text-camp-brown hover:bg-camp-brown/10 text-xs font-black transition-colors"
                  >
                    <Download className="w-4 h-4" /> 下載
                  </a>
                  <button
                    onClick={() => handleDelete(photo.id)}
                    className="min-h-[44px] flex items-center justify-center gap-1 text-camp-muted hover:text-red-600 hover:bg-red-500/10 text-xs font-black border-l border-camp-border transition-colors"
                  >
                    <Trash2 className="w-4 h-4" /> 刪除
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
```

實作重點：
- 下載／刪除做成照片下方獨立一列的兩個 `min-h-[44px]` 按鈕，**不是**疊在縮圖上的小圖示——疊在圖上的做法在規劃階段就被推翻了，因為小圖示做到 44px 會佔掉縮圖大半面積，做不到 44px 又違反觸控目標規定
- `has_thumb`/`has_display` 為 false 時的佔位邏輯只在這裡處理 `has_thumb`；`has_display`（燈箱用）留給 Task 5
- emoji 統計是唯讀顯示（`Object.entries` 直接渲染文字），沒有 `onClick`——這是刻意的，可互動的版本在 Task 5 的燈箱裡

- [ ] **Step 2：`src/App.tsx` 掛載 PhotoGallery**

第 2 行：

```tsx
import { Users, Map, Sparkles, UtensilsCrossed, Home, Wallet, Images } from 'lucide-react';
```

第 10 行 `import DailySummary from './components/DailySummary';` 之後新增：

```tsx
import PhotoGallery from './components/PhotoGallery';
```

第 14-19 行的 `quickLinks` 陣列，在 `budget` 那筆之後新增一筆：

```tsx
const quickLinks = [
  { id: 'flights', label: '人員班機', icon: Users },
  { id: 'duty', label: '餐廳輪值', icon: UtensilsCrossed },
  { id: 'lodging', label: '住房資訊', icon: Home },
  { id: 'budget', label: '費用分攤', icon: Wallet },
  { id: 'photos', label: '相簿', icon: Images },
];
```

第 86 行：

```tsx
            <div className="grid grid-cols-5 gap-1">
```

第 126-130 行的 budget Section：

```tsx
          <Section id="budget" title="費用分攤 & 記帳">
            <Budget />
            <h3 className="text-lg md:text-xl font-black text-camp-text mt-10 mb-4 tracking-tight px-1">旅途記帳</h3>
            <Expenses />
          </Section>
```

之後（`</main>` 之前）新增：

```tsx

          <Section id="photos" title="旅行相簿">
            <PhotoGallery />
          </Section>
```

- [ ] **Step 3：型別檢查**

```bash
cd /Users/mmfamily/Projects/2026_nztrip/.claude/worktrees/daily-summary && npm run lint
```

- [ ] **Step 4：瀏覽器實測**

```bash
cd /Users/mmfamily/Projects/2026_nztrip/.claude/worktrees/daily-summary
lsof -ti:3000 | xargs kill 2>/dev/null
npm run dev
```

開 `http://localhost:3000`，**確認分頁在前景**，捲到「旅行相簿」：

1. 頂部導覽變成**五格**，最後一格是「相簿」，點擊會捲到這區
2. 點上傳區選一張圖片 → 縮圖出現在格子牆
3. 一次選多張 → 全部都出現
4. 點「下載」→ 瀏覽器下載檔案，檔名是原始檔名
5. 點「刪除」→ 該格消失（有淡出動畫），重新整理頁面後仍然不在
6. 沒有照片時顯示「還沒有人上傳照片，來傳第一張吧！」

- [ ] **Step 5：Commit**

```bash
cd /Users/mmfamily/Projects/2026_nztrip/.claude/worktrees/daily-summary
git add src/components/PhotoGallery.tsx src/App.tsx
git commit -m "feat: 旅行相簿前端——上傳/格子牆/下載/刪除"
```

---

## Task 5：前端——PhotoLightbox.tsx（燈箱＋可點的心情 emoji）

新增點縮圖放大檢視的燈箱，加上可互動的心情 emoji（含 localStorage 記錄「我按過哪些」與樂觀更新）。

**Files:**
- Create: `src/components/PhotoLightbox.tsx`
- Modify: `src/components/PhotoGallery.tsx`（整份取代，見下方「Step 2：更新後的完整檔案」）
- Modify: `src/index.css`

**Interfaces:**
- Consumes（來自 Task 4）：`Photo` 型別（用 `import type { Photo } from './PhotoGallery'`——這是型別匯入，`tsc`／Vite 會在編譯時整個抹除，不會造成真正的執行期循環依賴）
- Consumes（來自 Task 2）：`POST /api/photos/:id/reactions`
- Produces：無（最後一個任務）

- [ ] **Step 1：`src/index.css` 新增淡入動畫**

在檔案最後（`.animate-pulse-soft` 那個規則之後）新增：

```css

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.animate-fade-in {
  animation: fade-in 0.15s ease-out;
}
```

沿用既有 `pulse-soft` 的 keyframe + utility class 模式，燈箱開啟時用這個做淡入，搭配 Tailwind 的 `motion-reduce:animate-none` 讓 `prefers-reduced-motion` 使用者跳過動畫。

- [ ] **Step 2：建立 `src/components/PhotoLightbox.tsx`**

完整內容：

```tsx
import React, { useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import type { Photo } from './PhotoGallery';

const REACTION_EMOJIS = ['❤️', '😂', '😍', '👍', '🔥', '🥹'];

interface PhotoLightboxProps {
  photos: Photo[];
  index: number | null;
  onClose: () => void;
  onNavigate: (index: number) => void;
  myReactions: string[];
  onReact: (photoId: number, emoji: string) => void;
}

export default function PhotoLightbox({ photos, index, onClose, onNavigate, myReactions, onReact }: PhotoLightboxProps) {
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    if (index === null) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [index]);

  useEffect(() => {
    if (index === null) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && index > 0) onNavigate(index - 1);
      if (e.key === 'ArrowRight' && index < photos.length - 1) onNavigate(index + 1);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [index, photos.length, onClose, onNavigate]);

  if (index === null) return null;
  const photo = photos[index];
  if (!photo) return null;

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < 50) return;
    if (delta > 0 && index > 0) onNavigate(index - 1);
    if (delta < 0 && index < photos.length - 1) onNavigate(index + 1);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-camp-text/95 flex flex-col animate-fade-in motion-reduce:animate-none"
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="flex items-center justify-end p-4">
        <button
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center text-camp-card rounded-full hover:bg-camp-card/10"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 relative" onClick={(e) => e.stopPropagation()}>
        {index > 0 && (
          <button
            onClick={() => onNavigate(index - 1)}
            className="absolute left-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-camp-card rounded-full hover:bg-camp-card/10 z-10"
          >
            <ChevronLeft className="w-7 h-7" />
          </button>
        )}

        {photo.has_display ? (
          <img
            src={`/api/photos/${photo.id}/display`}
            alt={photo.original_name}
            className="max-h-[70vh] max-w-full object-contain rounded-lg"
          />
        ) : (
          <div className="text-center text-camp-card">
            <p className="mb-3 font-bold">此格式無法預覽，請下載後檢視</p>
            <a
              href={`/api/photos/${photo.id}/file`}
              download
              className="inline-flex items-center gap-2 min-h-[44px] px-4 rounded-full bg-camp-brown text-camp-card font-black"
            >
              <Download className="w-4 h-4" /> 下載
            </a>
          </div>
        )}

        {index < photos.length - 1 && (
          <button
            onClick={() => onNavigate(index + 1)}
            className="absolute right-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-camp-card rounded-full hover:bg-camp-card/10 z-10"
          >
            <ChevronRight className="w-7 h-7" />
          </button>
        )}
      </div>

      <div
        className="px-4 pb-3 flex items-center justify-center gap-2 flex-wrap"
        onClick={(e) => e.stopPropagation()}
      >
        {REACTION_EMOJIS.map((emoji) => {
          const count = photo.reactions[emoji] || 0;
          const active = myReactions.includes(emoji);
          return (
            <button
              key={emoji}
              onClick={() => onReact(photo.id, emoji)}
              className={`min-w-[44px] min-h-[44px] px-2 rounded-2xl flex flex-col items-center justify-center gap-0.5 border-2 transition-all ${
                active
                  ? 'bg-camp-brown border-camp-brown text-camp-card'
                  : 'bg-transparent border-camp-card/30 text-camp-card'
              }`}
            >
              <span className="text-lg leading-none">{emoji}</span>
              {count > 0 && <span className="text-[10px] font-black leading-none">{count}</span>}
            </button>
          );
        })}
      </div>

      <div
        className="px-4 pb-4 flex items-center justify-between gap-3 text-camp-card"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-xs font-bold truncate flex-1">{photo.original_name}</span>
        <a
          href={`/api/photos/${photo.id}/file`}
          download
          className="min-h-[44px] px-4 rounded-full bg-camp-card/10 flex items-center gap-2 text-xs font-black shrink-0"
        >
          <Download className="w-4 h-4" /> 下載原始檔
        </a>
      </div>
    </div>
  );
}
```

- [ ] **Step 3：更新 `src/components/PhotoGallery.tsx`（整份取代 Task 4 的版本）**

用下面的完整內容**取代整個檔案**（不是局部修改——這個檔案的狀態管理與 JSX 都要跟燈箱串起來，整份替換比局部 diff 更不容易出錯）：

```tsx
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Images, Upload, Download, Trash2, Cloud, ImageOff } from 'lucide-react';
import PhotoLightbox from './PhotoLightbox';

export interface Photo {
  id: number;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  has_thumb: boolean;
  has_display: boolean;
  synced_at: string | null;
  timestamp: string;
  reactions: Record<string, number>;
}

const REACTIONS_STORAGE_KEY = 'nztrip.photoReactions';

function loadMyReactions(): Record<number, string[]> {
  try {
    const raw = localStorage.getItem(REACTIONS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveMyReactions(data: Record<number, string[]>) {
  try {
    localStorage.setItem(REACTIONS_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage 不可用（例如無痕模式關掉儲存）就不記，不影響按表情本身
  }
}

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function PhotoGallery() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [myReactionsMap, setMyReactionsMap] = useState<Record<number, string[]>>({});

  useEffect(() => {
    setMyReactionsMap(loadMyReactions());
  }, []);

  const fetchPhotos = async () => {
    try {
      const res = await fetch('/api/photos');
      if (res.ok) setPhotos(await res.json());
    } catch (error) {
      console.error('Failed to fetch photos:', error);
    }
  };

  useEffect(() => {
    fetchPhotos();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadError('');
    setIsUploading(true);
    try {
      const form = new FormData();
      Array.from(files).forEach((file) => form.append('photos', file));
      const res = await fetch('/api/photos', { method: 'POST', body: form });
      if (res.ok) {
        await fetchPhotos();
      } else {
        const body = await res.json().catch(() => ({}));
        setUploadError(body.error || '上傳失敗，請再試一次');
      }
    } catch (error) {
      console.error('Failed to upload photos:', error);
      setUploadError('上傳失敗，請再試一次');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/photos/${id}`, { method: 'DELETE' });
      if (res.ok) fetchPhotos();
    } catch (error) {
      console.error('Failed to delete photo:', error);
    }
  };

  const handleReact = async (photoId: number, emoji: string) => {
    const mine = myReactionsMap[photoId] ?? [];
    const isRemoving = mine.includes(emoji);
    const delta = isRemoving ? -1 : 1;

    const nextMine = isRemoving ? mine.filter((e) => e !== emoji) : [...mine, emoji];
    const nextMap = { ...myReactionsMap, [photoId]: nextMine };
    setMyReactionsMap(nextMap);
    saveMyReactions(nextMap);

    setPhotos((prev) =>
      prev.map((p) => {
        if (p.id !== photoId) return p;
        const nextCount = Math.max(0, (p.reactions[emoji] || 0) + delta);
        const nextReactions = { ...p.reactions };
        if (nextCount > 0) nextReactions[emoji] = nextCount;
        else delete nextReactions[emoji];
        return { ...p, reactions: nextReactions };
      })
    );

    try {
      const res = await fetch(`/api/photos/${photoId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji, delta }),
      });
      if (!res.ok) throw new Error('reaction request failed');
      const { reactions } = await res.json();
      setPhotos((prev) => prev.map((p) => (p.id === photoId ? { ...p, reactions } : p)));
    } catch (error) {
      console.error('Failed to update reaction:', error);
      const revertMine = isRemoving ? [...mine] : mine.filter((e) => e !== emoji);
      const revertMap = { ...myReactionsMap, [photoId]: revertMine };
      setMyReactionsMap(revertMap);
      saveMyReactions(revertMap);
      fetchPhotos();
    }
  };

  const lightboxPhoto = lightboxIndex !== null ? photos[lightboxIndex] : null;

  return (
    <div className="bg-camp-card p-6 md:p-8 rounded-[2.5rem] border border-camp-border shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-camp-brown/15 p-2 rounded-xl border border-camp-brown/30">
          <Images className="w-5 h-5 text-camp-brown" />
        </div>
        <h3 className="text-xl font-black text-camp-text tracking-tight">旅行相簿</h3>
      </div>

      <label className="flex flex-col items-center justify-center gap-2 min-h-[120px] border-2 border-dashed border-camp-border rounded-2xl cursor-pointer hover:border-camp-brown hover:bg-camp-brown/5 transition-all mb-6">
        <Upload className="w-6 h-6 text-camp-brown" />
        <span className="text-sm font-bold text-camp-text">
          {isUploading ? '上傳中…' : '點這裡上傳照片'}
        </span>
        <input
          type="file"
          multiple
          accept="image/*,.heic,.heif"
          className="hidden"
          disabled={isUploading}
          onChange={handleUpload}
        />
      </label>

      {uploadError && (
        <p className="mb-4 text-sm font-bold text-red-600">{uploadError}</p>
      )}

      {photos.length === 0 ? (
        <p className="text-center text-sm text-camp-muted font-medium py-6">
          還沒有人上傳照片，來傳第一張吧！
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          <AnimatePresence initial={false}>
            {photos.map((photo, idx) => (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="rounded-2xl border border-camp-border overflow-hidden bg-camp-bg"
              >
                <button
                  type="button"
                  onClick={() => setLightboxIndex(idx)}
                  className="relative aspect-square w-full block"
                >
                  {photo.has_thumb ? (
                    <img
                      src={`/api/photos/${photo.id}/thumb`}
                      alt={photo.original_name}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-camp-muted p-2">
                      <ImageOff className="w-6 h-6" />
                      <span className="text-xs font-bold text-center break-all">{photo.original_name}</span>
                    </div>
                  )}

                  {photo.synced_at && (
                    <div className="absolute top-2 right-2 bg-camp-text/60 rounded-full p-1">
                      <Cloud className="w-3.5 h-3.5 text-camp-card" />
                    </div>
                  )}

                  {Object.keys(photo.reactions).length > 0 && (
                    <div className="absolute bottom-2 left-2 bg-camp-text/60 rounded-full px-2 py-0.5 flex items-center gap-1.5">
                      {Object.entries(photo.reactions).map(([emoji, count]) => (
                        <span key={emoji} className="text-xs text-camp-card font-bold whitespace-nowrap">
                          {emoji}{count}
                        </span>
                      ))}
                    </div>
                  )}
                </button>

                <p className="px-2 pt-1.5 text-[10px] text-camp-muted font-bold truncate">
                  {photo.original_name} · {formatSize(photo.size_bytes)}
                </p>

                <div className="grid grid-cols-2 border-t border-camp-border mt-1.5">
                  <a
                    href={`/api/photos/${photo.id}/file`}
                    download
                    className="min-h-[44px] flex items-center justify-center gap-1 text-camp-brown hover:bg-camp-brown/10 text-xs font-black transition-colors"
                  >
                    <Download className="w-4 h-4" /> 下載
                  </a>
                  <button
                    onClick={() => handleDelete(photo.id)}
                    className="min-h-[44px] flex items-center justify-center gap-1 text-camp-muted hover:text-red-600 hover:bg-red-500/10 text-xs font-black border-l border-camp-border transition-colors"
                  >
                    <Trash2 className="w-4 h-4" /> 刪除
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <PhotoLightbox
        photos={photos}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onNavigate={setLightboxIndex}
        myReactions={lightboxPhoto ? myReactionsMap[lightboxPhoto.id] ?? [] : []}
        onReact={handleReact}
      />
    </div>
  );
}
```

跟 Task 4 版本的差異：新增 `lightboxIndex`／`myReactionsMap` state、`handleReact`（樂觀更新＋失敗回滾）、縮圖區塊包進可點的 `<button>`、檔案最後掛上 `<PhotoLightbox>`。

- [ ] **Step 4：型別檢查**

```bash
cd /Users/mmfamily/Projects/2026_nztrip/.claude/worktrees/daily-summary && npm run lint
```

- [ ] **Step 5：瀏覽器實測**

```bash
cd /Users/mmfamily/Projects/2026_nztrip/.claude/worktrees/daily-summary
lsof -ti:3000 | xargs kill 2>/dev/null
npm run dev
```

開 `http://localhost:3000`，**確認分頁在前景**，上傳至少一張照片後：

1. 點縮圖 → 燈箱開啟，顯示大圖
2. 燈箱：右上 X 關閉、點背景關閉、按 Esc 關閉
3. 上傳兩張以上照片後：左右箭頭切換、鍵盤左右鍵切換；手機或觸控裝置測左右滑動切換
4. 燈箱開啟時，背景頁面不會跟著捲動
5. 燈箱底部點 ❤️ → 數字立刻變成 1、該顆變成高亮的 `bg-camp-brown`
6. 關掉燈箱 → 縮圖左下角出現 `❤️1`
7. 重新整理頁面 → 數字還在，且再次點開燈箱時 ❤️ 仍然是高亮的（localStorage 記得）
8. 再點一次 ❤️ → 數字回到 0、高亮消失、縮圖上的標籤整個消失
9. 開一個無痕視窗看同一張照片 → 看得到數字，但 ❤️ **沒有**高亮（那個瀏覽器的 localStorage 是空的）

- [ ] **Step 6：Commit**

```bash
cd /Users/mmfamily/Projects/2026_nztrip/.claude/worktrees/daily-summary
git add src/components/PhotoLightbox.tsx src/components/PhotoGallery.tsx src/index.css
git commit -m "feat: 旅行相簿——燈箱檢視與可互動心情 emoji"
```

---

## 完工後最終驗收

五個任務都完成後：

```bash
cd /Users/mmfamily/Projects/2026_nztrip/.claude/worktrees/daily-summary
npm run lint && git status --short
```

預期：lint 無輸出；`git status` 乾淨（全部已 commit）。

瀏覽器完整走查（沿用 Task 4、5 的檢查項，這裡是彙總）：

- [ ] 頂部導覽五格，「相簿」點擊可捲動過去
- [ ] 上傳（含一次多張）、縮圖正常顯示
- [ ] 點縮圖開燈箱、左右切換、三種關閉方式都正常
- [ ] 下載的檔案跟上傳的位元組完全相同（Task 1 的 shasum 驗證已證明後端邏輯正確，這裡只需在瀏覽器再點一次下載確認前端串接無誤）
- [ ] 心情 emoji：按/取消、縮圖與燈箱都看得到統計、重整後還在、換瀏覽器看不到高亮
- [ ] 刪除照片後三個磁碟目錄與 reactions 資料都清乾淨

## 明確不做（YAGNI，沿用設計文件）

- 按拍攝地點／天數分類相簿、EXIF／GPS 讀取
- 照片說明文字／標題欄位
- 上傳者身分
- 打包成 zip 一次下載
- 同步失敗的手動重試按鈕
- 在縮圖格子上直接按 emoji（只能在燈箱按）
- 自訂 emoji、看得到「誰按了什麼」

## 完工後請告知使用者（不在任何任務的 commit 裡）

1. **HEIC 實測**：本計畫的 curl／瀏覽器驗證都用 `public/map.png` 這種一般圖檔測試，執行者手邊沒有真的 HEIC 檔案。需要使用者用 iPhone 實際傳一張，確認縮圖／燈箱都正常顯示、下載回去仍是原始 HEIC。
2. **n8n workflow**：Task 3 只驗證了程式碼在「沒設定」與「設定錯誤網址」兩種情境下的行為（不會壞、會靜默失敗），沒有測過真正連到使用者的 n8n。使用者需要在 n8n 建兩個節點（Webhook 收 POST binary → Google Drive 上傳檔案），把 Production URL 填進 `.env.local` 的 `N8N_PHOTO_WEBHOOK_URL`，再自己測一次真的同步。
3. **手機寬度**：五格導覽在 390px 下會不會擠爆、格子牆是不是兩欄、燈箱滑動切換順不順——執行者的工具無法真正模擬手機寬度（`innerWidth` 不會跟著視窗變，`docs/進度.md` 有記錄），這項必須使用者自己用 Chrome DevTools 裝置模式或真手機確認。
4. **⚠️ 照片保存風險**：`.uploads/` 已加進 `.gitignore`，照片不進版本控制、只存在這台電腦。`git clean -fdx` 之類的清理指令會刪光它們，換電腦、重灌也不會帶走。n8n → Drive 同步正是這個風險的解方，建議使用者盡早把 n8n workflow 建起來，讓 Drive 成為真正的備份；同步成功的照片格子上會有雲朵圖示，可以一眼確認哪些已經有備份。
5. 完成後更新 `docs/進度.md` 的「已完成」與「各區塊現況」兩節，加上旅行相簿功能。這一步等使用者確認驗收通過後再做。
