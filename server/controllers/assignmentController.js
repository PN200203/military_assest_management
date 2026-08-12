const pool = require("../config/db");

// ======================================================
// CREATE ASSIGNMENT
// POST /api/assignments
// ======================================================
const createAssignment = async (req, res) => {
    const client = await pool.connect();

    try {
        const {
            base_id,
            equipment_type_id,
            personnel_name,
            quantity,
            assigned_date,
            remarks
        } = req.body;

        // Validate required fields
        if (
            !base_id ||
            !equipment_type_id ||
            !personnel_name ||
            !quantity
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "base_id, equipment_type_id, personnel_name and quantity are required"
            });
        }

        if (quantity <= 0) {
            return res.status(400).json({
                success: false,
                message: "Quantity must be greater than 0"
            });
        }

        await client.query("BEGIN");

        // ------------------------------------------------
        // Check available asset quantity
        // ------------------------------------------------
        const assetResult = await client.query(
            `
            SELECT *
            FROM assets
            WHERE base_id = $1
            AND equipment_type_id = $2
            FOR UPDATE
            `,
            [base_id, equipment_type_id]
        );

        if (assetResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                success: false,
                message: "Asset not found for this base and equipment type"
            });
        }

        const asset = assetResult.rows[0];

        // ------------------------------------------------
        // Check quantity
        // ------------------------------------------------
        if (asset.quantity < quantity) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                success: false,
                message: `Insufficient asset quantity. Available quantity: ${asset.quantity}`
            });
        }

        // ------------------------------------------------
        // Reduce asset quantity
        // ------------------------------------------------
        const updatedAssetResult = await client.query(
            `
            UPDATE assets
            SET
                quantity = quantity - $1,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING *
            `,
            [quantity, asset.id]
        );

        // ------------------------------------------------
        // Get logged-in user
        // ------------------------------------------------
        const assignedBy = req.user?.id || null;

        // ------------------------------------------------
        // Create assignment
        // ------------------------------------------------
        const assignmentResult = await client.query(
            `
            INSERT INTO assignments
            (
                base_id,
                equipment_type_id,
                personnel_name,
                quantity,
                assigned_date,
                assigned_by,
                remarks
            )
            VALUES
            (
                $1,
                $2,
                $3,
                $4,
                COALESCE($5, CURRENT_TIMESTAMP),
                $6,
                $7
            )
            RETURNING *
            `,
            [
                base_id,
                equipment_type_id,
                personnel_name,
                quantity,
                assigned_date || null,
                assignedBy,
                remarks || null
            ]
        );

        await client.query("COMMIT");

        return res.status(201).json({
            success: true,
            message: "Assignment created successfully",
            assignment: assignmentResult.rows[0],
            updatedAsset: updatedAssetResult.rows[0]
        });

    } catch (error) {
        await client.query("ROLLBACK");

        console.error("Create assignment error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to create assignment",
            error: error.message
        });
    } finally {
        client.release();
    }
};


// ======================================================
// GET ASSIGNMENT HISTORY
// GET /api/assignments
// ======================================================
const getAssignments = async (req, res) => {
    try {
        const {
            base_id,
            equipment_type_id,
            personnel_name
        } = req.query;

        let query = `
            SELECT
                a.id,
                a.base_id,
                b.name AS base_name,
                a.equipment_type_id,
                et.name AS equipment_type_name,
                a.personnel_name,
                a.quantity,
                a.assigned_date,
                a.assigned_by,
                a.remarks
            FROM assignments a
            LEFT JOIN bases b
                ON a.base_id = b.id
            LEFT JOIN equipment_types et
                ON a.equipment_type_id = et.id
            WHERE 1 = 1
        `;

        const values = [];
        let parameterIndex = 1;

        // Filter by base
        if (base_id) {
            query += ` AND a.base_id = $${parameterIndex}`;
            values.push(base_id);
            parameterIndex++;
        }

        // Filter by equipment type
        if (equipment_type_id) {
            query += ` AND a.equipment_type_id = $${parameterIndex}`;
            values.push(equipment_type_id);
            parameterIndex++;
        }

        // Filter by personnel
        if (personnel_name) {
            query += `
                AND LOWER(a.personnel_name)
                LIKE LOWER($${parameterIndex})
            `;

            values.push(`%${personnel_name}%`);
            parameterIndex++;
        }

        query += `
            ORDER BY a.id DESC
        `;

        const result = await pool.query(query, values);

        return res.status(200).json({
            success: true,
            count: result.rows.length,
            assignments: result.rows
        });

    } catch (error) {
        console.error("Get assignments error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch assignment history",
            error: error.message
        });
    }
};


// ======================================================
// GET SINGLE ASSIGNMENT
// GET /api/assignments/:id
// ======================================================
const getAssignmentById = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `
            SELECT
                a.id,
                a.base_id,
                b.name AS base_name,
                a.equipment_type_id,
                et.name AS equipment_type_name,
                a.personnel_name,
                a.quantity,
                a.assigned_date,
                a.assigned_by,
                a.remarks
            FROM assignments a
            LEFT JOIN bases b
                ON a.base_id = b.id
            LEFT JOIN equipment_types et
                ON a.equipment_type_id = et.id
            WHERE a.id = $1
            `,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Assignment not found"
            });
        }

        return res.status(200).json({
            success: true,
            assignment: result.rows[0]
        });

    } catch (error) {
        console.error("Get assignment error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch assignment",
            error: error.message
        });
    }
};


module.exports = {
    createAssignment,
    getAssignments,
    getAssignmentById
};