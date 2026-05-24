import React, { useState } from "react";
import { Link } from "react-router-dom";
import API from "../utils/api";

function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setFeedback(null);
    try {
      const res = await API.post("/auth/login", form);
      setFeedback({ type: "success", message: `Welcome back, ${res.data.name}! Login successful.` });
    } catch (err) {
      setFeedback({ 
  type: "error", 
  message: err.response?.data?.message || "Invalid email or password. Please try again." 
});
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-icon">
          <i className="fa-solid fa-right-to-bracket" />
        </div>
        <h1 className="auth-title">Welcome Back!</h1>
        <p className="auth-subtitle">Sign in to your account</p>

        {feedback && (
          <div className={`alert-custom alert-${feedback.type} mb-4`}>
            <i className={`fa-solid ${feedback.type === "success" ? "fa-circle-check" : "fa-circle-exclamation"}`} />
            <span>{feedback.message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-3">
            <label className="form-label">Email Address</label>
            <div className="input-group-wrapper">
              <i className="fa-solid fa-envelope input-icon" />
              <input type="email" name="email" className="form-control-custom"
                placeholder="you@example.com" value={form.email}
                onChange={handleChange} required autoFocus />
            </div>
          </div>
          <div className="mb-2">
            <label className="form-label">Password</label>
            <div className="input-group-wrapper">
              <i className="fa-solid fa-lock input-icon" />
              <input type={showPassword ? "text" : "password"} name="password"
                className="form-control-custom" placeholder="Enter your password"
                value={form.password} onChange={handleChange} required />
              <button type="button" className="toggle-password"
                onClick={() => setShowPassword(v => !v)}>
                <i className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"}`} />
              </button>
            </div>
          </div>

          {/* Forgot Password Link */}
          <div className="text-end mb-4">
            <Link to="/forgot-password" className="auth-link" style={{ fontSize: "13px" }}>
              Forgot Password?
            </Link>
          </div>

          <button type="submit" className="btn-primary-custom" disabled={isLoading}>
            {isLoading ? <><span className="spinner" />Signing In…</> : <><i className="fa-solid fa-right-to-bracket me-2" />Sign In</>}
          </button>
        </form>

        <div className="divider">or</div>
        <p className="text-center" style={{ fontSize: "14px", color: "var(--color-muted)" }}>
          Don't have an account?{" "}
          <Link to="/register" className="auth-link">Create Account</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;