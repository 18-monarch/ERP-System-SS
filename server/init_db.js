require("dotenv").config();
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const pool = require("./config/db");

const initDb = async () => {
  try {
    console.log("🔧 Connecting to PostgreSQL database...");

    // Run schema — execute each statement separately
    const schemaPath = path.join(__dirname, "schema.sql");
    const schemaSql = fs.readFileSync(schemaPath, "utf8");
    
    // Remove all comments and split by semicolon
    const statements = schemaSql
      .replace(/--.*$/gm, "") // Remove single line comments
      .split(";")
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const stmt of statements) {
      try {
        console.log(`Executing statement: ${stmt.substring(0, 60)}...`);
        await pool.query(stmt);
      } catch (stmtErr) {
        console.error(`❌ Statement failed: ${stmtErr.message}`);
        throw stmtErr; 
      }
    }
    console.log("✅ Schema executed successfully.");

    // Seed default admin
    const adminEmail = "admin@shuttleslicers.com";
    const result = await pool.query(
      "SELECT id FROM public.users WHERE email = $1",
      [adminEmail]
    );

    if (result.rows.length === 0) {
      const hash = await bcrypt.hash("Admin@123", 10);
      await pool.query(
        "INSERT INTO public.users (name, email, password_hash, role) VALUES ($1, $2, $3, $4)",
        ["Admin", adminEmail, hash, "admin"]
      );
      console.log("✅ Admin seeded: admin@shuttleslicers.com / Admin@123");
    } else {
      console.log("ℹ️  Admin already exists — skipping seed.");
    }

    process.exit(0);
  } catch (err) {
    console.error("❌ Database initialization failed:", err.message);
    process.exit(1);
  }
};

initDb();
