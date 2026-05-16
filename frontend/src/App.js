/**
 * App.js
 * Root application component.
 * Sets up client-side routing with React Router v6.
 */

import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

/**
 * App
 * Defines all application routes:
 *  /                          → Redirect to /forgot-password
 *  /forgot-password           → Enter email to request reset link
 *  /reset-password/:token     → Enter new password using token from email
 *  *                          → 404 Not Found page
 */
function App() {
  return (
    <Router>
      {/* Animated background gradient orbs */}
      <div className="page-bg" aria-hidden="true" />

      <Routes>
        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/forgot-password" replace />} />

        {/* Step 1: User enters their email */}
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Step 2: User clicks link in email and resets password */}
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        {/* Fallback 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
