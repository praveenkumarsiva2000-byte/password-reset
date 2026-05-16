/**
 * pages/ResetPassword.jsx
 * Step 2 of the password reset flow.
 * Verifies the token from the URL, then lets the user enter a new password.
 */

import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { verifyResetToken, resetPassword } from "../utils/api";

// ─── Password Strength Calculator ─────────────────────────────────────────────

/**
 * getPasswordStrength
 * Evaluates a password and returns a strength level object.
 * @param {string} password
 * @returns {{ level: number, label: string, color: string, width: string }}
 */
const getPasswordStrength = (password) => {
  if (!password) return { level: 0, label: "", color: "#4a4a6a", width: "0%" };

  let score = 0;
  if (password.length >= 6)  score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const map = [
    { level: 0, label: "",          color: "#4a4a6a",      width: "0%"   },
    { level: 1, label: "Very Weak", color: "#ef4444",      width: "20%"  },
    { level: 2, label: "Weak",      color: "#f97316",      width: "40%"  },
    { level: 3, label: "Fair",      color: "#f59e0b",      width: "60%"  },
    { level: 4, label: "Strong",    color: "#22c55e",      width: "80%"  },
    { level: 5, label: "Very Strong", color: "#10b981",   width: "100%" },
  ];

  return map[Math.min(score, 5)];
};

// ─── Token States ─────────────────────────────────────────────────────────────
const TOKEN_STATE = {
  LOADING:  "loading",
  VALID:    "valid",
  INVALID:  "invalid",
  EXPIRED:  "expired",
  RESET_OK: "reset_ok",
};

// ─── Component ────────────────────────────────────────────────────────────────

function ResetPassword() {
  const { token } = useParams();

  // ── State ──────────────────────────────────────────────────────────────────
  const [tokenState, setTokenState] = useState(TOKEN_STATE.LOADING);
  const [userEmail, setUserEmail]   = useState("");

  const [password, setPassword]             = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword]     = useState(false);
  const [showConfirm, setShowConfirm]       = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback]   = useState(null);
  const [touched, setTouched]     = useState({ password: false, confirm: false });

  // ── Derived State ──────────────────────────────────────────────────────────
  const strength = getPasswordStrength(password);

  const passwordError = (() => {
    if (!touched.password) return null;
    if (!password) return "Password is required.";
    if (password.length < 6) return "Password must be at least 6 characters.";
    if (!/[A-Z]/.test(password)) return "Must contain at least one uppercase letter.";
    if (!/[0-9]/.test(password)) return "Must contain at least one number.";
    return null;
  })();

  const confirmError = (() => {
    if (!touched.confirm) return null;
    if (!confirmPassword) return "Please confirm your password.";
    if (password !== confirmPassword) return "Passwords do not match.";
    return null;
  })();

  const isFormValid = !passwordError && !confirmError && password && confirmPassword;

  // ── Token Verification on Mount ────────────────────────────────────────────

  /**
   * validateToken
   * Called when the component mounts. Verifies the URL token against the backend.
   */
  const validateToken = useCallback(async () => {
    if (!token) {
      setTokenState(TOKEN_STATE.INVALID);
      return;
    }

    try {
      const response = await verifyResetToken(token);
      setUserEmail(response.data.email || "");
      setTokenState(TOKEN_STATE.VALID);
    } catch (error) {
      const statusCode = error.response?.status;
      const isExpired  = error.response?.data?.expired;

      if (isExpired || statusCode === 410) {
        setTokenState(TOKEN_STATE.EXPIRED);
      } else {
        setTokenState(TOKEN_STATE.INVALID);
      }
    }
  }, [token]);

  useEffect(() => {
    validateToken();
  }, [validateToken]);

  // ── Handle Password Reset Submit ───────────────────────────────────────────

  /**
   * handleSubmit
   * Sends the new password + token to the backend for verification and update.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ password: true, confirm: true });
    setFeedback(null);

    if (!isFormValid) return;

    setIsLoading(true);

    try {
      const response = await resetPassword(token, password, confirmPassword);

      setFeedback({ type: "success", message: response.data.message });
      setTokenState(TOKEN_STATE.RESET_OK);
    } catch (error) {
      const statusCode = error.response?.status;
      const isExpired  = error.response?.data?.expired;

      if (isExpired || statusCode === 410) {
        setTokenState(TOKEN_STATE.EXPIRED);
      } else {
        setFeedback({
          type: "error",
          message: error.message || "Failed to reset password. Please try again.",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: Loading
  // ─────────────────────────────────────────────────────────────────────────────

  if (tokenState === TOKEN_STATE.LOADING) {
    return (
      <div className="auth-wrapper">
        <div className="auth-card text-center">
          <div
            style={{
              width: 72,
              height: 72,
              margin: "0 auto 24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              className="spinner"
              style={{ width: 40, height: 40, borderWidth: 4 }}
              aria-label="Verifying token…"
            />
          </div>
          <h2 className="auth-title mb-2">Verifying Link…</h2>
          <p className="auth-subtitle">Please wait while we validate your reset link.</p>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: Expired Token
  // ─────────────────────────────────────────────────────────────────────────────

  if (tokenState === TOKEN_STATE.EXPIRED) {
    return (
      <div className="auth-wrapper">
        <div className="auth-card text-center">
          <div className="status-icon warning mx-auto">
            <i className="fa-solid fa-clock-rotate-left" />
          </div>
          <h1 className="auth-title mb-2">Link Expired</h1>
          <p className="auth-subtitle">
            Your password reset link has expired. Reset links are valid for <strong>1 hour</strong>.
            Please request a new one.
          </p>

          <div className="alert-custom alert-warning mb-4" role="alert">
            <i className="fa-solid fa-triangle-exclamation" style={{ flexShrink: 0 }} />
            <span>This link can no longer be used. Please request a fresh reset link.</span>
          </div>

          <Link to="/forgot-password" className="btn-primary-custom d-block">
            <i className="fa-solid fa-rotate-right me-2" />
            Request New Reset Link
          </Link>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: Invalid Token
  // ─────────────────────────────────────────────────────────────────────────────

  if (tokenState === TOKEN_STATE.INVALID) {
    return (
      <div className="auth-wrapper">
        <div className="auth-card text-center">
          <div className="status-icon error mx-auto">
            <i className="fa-solid fa-link-slash" />
          </div>
          <h1 className="auth-title mb-2">Invalid Link</h1>
          <p className="auth-subtitle">
            This password reset link is invalid or has already been used.
            Please request a new one.
          </p>

          <div className="alert-custom alert-error mb-4" role="alert">
            <i className="fa-solid fa-circle-exclamation" style={{ flexShrink: 0 }} />
            <span>This reset link is not valid. It may have already been used.</span>
          </div>

          <Link to="/forgot-password" className="btn-primary-custom d-block">
            <i className="fa-solid fa-envelope me-2" />
            Request New Reset Link
          </Link>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: Password Reset Successful
  // ─────────────────────────────────────────────────────────────────────────────

  if (tokenState === TOKEN_STATE.RESET_OK) {
    return (
      <div className="auth-wrapper">
        <div className="auth-card text-center">
          <div className="status-icon success mx-auto">
            <i className="fa-solid fa-shield-halved" />
          </div>
          <h1 className="auth-title mb-2">Password Reset!</h1>
          <p className="auth-subtitle">
            Your password has been updated successfully. You can now sign in with your new password.
          </p>

          <div className="alert-custom alert-success mb-4" role="alert">
            <i className="fa-solid fa-circle-check" style={{ flexShrink: 0 }} />
            <span>Your account is now secured with your new password.</span>
          </div>

          {/* 
            In a real app, this would link to the actual login page.
            For this demo it links to the forgot-password page as a placeholder.
          */}
          <Link to="/forgot-password" className="btn-primary-custom d-block">
            <i className="fa-solid fa-right-to-bracket me-2" />
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: Reset Password Form (token is valid)
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="auth-wrapper">
      <div className="auth-card">

        {/* Back link */}
        <Link to="/forgot-password" className="back-link">
          <i className="fa-solid fa-arrow-left" />
          Back
        </Link>

        {/* Icon */}
        <div className="auth-icon">
          <i className="fa-solid fa-key" />
        </div>

        <h1 className="auth-title">Set New Password</h1>
        <p className="auth-subtitle">
          {userEmail ? (
            <>
              Resetting password for{" "}
              <strong style={{ color: "var(--color-accent)" }}>{userEmail}</strong>
            </>
          ) : (
            "Choose a strong new password for your account."
          )}
        </p>

        {/* Feedback Alert */}
        {feedback && (
          <div className={`alert-custom alert-${feedback.type} mb-4`} role="alert">
            <i
              className={`fa-solid ${
                feedback.type === "success" ? "fa-circle-check" : "fa-circle-exclamation"
              }`}
              style={{ flexShrink: 0 }}
            />
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>

          {/* New Password Field */}
          <div className="mb-3">
            <label className="form-label" htmlFor="password">
              New Password
            </label>
            <div className="input-group-wrapper">
              <i className="fa-solid fa-lock input-icon" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                className={`form-control-custom ${
                  touched.password
                    ? passwordError
                      ? "is-invalid"
                      : password
                      ? "is-valid"
                      : ""
                    : ""
                }`}
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                disabled={isLoading}
                autoComplete="new-password"
                autoFocus
                required
              />
              {/* Show / hide toggle */}
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                <i className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"}`} />
              </button>
            </div>

            {/* Inline validation */}
            {passwordError && (
              <div className="invalid-feedback-custom">
                <i className="fa-solid fa-triangle-exclamation" />
                {passwordError}
              </div>
            )}

            {/* Password Strength Meter */}
            {password && (
              <div className="strength-meter">
                <div className="strength-bar-track">
                  <div
                    className="strength-bar-fill"
                    style={{
                      width: strength.width,
                      backgroundColor: strength.color,
                    }}
                  />
                </div>
                <div className="strength-label" style={{ color: strength.color }}>
                  {strength.label && (
                    <>
                      <i className="fa-solid fa-shield-halved me-1" />
                      {strength.label}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Requirements hint */}
          <div
            className="mb-3"
            style={{
              background: "rgba(15,52,96,0.25)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-sm)",
              padding: "12px 14px",
              fontSize: "12px",
              color: "var(--color-muted)",
            }}
          >
            <div className="mb-1 fw-semibold" style={{ color: "var(--color-text)" }}>
              Password must include:
            </div>
            {[
              { rule: password.length >= 6, text: "At least 6 characters" },
              { rule: /[A-Z]/.test(password), text: "One uppercase letter" },
              { rule: /[0-9]/.test(password), text: "One number" },
            ].map(({ rule, text }) => (
              <div key={text} className="d-flex align-items-center gap-2 mt-1">
                <i
                  className={`fa-solid ${rule ? "fa-circle-check" : "fa-circle-xmark"}`}
                  style={{ color: rule ? "var(--color-success)" : "var(--color-border)", fontSize: "11px" }}
                />
                <span style={{ color: rule ? "var(--color-text)" : "var(--color-muted)" }}>{text}</span>
              </div>
            ))}
          </div>

          {/* Confirm Password Field */}
          <div className="mb-4">
            <label className="form-label" htmlFor="confirmPassword">
              Confirm New Password
            </label>
            <div className="input-group-wrapper">
              <i className="fa-solid fa-lock-open input-icon" />
              <input
                id="confirmPassword"
                type={showConfirm ? "text" : "password"}
                className={`form-control-custom ${
                  touched.confirm
                    ? confirmError
                      ? "is-invalid"
                      : confirmPassword
                      ? "is-valid"
                      : ""
                    : ""
                }`}
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, confirm: true }))}
                disabled={isLoading}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowConfirm((v) => !v)}
                aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
                tabIndex={-1}
              >
                <i className={`fa-solid ${showConfirm ? "fa-eye-slash" : "fa-eye"}`} />
              </button>
            </div>

            {confirmError && (
              <div className="invalid-feedback-custom">
                <i className="fa-solid fa-triangle-exclamation" />
                {confirmError}
              </div>
            )}
            {!confirmError && confirmPassword && confirmPassword === password && (
              <div className="valid-feedback-custom">
                <i className="fa-solid fa-circle-check" />
                Passwords match!
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="btn-primary-custom"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner" aria-hidden="true" />
                Resetting Password…
              </>
            ) : (
              <>
                <i className="fa-solid fa-shield-halved me-2" />
                Reset Password
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ResetPassword;
