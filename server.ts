import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PHOTO_CACHE_DIR = path.join(__dirname, ".photo-cache");

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
