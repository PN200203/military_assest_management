const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const pool = require("../config/db");

// ==========================================
// LOGIN
// ==========================================

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // ------------------------------------------
    // Validate input
    // ------------------------------------------

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // ------------------------------------------
    // Normalize email
    // ------------------------------------------

    const normalizedEmail = email.toLowerCase().trim();

    // ------------------------------------------
    // Find user
    // ------------------------------------------

    const result = await pool.query(
      `
      SELECT
        u.id,
        u.name,
        u.email,
        u.password_hash,
        u.role,
        u.base_id,
        b.name AS base_name
      FROM users u
      LEFT JOIN bases b
        ON u.base_id = b.id
      WHERE LOWER(u.email) = $1
      `,
      [normalizedEmail]
    );

    // ------------------------------------------
    // User not found
    // ------------------------------------------

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const user = result.rows[0];

    // ------------------------------------------
    // Check password hash
    // ------------------------------------------

    if (!user.password_hash) {
      console.error("LOGIN ERROR: User has no password_hash");

      return res.status(500).json({
        success: false,
        message: "Server error during login",
      });
    }

    // ------------------------------------------
    // Compare password
    // ------------------------------------------

    const passwordMatch = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // ------------------------------------------
    // Check JWT secret
    // ------------------------------------------

    if (!process.env.JWT_SECRET) {
      console.error("LOGIN ERROR: JWT_SECRET is not configured");

      return res.status(500).json({
        success: false,
        message: "Server configuration error",
      });
    }

    // ------------------------------------------
    // Create JWT
    // ------------------------------------------

    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        base_id: user.base_id,
        base_name: user.base_name,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "8h",
      }
    );

    // ------------------------------------------
    // Remove password hash
    // ------------------------------------------

    delete user.password_hash;

    // ------------------------------------------
    // Successful login
    // ------------------------------------------

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user,
    });
  } catch (error) {
    // ------------------------------------------
    // IMPORTANT:
    // This appears in Render Logs and helps us
    // identify the real deployment problem.
    // ------------------------------------------

    console.error("LOGIN ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error during login",
    });
  }
};

// ==========================================
// CURRENT USER
// ==========================================

const getCurrentUser = async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        u.id,
        u.name,
        u.email,
        u.role,
        u.base_id,
        b.name AS base_name
      FROM users u
      LEFT JOIN bases b
        ON u.base_id = b.id
      WHERE u.id = $1
      `,
      [req.user.id]
    );

    // ------------------------------------------
    // User not found
    // ------------------------------------------

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // ------------------------------------------
    // Return current user
    // ------------------------------------------

    return res.status(200).json({
      success: true,
      user: result.rows[0],
    });
  } catch (error) {
    console.error("GET CURRENT USER ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ==========================================
// LOGOUT
// ==========================================

const logout = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Logout successful",
  });
};

// ==========================================
// EXPORT
// ==========================================

module.exports = {
  login,
  getCurrentUser,
  logout,
};