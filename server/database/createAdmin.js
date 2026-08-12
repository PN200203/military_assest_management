const bcrypt = require("bcrypt");
const pool = require("../config/db");

const createAdmin = async () => {
  try {
    const name = "System Administrator";
    const email = "admin@military.com";
    const password = "Admin@123";

    // Hash the password
    const passwordHash = await bcrypt.hash(password, 12);

    // Check whether admin already exists
    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      // Update existing admin
      await pool.query(
        `
        UPDATE users
        SET
          name = $1,
          password_hash = $2,
          role = $3,
          base_id = $4
        WHERE email = $5
        `,
        [
          name,
          passwordHash,
          "ADMIN",
          null,
          email,
        ]
      );

      console.log("=================================");
      console.log("Admin user password reset successfully");
      console.log("Email:", email);
      console.log("Password:", password);
      console.log("Role: ADMIN");
      console.log("=================================");

      return;
    }

    // Create new admin if it doesn't exist
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
    console.error("Error creating/resetting admin:", error);
  } finally {
    await pool.end();
  }
};

createAdmin();