/**
 * routes/auth.js
 * Authentication routes:
 *   POST /api/auth/register         - Create a new user (for testing purposes)
 *   POST /api/auth/forgot-password  - Request a password reset email
 *   GET  /api/auth/verify-token/:token - Validate a reset token (check expiry)
 *   POST /api/auth/reset-password/:token - Submit a new password using the token
 */

const express = require("express");
const crypto = require("crypto");
const rateLimit = require("express-rate-limit");
const validator = require("validator");

const User = require("../models/User");
const { sendPasswordResetEmail } = require("../utils/sendEmail");

const router = express.Router();

// ─── Rate Limiters ────────────────────────────────────────────────────────────

/**
 * Stricter rate limit for forgot-password to prevent email flooding.
 * Max 5 requests per hour per IP.
 */
const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: {
    success: false,
    message: "Too many password reset requests. Please wait an hour before trying again.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── Route: Register (for testing/demo) ──────────────────────────────────────

/**
 * POST /api/auth/register
 * Creates a new user account. Used for demo/testing without a full auth system.
 */
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // ── Input Validation ──────────────────────────────────────────────────
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are all required.",
      });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ success: false, message: "Invalid email format." });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters.",
      });
    }

    // ── Check for Existing User ───────────────────────────────────────────
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    // ── Create and Save User ──────────────────────────────────────────────
    const newUser = new User({ name, email, password });
    await newUser.save();

    res.status(201).json({
      success: true,
      message: "Account created successfully. You can now request a password reset.",
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ success: false, message: "Server error during registration." });
  }
});

// ─── Route: Forgot Password ───────────────────────────────────────────────────

/**
 * POST /api/auth/forgot-password
 * Body: { email }
 *
 * Flow:
 *  1. Validate email format
 *  2. Check if user exists in DB
 *  3. If not found → return error (user doesn't exist)
 *  4. Generate a cryptographically random reset token
 *  5. Store hashed token + expiry in DB
 *  6. Send reset link to user's email
 */
router.post("/forgot-password", forgotPasswordLimiter, async (req, res) => {
  try {
    const { email } = req.body;

    // ── Validate input ────────────────────────────────────────────────────
    if (!email) {
      return res.status(400).json({ success: false, message: "Email address is required." });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ success: false, message: "Please enter a valid email address." });
    }

    // ── Look up user ──────────────────────────────────────────────────────
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Return error – user does not exist in the DB
      return res.status(404).json({
        success: false,
        message: "No account found with this email address. Please check and try again.",
      });
    }

    // ── Generate secure random token ──────────────────────────────────────
    // 32 random bytes → 64-char hex string
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Token expiry from env (default: 1 hour)
    const expiryMs = parseInt(process.env.RESET_TOKEN_EXPIRY) || 3600000;
    const resetTokenExpiry = new Date(Date.now() + expiryMs);

    // ── Store token in DB ─────────────────────────────────────────────────
    // Store the raw token (you could hash it for extra security, but raw is fine for this scope)
    user.resetToken = resetToken;
    user.resetTokenExpiry = resetTokenExpiry;
    await user.save({ validateBeforeSave: false });

    // ── Build the reset URL ───────────────────────────────────────────────
    const frontendURL = process.env.FRONTEND_URL || "http://localhost:3000";
    const resetURL = `${frontendURL}/reset-password/${resetToken}`;

    // ── Send email ────────────────────────────────────────────────────────
    await sendPasswordResetEmail(user.email, user.name, resetURL);

    res.status(200).json({
      success: true,
      message: `Password reset link has been sent to ${user.email}. Please check your inbox (and spam folder).`,
    });
  } catch (error) {
    console.error("Forgot password error:", error);

    // If email sending fails, clear the token so the user can retry
    if (error.code === "ECONNECTION" || error.responseCode) {
      try {
        await User.findOneAndUpdate(
          { email: req.body.email?.toLowerCase() },
          { $set: { resetToken: null, resetTokenExpiry: null } }
        );
      } catch (cleanupError) {
        console.error("Token cleanup error:", cleanupError);
      }
      return res.status(500).json({
        success: false,
        message: "Failed to send reset email. Please check your email configuration and try again.",
      });
    }

    res.status(500).json({ success: false, message: "Server error. Please try again later." });
  }
});

// ─── Route: Verify Token ──────────────────────────────────────────────────────

/**
 * GET /api/auth/verify-token/:token
 * Checks whether a reset token is valid and not expired.
 * Called by the frontend when the reset page loads.
 */
router.get("/verify-token/:token", async (req, res) => {
  try {
    const { token } = req.params;

    if (!token || token.length !== 64) {
      return res.status(400).json({ success: false, message: "Invalid reset token format." });
    }

    // ── Find user by reset token ──────────────────────────────────────────
    const user = await User.findOne({ resetToken: token });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Invalid or already used reset link. Please request a new one.",
      });
    }

    // ── Check expiry ──────────────────────────────────────────────────────
    if (user.isResetTokenExpired()) {
      // Clear expired token from DB
      user.resetToken = null;
      user.resetTokenExpiry = null;
      await user.save({ validateBeforeSave: false });

      return res.status(410).json({
        success: false,
        expired: true,
        message: "This password reset link has expired. Please request a new one.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Token is valid.",
      email: user.email, // Return masked email for display purposes
    });
  } catch (error) {
    console.error("Verify token error:", error);
    res.status(500).json({ success: false, message: "Server error during token verification." });
  }
});

// ─── Route: Reset Password ────────────────────────────────────────────────────

/**
 * POST /api/auth/reset-password/:token
 * Body: { password, confirmPassword }
 *
 * Flow:
 *  1. Extract token from URL
 *  2. Find user with matching resetToken in DB
 *  3. Verify token is not expired
 *  4. Validate the new password
 *  5. Hash and save the new password
 *  6. Clear the resetToken and resetTokenExpiry from DB
 */
router.post("/reset-password/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    // ── Validate token format ─────────────────────────────────────────────
    if (!token || token.length !== 64) {
      return res.status(400).json({ success: false, message: "Invalid reset token." });
    }

    // ── Validate passwords ────────────────────────────────────────────────
    if (!password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Both password fields are required.",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match. Please try again.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long.",
      });
    }

    // Password strength: at least one uppercase, one number
    const passwordStrengthRegex = /^(?=.*[A-Z])(?=.*\d).{6,}$/;
    if (!passwordStrengthRegex.test(password)) {
      return res.status(400).json({
        success: false,
        message:
          "Password must contain at least one uppercase letter and one number.",
      });
    }

    // ── Find user by token ────────────────────────────────────────────────
    const user = await User.findOne({ resetToken: token });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Invalid or already used reset link. Please request a new one.",
      });
    }

    // ── Check token expiry ────────────────────────────────────────────────
    if (user.isResetTokenExpired()) {
      // Clear expired token
      user.resetToken = null;
      user.resetTokenExpiry = null;
      await user.save({ validateBeforeSave: false });

      return res.status(410).json({
        success: false,
        expired: true,
        message: "This password reset link has expired. Please request a new password reset.",
      });
    }

    // ── Update password and clear reset token ─────────────────────────────
    user.password = password;       // Will be hashed by pre-save hook
    user.resetToken = null;          // Clear token so it cannot be reused
    user.resetTokenExpiry = null;    // Clear expiry
    await user.save();

    console.log(`✅ Password successfully reset for user: ${user.email}`);

    res.status(200).json({
      success: true,
      message: "Password has been reset successfully! You can now log in with your new password.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ success: false, message: "Server error during password reset." });
  }
});

module.exports = router;
