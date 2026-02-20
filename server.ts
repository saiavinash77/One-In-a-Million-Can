import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const db = new Database("catharsis.db");

// Initialize DB
db.exec(`
  CREATE TABLE IF NOT EXISTS tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT UNIQUE,
    word TEXT,
    content TEXT
  );
`);

const WORDS = [
  "EPHEMERAL", "SERENDIPITY", "LUMINESCENT", "ETHEREAL", "MELANCHOLY",
  "SOLITUDE", "RESONANCE", "PETRICHOR", "HALCYON", "SYMPHONY", 
  "LABYRINTH", "ENIGMATIC", "CELESTIAL", "INFINITE", "RADIANCE", 
  "HARMONY", "TRANQUIL", "BLOSSOM", "WHISPER", "EUPHORIA", 
  "NOSTALGIA", "PARADOX", "SPECTRUM", "VIBRANT", "ZENITH"
];

function getDailyWord(dateStr: string) {
  // Simple deterministic hash based on date string
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = ((hash << 5) - hash) + dateStr.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % WORDS.length;
  return WORDS[index];
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/daily-task", (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    const word = getDailyWord(today);
    const completed = db.prepare("SELECT * FROM tickets WHERE date = ?").get(today);
    res.json({ word, isCompleted: !!completed });
  });

  app.get("/api/stats", (req, res) => {
    const tickets = db.prepare("SELECT * FROM tickets ORDER BY date DESC").all();
    const totalTickets = tickets.length;
    
    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    const hasToday = tickets.some(t => t.date === today);
    const hasYesterday = tickets.some(t => t.date === yesterday);
    
    if (hasToday || hasYesterday) {
      let current = hasToday ? today : yesterday;
      let checkDate = new Date(current);
      
      while (true) {
        const dateStr = checkDate.toISOString().split('T')[0];
        const found = tickets.find(t => t.date === dateStr);
        if (found) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    }

    res.json({ totalTickets, streak, history: tickets });
  });

  app.post("/api/complete", (req, res) => {
    const { word, content } = req.body;
    const date = new Date().toISOString().split('T')[0];
    const targetWord = getDailyWord(date);

    if (word.toUpperCase() !== targetWord) {
      return res.status(400).json({ error: "Incorrect word" });
    }
    
    try {
      const stmt = db.prepare("INSERT INTO tickets (date, word, content) VALUES (?, ?, ?)");
      const result = stmt.run(date, word.toUpperCase(), content || "");
      res.json({ success: true, id: result.lastInsertRowid });
    } catch (e: any) {
      if (e.code === 'SQLITE_CONSTRAINT') {
        res.status(400).json({ error: "Already completed today" });
      } else {
        res.status(500).json({ error: e.message });
      }
    }
  });

  app.post("/api/reset", (req, res) => {
    try {
      db.prepare("DELETE FROM tickets").run();
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
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
    app.use(express.static(path.join(process.cwd(), "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(process.cwd(), "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
