const express = require("express");

const {
  createTransfer,
  getTransfers
} = require("../controllers/transferController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const router = express.Router();

// Get transfer history
router.get(
  "/",
  authMiddleware,
  getTransfers
);

// Create transfer
// Admin, Base Commander and Logistics Officer
router.post(
  "/",
  authMiddleware,
  roleMiddleware("ADMIN", "BASE_COMMANDER", "LOGISTICS_OFFICER"),
  createTransfer
);

module.exports = router;