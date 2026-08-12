const bcrypt = require("bcrypt");
const pool = require("../config/db");

const createAdmin = async () => {
  try {
    const name = "System Administrator";
    const email = "admin@military.com";
    const password = "Admin@123";

    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      console.log("Admin user already exists.");
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await pool.query(
      `
      INSERT INTO users
      (
        name,
        email,
        password_hash,
        role,
        base_id
      )
      VALUES
      ($1, $2, $3, $4, $5)
      `,
      [
        name,
        email,
        passwordHash,
        "ADMIN",
        null,
      ]
    );

    console.log("=================================");
    console.log("Admin user created successfully");
    console.log("Email:", email);
    console.log("Password:", password);
    console.log("Role: ADMIN");
    console.log("=================================");

  } catch (error) {
    console.error("Error creating admin:", error);
  } finally {
    await pool.end();
  }
};

createAdmin();