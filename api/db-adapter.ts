import { db } from "@vercel/postgres";
import path from "path";

export interface DatabaseAdapter {
  exec(query: string): Promise<void>;
  get<T>(query: string, params?: any[]): Promise<T | undefined>;
  all<T>(query: string, params?: any[]): Promise<T[]>;
  run(query: string, params?: any[]): Promise<{ lastInsertRowid?: number | string; changes?: number }>;
}

export class PostgresAdapter implements DatabaseAdapter {
  async exec(query: string) {
    await db.query(query);
  }

  async get<T>(query: string, params: any[] = []): Promise<T | undefined> {
    const pgQuery = this.convertQuery(query);
    const { rows } = await db.query(pgQuery, params);
    return rows[0] as T;
  }

  async all<T>(query: string, params: any[] = []): Promise<T[]> {
    const pgQuery = this.convertQuery(query);
    const { rows } = await db.query(pgQuery, params);
    return rows as T[];
  }

  async run(query: string, params: any[] = []) {
    const pgQuery = this.convertQuery(query);
    const result = await db.query(pgQuery, params);
    return { 
      changes: result.rowCount || 0,
      lastInsertRowid: result.rows && result.rows.length > 0 ? (result.rows[0] as any).id : undefined
    };
  }

  private convertQuery(query: string): string {
    // Convert SQLite '?' to Postgres '$1, $2...'
    let index = 1;
    let converted = query.replace(/\?/g, () => `$${index++}`);
    // Convert SQLite specific syntax if needed
    converted = converted.replace(/DATETIME DEFAULT CURRENT_TIMESTAMP/gi, "TIMESTAMP DEFAULT CURRENT_TIMESTAMP");
    converted = converted.replace(/INTEGER PRIMARY KEY AUTOINCREMENT/gi, "SERIAL PRIMARY KEY");
    converted = converted.replace(/REAL/gi, "DECIMAL");
    return converted;
  }
}

export class SQLiteAdapter implements DatabaseAdapter {
  private db: any;

  constructor(db: any) {
    this.db = db;
  }

  async exec(query: string) {
    this.db.exec(query);
  }

  async get<T>(query: string, params: any[] = []): Promise<T | undefined> {
    return this.db.prepare(query).get(...params) as T;
  }

  async all<T>(query: string, params: any[] = []): Promise<T[]> {
    return this.db.prepare(query).all(...params) as T[];
  }

  async run(query: string, params: any[] = []) {
    const info = this.db.prepare(query).run(...params);
    return { lastInsertRowid: info.lastInsertRowid, changes: info.changes };
  }
}

export class MockAdapter implements DatabaseAdapter {
  private db: any;

  constructor(db: any) {
    this.db = db;
  }

  async exec(query: string) {
    this.db.exec(query);
  }

  async get<T>(query: string, params: any[] = []): Promise<T | undefined> {
    return this.db.prepare(query).get(...params) as T;
  }

  async all<T>(query: string, params: any[] = []): Promise<T[]> {
    return this.db.prepare(query).all(...params) as T[];
  }

  async run(query: string, params: any[] = []) {
    const info = this.db.prepare(query).run(...params);
    return { lastInsertRowid: info.lastInsertRowid, changes: info.changes };
  }
}
