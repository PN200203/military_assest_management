const express = require("express");

const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

// ==========================================
// ADMIN ONLY
// ==========================================

router.get(
  "/admin",
  authenticateToken,
  authorizeRoles("ADMIN"),
  (req, res) => {
    res.json({
      success: true,
      message: "Welcome Admin. You have full access.",
      user: req.user,
    });
  }
);

// ==========================================
// ADMIN + BASE COMMANDER
// ==========================================

router.get(
  "/commander",
  authenticateToken,
  authorizeRoles(
    "ADMIN",
    "BASE_COMMANDER"
  ),
  (req, res) => {
    res.json({
      success: true,
      message:
        "Welcome Admin/Base Commander. You can access base operations.",
      user: req.user,
    });
  }
);

// ==========================================
// ADMIN + LOGISTICS OFFICER
// ==========================================

router.get(
  "/logistics",
  authenticateToken,
  authorizeRoles(
    "ADMIN",
    "LOGISTICS_OFFICER"
  ),
  (req, res) => {
    res.json({
      success: true,
      message:
        "Welcome Admin/Logistics Officer. You can access logistics operations.",
      user: req.user,
    });
  }
);

module.exports = router;