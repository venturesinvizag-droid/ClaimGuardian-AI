import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import { fileURLToPath } from "url";
import "dotenv/config";
import { MockDatabase } from "./mock-db.ts";
import { DatabaseAdapter, PostgresAdapter, SQLiteAdapter, MockAdapter } from "./db-adapter.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db: DatabaseAdapter;

async function startServer() {
  const app = express();
  const PORT = 3000;
  const JWT_SECRET = process.env.JWT_SECRET || "claim-guardian-secret-key-123";

  // Initialize DB
  try {
    if (process.env.POSTGRES_URL) {
      console.log("[DATABASE] Connecting to Vercel Postgres...");
      db = new PostgresAdapter();
    } else if (process.env.VERCEL === '1' || process.env.NODE_ENV === 'production') {
      console.log("[DATABASE] Running in production/Vercel without Postgres, using MockDatabase");
      db = new MockAdapter(new MockDatabase());
    } else {
      try {
        const Database = (await import("better-sqlite3")).default;
        const dbPath = path.join(process.cwd(), "claims.db");
        db = new SQLiteAdapter(new Database(dbPath));
        console.log(`[DATABASE] Connected to SQLite at ${dbPath}`);
      } catch (sqliteErr) {
        console.warn("[DATABASE] SQLite failed, falling back to MockDatabase", sqliteErr);
        db = new MockAdapter(new MockDatabase());
      }
    }
  } catch (err) {
    console.error("[DATABASE] Critical failure during DB init, using MockDatabase", err);
    db = new MockAdapter(new MockDatabase());
  }

  // Initialize DB Tables
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE,
      password TEXT,
      full_name TEXT,
      address TEXT,
      phone TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS average_prices (
      code TEXT PRIMARY KEY,
      description TEXT,
      avg_price DECIMAL
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS audits (
      id SERIAL PRIMARY KEY,
      user_id INTEGER,
      filename TEXT,
      total_savings DECIMAL,
      items_flagged INTEGER,
      total_items INTEGER,
      results_json TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);

  // Migration: Add user_id to audits if it doesn't exist (for existing DBs)
  try {
    await db.get("SELECT user_id FROM audits LIMIT 1");
  } catch (e) {
    try {
      await db.exec("ALTER TABLE audits ADD COLUMN user_id INTEGER REFERENCES users(id)");
    } catch (alterErr) {
      // Ignore if column already exists or other issues
    }
  }

  // Seed some sample data if empty
  const countResult = await db.get<{ count: string | number }>("SELECT count(*) as count FROM average_prices");
  const count = Number(countResult?.count || 0);
  
  if (count === 0) {
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
      await db.run("INSERT INTO average_prices (code, description, avg_price) VALUES (?, ?, ?)", row);
    }
  }

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
      
      // Use RETURNING id for Postgres compatibility
      const query = process.env.POSTGRES_URL 
        ? "INSERT INTO users (email, password, full_name) VALUES (?, ?, ?) RETURNING id"
        : "INSERT INTO users (email, password, full_name) VALUES (?, ?, ?)";
        
      const info = await db.run(query, [email, hashedPassword, full_name]);
      const userId = info.lastInsertRowid;
      
      const token = jwt.sign({ id: userId, email }, JWT_SECRET);
      res.cookie("token", token, { httpOnly: true, secure: true, sameSite: 'none' });
      res.json({ id: userId, email, full_name });
    } catch (err: any) {
      console.error("[SIGNUP ERROR]", err);
      if (err?.message?.includes("UNIQUE constraint failed") || err?.message?.includes("duplicate key")) {
        return res.status(400).json({ error: "Email already exists" });
      }
      res.status(500).json({ error: "Signup failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await db.get<any>("SELECT * FROM users WHERE email = ?", [email]);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      if (!(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: "Invalid password" });
      }
      
      const token = jwt.sign({ id: user.id, email }, JWT_SECRET);
      res.cookie("token", token, { httpOnly: true, secure: true, sameSite: 'none' });
      res.json({ id: user.id, email, full_name: user.full_name, address: user.address, phone: user.phone });
    } catch (err) {
      console.error("[LOGIN ERROR]", err);
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    res.clearCookie("token");
    res.json({ success: true });
  });

  app.get("/api/auth/me", authenticate, async (req: any, res) => {
    try {
      const user = await db.get<any>("SELECT id, email, full_name, address, phone FROM users WHERE id = ?", [req.user.id]);
      res.json(user);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  app.put("/api/auth/profile", authenticate, async (req: any, res) => {
    try {
      const { full_name, address, phone } = req.body;
      await db.run("UPDATE users SET full_name = ?, address = ?, phone = ? WHERE id = ?", [full_name, address, phone, req.user.id]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Update failed" });
    }
  });

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      env: process.env.NODE_ENV, 
      database: process.env.POSTGRES_URL ? "postgres" : (db instanceof SQLiteAdapter ? "sqlite" : "mock")
    });
  });

  app.get("/api/prices", async (req, res) => {
    try {
      const prices = await db.all("SELECT * FROM average_prices");
      res.json(prices);
    } catch (err) {
      res.status(500).json({ error: "Database error" });
    }
  });

  app.get("/api/audits", authenticate, async (req: any, res) => {
    try {
      const audits = await db.all("SELECT * FROM audits WHERE user_id = ? ORDER BY created_at DESC", [req.user.id]);
      res.json(audits);
    } catch (err) {
      res.status(500).json({ error: "Database error" });
    }
  });

  app.post("/api/audits", authenticate, async (req: any, res) => {
    try {
      const { filename, total_savings, items_flagged, total_items, results } = req.body;
      
      const query = process.env.POSTGRES_URL
        ? `INSERT INTO audits (user_id, filename, total_savings, items_flagged, total_items, results_json)
           VALUES (?, ?, ?, ?, ?, ?) RETURNING id`
        : `INSERT INTO audits (user_id, filename, total_savings, items_flagged, total_items, results_json)
           VALUES (?, ?, ?, ?, ?, ?)`;
           
      const info = await db.run(query, [req.user.id, filename, total_savings, items_flagged, total_items, JSON.stringify(results)]);
      res.json({ id: info.lastInsertRowid });
    } catch (err) {
      console.error("[AUDIT SAVE ERROR]", err);
      res.status(500).json({ error: "Database error" });
    }
  });

  // Global Error Handler
  app.use((err: any, req: any, res: any, next: any) => {
    console.error("[SERVER ERROR]", err);
    res.status(500).json({ 
      error: "Internal Server Error", 
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
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

  const port = 3000;
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
  try {
    const app = await appPromise;
    if (!app) {
      res.status(500).json({ error: "Server failed to initialize" });
      return;
    }
    return app(req, res);
  } catch (err: any) {
    res.status(500).json({ error: "Server error", message: err.message });
  }
};
