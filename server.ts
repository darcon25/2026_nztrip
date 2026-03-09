import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
