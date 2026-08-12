const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

require("dotenv").config();

const pool = require("./config/db");

// ==========================================
// ROUTES
// ==========================================

const authRoutes = require("./routes/authRoutes");
const rbacRoutes = require("./routes/rbacRoutes");
const equipmentTypeRoutes = require("./routes/equipmentTypeRoutes");
const assetRoutes = require("./routes/assetRoutes");
const purchaseRoutes = require("./routes/purchaseRoutes");
const transferRoutes = require("./routes/transferRoutes");
const assignmentRoutes = require("./routes/assignmentRoutes");
const expenditureRoutes = require("./routes/expenditureRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

// ==========================================
// APP
// ==========================================

const app = express();

const PORT = process.env.PORT || 5000;

// ==========================================
// CORS
// ==========================================

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://military-asset-management-client.onrender.com",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ==========================================
// BODY PARSERS
// ==========================================

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
  })
);

app.use(cookieParser());

// ==========================================
// API ROUTES
// ==========================================

app.use("/api/auth", authRoutes);

app.use("/api/rbac", rbacRoutes);

app.use(
  "/api/equipment-types",
  equipmentTypeRoutes
);

app.use("/api/assets", assetRoutes);

app.use(
  "/api/purchases",
  purchaseRoutes
);

app.use(
  "/api/transfers",
  transferRoutes
);

app.use(
  "/api/assignments",
  assignmentRoutes
);

app.use(
  "/api/expenditures",
  expenditureRoutes
);

app.use(
  "/api/dashboard",
  dashboardRoutes
);

// ==========================================
// HOME ROUTE
// ==========================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Military Asset Management API is running",
  });
});

// ==========================================
// DATABASE HEALTH CHECK
// ==========================================

app.get("/api/health", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");

    res.json({
      success: true,
      message: "Backend and PostgreSQL are connected",
      databaseTime: result.rows[0].now,
    });
  } catch (error) {
    console.error("Database connection error:", error);

    res.status(500).json({
      success: false,
      message: "Database connection failed",
      error: error.message,
    });
  }
});

// ==========================================
// START SERVER
// ==========================================

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});