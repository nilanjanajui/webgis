/**
 * AuthModal.jsx — Premium Dual-Pane Auth Experience
 * Glassmorphic login & registration modal with GIS spatial radar showcase,
 * password eye toggle, strength indicator, and 1-click Recruiter Demo mode.
 */

import { useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../../state/authStore";

export default function AuthModal({ onClose }) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Password strength calculation
  const getPasswordStrength = () => {
    if (!password) return { width: "0%", color: "transparent", text: "" };
    if (password.length < 6) return { width: "30%", color: "#F43F5E", text: "Weak" };
    if (password.length < 10) return { width: "65%", color: "#F59E0B", text: "Medium" };
    return { width: "100%", color: "#10B981", text: "Strong" };
  };

  const strength = getPasswordStrength();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      if (mode === "login") {
        await login(username, password);
      } else {
        await register(username, password);
      }
      onClose();
    } catch (err) {
      setError(err.message || "Authentication failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecruiterDemo = async () => {
    setError(null);
    setIsSubmitting(true);
    // Auto-login or register demo recruiter credentials
    const demoUser = "recruiter_guest";
    const demoPass = "demo1234";
    try {
      await login(demoUser, demoPass);
      onClose();
    } catch {
      try {
        await register(demoUser, demoPass);
        onClose();
      } catch (err) {
        setError(err.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div
      className="auth-showcase-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-title"
      id="auth-modal"
      onClick={(e) => e.target.className === "auth-showcase-overlay" && onClose()}
    >
      <div className="auth-showcase-card">
        {/* Left Visual Panel — Interactive GIS Radar Showcase */}
        <div className="auth-showcase-visual">
          <div className="auth-showcase-visual__bg" />

          <div className="auth-showcase-visual__brand">
            <div className="auth-showcase-visual__icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
              </svg>
            </div>
            <span className="auth-showcase-visual__title">WebGIS Engine</span>
          </div>

          <div className="auth-showcase-visual__radar">
            <div className="radar-ring">
              <div className="radar-center-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <polygon points="12 2 2 7 12 12 22 7 12 2" />
                  <polyline points="2 17 12 22 22 17" />
                  <polyline points="2 12 12 17 22 12" />
                </svg>
              </div>
            </div>
            <div className="auth-showcase-visual__tagline">Next-Gen Spatial Analytics</div>
            <div className="auth-showcase-visual__desc">
              Real-time vector layers, boundary polygon synthesis & automated shapefile exports.
            </div>
          </div>

          <div className="auth-showcase-visual__pills">
            <span className="tech-pill tech-pill--accent">★ Award Winning UI</span>
            <span className="tech-pill">React 19</span>
            <span className="tech-pill">Leaflet Pro</span>
            <span className="tech-pill">GeoJSON / SHP</span>
          </div>
        </div>

        {/* Right Form Panel — Dual-Tab Login / Register */}
        <div className="auth-showcase-form">
          <button
            className="auth-showcase-close"
            onClick={onClose}
            aria-label="Close modal"
            id="auth-modal-close"
          >
            ✕
          </button>

          {/* Navigation Tabs */}
          <div className="auth-tabs">
            <button
              className={`auth-tab-btn ${mode === "login" ? "auth-tab-btn--active" : ""}`}
              onClick={() => { setMode("login"); setError(null); }}
              type="button"
              id="auth-tab-login"
            >
              Sign In
            </button>
            <button
              className={`auth-tab-btn ${mode === "register" ? "auth-tab-btn--active" : ""}`}
              onClick={() => { setMode("register"); setError(null); }}
              type="button"
              id="auth-tab-register"
            >
              Create Account
            </button>
          </div>

          <h2 id="auth-title" style={{ fontSize: "1.35rem", fontWeight: 700, marginBottom: "0.25rem" }}>
            {mode === "login" ? "Welcome back!" : "Join WebGIS Explorer"}
          </h2>
          <p style={{ fontSize: "0.82rem", color: "var(--color-slate)", marginBottom: "1.25rem" }}>
            {mode === "login"
              ? "Access vector layer tools and spatial data analytics."
              : "Register to save custom boundaries and vector points."}
          </p>

          <form onSubmit={handleSubmit}>
            {/* Username Input */}
            <div className="auth-input-group">
              <label htmlFor="auth-username">Username</label>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </span>
                <input
                  id="auth-username"
                  className="auth-input"
                  type="text"
                  placeholder="e.g. gis_explorer"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  minLength={3}
                  maxLength={30}
                  required
                  autoFocus
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="auth-input-group">
              <label htmlFor="auth-password">Password</label>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                </span>
                <input
                  id="auth-password"
                  className="auth-input"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  required
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                />
                <button
                  type="button"
                  className="auth-input-eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Password strength meter for registration */}
              {mode === "register" && password && (
                <div style={{ marginTop: "0.4rem" }}>
                  <div className="password-meter">
                    <div
                      className="password-meter__bar"
                      style={{ width: strength.width, background: strength.color }}
                    />
                  </div>
                  <div style={{ fontSize: "0.72rem", color: strength.color, marginTop: "0.25rem", textAlign: "right", fontWeight: 600 }}>
                    Strength: {strength.text}
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="auth-error-alert" id="auth-error">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="btn-auth-submit"
              disabled={isSubmitting}
              id="auth-submit-btn"
            >
              {isSubmitting ? (
                <span>Connecting…</span>
              ) : (
                <>
                  <span>{mode === "login" ? "Sign In to Explorer" : "Create Account"}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </>
              )}
            </button>

            {/* Recruiter Quick Demo Access Button */}
            <button
              type="button"
              className="btn-recruiter-demo"
              onClick={handleRecruiterDemo}
              disabled={isSubmitting}
              id="recruiter-demo-btn"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              <span>1-Click Recruiter Demo Access</span>
            </button>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
}