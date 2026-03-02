import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import { fileURLToPath } from "url";
import "dotenv/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db: any;
try {
  const dbPath = path.join(process.cwd(), "claims.db");
  db = new Database(dbPath);
  console.log(`[DATABASE] Connected to SQLite at ${dbPath}`);
} catch (err) {
  console.error("[DATABASE] Failed to connect to SQLite. Using in-memory database fallback.", err);
  db = new Database(":memory:");
}

const JWT_SECRET = process.env.JWT_SECRET || "claim-guardian-secret-key-123";

// Initialize DB
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT,
    full_name TEXT,
    address TEXT,
    phone TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS average_prices (
    code TEXT PRIMARY KEY,
    description TEXT,
    avg_price REAL
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS audits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    filename TEXT,
    total_savings REAL,
    items_flagged INTEGER,
    total_items INTEGER,
    results_json TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )
`);

// Migration: Add user_id to audits if it doesn't exist (for existing DBs)
try {
  db.prepare("SELECT user_id FROM audits LIMIT 1").get();
} catch (e) {
  db.exec("ALTER TABLE audits ADD COLUMN user_id INTEGER REFERENCES users(id)");
}

// Seed some sample data if empty
const count = db.prepare("SELECT count(*) as count FROM average_prices").get() as { count: number };
if (count.count === 0) {
  const insert = db.prepare("INSERT INTO average_prices (code, description, avg_price) VALUES (?, ?, ?)");
  const seedData = [
    ["99213", "Office Visit (Level 3)", 120.00],
    ["99214", "Office Visit (Level 4)", 180.00],
    ["80053", "Comprehensive Metabolic Panel", 45.00],
    ["85025", "Complete Blood Count", 30.00],
    ["71045", "Chest X-Ray", 95.00],
    ["93000", "EKG", 65.00],
    ["J0696", "Ceftriaxone Injection", 25.00],
  ];
  for (const row of seedData) {
    insert.run(row[0], row[1], row[2]);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));
  app.use(cookieParser());

  // Logging middleware
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });

  // Auth Middleware
  const authenticate = (req: any, res: any, next: any) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch (err) {
      res.status(401).json({ error: "Invalid token" });
    }
  };

  // Auth Routes
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { email, password, full_name } = req.body;
      const hashedPassword = await bcrypt.hash(password, 10);
      const insert = db.prepare("INSERT INTO users (email, password, full_name) VALUES (?, ?, ?)");
      const info = insert.run(email, hashedPassword, full_name);
      
      const token = jwt.sign({ id: info.lastInsertRowid, email }, JWT_SECRET);
      res.cookie("token", token, { httpOnly: true, secure: true, sameSite: 'none' });
      res.json({ id: info.lastInsertRowid, email, full_name });
    } catch (err: any) {
      if (err.message.includes("UNIQUE constraint failed")) {
        return res.status(400).json({ error: "Email already exists" });
      }
      res.status(500).json({ error: "Signup failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      const token = jwt.sign({ id: user.id, email }, JWT_SECRET);
      res.cookie("token", token, { httpOnly: true, secure: true, sameSite: 'none' });
      res.json({ id: user.id, email, full_name: user.full_name, address: user.address, phone: user.phone });
    } catch (err) {
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    res.clearCookie("token");
    res.json({ success: true });
  });

  app.get("/api/auth/me", authenticate, (req: any, res) => {
    const user = db.prepare("SELECT id, email, full_name, address, phone FROM users WHERE id = ?").get(req.user.id) as any;
    res.json(user);
  });

  app.put("/api/auth/profile", authenticate, (req: any, res) => {
    try {
      const { full_name, address, phone } = req.body;
      db.prepare("UPDATE users SET full_name = ?, address = ?, phone = ? WHERE id = ?")
        .run(full_name, address, phone, req.user.id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Update failed" });
    }
  });

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", env: process.env.NODE_ENV, database: "sqlite" });
  });

  app.get("/api/prices", (req, res) => {
    try {
      const prices = db.prepare("SELECT * FROM average_prices").all();
      res.json(prices);
    } catch (err) {
      res.status(500).json({ error: "Database error" });
    }
  });

  app.get("/api/audits", authenticate, (req: any, res) => {
    try {
      const audits = db.prepare("SELECT * FROM audits WHERE user_id = ? ORDER BY created_at DESC").all(req.user.id);
      res.json(audits);
    } catch (err) {
      res.status(500).json({ error: "Database error" });
    }
  });

  app.post("/api/audits", authenticate, (req: any, res) => {
    try {
      const { filename, total_savings, items_flagged, total_items, results } = req.body;
      const insert = db.prepare(`
        INSERT INTO audits (user_id, filename, total_savings, items_flagged, total_items, results_json)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      const info = insert.run(req.user.id, filename, total_savings, items_flagged, total_items, JSON.stringify(results));
      res.json({ id: info.lastInsertRowid });
    } catch (err) {
      res.status(500).json({ error: "Database error" });
    }
  });

  // Catch-all for unmatched API routes to prevent HTML responses
  app.use("/api", (req, res) => {
    console.warn(`[SERVER] 404 API Route: ${req.method} ${req.url}`);
    res.status(404).json({ 
      error: "API endpoint not found", 
      method: req.method, 
      path: req.originalUrl 
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === 'true' ? false : { overlay: false },
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const port = Number(process.env.PORT) || 3000;
  // Only listen if we're not running as a Vercel function
  if (process.env.VERCEL !== '1') {
    app.listen(port, "0.0.0.0", () => {
      console.log(`[SERVER] Running on http://0.0.0.0:${port}`);
      console.log(`[SERVER] NODE_ENV: ${process.env.NODE_ENV}`);
    });
  }

  return app;
}

const appPromise = startServer().catch(err => {
  console.error("[SERVER] Failed to start:", err);
});

// For Vercel compatibility
export default async (req: any, res: any) => {
  const app = await appPromise;
  if (!app) {
    res.status(500).send("Server failed to initialize");
    return;
  }
  return app(req, res);
};
