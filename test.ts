import Database from "better-sqlite3";
import bcrypt from "bcryptjs";

async function test() {
  try {
    console.log("Testing better-sqlite3...");
    const db = new Database(":memory:");
    db.exec("CREATE TABLE users (id INTEGER PRIMARY KEY, email TEXT)");
    db.prepare("INSERT INTO users (email) VALUES (?)").run("test@test.com");
    console.log("SQLite works!");

    console.log("Testing bcryptjs...");
    const hash = await bcrypt.hash("password", 10);
    console.log("Bcrypt works! Hash:", hash);
  } catch (err) {
    console.error("Test failed:", err);
  }
}

test();
