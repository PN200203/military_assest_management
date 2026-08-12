const express = require("express");

const {
  getEquipmentTypes,
  getEquipmentTypeById,
  createEquipmentType,
  updateEquipmentType,
  deleteEquipmentType,
} = require("../controllers/equipmentTypeController");

const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

// ==========================================
// GET ALL
// ADMIN + COMMANDER + LOGISTICS
// ==========================================

router.get(
  "/",
  authenticateToken,
  authorizeRoles(
    "ADMIN",
    "BASE_COMMANDER",
    "LOGISTICS_OFFICER"
  ),
  getEquipmentTypes
);

// ==========================================
// GET ONE
// ==========================================

router.get(
  "/:id",
  authenticateToken,
  authorizeRoles(
    "ADMIN",
    "BASE_COMMANDER",
    "LOGISTICS_OFFICER"
  ),
  getEquipmentTypeById
);

// ==========================================
// CREATE
// ADMIN ONLY
// ==========================================

router.post(
  "/",
  authenticateToken,
  authorizeRoles("ADMIN"),
  createEquipmentType
);

// ==========================================
// UPDATE
// ADMIN ONLY
// ==========================================

router.put(
  "/:id",
  authenticateToken,
  authorizeRoles("ADMIN"),
  updateEquipmentType
);

// ==========================================
// DELETE
// ADMIN ONLY
// ==========================================

router.delete(
  "/:id",
  authenticateToken,
  authorizeRoles("ADMIN"),
  deleteEquipmentType
);

module.exports = router;