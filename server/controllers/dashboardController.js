const pool = require("../config/db");

// ======================================================
// GET DASHBOARD SUMMARY
// GET /api/dashboard
// ======================================================
const getDashboard = async (req, res) => {
    try {
        const { base_id, equipment_type_id } = req.query;

        // ------------------------------------------------
        // Build filters
        // ------------------------------------------------
        const filters = [];
        const values = [];

        let parameterIndex = 1;

        if (base_id) {
            filters.push(`base_id = $${parameterIndex}`);
            values.push(base_id);
            parameterIndex++;
        }

        if (equipment_type_id) {
            filters.push(
                `equipment_type_id = $${parameterIndex}`
            );
            values.push(equipment_type_id);
            parameterIndex++;
        }

        const whereClause =
            filters.length > 0
                ? `WHERE ${filters.join(" AND ")}`
                : "";

        // ------------------------------------------------
        // 1. OPENING BALANCE
        // ------------------------------------------------
        const openingBalanceResult = await pool.query(
            `
            SELECT COALESCE(SUM(quantity), 0) AS total
            FROM opening_balances
            ${whereClause}
            `,
            values
        );

        // ------------------------------------------------
        // 2. PURCHASES
        // ------------------------------------------------
        const purchaseResult = await pool.query(
            `
            SELECT COALESCE(SUM(quantity), 0) AS total
            FROM purchases
            ${whereClause}
            `,
            values
        );

        // ------------------------------------------------
        // 3. TRANSFER IN
        // ------------------------------------------------
        let transferInQuery = `
            SELECT COALESCE(SUM(quantity), 0) AS total
            FROM transfers
            WHERE 1 = 1
            AND to_base_id IS NOT NULL
        `;

        const transferInValues = [];
        let transferInIndex = 1;

        if (base_id) {
            transferInQuery += `
                AND to_base_id = $${transferInIndex}
            `;

            transferInValues.push(base_id);
            transferInIndex++;
        }

        if (equipment_type_id) {
            transferInQuery += `
                AND equipment_type_id = $${transferInIndex}
            `;

            transferInValues.push(equipment_type_id);
            transferInIndex++;
        }

        const transferInResult = await pool.query(
            transferInQuery,
            transferInValues
        );

        // ------------------------------------------------
        // 4. TRANSFER OUT
        // ------------------------------------------------
        let transferOutQuery = `
            SELECT COALESCE(SUM(quantity), 0) AS total
            FROM transfers
            WHERE 1 = 1
            AND from_base_id IS NOT NULL
        `;

        const transferOutValues = [];
        let transferOutIndex = 1;

        if (base_id) {
            transferOutQuery += `
                AND from_base_id = $${transferOutIndex}
            `;

            transferOutValues.push(base_id);
            transferOutIndex++;
        }

        if (equipment_type_id) {
            transferOutQuery += `
                AND equipment_type_id = $${transferOutIndex}
            `;

            transferOutValues.push(equipment_type_id);
            transferOutIndex++;
        }

        const transferOutResult = await pool.query(
            transferOutQuery,
            transferOutValues
        );

        // ------------------------------------------------
        // 5. ASSIGNED
        // ------------------------------------------------
        const assignmentResult = await pool.query(
            `
            SELECT COALESCE(SUM(quantity), 0) AS total
            FROM assignments
            ${whereClause}
            `,
            values
        );

        // ------------------------------------------------
        // 6. EXPENDED
        // ------------------------------------------------
        const expenditureResult = await pool.query(
            `
            SELECT COALESCE(SUM(quantity), 0) AS total
            FROM expenditures
            ${whereClause}
            `,
            values
        );

        // ------------------------------------------------
        // Convert database values to numbers
        // ------------------------------------------------
        const openingBalance =
            Number(openingBalanceResult.rows[0].total) || 0;

        const purchases =
            Number(purchaseResult.rows[0].total) || 0;

        const transferIn =
            Number(transferInResult.rows[0].total) || 0;

        const transferOut =
            Number(transferOutResult.rows[0].total) || 0;

        const assigned =
            Number(assignmentResult.rows[0].total) || 0;

        const expended =
            Number(expenditureResult.rows[0].total) || 0;

        // ------------------------------------------------
        // Calculate closing balance
        // ------------------------------------------------
        const closingBalance =
            openingBalance +
            purchases +
            transferIn -
            transferOut -
            assigned -
            expended;

        // ------------------------------------------------
        // Get current asset quantity
        // ------------------------------------------------
        const assetResult = await pool.query(
            `
            SELECT COALESCE(SUM(quantity), 0) AS total
            FROM assets
            ${whereClause}
            `,
            values
        );

        const currentAssetQuantity =
            Number(assetResult.rows[0].total) || 0;

        // ------------------------------------------------
        // Return dashboard
        // ------------------------------------------------
        return res.status(200).json({
            success: true,

            dashboard: {
                openingBalance,
                purchases,
                transferIn,
                transferOut,
                assigned,
                expended,
                closingBalance,
                currentAssetQuantity
            }
        });

    } catch (error) {
        console.error("Dashboard error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch dashboard data",
            error: error.message
        });
    }
};


// ======================================================
// GET DASHBOARD BREAKDOWN
// GET /api/dashboard/breakdown
// ======================================================
const getDashboardBreakdown = async (req, res) => {
    try {
        const result = await pool.query(
            `
            SELECT
                a.base_id,
                b.name AS base_name,
                a.equipment_type_id,
                et.name AS equipment_type_name,

                COALESCE(
                    (
                        SELECT SUM(ob.quantity)
                        FROM opening_balances ob
                        WHERE ob.base_id = a.base_id
                        AND ob.equipment_type_id = a.equipment_type_id
                    ),
                    0
                ) AS opening_balance,

                COALESCE(
                    (
                        SELECT SUM(p.quantity)
                        FROM purchases p
                        WHERE p.base_id = a.base_id
                        AND p.equipment_type_id = a.equipment_type_id
                    ),
                    0
                ) AS purchases,

                COALESCE(
                    (
                        SELECT SUM(t.quantity)
                        FROM transfers t
                        WHERE t.to_base_id = a.base_id
                        AND t.equipment_type_id = a.equipment_type_id
                    ),
                    0
                ) AS transfer_in,

                COALESCE(
                    (
                        SELECT SUM(t.quantity)
                        FROM transfers t
                        WHERE t.from_base_id = a.base_id
                        AND t.equipment_type_id = a.equipment_type_id
                    ),
                    0
                ) AS transfer_out,

                COALESCE(
                    (
                        SELECT SUM(asg.quantity)
                        FROM assignments asg
                        WHERE asg.base_id = a.base_id
                        AND asg.equipment_type_id = a.equipment_type_id
                    ),
                    0
                ) AS assigned,

                COALESCE(
                    (
                        SELECT SUM(e.quantity)
                        FROM expenditures e
                        WHERE e.base_id = a.base_id
                        AND e.equipment_type_id = a.equipment_type_id
                    ),
                    0
                ) AS expended,

                a.quantity AS current_asset_quantity

            FROM assets a

            LEFT JOIN bases b
                ON a.base_id = b.id

            LEFT JOIN equipment_types et
                ON a.equipment_type_id = et.id

            ORDER BY
                a.base_id,
                a.equipment_type_id
            `
        );

        const breakdown = result.rows.map(row => {
            const openingBalance =
                Number(row.opening_balance) || 0;

            const purchases =
                Number(row.purchases) || 0;

            const transferIn =
                Number(row.transfer_in) || 0;

            const transferOut =
                Number(row.transfer_out) || 0;

            const assigned =
                Number(row.assigned) || 0;

            const expended =
                Number(row.expended) || 0;

            const closingBalance =
                openingBalance +
                purchases +
                transferIn -
                transferOut -
                assigned -
                expended;

            return {
                base_id: row.base_id,
                base_name: row.base_name,

                equipment_type_id:
                    row.equipment_type_id,

                equipment_type_name:
                    row.equipment_type_name,

                opening_balance: openingBalance,
                purchases,
                transfer_in: transferIn,
                transfer_out: transferOut,
                assigned,
                expended,
                closing_balance: closingBalance,

                current_asset_quantity:
                    Number(row.current_asset_quantity) || 0
            };
        });

        return res.status(200).json({
            success: true,
            count: breakdown.length,
            breakdown
        });

    } catch (error) {
        console.error(
            "Dashboard breakdown error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to fetch dashboard breakdown",
            error: error.message
        });
    }
};


module.exports = {
    getDashboard,
    getDashboardBreakdown
};