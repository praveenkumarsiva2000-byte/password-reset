import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../utils/api";

function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setFeedback(null);
    try {
      const res = await registerUser(form.name, form.email, form.password);
      setFeedback({ type: "success", message: res.data.message });
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-icon">
          <i className="fa-solid fa-user-plus" />
        </div>
        <h1 className="auth-title">Create Account</h1>
        <p className="auth-subtitle">Join us today — it's free!</p>

        {feedback && (
          <div className={`alert-custom alert-${feedback.type} mb-4`}>
            <i className={`fa-solid ${feedback.type === "success" ? "fa-circle-check" : "fa-circle-exclamation"}`} />
            <span>{feedback.message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-3">
            <label className="form-label">Full Name</label>
            <div className="input-group-wrapper">
              <i className="fa-solid fa-user input-icon" />
              <input type="text" name="name" className="form-control-custom"
                placeholder="John Doe" value={form.name}
                onChange={handleChange} required autoFocus />
            </div>
          </div>
          <div className="mb-3">
            <label className="form-label">Email Address</label>
            <div className="input-group-wrapper">
              <i className="fa-solid fa-envelope input-icon" />
              <input type="email" name="email" className="form-control-custom"
                placeholder="you@example.com" value={form.email}
                onChange={handleChange} required />
            </div>
          </div>
          <div className="mb-4">
            <label className="form-label">Password</label>
            <div className="input-group-wrapper">
              <i className="fa-solid fa-lock input-icon" />
              <input type="password" name="password" className="form-control-custom"
                placeholder="Min 6 characters" value={form.password}
                onChange={handleChange} required />
            </div>
          </div>
          <button type="submit" className="btn-primary-custom" disabled={isLoading}>
            {isLoading ? <><span className="spinner" />Creating Account…</> : <><i className="fa-solid fa-user-plus me-2" />Create Account</>}
          </button>
        </form>

        <div className="divider">or</div>
        <p className="text-center" style={{ fontSize: "14px", color: "var(--color-muted)" }}>
          Already have an account?{" "}
          <Link to="/login" className="auth-link">Sign In</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;