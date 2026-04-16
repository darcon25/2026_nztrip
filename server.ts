import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, 'uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// 配置 multer 儲存
const upload = multer({
  storage: multer.memoryStorage(), // 儲存在記憶體中，後面手動保存到檔案
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
});

const db = new Database("comments.db");

// Initialize database - 檢查並遷移舊表
try {
  // 檢查 comments 表是否存在並修復結構
  const tableInfo = db.prepare("PRAGMA table_info(comments)").all();
  const hasAuthorColumn = tableInfo.some(col => col.name === 'author');
  const hasAttachmentUrlColumn = tableInfo.some(col => col.name === 'attachment_url');
  const hasAttachmentNameColumn = tableInfo.some(col => col.name === 'attachment_name');
  const hasAttachmentTypeColumn = tableInfo.some(col => col.name === 'attachment_type');
  
  if (tableInfo.length > 0) {
    // 舊表存在，但可能缺少欄位
    console.log('Checking existing comments table structure...');
    if (!hasAuthorColumn) {
      console.log('Migrating comments table: add author column...');
      db.exec(`ALTER TABLE comments ADD COLUMN author TEXT DEFAULT 'Anonymous';`);
    }
    if (!hasAttachmentUrlColumn) {
      console.log('Migrating comments table: add attachment_url column...');
      db.exec(`ALTER TABLE comments ADD COLUMN attachment_url TEXT;`);
    }
    if (!hasAttachmentNameColumn) {
      console.log('Migrating comments table: add attachment_name column...');
      db.exec(`ALTER TABLE comments ADD COLUMN attachment_name TEXT;`);
    }
    if (!hasAttachmentTypeColumn) {
      console.log('Migrating comments table: add attachment_type column...');
      db.exec(`ALTER TABLE comments ADD COLUMN attachment_type TEXT;`);
    }
  } else {
    // 表不存在，創建新表
    console.log('Creating new comments table...');
    db.exec(`
      CREATE TABLE comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        day_id INTEGER NOT NULL,
        item_idx INTEGER NOT NULL,
        text TEXT,
        author TEXT NOT NULL,
        attachment_url TEXT,
        attachment_name TEXT,
        attachment_type TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Comments table created');
  }
} catch (error) {
  console.error('Database initialization error:', error);
  // 創建新表作為後備方案
  db.exec(`
    DROP TABLE IF EXISTS comments;
    CREATE TABLE comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      day_id INTEGER NOT NULL,
      item_idx INTEGER NOT NULL,
      text TEXT,
      author TEXT NOT NULL,
      attachment_url TEXT,
      attachment_name TEXT,
      attachment_type TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function startServer() {
  const app = express();
  const PORT = 3007;

  // 增加檔案上傳限制（Base64 編碼會增加約 33% 的大小）
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));
  app.use('/uploads', express.static(uploadsDir));

  // API Routes
  app.get("/api/comments/:dayId/:itemIdx", (req, res) => {
    const { dayId, itemIdx } = req.params;
    const stmt = db.prepare("SELECT * FROM comments WHERE day_id = ? AND item_idx = ? ORDER BY timestamp DESC");
    const comments = stmt.all(dayId, itemIdx);
    res.json(comments);
  });

  app.post("/api/comments", upload.single('file'), async (req, res) => {
    console.log('Received comment request. Body keys:', Object.keys(req.body));
    console.log('Body content:', JSON.stringify(req.body));
    console.log('File info:', req.file ? { fieldname: req.file.fieldname, originalname: req.file.originalname, mimetype: req.file.mimetype, size: req.file.size } : 'no file');
    const { dayId, itemIdx, text, author } = req.body;
    const file = req.file;
    
    console.log('Extracted fields:', { dayId, itemIdx, author, text, hasFile: !!file });
    
    // 允許純文字留言或純附件留言
    if ((!text || (typeof text === 'string' && text.trim() === "")) && !file) {
      console.log('Validation failed: no text and no file');
      return res.status(400).json({ error: "Comment text or attachment is required" });
    }
    if (!author || (typeof author === 'string' && author.trim() === "")) {
      console.log('Validation failed: no author');
      return res.status(400).json({ error: "Author is required" });
    }

    let attachmentUrl = null;
    let savedAttachmentName = null;
    let savedAttachmentType = null;

    if (file) {
      console.log('Processing file upload:', { fileName: file.originalname, mimeType: file.mimetype, fileSize: file.size });
      
      // 檢查副檔名
      const allowedExtensions = ['.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg'];
      const lowerName = file.originalname.toLowerCase();
      const hasValidExtension = allowedExtensions.some(ext => lowerName.endsWith(ext));

      console.log('File validation:', { fileName: file.originalname, hasValidExtension });
      
      if (!hasValidExtension) {
        return res.status(400).json({ error: 'Unsupported file type. Allowed: PDF, Word, PNG, JPG' });
      }

      // 保存檔案
      const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
      const fileName = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${safeName}`;
      const filePath = path.join(uploadsDir, fileName);

      console.log('Saving file to disk:', { filePath, fileSize: file.size });
      
      try {
        await fs.promises.writeFile(filePath, file.buffer);
        attachmentUrl = `http://localhost:3007/uploads/${fileName}`;
        savedAttachmentName = file.originalname;
        savedAttachmentType = file.mimetype;
        console.log('File saved successfully:', { fileName, attachmentUrl });
      } catch (error) {
        console.error('Failed to save file:', error);
        return res.status(500).json({ error: 'Unable to save file' });
      }
    }

    console.log('Inserting comment to DB:', { dayId, itemIdx, author, attachmentUrl, savedAttachmentName });
    const stmt = db.prepare("INSERT INTO comments (day_id, item_idx, text, author, attachment_url, attachment_name, attachment_type) VALUES (?, ?, ?, ?, ?, ?, ?)");
    const info = stmt.run(dayId, itemIdx, text || '', author, attachmentUrl, savedAttachmentName, savedAttachmentType);
    const responseData = { id: info.lastInsertRowid, day_id: dayId, item_idx: itemIdx, text: text || '', author, attachment_url: attachmentUrl, attachment_name: savedAttachmentName, attachment_type: savedAttachmentType, timestamp: new Date().toISOString() };
    console.log('Comment response:', responseData);
    res.json(responseData);
  });

  app.delete("/api/comments/:id", (req, res) => {
    const { id } = req.params;
    const stmt = db.prepare("DELETE FROM comments WHERE id = ?");
    stmt.run(id);
    res.json({ success: true });
  });

  // API endpoint to resolve Google Maps link and extract place info
  app.post("/api/maps/resolve", async (req, res) => {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    try {
      // Resolve short links by following the redirect
      let finalUrl = url;
      let placeName = "Google Maps 地點";
      let coords = null;

      // For short links (maps.app.goo.gl), we need to follow the redirect
      if (url.includes('maps.app.goo.gl')) {
        try {
          const response = await fetch(url, {
            redirect: 'follow',
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          });
          finalUrl = response.url;
          console.log('Resolved short link to:', finalUrl);
        } catch (error) {
          console.error('Failed to resolve short link:', error);
          // Continue with the original URL
        }
      }

      // Extract place name and coordinates from the final URL
      // Full URL format: https://www.google.com/maps/place/Place+Name/@lat,lng,...
      const placeMatch = finalUrl.match(/\/place\/([^/@?&]+)/);
      if (placeMatch) {
        placeName = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
      }

      // Extract coordinates from /@lat,lng or !3d/!4d format
      const coordMatch = finalUrl.match(/@([\-\d.]+),([\-\d.]+)/);
      if (coordMatch) {
        coords = {
          lat: parseFloat(coordMatch[1]),
          lng: parseFloat(coordMatch[2])
        };
      } else {
        const coordMatch2 = finalUrl.match(/!3d([\-\d.]+)!4d([\-\d.]+)/);
        if (coordMatch2) {
          coords = {
            lat: parseFloat(coordMatch2[1]),
            lng: parseFloat(coordMatch2[2])
          };
        }
      }

      console.log('Maps info extracted:', { placeName, coords });

      res.json({ 
        url: finalUrl,
        placeName: placeName,
        coords: coords
      });
    } catch (error) {
      console.error('Error resolving maps URL:', error);
      res.status(500).json({ 
        error: "Failed to resolve maps URL",
        url: url,
        placeName: "Google Maps 地點"
      });
    }
  });

  // Vite middleware for development - DISABLED when running separate frontend dev server
  // For development, run `npx vite` in one terminal and `npx tsx server.ts` in another
  // For production, build with `npm run build` and this serves the static files
  if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  } else {
    // Development mode - just provide API
    app.get("/", (req, res) => {
      res.json({ message: "API running. Frontend should be served by Vite dev server." });
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
