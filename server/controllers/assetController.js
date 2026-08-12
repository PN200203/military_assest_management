const pool = require("../config/db");

// =====================================================
// GET ALL ASSETS
// GET /api/assets
// =====================================================

const getAssets = async (req, res) => {
  try {
    const { base_id, equipment_type_id } = req.query;

    let query = `
      SELECT
        a.id,
        a.base_id,
        b.name AS base_name,
        a.equipment_type_id,
        et.name AS equipment_type,
        a.asset_name,
        a.quantity,
        a.created_at,
        a.updated_at
      FROM assets a
      INNER JOIN bases b
        ON a.base_id = b.id
      INNER JOIN equipment_types et
        ON a.equipment_type_id = et.id
      WHERE 1 = 1
    `;

    const values = [];

    // Filter by base
    if (base_id) {
      values.push(base_id);

      query += `
        AND a.base_id = $${values.length}
      `;
    }

    // Filter by equipment type
    if (equipment_type_id) {
      values.push(equipment_type_id);

      query += `
        AND a.equipment_type_id = $${values.length}
      `;
    }

    // Base Commander can only see their own base
    if (req.user.role === "BASE_COMMANDER") {
      values.push(req.user.base_id);

      query += `
        AND a.base_id = $${values.length}
      `;
    }

    // Logistics Officer can only see their assigned base
    if (req.user.role === "LOGISTICS_OFFICER") {
      values.push(req.user.base_id);

      query += `
        AND a.base_id = $${values.length}
      `;
    }

    query += `
      ORDER BY a.id DESC
    `;

    const result = await pool.query(query, values);

    res.status(200).json({
      success: true,
      assets: result.rows,
    });
  } catch (error) {
    console.error("Get assets error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch assets",
    });
  }
};


// =====================================================
// GET SINGLE ASSET
// GET /api/assets/:id
// =====================================================

const getAssetById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT
        a.id,
        a.base_id,
        b.name AS base_name,
        a.equipment_type_id,
        et.name AS equipment_type,
        a.asset_name,
        a.quantity,
        a.created_at,
        a.updated_at
      FROM assets a
      INNER JOIN bases b
        ON a.base_id = b.id
      INNER JOIN equipment_types et
        ON a.equipment_type_id = et.id
      WHERE a.id = $1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Asset not found",
      });
    }

    const asset = result.rows[0];

    // Admin can access everything
    if (req.user.role !== "ADMIN") {
      // Other users can only access their own base
      if (
        Number(asset.base_id) !==
        Number(req.user.base_id)
      ) {
        return res.status(403).json({
          success: false,
          message: "You do not have access to this asset",
        });
      }
    }

    res.status(200).json({
      success: true,
      asset: asset,
    });
  } catch (error) {
    console.error("Get asset by ID error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch asset",
    });
  }
};


// =====================================================
// CREATE ASSET
// POST /api/assets
// =====================================================

const createAsset = async (req, res) => {
  try {
    const {
      base_id,
      equipment_type_id,
      asset_name,
      quantity,
    } = req.body;

    // -----------------------------------------------
    // Validate required fields
    // -----------------------------------------------

    if (
      !base_id ||
      !equipment_type_id ||
      !asset_name
    ) {
      return res.status(400).json({
        success: false,
        message:
          "base_id, equipment_type_id and asset_name are required",
      });
    }

    // -----------------------------------------------
    // Validate quantity
    // -----------------------------------------------

    const assetQuantity =
      quantity === undefined ? 0 : Number(quantity);

    if (
      !Number.isInteger(assetQuantity) ||
      assetQuantity < 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Quantity must be a non-negative integer",
      });
    }

    // -----------------------------------------------
    // Base Commander can only create assets
    // for their own base
    // -----------------------------------------------

    if (req.user.role === "BASE_COMMANDER") {
      if (
        Number(base_id) !==
        Number(req.user.base_id)
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You can only create assets for your assigned base",
        });
      }
    }

    // -----------------------------------------------
    // Logistics Officer cannot create assets
    // -----------------------------------------------

    if (req.user.role === "LOGISTICS_OFFICER") {
      return res.status(403).json({
        success: false,
        message:
          "Logistics Officers cannot create asset records",
      });
    }

    // -----------------------------------------------
    // Check whether base exists
    // -----------------------------------------------

    const baseResult = await pool.query(
      `
      SELECT id, name
      FROM bases
      WHERE id = $1
      `,
      [base_id]
    );

    if (baseResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Base not found",
      });
    }

    // -----------------------------------------------
    // Check whether equipment type exists
    // -----------------------------------------------

    const equipmentResult = await pool.query(
      `
      SELECT id, name
      FROM equipment_types
      WHERE id = $1
      `,
      [equipment_type_id]
    );

    if (equipmentResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Equipment type not found",
      });
    }

    // -----------------------------------------------
    // Create asset
    // -----------------------------------------------

    const result = await pool.query(
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
      RETURNING
        id,
        base_id,
        equipment_type_id,
        asset_name,
        quantity,
        created_at,
        updated_at
      `,
      [
        base_id,
        equipment_type_id,
        asset_name.trim(),
        assetQuantity,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Asset created successfully",
      asset: result.rows[0],
    });
  } catch (error) {
    console.error("Create asset error:", error);

    // Duplicate asset
    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message:
          "An asset with this name already exists for this base",
      });
    }

    // Foreign key violation
    if (error.code === "23503") {
      return res.status(400).json({
        success: false,
        message:
          "Invalid base or equipment type",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create asset",
    });
  }
};


// =====================================================
// UPDATE ASSET
// PUT /api/assets/:id
// =====================================================

const updateAsset = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      asset_name,
      quantity,
    } = req.body;

    // -----------------------------------------------
    // Find existing asset
    // -----------------------------------------------

    const existing = await pool.query(
      `
      SELECT
        id,
        base_id,
        equipment_type_id,
        asset_name,
        quantity
      FROM assets
      WHERE id = $1
      `,
      [id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Asset not found",
      });
    }

    const asset = existing.rows[0];

    // -----------------------------------------------
    // Base access
    // -----------------------------------------------

    if (req.user.role !== "ADMIN") {
      if (
        Number(asset.base_id) !==
        Number(req.user.base_id)
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You can only update assets for your assigned base",
        });
      }
    }

    // -----------------------------------------------
    // Validate quantity
    // -----------------------------------------------

    if (quantity !== undefined) {
      const newQuantity = Number(quantity);

      if (
        !Number.isInteger(newQuantity) ||
        newQuantity < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Quantity must be a non-negative integer",
        });
      }
    }

    // -----------------------------------------------
    // Update asset
    // -----------------------------------------------

    const result = await pool.query(
      `
      UPDATE assets
      SET
        asset_name =
          COALESCE($1, asset_name),

        quantity =
          COALESCE($2, quantity),

        updated_at =
          CURRENT_TIMESTAMP

      WHERE id = $3

      RETURNING
        id,
        base_id,
        equipment_type_id,
        asset_name,
        quantity,
        created_at,
        updated_at
      `,
      [
        asset_name
          ? asset_name.trim()
          : null,

        quantity !== undefined
          ? Number(quantity)
          : null,

        id,
      ]
    );

    res.status(200).json({
      success: true,
      message: "Asset updated successfully",
      asset: result.rows[0],
    });
  } catch (error) {
    console.error("Update asset error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update asset",
    });
  }
};


// =====================================================
// DELETE ASSET
// DELETE /api/assets/:id
// =====================================================

const deleteAsset = async (req, res) => {
  try {
    const { id } = req.params;

    // -----------------------------------------------
    // Find asset
    // -----------------------------------------------

    const existing = await pool.query(
      `
      SELECT
        id,
        base_id
      FROM assets
      WHERE id = $1
      `,
      [id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Asset not found",
      });
    }

    const asset = existing.rows[0];

    // -----------------------------------------------
    // Base access
    // -----------------------------------------------

    if (req.user.role !== "ADMIN") {
      if (
        Number(asset.base_id) !==
        Number(req.user.base_id)
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You cannot delete assets from another base",
        });
      }
    }

    // -----------------------------------------------
    // Delete asset
    // -----------------------------------------------

    await pool.query(
      `
      DELETE FROM assets
      WHERE id = $1
      `,
      [id]
    );

    res.status(200).json({
      success: true,
      message: "Asset deleted successfully",
    });
  } catch (error) {
    console.error("Delete asset error:", error);

    // Asset is referenced by another table
    if (error.code === "23503") {
      return res.status(409).json({
        success: false,
        message:
          "This asset cannot be deleted because it is being used in another transaction",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to delete asset",
    });
  }
};


// =====================================================
// EXPORT ALL CONTROLLERS
// =====================================================

module.exports = {
  getAssets,
  getAssetById,
  createAsset,
  updateAsset,
  deleteAsset,
};