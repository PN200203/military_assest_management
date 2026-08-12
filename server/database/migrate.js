const pool = require("../config/db");

const migrate = async () => {
  try {
    console.log("Starting complete database migration...");

    // ==========================================
    // 1. BASES
    // ==========================================

    await pool.query(`
      CREATE TABLE IF NOT EXISTS bases (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        location VARCHAR(150) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("✓ bases table ready");

    // ==========================================
    // 2. USERS
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

    console.log("✓ users table ready");

    // ==========================================
    // 3. EQUIPMENT TYPES
    // ==========================================

    await pool.query(`
      CREATE TABLE IF NOT EXISTS equipment_types (
        id SERIAL PRIMARY KEY,
        name VARCHAR(150) NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("✓ equipment_types table ready");

    // ==========================================
    // 4. ASSETS
    // ==========================================

    await pool.query(`
      CREATE TABLE IF NOT EXISTS assets (
        id SERIAL PRIMARY KEY,
        base_id INTEGER NOT NULL
          REFERENCES bases(id)
          ON DELETE CASCADE,

        equipment_type_id INTEGER NOT NULL
          REFERENCES equipment_types(id)
          ON DELETE CASCADE,

        asset_name VARCHAR(200) NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT assets_quantity_non_negative
          CHECK (quantity >= 0),

        CONSTRAINT unique_base_equipment
          UNIQUE (base_id, equipment_type_id)
      );
    `);

    console.log("✓ assets table ready");

    // ==========================================
    // 5. OPENING BALANCES
    // ==========================================

    await pool.query(`
      CREATE TABLE IF NOT EXISTS opening_balances (
        id SERIAL PRIMARY KEY,

        base_id INTEGER NOT NULL
          REFERENCES bases(id)
          ON DELETE CASCADE,

        equipment_type_id INTEGER NOT NULL
          REFERENCES equipment_types(id)
          ON DELETE CASCADE,

        quantity INTEGER NOT NULL DEFAULT 0,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT opening_balance_quantity_non_negative
          CHECK (quantity >= 0),

        CONSTRAINT unique_opening_balance
          UNIQUE (base_id, equipment_type_id)
      );
    `);

    console.log("✓ opening_balances table ready");

    // ==========================================
    // 6. PURCHASES
    // ==========================================

    await pool.query(`
      CREATE TABLE IF NOT EXISTS purchases (
        id SERIAL PRIMARY KEY,

        base_id INTEGER NOT NULL
          REFERENCES bases(id)
          ON DELETE RESTRICT,

        equipment_type_id INTEGER NOT NULL
          REFERENCES equipment_types(id)
          ON DELETE RESTRICT,

        quantity INTEGER NOT NULL,

        purchase_date TIMESTAMP NOT NULL
          DEFAULT CURRENT_TIMESTAMP,

        reference_number VARCHAR(100),

        remarks TEXT,

        created_by INTEGER
          REFERENCES users(id)
          ON DELETE SET NULL,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT purchases_quantity_positive
          CHECK (quantity > 0)
      );
    `);

    console.log("✓ purchases table ready");

    // ==========================================
    // 7. TRANSFERS
    // ==========================================

    await pool.query(`
      CREATE TABLE IF NOT EXISTS transfers (
        id SERIAL PRIMARY KEY,

        from_base_id INTEGER
          REFERENCES bases(id)
          ON DELETE RESTRICT,

        to_base_id INTEGER
          REFERENCES bases(id)
          ON DELETE RESTRICT,

        equipment_type_id INTEGER NOT NULL
          REFERENCES equipment_types(id)
          ON DELETE RESTRICT,

        quantity INTEGER NOT NULL,

        transfer_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        status VARCHAR(50) NOT NULL DEFAULT 'COMPLETED',

        remarks TEXT,

        created_by INTEGER
          REFERENCES users(id)
          ON DELETE SET NULL,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT transfers_quantity_positive
          CHECK (quantity > 0),

        CONSTRAINT different_transfer_bases
          CHECK (
            from_base_id IS NULL
            OR to_base_id IS NULL
            OR from_base_id <> to_base_id
          )
      );
    `);

    console.log("✓ transfers table ready");

    // ==========================================
    // 8. ASSIGNMENTS
    // ==========================================

    await pool.query(`
      CREATE TABLE IF NOT EXISTS assignments (
        id SERIAL PRIMARY KEY,

        base_id INTEGER NOT NULL
          REFERENCES bases(id)
          ON DELETE RESTRICT,

        equipment_type_id INTEGER NOT NULL
          REFERENCES equipment_types(id)
          ON DELETE RESTRICT,

        personnel_name VARCHAR(200) NOT NULL,

        quantity INTEGER NOT NULL,

        assigned_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        assigned_by INTEGER
          REFERENCES users(id)
          ON DELETE SET NULL,

        remarks TEXT,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT assignments_quantity_positive
          CHECK (quantity > 0)
      );
    `);

    console.log("✓ assignments table ready");

    // ==========================================
    // 9. EXPENDITURES
    // ==========================================

    await pool.query(`
      CREATE TABLE IF NOT EXISTS expenditures (
        id SERIAL PRIMARY KEY,

        base_id INTEGER NOT NULL
          REFERENCES bases(id)
          ON DELETE RESTRICT,

        equipment_type_id INTEGER NOT NULL
          REFERENCES equipment_types(id)
          ON DELETE RESTRICT,

        quantity INTEGER NOT NULL,

        expenditure_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        reason TEXT,

        recorded_by INTEGER
          REFERENCES users(id)
          ON DELETE SET NULL,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT expenditures_quantity_positive
          CHECK (quantity > 0)
      );
    `);

    console.log("✓ expenditures table ready");

    // ==========================================
    // 10. AUDIT LOGS
    // ==========================================

    await pool.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,

        user_id INTEGER
          REFERENCES users(id)
          ON DELETE SET NULL,

        action VARCHAR(50) NOT NULL,

        entity_type VARCHAR(100) NOT NULL,

        entity_id INTEGER,

        details JSONB,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("✓ audit_logs table ready");

    // ==========================================
    // INDEXES
    // ==========================================

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email
      ON users(email);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_assets_base
      ON assets(base_id);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_assets_equipment
      ON assets(equipment_type_id);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_purchases_base
      ON purchases(base_id);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_transfers_from_base
      ON transfers(from_base_id);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_transfers_to_base
      ON transfers(to_base_id);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_assignments_base
      ON assignments(base_id);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_expenditures_base
      ON expenditures(base_id);
    `);

    console.log("✓ indexes ready");

    console.log("");
    console.log("========================================");
    console.log("DATABASE MIGRATION COMPLETED SUCCESSFULLY");
    console.log("========================================");

  } catch (error) {
    console.error("Migration error:", error);
  } finally {
    await pool.end();
  }
};

migrate();