const express = require("express");

const {
  login,
  getCurrentUser,
  logout,
} = require("../controllers/authController");

const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();

// POST /api/auth/login
router.post("/login", login);

// GET /api/auth/me
router.get(
  "/me",
  authenticateToken,
  getCurrentUser
);

// POST /api/auth/logout
router.post(
  "/logout",
  authenticateToken,
  logout
);

module.exports = router;