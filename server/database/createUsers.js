const bcrypt = require("bcrypt");
const pool = require("../config/db");

const createUsers = async () => {
  try {
    console.log("Creating users...");

    // ==========================================
    // GET BASE IDS
    // ==========================================

    const baseResult = await pool.query(`
      SELECT id, name
      FROM bases
      ORDER BY id
    `);

    if (baseResult.rows.length < 3) {
      throw new Error(
        "Please create the three bases first."
      );
    }

    const baseAlpha = baseResult.rows.find(
      (base) => base.name === "Base Alpha"
    );

    const baseBravo = baseResult.rows.find(
      (base) => base.name === "Base Bravo"
    );

    // ==========================================
    // USERS
    // ==========================================

    const users = [
      {
        name: "Alpha Base Commander",
        email: "commander@military.com",
        password: "Commander@123",
        role: "BASE_COMMANDER",
        baseId: baseAlpha.id,
      },
      {
        name: "Logistics Officer",
        email: "logistics@military.com",
        password: "Logistics@123",
        role: "LOGISTICS_OFFICER",
        baseId: baseBravo.id,
      },
    ];

    // ==========================================
    // CREATE USERS
    // ==========================================

    for (const user of users) {
      const existingUser = await pool.query(
        `
        SELECT id
        FROM users
        WHERE email = $1
        `,
        [user.email]
      );

      if (existingUser.rows.length > 0) {
        console.log(
          `${user.email} already exists.`
        );

        continue;
      }

      const passwordHash = await bcrypt.hash(
        user.password,
        12
      );

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
          user.name,
          user.email,
          passwordHash,
          user.role,
          user.baseId,
        ]
      );

      console.log(
        `${user.email} created successfully.`
      );
    }

    console.log("");
    console.log("=================================");
    console.log("USERS CREATED");
    console.log("=================================");
    console.log(
      "Commander: commander@military.com"
    );
    console.log(
      "Commander Password: Commander@123"
    );
    console.log("");
    console.log(
      "Logistics: logistics@military.com"
    );
    console.log(
      "Logistics Password: Logistics@123"
    );
    console.log("=================================");

  } catch (error) {
    console.error("User creation error:", error);
  } finally {
    await pool.end();
  }
};

createUsers();