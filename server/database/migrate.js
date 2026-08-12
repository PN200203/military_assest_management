const pool = require("../config/db");

const migrate = async () => {
  try {
    console.log("Starting database migration...");

    // ==========================================
    // BASES TABLE
    // ==========================================

    await pool.query(`
      CREATE TABLE IF NOT EXISTS bases (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        location VARCHAR(150) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("✓ bases table created successfully.");

    // ==========================================
    // USERS TABLE
    // ==========================================

    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        base_id INTEGER REFERENCES bases(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("✓ users table created successfully.");

    // ==========================================
    // CREATE INDEX FOR EMAIL
    // ==========================================

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email
      ON users(email);
    `);

    console.log("✓ users email index created successfully.");

    console.log("");
    console.log("=================================");
    console.log("DATABASE MIGRATION COMPLETED");
    console.log("=================================");

  } catch (error) {
    console.error("Migration error:", error);
  } finally {
    await pool.end();
  }
};

migrate();