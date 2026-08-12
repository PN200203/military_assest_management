const express = require("express");

const {
    createExpenditure,
    getExpenditures,
    getExpenditureById
} = require("../controllers/expenditureController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Create expenditure
router.post(
    "/",
    authMiddleware,
    createExpenditure
);

// Get expenditure history
router.get(
    "/",
    authMiddleware,
    getExpenditures
);

// Get single expenditure
router.get(
    "/:id",
    authMiddleware,
    getExpenditureById
);

module.exports = router;