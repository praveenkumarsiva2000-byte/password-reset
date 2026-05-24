/**
 * routes/auth.js
 */

const express = require("express");
const crypto = require("crypto");
const rateLimit = require("express-rate-limit");
const validator = require("validator");

const User = require("../models/User");
const { sendPasswordResetEmail } = require("../utils/sendEmail");

const router = express.Router();

// ─── Rate Limiters ────────────────────────────────────────────────────────────
const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { success: false, message: "Too many password reset requests. Please wait an hour before trying again." },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── Route: Register ─────────────────────────────────────────────────────────
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Name, email, and password are all required." });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ success: false, message: "Invalid email format." });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters." });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ success: false, message: "An account with this email already exists." });
    }

    const newUser = new User({ name, email, password });
    await newUser.save();

    res.status(201).json({ success: true, message: "Account created successfully. You can now log in." });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ success: false, message: "Server error during registration." });
  }
});

// ─── Route: Login ─────────────────────────────────────────────────────────────
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ success: false, message: "Email and password are required." });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user)
      return res.status(404).json({ success: false, message: "No account found with this email." });

    const isMatch = await user.comparePassword(password);
    if (!isMatch)
      return res.status(401).json({ success: false, message: "Incorrect password. Please try again." });

    res.status(200).json({ success: true, message: "Login successful!", name: user.name, email: user.email });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: "Server error during login." });
  }
});

// ─── Route: Forgot Password ───────────────────────────────────────────────────
router.post("/forgot-password", forgotPasswordLimiter, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email address is required." });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ success: false, message: "Please enter a valid email address." });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ success: false, message: "No account found with this email address. Please check and try again." });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const expiryMs = parseInt(process.env.RESET_TOKEN_EXPIRY) || 3600000;
    const resetTokenExpiry = new Date(Date.now() + expiryMs);

    user.resetToken = resetToken;
    user.resetTokenExpiry = resetTokenExpiry;
    await user.save({ validateBeforeSave: false });

    const frontendURL = process.env.FRONTEND_URL || "http://localhost:3000";
    const resetURL = `${frontendURL}/reset-password/${resetToken}`;

    await sendPasswordResetEmail(user.email, user.name, resetURL);

    res.status(200).json({ success: true, message: `Password reset link has been sent to ${user.email}. Please check your inbox (and spam folder).` });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ success: false, message: "Server error. Please try again later." });
  }
});

// ─── Route: Verify Token ──────────────────────────────────────────────────────
router.get("/verify-token/:token", async (req, res) => {
  try {
    const { token } = req.params;

    if (!token || token.length !== 64) {
      return res.status(400).json({ success: false, message: "Invalid reset token format." });
    }

    const user = await User.findOne({ resetToken: token });
    if (!user) {
      return res.status(404).json({ success: false, message: "Invalid or already used reset link. Please request a new one." });
    }

    if (user.isResetTokenExpired()) {
      user.resetToken = null;
      user.resetTokenExpiry = null;
      await user.save({ validateBeforeSave: false });
      return res.status(410).json({ success: false, expired: true, message: "This password reset link has expired. Please request a new one." });
    }

    res.status(200).json({ success: true, message: "Token is valid.", email: user.email });
  } catch (error) {
    console.error("Verify token error:", error);
    res.status(500).json({ success: false, message: "Server error during token verification." });
  }
});

// ─── Route: Reset Password ────────────────────────────────────────────────────
router.post("/reset-password/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    if (!token || token.length !== 64) {
      return res.status(400).json({ success: false, message: "Invalid reset token." });
    }

    if (!password || !confirmPassword) {
      return res.status(400).json({ success: false, message: "Both password fields are required." });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: "Passwords do not match. Please try again." });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters long." });
    }

    const passwordStrengthRegex = /^(?=.*[A-Z])(?=.*\d).{6,}$/;
    if (!passwordStrengthRegex.test(password)) {
      return res.status(400).json({ success: false, message: "Password must contain at least one uppercase letter and one number." });
    }

    const user = await User.findOne({ resetToken: token });
    if (!user) {
      return res.status(404).json({ success: false, message: "Invalid or already used reset link. Please request a new one." });
    }

    if (user.isResetTokenExpired()) {
      user.resetToken = null;
      user.resetTokenExpiry = null;
      await user.save({ validateBeforeSave: false });
      return res.status(410).json({ success: false, expired: true, message: "This password reset link has expired. Please request a new password reset." });
    }

    user.password = password;
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await user.save();

    console.log(`✅ Password successfully reset for user: ${user.email}`);

    res.status(200).json({ success: true, message: "Password has been reset successfully! You can now log in with your new password." });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ success: false, message: "Server error during password reset." });
  }
});

module.exports = router;