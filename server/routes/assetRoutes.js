const express = require("express");

const {
  getAssets,
  getAssetById,
  createAsset,
  updateAsset,
  deleteAsset,
} = require("../controllers/assetController");

const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();


// =====================================================
// GET ALL ASSETS
// GET /api/assets
// =====================================================

router.get(
  "/",
  authenticateToken,
  authorizeRoles(
    "ADMIN",
    "BASE_COMMANDER",
    "LOGISTICS_OFFICER"
  ),
  getAssets
);


// =====================================================
// GET SINGLE ASSET
// GET /api/assets/:id
// =====================================================

router.get(
  "/:id",
  authenticateToken,
  authorizeRoles(
    "ADMIN",
    "BASE_COMMANDER",
    "LOGISTICS_OFFICER"
  ),
  getAssetById
);


// =====================================================
// CREATE ASSET
// POST /api/assets
// =====================================================

router.post(
  "/",
  authenticateToken,
  authorizeRoles(
    "ADMIN",
    "BASE_COMMANDER"
  ),
  createAsset
);


// =====================================================
// UPDATE ASSET
// PUT /api/assets/:id
// =====================================================

router.put(
  "/:id",
  authenticateToken,
  authorizeRoles(
    "ADMIN",
    "BASE_COMMANDER"
  ),
  updateAsset
);


// =====================================================
// DELETE ASSET
// DELETE /api/assets/:id
// =====================================================

router.delete(
  "/:id",
  authenticateToken,
  authorizeRoles(
    "ADMIN",
    "BASE_COMMANDER"
  ),
  deleteAsset
);


module.exports = router;