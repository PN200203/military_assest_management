const pool = require("../config/db");

// ======================================================
// CREATE EXPENDITURE
// POST /api/expenditures
// ======================================================
const createExpenditure = async (req, res) => {
    const client = await pool.connect();

    try {
        const {
            base_id,
            equipment_type_id,
            quantity,
            expenditure_date,
            reason
        } = req.body;

        // Validate required fields
        if (
            !base_id ||
            !equipment_type_id ||
            !quantity
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "base_id, equipment_type_id and quantity are required"
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
                message:
                    "Asset not found for this base and equipment type"
            });
        }

        const asset = assetResult.rows[0];

        // ------------------------------------------------
        // Check available quantity
        // ------------------------------------------------
        if (asset.quantity < quantity) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                success: false,
                message:
                    `Insufficient asset quantity. Available quantity: ${asset.quantity}`
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
        const recordedBy = req.user?.id || null;

        // ------------------------------------------------
        // Create expenditure record
        // ------------------------------------------------
        const expenditureResult = await client.query(
            `
            INSERT INTO expenditures
            (
                base_id,
                equipment_type_id,
                quantity,
                expenditure_date,
                reason,
                recorded_by
            )
            VALUES
            (
                $1,
                $2,
                $3,
                COALESCE($4, CURRENT_TIMESTAMP),
                $5,
                $6
            )
            RETURNING *
            `,
            [
                base_id,
                equipment_type_id,
                quantity,
                expenditure_date || null,
                reason || null,
                recordedBy
            ]
        );

        await client.query("COMMIT");

        return res.status(201).json({
            success: true,
            message: "Expenditure recorded successfully",
            expenditure: expenditureResult.rows[0],
            updatedAsset: updatedAssetResult.rows[0]
        });

    } catch (error) {
        await client.query("ROLLBACK");

        console.error("Create expenditure error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to create expenditure",
            error: error.message
        });
    } finally {
        client.release();
    }
};


// ======================================================
// GET EXPENDITURE HISTORY
// GET /api/expenditures
// ======================================================
const getExpenditures = async (req, res) => {
    try {
        const {
            base_id,
            equipment_type_id,
            reason
        } = req.query;

        let query = `
            SELECT
                e.id,
                e.base_id,
                b.name AS base_name,
                e.equipment_type_id,
                et.name AS equipment_type_name,
                e.quantity,
                e.expenditure_date,
                e.reason,
                e.recorded_by
            FROM expenditures e
            LEFT JOIN bases b
                ON e.base_id = b.id
            LEFT JOIN equipment_types et
                ON e.equipment_type_id = et.id
            WHERE 1 = 1
        `;

        const values = [];
        let parameterIndex = 1;

        // Filter by base
        if (base_id) {
            query += ` AND e.base_id = $${parameterIndex}`;
            values.push(base_id);
            parameterIndex++;
        }

        // Filter by equipment type
        if (equipment_type_id) {
            query += ` AND e.equipment_type_id = $${parameterIndex}`;
            values.push(equipment_type_id);
            parameterIndex++;
        }

        // Filter by reason
        if (reason) {
            query += `
                AND LOWER(e.reason)
                LIKE LOWER($${parameterIndex})
            `;

            values.push(`%${reason}%`);
            parameterIndex++;
        }

        query += `
            ORDER BY e.id DESC
        `;

        const result = await pool.query(query, values);

        return res.status(200).json({
            success: true,
            count: result.rows.length,
            expenditures: result.rows
        });

    } catch (error) {
        console.error("Get expenditures error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch expenditure history",
            error: error.message
        });
    }
};


// ======================================================
// GET SINGLE EXPENDITURE
// GET /api/expenditures/:id
// ======================================================
const getExpenditureById = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `
            SELECT
                e.id,
                e.base_id,
                b.name AS base_name,
                e.equipment_type_id,
                et.name AS equipment_type_name,
                e.quantity,
                e.expenditure_date,
                e.reason,
                e.recorded_by
            FROM expenditures e
            LEFT JOIN bases b
                ON e.base_id = b.id
            LEFT JOIN equipment_types et
                ON e.equipment_type_id = et.id
            WHERE e.id = $1
            `,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Expenditure not found"
            });
        }

        return res.status(200).json({
            success: true,
            expenditure: result.rows[0]
        });

    } catch (error) {
        console.error("Get expenditure error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch expenditure",
            error: error.message
        });
    }
};


module.exports = {
    createExpenditure,
    getExpenditures,
    getExpenditureById
};