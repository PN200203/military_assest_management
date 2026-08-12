const express = require("express");

const {
    createAssignment,
    getAssignments,
    getAssignmentById
} = require("../controllers/assignmentController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Create assignment
router.post(
    "/",
    authMiddleware,
    createAssignment
);

// Get assignment history
router.get(
    "/",
    authMiddleware,
    getAssignments
);

// Get single assignment
router.get(
    "/:id",
    authMiddleware,
    getAssignmentById
);

module.exports = router;