/**
 * pages/ForgotPassword.jsx
 * Step 1 of the password reset flow.
 * User enters their email address to receive a reset link.
 */

import React, { useState } from "react";
import { Link } from "react-router-dom";
import { requestPasswordReset } from "../utils/api";

// ─── Component ────────────────────────────────────────────────────────────────

function ForgotPassword() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success'|'error', message }
  const [emailSent, setEmailSent] = useState(false);
  const [touched, setTouched] = useState(false);

  // ── Validation ─────────────────────────────────────────────────────────────
  const isValidEmail = (val) => /^\S+@\S+\.\S+$/.test(val);
  const emailError = touched && !isValidEmail(email) ? "Please enter a valid email address." : null;

  // ── Handle Submit ──────────────────────────────────────────────────────────

  /**
   * handleSubmit
   * Validates the email and calls the forgot-password API endpoint.
   * Displays success or error feedback based on the response.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched(true);
    setFeedback(null);

    // Client-side validation
    if (!isValidEmail(email)) return;

    setIsLoading(true);

    try {
      const response = await requestPasswordReset(email.trim());

      // Success – show confirmation message
      setFeedback({
        type: "success",
        message: response.data.message,
      });
      setEmailSent(true);
    } catch (error) {
      // Error – user not found or server error
      const statusCode = error.response?.status;

      setFeedback({
        type: statusCode === 404 ? "error" : "error",
        message:
          error.message ||
          "Something went wrong. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ── Render: Email Sent Confirmation ────────────────────────────────────────
  if (emailSent) {
    return (
      <div className="auth-wrapper">
        <div className="auth-card text-center">
          {/* Success Icon */}
          <div className="status-icon success mx-auto">
            <i className="fa-solid fa-paper-plane" />
          </div>

          <h1 className="auth-title mb-2">Check Your Inbox!</h1>
          <p className="auth-subtitle">
            We sent a password reset link to{" "}
            <strong style={{ color: "var(--color-accent)" }}>{email}</strong>.
            <br />
            The link expires in <strong>1 hour</strong>.
          </p>

          {/* Checklist */}
          <div className="text-start mb-4" style={{ color: "var(--color-muted)", fontSize: "14px" }}>
            <div className="d-flex align-items-center gap-2 mb-2">
              <i className="fa-solid fa-circle-check" style={{ color: "var(--color-success)" }} />
              <span>Check your <strong>inbox</strong> for the reset email</span>
            </div>
            <div className="d-flex align-items-center gap-2 mb-2">
              <i className="fa-solid fa-circle-check" style={{ color: "var(--color-success)" }} />
              <span>Also check your <strong>spam / junk</strong> folder</span>
            </div>
            <div className="d-flex align-items-center gap-2">
              <i className="fa-solid fa-clock" style={{ color: "var(--color-warning)" }} />
              <span>Link expires in <strong>1 hour</strong></span>
            </div>
          </div>

          <div className="divider">Didn't get it?</div>

          {/* Resend */}
          <button
            className="btn-primary-custom"
            onClick={() => {
              setEmailSent(false);
              setFeedback(null);
              setEmail("");
              setTouched(false);
            }}
          >
            <i className="fa-solid fa-rotate-right me-2" />
            Try a Different Email
          </button>
        </div>
      </div>
    );
  }

  // ── Render: Forgot Password Form ───────────────────────────────────────────
  return (
    <div className="auth-wrapper">
      <div className="auth-card">

        {/* Icon */}
        <div className="auth-icon">
          <i className="fa-solid fa-lock" />
        </div>

        <h1 className="auth-title">Forgot Password?</h1>
        <p className="auth-subtitle">
          No worries! Enter your registered email and we'll send you a secure reset link.
        </p>

        {/* Feedback Alert */}
        {feedback && (
          <div className={`alert-custom alert-${feedback.type} mb-4`} role="alert">
            <i
              className={`fa-solid ${
                feedback.type === "success"
                  ? "fa-circle-check"
                  : "fa-circle-exclamation"
              }`}
              style={{ flexShrink: 0, marginTop: "2px" }}
            />
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          {/* Email Field */}
          <div className="mb-4">
            <label className="form-label" htmlFor="email">
              Email Address
            </label>
            <div className="input-group-wrapper">
              <i className="fa-solid fa-envelope input-icon" />
              <input
                id="email"
                type="email"
                className={`form-control-custom ${
                  touched
                    ? emailError
                      ? "is-invalid"
                      : email
                      ? "is-valid"
                      : ""
                    : ""
                }`}
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched(true)}
                disabled={isLoading}
                autoComplete="email"
                autoFocus
                required
              />
            </div>
            {/* Inline validation message */}
            {emailError && (
              <div className="invalid-feedback-custom">
                <i className="fa-solid fa-triangle-exclamation" />
                {emailError}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn-primary-custom"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner" aria-hidden="true" />
                Sending Reset Link…
              </>
            ) : (
              <>
                <i className="fa-solid fa-paper-plane me-2" />
                Send Reset Link
              </>
            )}
          </button>
        </form>

        {/* Back to login */}
        <div className="divider">or</div>
        <p className="text-center" style={{ fontSize: "14px", color: "var(--color-muted)" }}>
          Remember your password?{" "}
          <Link to="/login" className="auth-link">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}

export default ForgotPassword;
