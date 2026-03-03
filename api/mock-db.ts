export class MockDatabase {
  private tables: Record<string, any[]> = {
    users: [],
    average_prices: [],
    audits: []
  };
  private idCounters: Record<string, number> = {
    users: 1,
    audits: 1
  };

  constructor() {
    console.log("[DATABASE] Using in-memory mock database");
    this.seedPrices();
  }

  private seedPrices() {
    const seedData = [
      { code: "99213", description: "Office Visit (Level 3)", avg_price: 120.00 },
      { code: "99214", description: "Office Visit (Level 4)", avg_price: 180.00 },
      { code: "80053", description: "Comprehensive Metabolic Panel", avg_price: 45.00 },
      { code: "85025", description: "Complete Blood Count", avg_price: 30.00 },
      { code: "71045", description: "Chest X-Ray", avg_price: 95.00 },
      { code: "93000", description: "EKG", avg_price: 65.00 },
      { code: "J0696", description: "Ceftriaxone Injection", avg_price: 25.00 },
    ];
    this.tables.average_prices = seedData;
  }

  exec(sql: string) {
    // No-op for CREATE TABLE
  }

  prepare(sql: string) {
    return {
      get: (...params: any[]) => {
        if (sql.includes("SELECT * FROM users WHERE email = ?")) {
          return this.tables.users.find(u => u.email === params[0]);
        }
        if (sql.includes("SELECT id, email, full_name, address, phone FROM users WHERE id = ?")) {
          return this.tables.users.find(u => u.id === params[0]);
        }
        if (sql.includes("SELECT count(*) as count FROM average_prices")) {
          return { count: this.tables.average_prices.length };
        }
        if (sql.includes("SELECT user_id FROM audits LIMIT 1")) {
          return this.tables.audits[0];
        }
        return null;
      },
      all: (...params: any[]) => {
        if (sql.includes("SELECT * FROM average_prices")) {
          return this.tables.average_prices;
        }
        if (sql.includes("SELECT * FROM audits WHERE user_id = ?")) {
          return this.tables.audits.filter(a => a.user_id === params[0]).sort((a, b) => b.created_at.localeCompare(a.created_at));
        }
        return [];
      },
      run: (...params: any[]) => {
        if (sql.includes("INSERT INTO users")) {
          const [email, password, full_name] = params;
          if (this.tables.users.some(u => u.email === email)) {
            throw new Error("UNIQUE constraint failed: users.email");
          }
          const id = this.idCounters.users++;
          this.tables.users.push({ id, email, password, full_name, address: null, phone: null, created_at: new Date().toISOString() });
          return { lastInsertRowid: id };
        }
        if (sql.includes("UPDATE users SET full_name = ?, address = ?, phone = ? WHERE id = ?")) {
          const [full_name, address, phone, id] = params;
          const user = this.tables.users.find(u => u.id === id);
          if (user) {
            user.full_name = full_name;
            user.address = address;
            user.phone = phone;
          }
          return { changes: 1 };
        }
        if (sql.includes("INSERT INTO average_prices")) {
          const [code, description, avg_price] = params;
          this.tables.average_prices.push({ code, description, avg_price });
          return { changes: 1 };
        }
        if (sql.includes("INSERT INTO audits")) {
          const [user_id, filename, total_savings, items_flagged, total_items, results_json] = params;
          const id = this.idCounters.audits++;
          this.tables.audits.push({ id, user_id, filename, total_savings, items_flagged, total_items, results_json, created_at: new Date().toISOString() });
          return { lastInsertRowid: id };
        }
        return { changes: 0 };
      }
    };
  }
}
