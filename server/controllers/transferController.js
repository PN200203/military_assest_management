const pool = require("../config/db");

// Create a transfer
const createTransfer = async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      from_base_id,
      to_base_id,
      equipment_type_id,
      quantity,
      transfer_date,
      remarks
    } = req.body;

    // Validate required fields
    if (
      !from_base_id ||
      !to_base_id ||
      !equipment_type_id ||
      !quantity
    ) {
      return res.status(400).json({
        success: false,
        message:
          "from_base_id, to_base_id, equipment_type_id and quantity are required"
      });
    }

    // Source and destination cannot be same
    if (Number(from_base_id) === Number(to_base_id)) {
      return res.status(400).json({
        success: false,
        message: "Source and destination bases must be different"
      });
    }

    if (Number(quantity) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be greater than zero"
      });
    }

    await client.query("BEGIN");

    // Check source asset
    const sourceResult = await client.query(
      `
      SELECT *
      FROM assets
      WHERE base_id = $1
      AND equipment_type_id = $2
      FOR UPDATE
      `,
      [from_base_id, equipment_type_id]
    );

    if (sourceResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "Asset not found at source base"
      });
    }

    const sourceAsset = sourceResult.rows[0];

    // Check available quantity
    if (Number(sourceAsset.quantity) < Number(quantity)) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message: "Insufficient asset quantity at source base",
        available_quantity: sourceAsset.quantity,
        requested_quantity: quantity
      });
    }

    // Reduce source quantity
    const updatedSource = await client.query(
      `
      UPDATE assets
      SET quantity = quantity - $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
      `,
      [quantity, sourceAsset.id]
    );

    // Check whether destination already has this equipment
    const destinationResult = await client.query(
      `
      SELECT *
      FROM assets
      WHERE base_id = $1
      AND equipment_type_id = $2
      FOR UPDATE
      `,
      [to_base_id, equipment_type_id]
    );

    let destinationAsset;

    if (destinationResult.rows.length > 0) {
      // Increase existing destination quantity
      const updatedDestination = await client.query(
        `
        UPDATE assets
        SET quantity = quantity + $1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
        `,
        [quantity, destinationResult.rows[0].id]
      );

      destinationAsset = updatedDestination.rows[0];
    } else {
      // Get equipment type name
      const equipmentResult = await client.query(
        `
        SELECT name
        FROM equipment_types
        WHERE id = $1
        `,
        [equipment_type_id]
      );

      if (equipmentResult.rows.length === 0) {
        await client.query("ROLLBACK");

        return res.status(404).json({
          success: false,
          message: "Equipment type not found"
        });
      }

      // Create destination asset
      const newDestination = await client.query(
        `
        INSERT INTO assets
        (
          base_id,
          equipment_type_id,
          asset_name,
          quantity
        )
        VALUES ($1, $2, $3, $4)
        RETURNING *
        `,
        [
          to_base_id,
          equipment_type_id,
          equipmentResult.rows[0].name,
          quantity
        ]
      );

      destinationAsset = newDestination.rows[0];
    }

    // Create transfer record
    const transferResult = await client.query(
      `
      INSERT INTO transfers
      (
        from_base_id,
        to_base_id,
        equipment_type_id,
        quantity,
        transfer_date,
        status,
        remarks,
        created_by
      )
      VALUES
      (
        $1,
        $2,
        $3,
        $4,
        COALESCE($5, CURRENT_TIMESTAMP),
        'COMPLETED',
        $6,
        $7
      )
      RETURNING *
      `,
      [
        from_base_id,
        to_base_id,
        equipment_type_id,
        quantity,
        transfer_date || null,
        remarks || null,
        req.user.id
      ]
    );

    // Audit log
    await client.query(
      `
      INSERT INTO audit_logs
      (
        user_id,
        action,
        entity_type,
        entity_id,
        details
      )
      VALUES
      (
        $1,
        $2,
        $3,
        $4,
        $5
      )
      `,
      [
        req.user.id,
        "CREATE",
        "TRANSFER",
        transferResult.rows[0].id,
        JSON.stringify({
          from_base_id,
          to_base_id,
          equipment_type_id,
          quantity
        })
      ]
    );

    await client.query("COMMIT");

    return res.status(201).json({
      success: true,
      message: "Transfer completed successfully",
      transfer: transferResult.rows[0],
      sourceAsset: updatedSource.rows[0],
      destinationAsset
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Create transfer error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create transfer",
      error: error.message
    });
  } finally {
    client.release();
  }
};


// Get transfer history
const getTransfers = async (req, res) => {
  try {
    const {
      from_base_id,
      to_base_id,
      equipment_type_id,
      start_date,
      end_date
    } = req.query;

    let query = `
      SELECT
        t.id,
        t.from_base_id,
        fb.name AS from_base_name,
        t.to_base_id,
        tb.name AS to_base_name,
        t.equipment_type_id,
        et.name AS equipment_type,
        t.quantity,
        t.transfer_date,
        t.status,
        t.remarks,
        t.created_by,
        t.created_at
      FROM transfers t
      LEFT JOIN bases fb
        ON fb.id = t.from_base_id
      LEFT JOIN bases tb
        ON tb.id = t.to_base_id
      LEFT JOIN equipment_types et
        ON et.id = t.equipment_type_id
      WHERE 1 = 1
    `;

    const values = [];
    let index = 1;

    if (from_base_id) {
      query += ` AND t.from_base_id = $${index}`;
      values.push(from_base_id);
      index++;
    }

    if (to_base_id) {
      query += ` AND t.to_base_id = $${index}`;
      values.push(to_base_id);
      index++;
    }

    if (equipment_type_id) {
      query += ` AND t.equipment_type_id = $${index}`;
      values.push(equipment_type_id);
      index++;
    }

    if (start_date) {
      query += ` AND t.transfer_date >= $${index}`;
      values.push(start_date);
      index++;
    }

    if (end_date) {
      query += ` AND t.transfer_date <= $${index}`;
      values.push(end_date);
      index++;
    }

    query += ` ORDER BY t.transfer_date DESC, t.id DESC`;

    const result = await pool.query(query, values);

    res.json({
      success: true,
      count: result.rows.length,
      transfers: result.rows
    });
  } catch (error) {
    console.error("Get transfers error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch transfer history",
      error: error.message
    });
  }
};


module.exports = {
  createTransfer,
  getTransfers
};