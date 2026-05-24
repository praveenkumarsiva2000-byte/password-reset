/**
 * App.js
 * Root application component.
 * Sets up client-side routing with React Router v6.
 * 
 * Routes:
 *  /              → Redirect to /login
 *  /login         → Login page
 *  /register      → Register page
 *  /forgot-password       → Forgot password page
 *  /reset-password/:token → Reset password page
 *  *              → 404 Not Found
 */

import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

function App() {
  return (
    <Router>
      {/* Animated background gradient orbs */}
      <div className="page-bg" aria-hidden="true" />

      <Routes>
        {/* Default redirect to login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Step 0: Register new account */}
        <Route path="/register" element={<Register />} />

        {/* Step 1: Login to existing account */}
        <Route path="/login" element={<Login />} />

        {/* Step 2: User enters email for reset */}
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Step 3: User resets password via token */}
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        {/* Fallback 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;