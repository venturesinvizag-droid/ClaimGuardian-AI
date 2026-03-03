import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import { GoogleGenAI, Type } from "@google/genai";

const SYSTEM_INSTRUCTION = `Role: You are an expert Medical Billing and Claims Auditor.

Task: Your objective is to analyze medical claim descriptions and identify potential billing errors, missing information, or compliance risks.

Context: You are the backend AI assistant for ClaimGuardian, a medical audits management platform. Users will submit text snippets of claim notes or billing codes. 

Constraints: 
* Only provide analysis based on standard medical billing practices.
* Do not provide medical advice or diagnose conditions.
* If the input is unrelated to medical claims, respond with: {"error": "Invalid input. Please provide medical claim data."}
* Do not include Markdown formatting blocks (like \`\`\`json) in your final output.

Output Format: Return your response strictly as a JSON object with the following keys:
* "status": (String) "approved", "flagged", or "rejected"
* "confidence_score": (Number) 1-100
* "flags": (Array of Strings) List of identified issues, if any.
* "recommendation": (String) A brief next-step action.`;

// ... existing imports ...
import { fileURLToPath } from "url";
import "dotenv/config";
import { MockDatabase } from "./mock-db.js";
import { DatabaseAdapter, PostgresAdapter, SQLiteAdapter, MockAdapter } from "./db-adapter.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || "claim-guardian-secret-key-123";

let db: DatabaseAdapter;
let dbInitialized = false;
let dbInitializationPromise: Promise<void> | null = null;

async function initializeDatabase() {
  if (dbInitialized) return;
  if (dbInitializationPromise) return dbInitializationPromise;

  dbInitializationPromise = (async () => {
    try {
      // Check if Postgres URL is present and looks valid
      const postgresUrl = process.env.POSTGRES_URL;
      const isPostgresValid = postgresUrl && (postgresUrl.startsWith('postgres://') || postgresUrl.startsWith('postgresql://'));

      if (isPostgresValid) {
        console.log("[DATABASE] Connecting to Vercel Postgres...");
        db = new PostgresAdapter();
      } else if (process.env.VERCEL === '1' || process.env.NODE_ENV === 'production') {
        console.log("[DATABASE] Running in production/Vercel without valid Postgres, using MockDatabase");
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

      console.log(`[DATABASE] Using adapter: ${db.constructor.name}`);

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
      
      // ... rest of table initializations ...
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
          hospital_name TEXT,
          total_savings DECIMAL,
          items_flagged INTEGER,
          total_items INTEGER,
          results_json TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(user_id) REFERENCES users(id)
        )
      `);

      // Migration: Add user_id to audits if it doesn't exist
      try {
        await db.get("SELECT user_id FROM audits LIMIT 1");
      } catch (e) {
        try {
          await db.exec("ALTER TABLE audits ADD COLUMN user_id INTEGER REFERENCES users(id)");
        } catch (alterErr) {
          // Ignore if column already exists
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
      
      dbInitialized = true;
    } catch (err) {
      console.error("[DATABASE] Critical failure during DB init", err);
      // FORCE fallback to mock if initialization fails (e.g. Invalid URL)
      db = new MockAdapter(new MockDatabase());
      dbInitialized = true;
    }
  })();

  return dbInitializationPromise;
}

const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// Middleware to ensure DB is initialized
app.use(async (req, res, next) => {
  if (req.path.startsWith('/api')) {
    try {
      await initializeDatabase();
    } catch (err) {
      console.error("[SERVER] Database initialization failed:", err);
      return next(err);
    }
  }
  next();
});

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

app.post("/api/analyze-claim", authenticate, async (req: any, res) => {
  try {
    const { claimText } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "Gemini API key not configured" });

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: claimText,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            status: { type: Type.STRING },
            confidence_score: { type: Type.NUMBER },
            flags: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            recommendation: { type: Type.STRING },
            error: { type: Type.STRING }
          },
          required: ["status", "confidence_score", "flags", "recommendation"]
        }
      },
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch (err) {
    console.error("[ANALYZE CLAIM ERROR]", err);
    res.status(500).json({ error: "Analysis failed" });
  }
});

app.post("/api/audit-bill", authenticate, async (req: any, res) => {
  try {
    const { imageData, mimeType } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "Gemini API key not configured" });

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: {
        parts: [
          {
            text: `Analyze this medical bill image. 
            1. Extract the hospital/provider details (name, address) and patient details (name, account number, date of service).
            2. Extract all line items/procedures.
            3. For each procedure:
               - Identify the CPT/HCPCS code (infer from description if missing).
               - Extract the billed price.
               - Estimate the Fair Market Value (FMV) based on typical Medicare or commercial insurance rates for this code.
               - Determine if the item is "overcharged" (billed price significantly > FMV).
               - Provide a short "analysis" explaining the finding (e.g., "Price is 3x Medicare rate" or "Possible unbundling").
            
            Return a JSON object matching the schema.`
          },
          {
            inlineData: {
              mimeType: mimeType,
              data: imageData
            }
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            hospitalName: { type: Type.STRING },
            hospitalAddress: { type: Type.STRING },
            accountNumber: { type: Type.STRING },
            dateOfService: { type: Type.STRING },
            patientName: { type: Type.STRING },
            procedures: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  code: { type: Type.STRING },
                  description: { type: Type.STRING },
                  price: { type: Type.NUMBER },
                  fairPrice: { type: Type.NUMBER },
                  isOvercharged: { type: Type.BOOLEAN },
                  analysis: { type: Type.STRING }
                },
                required: ["code", "description", "price", "fairPrice", "isOvercharged", "analysis"]
              }
            }
          },
          required: ["procedures"]
        }
      }
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch (err) {
    console.error("[AUDIT BILL ERROR]", err);
    res.status(500).json({ error: "Audit failed" });
  }
});

app.post("/api/generate-letter", authenticate, async (req: any, res) => {
  try {
    const { results, billDetails, userInfo } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "Gemini API key not configured" });

    const ai = new GoogleGenAI({ apiKey });
    const flaggedItems = results.filter((r: any) => r.isOvercharged);
    const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const prompt = `Write a professional medical bill dispute letter based on the following information:
    
    Current Date: ${currentDate}
    
    User Information:
    ${userInfo}
    
    Hospital/Provider Details:
    Name: ${billDetails.hospitalName}
    Address: ${billDetails.hospitalAddress}
    Account Number: ${billDetails.accountNumber}
    Date of Service: ${billDetails.dateOfService}
    
    Flagged Overcharges:
    ${flaggedItems.map((item: any) => `- ${item.description} (${item.code}): Billed $${item.price}, Fair Market Value $${item.avgPrice}. Analysis: ${item.analysis}`).join('\n')}
    
    The letter should be firm but professional, citing the fair market value findings and requesting a review and adjustment of the bill. 
    Return ONLY the text of the letter.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    res.json({ letter: response.text });
  } catch (err) {
    console.error("[GENERATE LETTER ERROR]", err);
    res.status(500).json({ error: "Letter generation failed" });
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
    const { filename, hospital_name, total_savings, items_flagged, total_items, results } = req.body;
    
    const query = process.env.POSTGRES_URL
      ? `INSERT INTO audits (user_id, filename, hospital_name, total_savings, items_flagged, total_items, results_json)
         VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id`
      : `INSERT INTO audits (user_id, filename, hospital_name, total_savings, items_flagged, total_items, results_json)
         VALUES (?, ?, ?, ?, ?, ?, ?)`;
         
    const info = await db.run(query, [req.user.id, filename, hospital_name, total_savings, items_flagged, total_items, JSON.stringify(results)]);
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

// Catch-all for unmatched API routes
app.use("/api", (req, res) => {
  res.status(404).json({ error: "API endpoint not found" });
});

// Vite/Static serving
async function setupFrontend() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === 'true' ? false : { overlay: false },
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
        ws: false, // Explicitly disable websocket to prevent connection errors in AI Studio
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
}

// Start server if not in Vercel
if (process.env.VERCEL !== '1') {
  setupFrontend().then(() => {
    const PORT = 3000;
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`[SERVER] Running on http://0.0.0.0:${PORT}`);
    });
  });
} else {
  // In Vercel, we still need to serve static files if it's a single deployment
  // But we don't await it at the top level to avoid blocking the export
  setupFrontend();
}

export default app;
