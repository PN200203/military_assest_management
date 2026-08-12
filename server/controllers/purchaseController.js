const pool = require("../config/db");

// =====================================================
// GET ALL PURCHASES
// GET /api/purchases
// =====================================================

const getPurchases = async (req, res) => {
  try {
    const {
      base_id,
      equipment_type_id,
      start_date,
      end_date,
    } = req.query;

    let query = `
      SELECT
        p.id,
        p.base_id,
        b.name AS base_name,
        p.equipment_type_id,
        et.name AS equipment_type,
        p.quantity,
        p.purchase_date,
        p.reference_number,
        p.remarks,
        p.created_by,
        u.name AS created_by_name,
        p.created_at
      FROM purchases p
      INNER JOIN bases b
        ON p.base_id = b.id
      INNER JOIN equipment_types et
        ON p.equipment_type_id = et.id
      LEFT JOIN users u
        ON p.created_by = u.id
      WHERE 1 = 1
    `;

    const values = [];

    // Filter by base
    if (base_id) {
      values.push(base_id);
      query += ` AND p.base_id = $${values.length}`;
    }

    // Filter by equipment type
    if (equipment_type_id) {
      values.push(equipment_type_id);
      query += ` AND p.equipment_type_id = $${values.length}`;
    }

    // Filter by start date
    if (start_date) {
      values.push(start_date);
      query += ` AND p.purchase_date >= $${values.length}`;
    }

    // Filter by end date
    if (end_date) {
      values.push(end_date);
      query += ` AND p.purchase_date <= $${values.length}`;
    }

    // Base Commander can see only assigned base
    if (req.user.role === "BASE_COMMANDER") {
      values.push(req.user.base_id);
      query += ` AND p.base_id = $${values.length}`;
    }

    // Logistics Officer can see only assigned base
    if (req.user.role === "LOGISTICS_OFFICER") {
      values.push(req.user.base_id);
      query += ` AND p.base_id = $${values.length}`;
    }

    query += `
      ORDER BY p.purchase_date DESC, p.id DESC
    `;

    const result = await pool.query(query, values);

    res.status(200).json({
      success: true,
      purchases: result.rows,
    });
  } catch (error) {
    console.error("Get purchases error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch purchases",
      error: error.message,
    });
  }
};


// =====================================================
// GET SINGLE PURCHASE
// GET /api/purchases/:id
// =====================================================

const getPurchaseById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT
        p.id,
        p.base_id,
        b.name AS base_name,
        p.equipment_type_id,
        et.name AS equipment_type,
        p.quantity,
        p.purchase_date,
        p.reference_number,
        p.remarks,
        p.created_by,
        u.name AS created_by_name,
        p.created_at
      FROM purchases p
      INNER JOIN bases b
        ON p.base_id = b.id
      INNER JOIN equipment_types et
        ON p.equipment_type_id = et.id
      LEFT JOIN users u
        ON p.created_by = u.id
      WHERE p.id = $1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Purchase not found",
      });
    }

    const purchase = result.rows[0];

    // Non-admin users can access only their base
    if (req.user.role !== "ADMIN") {
      if (
        Number(purchase.base_id) !==
        Number(req.user.base_id)
      ) {
        return res.status(403).json({
          success: false,
          message: "You do not have access to this purchase",
        });
      }
    }

    res.status(200).json({
      success: true,
      purchase,
    });
  } catch (error) {
    console.error("Get purchase error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch purchase",
      error: error.message,
    });
  }
};


// =====================================================
// CREATE PURCHASE
// POST /api/purchases
// =====================================================

const createPurchase = async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      base_id,
      equipment_type_id,
      quantity,
      purchase_date,
      reference_number,
      remarks,
    } = req.body;

    // -------------------------------------------------
    // Validate required fields
    // -------------------------------------------------

    if (
      !base_id ||
      !equipment_type_id ||
      quantity === undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          "base_id, equipment_type_id and quantity are required",
      });
    }

    const purchaseQuantity = Number(quantity);

    if (
      !Number.isInteger(purchaseQuantity) ||
      purchaseQuantity <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Purchase quantity must be a positive integer",
      });
    }

    // -------------------------------------------------
    // Check allowed roles
    // -------------------------------------------------

    const allowedRoles = [
      "ADMIN",
      "BASE_COMMANDER",
      "LOGISTICS_OFFICER",
    ];

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message:
          "You do not have permission to record purchases",
      });
    }

    // -------------------------------------------------
    // Base Commander can only use own base
    // -------------------------------------------------

    if (
      req.user.role === "BASE_COMMANDER" &&
      Number(base_id) !== Number(req.user.base_id)
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You can only record purchases for your assigned base",
      });
    }

    // -------------------------------------------------
    // Logistics Officer can only use own base
    // -------------------------------------------------

    if (
      req.user.role === "LOGISTICS_OFFICER" &&
      Number(base_id) !== Number(req.user.base_id)
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You can only record purchases for your assigned base",
      });
    }

    // -------------------------------------------------
    // Start transaction
    // -------------------------------------------------

    await client.query("BEGIN");

    // -------------------------------------------------
    // Check base
    // -------------------------------------------------

    const baseResult = await client.query(
      `
      SELECT id, name
      FROM bases
      WHERE id = $1
      `,
      [base_id]
    );

    if (baseResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "Base not found",
      });
    }

    // -------------------------------------------------
    // Check equipment type
    // -------------------------------------------------

    const equipmentResult = await client.query(
      `
      SELECT id, name
      FROM equipment_types
      WHERE id = $1
      `,
      [equipment_type_id]
    );

    if (equipmentResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "Equipment type not found",
      });
    }

    // -------------------------------------------------
    // Find asset using:
    //
    // base_id + equipment_type_id
    //
    // because purchases table DOES NOT have asset_id
    // -------------------------------------------------

    const assetResult = await client.query(
      `
      SELECT
        id,
        base_id,
        equipment_type_id,
        asset_name,
        quantity
      FROM assets
      WHERE
        base_id = $1
        AND equipment_type_id = $2
      ORDER BY id ASC
      LIMIT 1
      FOR UPDATE
      `,
      [
        base_id,
        equipment_type_id,
      ]
    );

    if (assetResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message:
          "No asset found for this base and equipment type",
      });
    }

    const asset = assetResult.rows[0];

    // -------------------------------------------------
    // Update asset quantity
    // -------------------------------------------------

    const updatedAsset = await client.query(
      `
      UPDATE assets
      SET
        quantity = quantity + $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING
        id,
        base_id,
        equipment_type_id,
        asset_name,
        quantity,
        updated_at
      `,
      [
        purchaseQuantity,
        asset.id,
      ]
    );

    // -------------------------------------------------
    // Insert purchase
    //
    // IMPORTANT:
    // Uses the actual purchases table columns
    // -------------------------------------------------

    const purchaseResult = await client.query(
      `
      INSERT INTO purchases
      (
        base_id,
        equipment_type_id,
        quantity,
        purchase_date,
        reference_number,
        remarks,
        created_by
      )
      VALUES
      (
        $1,
        $2,
        $3,
        COALESCE($4, CURRENT_DATE),
        $5,
        $6,
        $7
      )
      RETURNING *
      `,
      [
        base_id,
        equipment_type_id,
        purchaseQuantity,
        purchase_date || null,
        reference_number || null,
        remarks || null,
        req.user.id,
      ]
    );

    // -------------------------------------------------
    // Create audit log
    // -------------------------------------------------

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
        "PURCHASE",
        purchaseResult.rows[0].id,
        JSON.stringify({
          base_id: base_id,
          equipment_type_id: equipment_type_id,
          quantity: purchaseQuantity,
          asset_id: asset.id,
          asset_name: asset.asset_name,
        }),
      ]
    );

    // -------------------------------------------------
    // Commit
    // -------------------------------------------------

    await client.query("COMMIT");

    // -------------------------------------------------
    // Response
    // -------------------------------------------------

    res.status(201).json({
      success: true,
      message: "Purchase recorded successfully",
      purchase: purchaseResult.rows[0],
      updatedAsset: updatedAsset.rows[0],
    });

  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Create purchase error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create purchase",
      error: error.message,
    });
  } finally {
    client.release();
  }
};


// =====================================================
// DELETE PURCHASE
// DELETE /api/purchases/:id
// ADMIN ONLY
// =====================================================

const deletePurchase = async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;

    // -------------------------------------------------
    // Admin only
    // -------------------------------------------------

    if (req.user.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Only Admin can delete purchases",
      });
    }

    await client.query("BEGIN");

    // -------------------------------------------------
    // Find purchase
    // -------------------------------------------------

    const purchaseResult = await client.query(
      `
      SELECT *
      FROM purchases
      WHERE id = $1
      FOR UPDATE
      `,
      [id]
    );

    if (purchaseResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "Purchase not found",
      });
    }

    const purchase = purchaseResult.rows[0];

    // -------------------------------------------------
    // Find related asset using:
    //
    // base_id + equipment_type_id
    // -------------------------------------------------

    const assetResult = await client.query(
      `
      SELECT
        id,
        asset_name,
        quantity
      FROM assets
      WHERE
        base_id = $1
        AND equipment_type_id = $2
      ORDER BY id ASC
      LIMIT 1
      FOR UPDATE
      `,
      [
        purchase.base_id,
        purchase.equipment_type_id,
      ]
    );

    if (assetResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "Related asset not found",
      });
    }

    const asset = assetResult.rows[0];

    // -------------------------------------------------
    // Check current quantity
    // -------------------------------------------------

    if (
      Number(asset.quantity) <
      Number(purchase.quantity)
    ) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message:
          "Purchase cannot be deleted because asset quantity is already lower than the purchase quantity",
      });
    }

    // -------------------------------------------------
    // Reduce asset quantity
    // -------------------------------------------------

    await client.query(
      `
      UPDATE assets
      SET
        quantity = quantity - $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      `,
      [
        purchase.quantity,
        asset.id,
      ]
    );

    // -------------------------------------------------
    // Delete purchase
    // -------------------------------------------------

    await client.query(
      `
      DELETE FROM purchases
      WHERE id = $1
      `,
      [id]
    );

    // -------------------------------------------------
    // Audit log
    // -------------------------------------------------

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
        "DELETE",
        "PURCHASE",
        id,
        JSON.stringify({
          base_id: purchase.base_id,
          equipment_type_id:
            purchase.equipment_type_id,
          quantity: purchase.quantity,
          asset_id: asset.id,
          asset_name: asset.asset_name,
        }),
      ]
    );

    // -------------------------------------------------
    // Commit
    // -------------------------------------------------

    await client.query("COMMIT");

    res.status(200).json({
      success: true,
      message: "Purchase deleted successfully",
    });

  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Delete purchase error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete purchase",
      error: error.message,
    });
  } finally {
    client.release();
  }
};


// =====================================================
// EXPORT
// =====================================================

module.exports = {
  getPurchases,
  getPurchaseById,
  createPurchase,
  deletePurchase,
};