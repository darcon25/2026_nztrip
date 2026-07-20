import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import multer from "multer";
import sharp from "sharp";

dotenv.config({ path: ".env.local" });
dotenv.config();

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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PHOTO_CACHE_DIR = path.join(__dirname, ".photo-cache");

const UPLOAD_DIR = path.join(__dirname, ".uploads");
const UPLOAD_ORIGINALS_DIR = path.join(UPLOAD_DIR, "originals");
const UPLOAD_DISPLAY_DIR = path.join(UPLOAD_DIR, "display");
const UPLOAD_THUMBS_DIR = path.join(UPLOAD_DIR, "thumbs");
for (const dir of [UPLOAD_ORIGINALS_DIR, UPLOAD_DISPLAY_DIR, UPLOAD_THUMBS_DIR]) {
  fs.mkdirSync(dir, { recursive: true });
}

const db = new Database("comments.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    day_id INTEGER NOT NULL,
    item_idx INTEGER NOT NULL,
    text TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS place_photos (
    query TEXT PRIMARY KEY,
    file TEXT,
    updated DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`DROP TABLE IF EXISTS expenses`);
db.exec(`
  CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    payer_family TEXT NOT NULL,
    amount_nzd REAL NOT NULL,
    description TEXT NOT NULL,
    splits TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

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

const REACTION_EMOJIS = ["❤️", "😂", "😍", "👍", "🔥", "🥹"];

db.exec(`
  CREATE TABLE IF NOT EXISTS photo_reactions (
    photo_id INTEGER NOT NULL,
    emoji TEXT NOT NULL,
    count INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (photo_id, emoji)
  )
`);

db.exec(`
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
`);

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

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/comments/:dayId/:itemIdx", (req, res) => {
    const { dayId, itemIdx } = req.params;
    const stmt = db.prepare("SELECT * FROM comments WHERE day_id = ? AND item_idx = ? ORDER BY timestamp DESC");
    const comments = stmt.all(dayId, itemIdx);
    res.json(comments);
  });

  app.post("/api/comments", (req, res) => {
    const { dayId, itemIdx, text } = req.body;
    if (!text || text.trim() === "") {
      return res.status(400).json({ error: "Comment text is required" });
    }
    const stmt = db.prepare("INSERT INTO comments (day_id, item_idx, text) VALUES (?, ?, ?)");
    const info = stmt.run(dayId, itemIdx, text);
    res.json({ id: info.lastInsertRowid, day_id: dayId, item_idx: itemIdx, text, timestamp: new Date().toISOString() });
  });

  app.delete("/api/comments/:id", (req, res) => {
    const { id } = req.params;
    const stmt = db.prepare("DELETE FROM comments WHERE id = ?");
    stmt.run(id);
    res.json({ success: true });
  });

  app.get("/api/expenses", (req, res) => {
    const stmt = db.prepare("SELECT * FROM expenses ORDER BY timestamp DESC");
    const rows = stmt.all() as any[];
    const expenses = rows.map((row) => ({
      ...row,
      splits: JSON.parse(row.splits),
    }));
    res.json(expenses);
  });

  app.post("/api/expenses", (req, res) => {
    const { payerFamily, amountNzd, description, splits } = req.body;
    if (!payerFamily || typeof payerFamily !== "string") {
      return res.status(400).json({ error: "Payer family is required" });
    }
    if (typeof amountNzd !== "number" || !(amountNzd > 0)) {
      return res.status(400).json({ error: "Amount must be greater than 0" });
    }
    if (!description || description.trim() === "") {
      return res.status(400).json({ error: "Description is required" });
    }
    if (!splits || typeof splits !== "object" || Array.isArray(splits)) {
      return res.status(400).json({ error: "Splits must be an object" });
    }
    const entries = Object.entries(splits) as [string, unknown][];
    if (entries.length === 0) {
      return res.status(400).json({ error: "Splits must have at least one family" });
    }
    let sum = 0;
    for (const [, value] of entries) {
      if (typeof value !== "number" || !(value >= 0)) {
        return res.status(400).json({ error: "Split amounts must be non-negative numbers" });
      }
      sum += value;
    }
    if (Math.abs(sum - amountNzd) > 0.01) {
      return res.status(400).json({ error: "Split amounts must sum to the total amount" });
    }
    const stmt = db.prepare(
      "INSERT INTO expenses (payer_family, amount_nzd, description, splits) VALUES (?, ?, ?, ?)"
    );
    const info = stmt.run(payerFamily, amountNzd, description, JSON.stringify(splits));
    res.json({
      id: info.lastInsertRowid,
      payer_family: payerFamily,
      amount_nzd: amountNzd,
      description,
      splits,
      timestamp: new Date().toISOString(),
    });
  });

  app.delete("/api/expenses/:id", (req, res) => {
    const { id } = req.params;
    const stmt = db.prepare("DELETE FROM expenses WHERE id = ?");
    stmt.run(id);
    res.json({ success: true });
  });

  app.delete("/api/expenses", (req, res) => {
    db.prepare("DELETE FROM expenses").run();
    res.json({ success: true });
  });

  app.get("/api/place-photo", async (req, res) => {
    const query = typeof req.query.query === "string" ? req.query.query.trim() : "";
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!query || !apiKey) {
      return res.status(404).end();
    }

    const hash = crypto.createHash("md5").update(query).digest("hex");
    const filePath = path.join(PHOTO_CACHE_DIR, `${hash}.jpg`);

    try {
      const cached = db
        .prepare("SELECT file FROM place_photos WHERE query = ?")
        .get(query) as { file: string } | undefined;
      if (cached && fs.existsSync(filePath)) {
        res.setHeader("Content-Type", "image/jpeg");
        res.setHeader("Cache-Control", "public, max-age=2592000");
        return fs.createReadStream(filePath).pipe(res);
      }

      // Places API (New)：2025-03 起新專案無法啟用舊版 Places API，故用 v1 端點
      const searchResp = await fetch("https://places.googleapis.com/v1/places:searchText", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": "places.photos",
        },
        body: JSON.stringify({ textQuery: query, maxResultCount: 1 }),
      });
      const searchData = (await searchResp.json()) as any;
      const ref = searchData?.places?.[0]?.photos?.[0]?.name;
      if (!ref) {
        return res.status(404).end();
      }

      const photoUrl = `https://places.googleapis.com/v1/${ref}/media?maxWidthPx=800&key=${apiKey}`;
      const photoResp = await fetch(photoUrl);
      if (!photoResp.ok) {
        return res.status(404).end();
      }
      const buffer = Buffer.from(await photoResp.arrayBuffer());

      fs.mkdirSync(PHOTO_CACHE_DIR, { recursive: true });
      fs.writeFileSync(filePath, buffer);
      db.prepare(
        "INSERT OR REPLACE INTO place_photos (query, file, updated) VALUES (?, ?, CURRENT_TIMESTAMP)"
      ).run(query, filePath);

      res.setHeader("Content-Type", photoResp.headers.get("content-type") || "image/jpeg");
      res.setHeader("Cache-Control", "public, max-age=2592000");
      return res.end(buffer);
    } catch (err) {
      return res.status(404).end();
    }
  });

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
        const photoId = Number(info.lastInsertRowid);
        syncPhotoToN8n(photoId, file.path, file.originalname, file.mimetype);
        created.push({
          id: info.lastInsertRowid,
          original_name: file.originalname,
          mime_type: file.mimetype,
          size_bytes: file.size,
          has_thumb: !!thumbFile,
          has_display: !!displayFile,
          synced_at: null,
          timestamp: new Date().toISOString(),
          reactions: {},
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

    db.prepare("DELETE FROM photo_reactions WHERE photo_id = ?").run(req.params.id);
    db.prepare("DELETE FROM photos WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

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

  app.get("/api/cook-dishes", (req, res) => {
    const rows = db.prepare("SELECT * FROM cook_dishes").all();
    res.json(rows);
  });

  app.post("/api/cook-dishes", (req, res) => {
    const { dayId, meal, family, dish, note } = req.body;
    if (!dayId || typeof dayId !== "string") {
      return res.status(400).json({ error: "dayId is required" });
    }
    if (!meal || typeof meal !== "string") {
      return res.status(400).json({ error: "meal is required" });
    }
    if (!family || typeof family !== "string") {
      return res.status(400).json({ error: "family is required" });
    }
    if (typeof dish !== "string" || dish.trim() === "") {
      return res.status(400).json({ error: "dish is required" });
    }
    const cleanNote = typeof note === "string" && note.trim() !== "" ? note.trim() : null;
    db.prepare(
      `INSERT INTO cook_dishes (day_id, meal, family, dish, note, updated)
       VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(day_id, meal, family) DO UPDATE SET dish = ?, note = ?, updated = CURRENT_TIMESTAMP`
    ).run(dayId, meal, family, dish.trim(), cleanNote, dish.trim(), cleanNote);

    const row = db
      .prepare("SELECT * FROM cook_dishes WHERE day_id = ? AND meal = ? AND family = ?")
      .get(dayId, meal, family);
    res.json(row);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
