/**
 * AuthModal.jsx
 * Login / register modal. Portaled to document.body — same pattern as
 * ConfirmationPreview.jsx — so it can never get trapped inside a parent's
 * CSS stacking context (see the .left-sidebar z-index bug fixed earlier).
 */

import { useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../../state/authStore";

export default function AuthModal({ onClose }) {
    const { login, register } = useAuth();
    const [mode, setMode] = useState("login"); // "login" | "register"
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

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
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return createPortal(
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="auth-title" id="auth-modal">
            <div className="modal-panel" style={{ maxWidth: "380px" }}>
                <div className="modal-header">
                    <h2 id="auth-title">{mode === "login" ? "Log In" : "Create Account"}</h2>
                    <button className="modal-close" onClick={onClose} aria-label="Close" id="auth-modal-close">✕</button>
                </div>

                <form onSubmit={handleSubmit} style={{ padding: "1.25rem 1.6rem" }}>
                    <div className="point-form__fields">
                        <label htmlFor="auth-username">Username</label>
                        <input
                            id="auth-username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            minLength={3}
                            maxLength={30}
                            required
                            autoFocus
                            autoComplete="username"
                        />

                        <label htmlFor="auth-password">Password</label>
                        <input
                            id="auth-password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            minLength={6}
                            required
                            autoComplete={mode === "login" ? "current-password" : "new-password"}
                        />
                    </div>

                    {error && <p className="point-form__error" id="auth-error">{error}</p>}

                    <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
                        <button type="submit" className="btn btn--primary" disabled={isSubmitting} id="auth-submit-btn" style={{ flex: 1 }}>
                            {isSubmitting ? "Please wait…" : mode === "login" ? "Log In" : "Create Account"}
                        </button>
                    </div>

                    <p style={{ fontSize: "0.8rem", color: "var(--color-slate)", marginTop: "0.85rem", textAlign: "center" }}>
                        {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
                        <button
                            type="button"
                            onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(null); }}
                            id="auth-mode-toggle"
                            style={{ background: "none", border: "none", color: "var(--color-teal)", fontWeight: 600, cursor: "pointer", padding: 0 }}
                        >
                            {mode === "login" ? "Create one" : "Log in"}
                        </button>
                    </p>
                </form>
            </div>
        </div>,
        document.body
    );
}