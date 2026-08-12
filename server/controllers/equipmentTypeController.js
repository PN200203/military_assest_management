const pool = require("../config/db");

// ==========================================
// GET ALL EQUIPMENT TYPES
// ==========================================

const getEquipmentTypes = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        name,
        description,
        created_at
      FROM equipment_types
      ORDER BY name ASC
    `);

    res.json({
      success: true,
      equipmentTypes: result.rows,
    });
  } catch (error) {
    console.error(
      "Get equipment types error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch equipment types",
    });
  }
};

// ==========================================
// GET SINGLE EQUIPMENT TYPE
// ==========================================

const getEquipmentTypeById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT
        id,
        name,
        description,
        created_at
      FROM equipment_types
      WHERE id = $1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Equipment type not found",
      });
    }

    res.json({
      success: true,
      equipmentType: result.rows[0],
    });
  } catch (error) {
    console.error(
      "Get equipment type error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch equipment type",
    });
  }
};

// ==========================================
// CREATE EQUIPMENT TYPE
// ==========================================

const createEquipmentType = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Equipment type name is required",
      });
    }

    const result = await pool.query(
      `
      INSERT INTO equipment_types
      (
        name,
        description
      )
      VALUES
      ($1, $2)
      RETURNING
        id,
        name,
        description,
        created_at
      `,
      [
        name.trim(),
        description || null,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Equipment type created successfully",
      equipmentType: result.rows[0],
    });
  } catch (error) {
    console.error(
      "Create equipment type error:",
      error
    );

    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "Equipment type already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create equipment type",
    });
  }
};

// ==========================================
// UPDATE EQUIPMENT TYPE
// ==========================================

const updateEquipmentType = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Equipment type name is required",
      });
    }

    const result = await pool.query(
      `
      UPDATE equipment_types
      SET
        name = $1,
        description = $2
      WHERE id = $3
      RETURNING
        id,
        name,
        description,
        created_at
      `,
      [
        name.trim(),
        description || null,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Equipment type not found",
      });
    }

    res.json({
      success: true,
      message:
        "Equipment type updated successfully",
      equipmentType: result.rows[0],
    });
  } catch (error) {
    console.error(
      "Update equipment type error:",
      error
    );

    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "Equipment type already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update equipment type",
    });
  }
};

// ==========================================
// DELETE EQUIPMENT TYPE
// ==========================================

const deleteEquipmentType = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      DELETE FROM equipment_types
      WHERE id = $1
      RETURNING id
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Equipment type not found",
      });
    }

    res.json({
      success: true,
      message:
        "Equipment type deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete equipment type error:",
      error
    );

    // Foreign key constraint
    if (error.code === "23503") {
      return res.status(409).json({
        success: false,
        message:
          "Cannot delete equipment type because it is being used by assets or transactions",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to delete equipment type",
    });
  }
};

module.exports = {
  getEquipmentTypes,
  getEquipmentTypeById,
  createEquipmentType,
  updateEquipmentType,
  deleteEquipmentType,
};