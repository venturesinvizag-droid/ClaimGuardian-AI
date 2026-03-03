import { sql } from "@vercel/postgres";
import path from "path";

export interface DatabaseAdapter {
  exec(query: string): Promise<void>;
  get<T>(query: string, params?: any[]): Promise<T | undefined>;
  all<T>(query: string, params?: any[]): Promise<T[]>;
  run(query: string, params?: any[]): Promise<{ lastInsertRowid?: number | string; changes?: number }>;
}

export class PostgresAdapter implements DatabaseAdapter {
  async exec(query: string) {
    // Postgres doesn't have a single 'exec' for multiple statements usually in this context,
    // but we can just run the query.
    await sql.query(query);
  }

  async get<T>(query: string, params: any[] = []): Promise<T | undefined> {
    const pgQuery = this.convertQuery(query);
    const { rows } = await sql.query(pgQuery, params);
    return rows[0] as T;
  }

  async all<T>(query: string, params: any[] = []): Promise<T[]> {
    const pgQuery = this.convertQuery(query);
    const { rows } = await sql.query(pgQuery, params);
    return rows as T[];
  }

  async run(query: string, params: any[] = []) {
    const pgQuery = this.convertQuery(query);
    const result = await sql.query(pgQuery, params);
    // Vercel Postgres / pg doesn't return lastInsertRowid directly in the same way as sqlite
    // We usually need RETURNING id in the query.
    // For simplicity in this adapter, we'll try to extract it if possible or just return changes.
    return { 
      changes: result.rowCount || 0,
      lastInsertRowid: (result.rows[0] as any)?.id 
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
