# 住宿註記（Lodging Notes）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在住宿卡片新增匿名、自由文字的註記區，讓家人可在 app 內貼門禁密碼／WiFi 密碼等資訊，存網站後端 SQLite。

**Architecture:** 完全沿用現有景點留言板（`comments` 表 + `/api/comments` + `CommentSection.tsx`）的模式，換一張新表 `lodging_notes` 與新路徑 `/api/lodging-notes`，並以住宿地址當識別 key（住宿卡片沒有固定 id）。前端新增一個自帶展開/收合的 `LodgingNotes` 元件，掛進 `Lodging.tsx` 每張卡片。讀 Google Sheet 組卡片的流程完全不動。

**Tech Stack:** Express + better-sqlite3（`server.ts`）、React + TypeScript + motion/react + lucide-react、Tailwind（`camp-*` class）。

## Global Constraints

- 後端表名固定為 `lodging_notes`，欄位：`id INTEGER PRIMARY KEY AUTOINCREMENT`、`lodging_key TEXT NOT NULL`、`text TEXT NOT NULL`、`timestamp DATETIME DEFAULT CURRENT_TIMESTAMP`。
- API 路徑固定：`GET /api/lodging-notes/:key`、`POST /api/lodging-notes`（body `{ key, text }`）、`DELETE /api/lodging-notes/:id`。
- 識別 key = 住宿地址去頭尾空白；地址為空時退回住宿名稱：`(l.address?.trim() || l.name?.trim() || '')`。
- 匿名（不記錄誰填）、自由文字。**只做新增與刪除，不做編輯**。
- **不做**：加密、權限、具名、結構化欄位。皆 YAGNI。
- 使用者資料存後端 `comments.db`，**不寫回 Google Sheet**。
- 本專案**沒有測試框架**（`npm run lint` = `tsc --noEmit`）。驗證用 lint + `curl` + 瀏覽器手動點。
- 部署方式不受影響（純程式改動，上線仍依 `docs/Zeabur部署教學.md` 建 Docker image，不是 git push）。

---

### Task 1: 後端 `lodging_notes` 表與 API

**Files:**
- Modify: `server.ts`（表定義接在 `cook_dishes` 表 `db.exec` 之後，約 line 125；API 接在現有 `DELETE /api/comments/:id` 之後，約 line 231）

**Interfaces:**
- Produces:
  - `GET /api/lodging-notes/:key` → `200` JSON 陣列，每筆 `{ id:number, lodging_key:string, text:string, timestamp:string }`，依 `timestamp DESC`。
  - `POST /api/lodging-notes` body `{ key:string, text:string }` → `text` 去空白為空回 `400 { error }`；成功回 `{ id, lodging_key, text, timestamp }`。
  - `DELETE /api/lodging-notes/:id` → `{ success: true }`。

- [ ] **Step 1: 新增資料表定義**

在 `server.ts` 的 `cook_dishes` 表 `db.exec(...)` 區塊之後（約 line 125，`const ALLOWED_PHOTO_EXTENSIONS` 之前）插入：

```ts
db.exec(`
  CREATE TABLE IF NOT EXISTS lodging_notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lodging_key TEXT NOT NULL,
    text TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);
```

- [ ] **Step 2: 新增三支 API**

在 `server.ts` 現有 `app.delete("/api/comments/:id", ...)` 區塊之後（約 line 231）插入：

```ts
  app.get("/api/lodging-notes/:key", (req, res) => {
    const { key } = req.params;
    const stmt = db.prepare("SELECT * FROM lodging_notes WHERE lodging_key = ? ORDER BY timestamp DESC");
    const notes = stmt.all(key);
    res.json(notes);
  });

  app.post("/api/lodging-notes", (req, res) => {
    const { key, text } = req.body;
    if (!key || String(key).trim() === "") {
      return res.status(400).json({ error: "Lodging key is required" });
    }
    if (!text || text.trim() === "") {
      return res.status(400).json({ error: "Note text is required" });
    }
    const stmt = db.prepare("INSERT INTO lodging_notes (lodging_key, text) VALUES (?, ?)");
    const info = stmt.run(key, text);
    res.json({ id: info.lastInsertRowid, lodging_key: key, text, timestamp: new Date().toISOString() });
  });

  app.delete("/api/lodging-notes/:id", (req, res) => {
    const { id } = req.params;
    const stmt = db.prepare("DELETE FROM lodging_notes WHERE id = ?");
    stmt.run(id);
    res.json({ success: true });
  });
```

- [ ] **Step 3: 型別檢查**

Run: `npm run lint`
Expected: 無輸出、零錯誤（`tsc --noEmit` 通過）。

- [ ] **Step 4: 啟動後端手動驗證三支 API**

先在一個 terminal 跑：`npm run dev`（port 3000），另一個 terminal 依序執行：

```bash
# 新增一筆（用一個測試 key）
curl -s -X POST http://localhost:3000/api/lodging-notes \
  -H 'Content-Type: application/json' \
  -d '{"key":"TEST ADDR","text":"大門密碼 1234"}'
# Expected: {"id":1,"lodging_key":"TEST ADDR","text":"大門密碼 1234","timestamp":"..."}

# 讀回該 key
curl -s http://localhost:3000/api/lodging-notes/$(python3 -c "import urllib.parse;print(urllib.parse.quote('TEST ADDR'))")
# Expected: 陣列含剛剛那筆

# 空白 text → 400
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:3000/api/lodging-notes \
  -H 'Content-Type: application/json' -d '{"key":"TEST ADDR","text":"   "}'
# Expected: 400

# 刪除 id=1 後再讀，應為空陣列
curl -s -X DELETE http://localhost:3000/api/lodging-notes/1
curl -s http://localhost:3000/api/lodging-notes/$(python3 -c "import urllib.parse;print(urllib.parse.quote('TEST ADDR'))")
# Expected: []
```

- [ ] **Step 5: Commit**

```bash
git add server.ts
git commit -m "feat: add lodging_notes table and API endpoints"
```

---

### Task 2: 前端 `LodgingNotes` 元件與接線

**Files:**
- Create: `src/components/LodgingNotes.tsx`
- Modify: `src/components/Lodging.tsx`（頂部 import；每張卡片底部掛入元件）

**Interfaces:**
- Consumes: Task 1 的三支 `/api/lodging-notes` 端點。
- Produces: `export default function LodgingNotes({ lodgingKey }: { lodgingKey: string })` — 自帶展開/收合按鈕的註記區元件。

- [ ] **Step 1: 建立 `LodgingNotes.tsx`**

Create `src/components/LodgingNotes.tsx`：

```tsx
import React, { useState, useEffect } from 'react';
import { StickyNote, Send, Trash2, Clock, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Note {
  id: number;
  lodging_key: string;
  text: string;
  timestamp: string;
}

export default function LodgingNotes({ lodgingKey }: { lodgingKey: string }) {
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchNotes = async () => {
    try {
      const response = await fetch(`/api/lodging-notes/${encodeURIComponent(lodgingKey)}`);
      if (response.ok) {
        setNotes(await response.json());
      }
    } catch (error) {
      console.error('Failed to fetch lodging notes:', error);
    }
  };

  useEffect(() => {
    if (showNotes) fetchNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showNotes, lodgingKey]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    setIsLoading(true);
    try {
      const response = await fetch('/api/lodging-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: lodgingKey, text: newNote }),
      });
      if (response.ok) {
        setNewNote('');
        fetchNotes();
      }
    } catch (error) {
      console.error('Failed to post lodging note:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/lodging-notes/${id}`, { method: 'DELETE' });
      if (response.ok) fetchNotes();
    } catch (error) {
      console.error('Failed to delete lodging note:', error);
    }
  };

  return (
    <div>
      <button
        onClick={() => setShowNotes((v) => !v)}
        className="inline-flex items-center justify-center gap-2 min-h-[44px] w-full rounded-full bg-camp-bg border-2 border-camp-border text-camp-text text-sm font-black hover:border-camp-brown transition-colors"
      >
        <StickyNote className="w-4 h-4 text-camp-brown" />
        註記（門禁／WiFi 密碼等）
        <ChevronDown className={`w-4 h-4 transition-transform ${showNotes ? 'rotate-180' : ''}`} />
      </button>

      {showNotes && (
        <div className="mt-3 space-y-3">
          <p className="text-xs font-bold text-camp-muted leading-snug">
            僅供家族內部使用，請勿外流連結。
          </p>

          <form onSubmit={handleSubmit} className="relative">
            <input
              type="text"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="例如：大門密碼 1234 / WiFi CampHouse 密碼 abc12345"
              className="w-full min-h-[48px] bg-camp-bg border-2 border-camp-border rounded-xl px-4 py-3 pr-12 text-sm font-medium text-camp-text placeholder:text-camp-muted focus:border-camp-brown focus:outline-none transition-all"
            />
            <button
              type="submit"
              disabled={isLoading || !newNote.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-camp-brown hover:bg-camp-brown/10 rounded-lg transition-colors disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          <div className="space-y-3 max-h-60 overflow-y-auto no-scrollbar pr-1">
            <AnimatePresence initial={false}>
              {notes.map((note) => (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-camp-bg p-3 rounded-xl border border-camp-border group"
                >
                  <div className="flex justify-between items-start gap-2">
                    <p className="text-sm text-camp-text font-medium leading-relaxed break-words flex-1">
                      {note.text}
                    </p>
                    <button
                      onClick={() => handleDelete(note.id)}
                      className="p-1.5 text-camp-muted hover:text-red-600 hover:bg-red-500/10 rounded-lg transition-all"
                      title="刪除註記"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 text-xs font-black text-camp-muted uppercase tracking-widest">
                    <Clock className="w-3 h-3" />
                    {new Date(note.timestamp).toLocaleString('zh-TW', {
                      month: 'numeric',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {notes.length === 0 && (
              <p className="text-center text-sm text-camp-muted font-medium py-4">
                還沒有註記，第一個貼上門禁／WiFi 密碼吧！
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: 在 `Lodging.tsx` 引入元件**

在 `src/components/Lodging.tsx` 頂部 import 區塊加入（放在既有 `import type { LodgingData }...` 之後）：

```tsx
import LodgingNotes from './LodgingNotes';
```

- [ ] **Step 3: 在每張卡片底部掛入註記區**

在 `Lodging.tsx` 卡片內、`{l.roomNote && (...)}` 區塊之後、關閉該 `<div className="px-4 md:px-5 flex flex-col gap-2.5 pb-4 md:pb-5">` 之前，插入：

```tsx
            {(l.address?.trim() || l.name?.trim()) && (
              <LodgingNotes lodgingKey={(l.address?.trim() || l.name?.trim() || '')} />
            )}
```

- [ ] **Step 4: 型別檢查**

Run: `npm run lint`
Expected: 無輸出、零錯誤。

- [ ] **Step 5: 瀏覽器手動驗證**

`npm run dev` 後開 http://localhost:3000 ，捲到「住房資訊」：
1. 每張住宿卡片底部有「📝 註記（門禁／WiFi 密碼等）」按鈕，點擊展開。
2. 輸入「大門密碼 1234」按送出 → 立即出現在下方列表，帶時間。
3. 重新整理頁面、再次展開同一張卡片 → 該筆仍在（確認有存後端）。
4. 點該筆的垃圾桶圖示 → 消失。
5. 不同住宿卡片（不同地址）的註記彼此獨立、不會互相出現。

- [ ] **Step 6: Commit**

```bash
git add src/components/LodgingNotes.tsx src/components/Lodging.tsx
git commit -m "feat: add lodging notes UI to lodging cards"
```

---

## 完成後

依 `docs/Zeabur部署教學.md` 建 Docker image 推 ghcr.io、按「重啟目前版本」上線（**不是 git push**），並更新 `docs/進度.md` 記錄本次改動（住房資訊區塊新增匿名註記功能）。

## Self-Review 註記

- **Spec coverage:** 資料表、三支 API、address 當 key、匿名自由文字、只增刪不編輯、卡片底部展開式 UI、安全性提醒小灰字（選配已納入 Step 1 元件）、驗證方式（lint+curl+瀏覽器）——皆有對應任務。
- **Placeholder scan:** 無 TBD/TODO；所有程式碼與指令皆完整。
- **Type consistency:** 後端回傳欄位 `{ id, lodging_key, text, timestamp }` 與前端 `Note` interface 一致；POST body `{ key, text }` 前後端一致；key 前端 `encodeURIComponent`、後端 `req.params.key` 對應。
