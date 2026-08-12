const pool = require("../config/db");

const seedData = async () => {
  try {
    console.log("Starting seed...");

    // ==========================================
    // CREATE BASES
    // ==========================================

    const bases = [
      {
        name: "Base Alpha",
        location: "Visakhapatnam",
      },
      {
        name: "Base Bravo",
        location: "Hyderabad",
      },
      {
        name: "Base Charlie",
        location: "Chennai",
      },
    ];

    for (const base of bases) {
      await pool.query(
        `
        INSERT INTO bases (name, location)
        VALUES ($1, $2)
        ON CONFLICT (name)
        DO NOTHING
        `,
        [base.name, base.location]
      );
    }

    console.log("Bases created successfully.");

    // ==========================================
    // DISPLAY BASES
    // ==========================================

    const result = await pool.query(`
      SELECT id, name, location
      FROM bases
      ORDER BY id
    `);

    console.table(result.rows);

    console.log("Seed completed successfully.");
  } catch (error) {
    console.error("Seed error:", error);
  } finally {
    await pool.end();
  }
};

seedData();