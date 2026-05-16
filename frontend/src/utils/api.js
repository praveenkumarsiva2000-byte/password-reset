/**
 * utils/api.js
 * Centralized Axios instance for all API calls.
 * Base URL is read from the REACT_APP_API_URL environment variable.
 */

import axios from "axios";

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "/api",
  timeout: 60000, // 60 seconds (for Render free tier wake-up)
  headers: {
    "Content-Type": "application/json",
  },
});

// ─── Request Interceptor ──────────────────────────────────────────────────────
// Attach auth token from localStorage if present (for future expansion)
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor ─────────────────────────────────────────────────────
// Normalize error messages from the server
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.data?.message) {
      error.message = error.response.data.message;
    } else if (error.code === "ECONNABORTED") {
      error.message = "Request timed out. Please check your connection and try again.";
    } else if (!error.response) {
      error.message = "Unable to connect to the server. Please try again later.";
    }
    return Promise.reject(error);
  }
);

// ─── Auth API Helpers ─────────────────────────────────────────────────────────

/**
 * requestPasswordReset
 * Sends the user's email to the backend to trigger the reset flow.
 * @param {string} email
 */
export const requestPasswordReset = (email) =>
  API.post("/auth/forgot-password", { email });

/**
 * verifyResetToken
 * Checks if a reset token is valid and not expired before showing the form.
 * @param {string} token - The token from the URL
 */
export const verifyResetToken = (token) =>
  API.get(`/auth/verify-token/${token}`);

/**
 * resetPassword
 * Submits the new password along with the token for verification.
 * @param {string} token        - The token from the URL
 * @param {string} password     - The new password
 * @param {string} confirmPassword
 */
export const resetPassword = (token, password, confirmPassword) =>
  API.post(`/auth/reset-password/${token}`, { password, confirmPassword });

/**
 * registerUser (for testing/demo)
 * Creates a test user account.
 */
export const registerUser = (name, email, password) =>
  API.post("/auth/register", { name, email, password });

export default API;
