const pool = require("../config/db");

const seedInventory = async () => {
  try {
    console.log("Starting inventory seed...");

    // ==========================================
    // EQUIPMENT TYPES
    // ==========================================

    const equipmentTypes = [
      {
        name: "Assault Rifle",
        description: "Standard infantry assault rifle",
      },
      {
        name: "Pistol",
        description: "Standard sidearm",
      },
      {
        name: "Machine Gun",
        description: "Heavy automatic weapon",
      },
      {
        name: "Ammunition",
        description: "Small arms ammunition",
      },
      {
        name: "Military Vehicle",
        description: "Military transport vehicle",
      },
    ];

    for (const equipment of equipmentTypes) {
      await pool.query(
        `
        INSERT INTO equipment_types
        (
          name,
          description
        )
        VALUES
        ($1, $2)
        ON CONFLICT (name)
        DO NOTHING
        `,
        [
          equipment.name,
          equipment.description,
        ]
      );
    }

    console.log("Equipment types created successfully.");

    // ==========================================
    // GET EQUIPMENT TYPE IDS
    // ==========================================

    const equipmentResult = await pool.query(`
      SELECT id, name
      FROM equipment_types
      ORDER BY id
    `);

    console.table(equipmentResult.rows);

    const getEquipmentId = (name) => {
      const equipment = equipmentResult.rows.find(
        (item) => item.name === name
      );

      if (!equipment) {
        throw new Error(
          `Equipment type not found: ${name}`
        );
      }

      return equipment.id;
    };

    // ==========================================
    // GET BASE IDS
    // ==========================================

    const baseResult = await pool.query(`
      SELECT id, name
      FROM bases
      ORDER BY id
    `);

    console.table(baseResult.rows);

    const getBaseId = (name) => {
      const base = baseResult.rows.find(
        (item) => item.name === name
      );

      if (!base) {
        throw new Error(
          `Base not found: ${name}`
        );
      }

      return base.id;
    };

    // ==========================================
    // ASSETS
    // ==========================================

    const assets = [
      {
        base: "Base Alpha",
        equipment: "Assault Rifle",
        quantity: 100,
      },
      {
        base: "Base Alpha",
        equipment: "Pistol",
        quantity: 50,
      },
      {
        base: "Base Alpha",
        equipment: "Machine Gun",
        quantity: 20,
      },
      {
        base: "Base Alpha",
        equipment: "Ammunition",
        quantity: 5000,
      },
      {
        base: "Base Alpha",
        equipment: "Military Vehicle",
        quantity: 10,
      },

      {
        base: "Base Bravo",
        equipment: "Assault Rifle",
        quantity: 80,
      },
      {
        base: "Base Bravo",
        equipment: "Pistol",
        quantity: 40,
      },
      {
        base: "Base Bravo",
        equipment: "Machine Gun",
        quantity: 15,
      },
      {
        base: "Base Bravo",
        equipment: "Ammunition",
        quantity: 4000,
      },
      {
        base: "Base Bravo",
        equipment: "Military Vehicle",
        quantity: 5,
      },

      {
        base: "Base Charlie",
        equipment: "Assault Rifle",
        quantity: 60,
      },
      {
        base: "Base Charlie",
        equipment: "Pistol",
        quantity: 30,
      },
      {
        base: "Base Charlie",
        equipment: "Machine Gun",
        quantity: 10,
      },
      {
        base: "Base Charlie",
        equipment: "Ammunition",
        quantity: 3000,
      },
      {
        base: "Base Charlie",
        equipment: "Military Vehicle",
        quantity: 8,
      },
    ];

    // ==========================================
    // INSERT ASSETS
    // ==========================================

    for (const asset of assets) {
      const baseId = getBaseId(asset.base);
      const equipmentTypeId = getEquipmentId(
        asset.equipment
      );

      await pool.query(
        `
        INSERT INTO assets
        (
          base_id,
          equipment_type_id,
          asset_name,
          quantity
        )
        VALUES
        ($1, $2, $3, $4)
        ON CONFLICT (base_id, equipment_type_id)
        DO UPDATE SET
          quantity = EXCLUDED.quantity,
          updated_at = CURRENT_TIMESTAMP
        `,
        [
          baseId,
          equipmentTypeId,
          asset.equipment,
          asset.quantity,
        ]
      );
    }

    console.log("Assets created successfully.");

    // ==========================================
    // DISPLAY ASSETS
    // ==========================================

    const assetResult = await pool.query(`
      SELECT
        a.id,
        b.name AS base_name,
        et.name AS equipment_type,
        a.asset_name,
        a.quantity
      FROM assets a
      JOIN bases b
        ON b.id = a.base_id
      JOIN equipment_types et
        ON et.id = a.equipment_type_id
      ORDER BY b.id, et.id
    `);

    console.table(assetResult.rows);

    console.log("");
    console.log("========================================");
    console.log("INVENTORY SEED COMPLETED SUCCESSFULLY");
    console.log("========================================");
  } catch (error) {
    console.error(
      "Inventory seed error:",
      error
    );
  } finally {
    await pool.end();
  }
};

seedInventory();