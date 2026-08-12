const express = require("express");

const {
  getPurchases,
  getPurchaseById,
  createPurchase,
  deletePurchase,
} = require("../controllers/purchaseController");

const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();


// =====================================================
// GET ALL PURCHASES
// =====================================================

router.get(
  "/",
  authenticateToken,
  authorizeRoles(
    "ADMIN",
    "BASE_COMMANDER",
    "LOGISTICS_OFFICER"
  ),
  getPurchases
);


// =====================================================
// GET SINGLE PURCHASE
// =====================================================

router.get(
  "/:id",
  authenticateToken,
  authorizeRoles(
    "ADMIN",
    "BASE_COMMANDER",
    "LOGISTICS_OFFICER"
  ),
  getPurchaseById
);


// =====================================================
// CREATE PURCHASE
// =====================================================

router.post(
  "/",
  authenticateToken,
  authorizeRoles(
    "ADMIN",
    "BASE_COMMANDER",
    "LOGISTICS_OFFICER"
  ),
  createPurchase
);


// =====================================================
// DELETE PURCHASE
// ADMIN ONLY
// =====================================================

router.delete(
  "/:id",
  authenticateToken,
  authorizeRoles("ADMIN"),
  deletePurchase
);


module.exports = router;