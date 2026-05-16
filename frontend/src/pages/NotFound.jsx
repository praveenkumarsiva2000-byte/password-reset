/**
 * pages/NotFound.jsx
 * 404 Not Found fallback page.
 */

import React from "react";
import { Link } from "react-router-dom";

function NotFound() {
  return (
    <div className="auth-wrapper">
      <div className="auth-card text-center">
        <div
          style={{
            fontSize: "72px",
            fontFamily: "var(--font-heading)",
            fontWeight: 800,
            background: "linear-gradient(135deg, var(--color-accent), var(--color-primary))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            marginBottom: "16px",
            lineHeight: 1,
          }}
        >
          404
        </div>

        <h1 className="auth-title mb-2">Page Not Found</h1>
        <p className="auth-subtitle">
          The page you're looking for doesn't exist or has been moved.
        </p>

        <Link to="/forgot-password" className="btn-primary-custom d-block">
          <i className="fa-solid fa-house me-2" />
          Go to Home
        </Link>
      </div>
    </div>
  );
}

export default NotFound;
