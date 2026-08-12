const express = require("express");

const {
    getDashboard,
    getDashboardBreakdown
} = require("../controllers/dashboardController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Dashboard summary
router.get(
    "/",
    authMiddleware,
    getDashboard
);

// Dashboard breakdown
router.get(
    "/breakdown",
    authMiddleware,
    getDashboardBreakdown
);

module.exports = router;