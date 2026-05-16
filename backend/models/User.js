/**
 * models/User.js
 * Mongoose schema and model for the User collection.
 * Stores hashed passwords and reset token data.
 */

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    // User's display name
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },

    // Unique email address (used as login identifier)
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    },

    // Hashed password – never store plain text
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
    },

    // ── Password Reset Fields ──────────────────────────────────────────────

    /**
     * resetToken: A cryptographically random string sent in the reset link.
     * Cleared from DB after a successful password reset.
     */
    resetToken: {
      type: String,
      default: null,
    },

    /**
     * resetTokenExpiry: Timestamp after which the resetToken is considered expired.
     * Default expiry is configured via RESET_TOKEN_EXPIRY env variable (default 1 hour).
     */
    resetTokenExpiry: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields automatically
  }
);

// ─── Pre-save Hook: Hash Password ─────────────────────────────────────────────

/**
 * Before saving a user document, hash the password if it has been modified.
 * This ensures passwords are never stored as plain text.
 */
userSchema.pre("save", async function (next) {
  // Only hash if the password field was modified
  if (!this.isModified("password")) return next();

  try {
    const saltRounds = 12;
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error) {
    next(error);
  }
});

// ─── Instance Methods ─────────────────────────────────────────────────────────

/**
 * comparePassword
 * Compares a plain-text candidate password with the stored hashed password.
 * @param {string} candidatePassword - The password entered by the user
 * @returns {Promise<boolean>} - True if passwords match, false otherwise
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

/**
 * isResetTokenExpired
 * Checks whether the stored reset token has passed its expiry time.
 * @returns {boolean} - True if token is expired or missing
 */
userSchema.methods.isResetTokenExpired = function () {
  if (!this.resetTokenExpiry) return true;
  return Date.now() > this.resetTokenExpiry.getTime();
};

const User = mongoose.model("User", userSchema);

module.exports = User;
