/**
 * authStore.jsx
 * Minimal auth state: current user, login/register/logout, and session
 * restore on page load (validates any stored token against /auth/me).
 *
 * Deliberately small — this app has no per-user data (everyone shares the
 * same saved layers/boundary, per the project's collaborative design), so
 * the only thing auth gates is *who is allowed to write*, not who can see what.
 */

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
    login as apiLogin,
    register as apiRegister,
    getCurrentUser,
    getToken,
    setToken,
} from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isCheckingSession, setIsCheckingSession] = useState(true);

    // On mount: if a token is already stored, validate it and restore the session.
    useEffect(() => {
        const token = getToken();
        if (!token) {
            setIsCheckingSession(false);
            return;
        }
        getCurrentUser()
            .then((res) => setUser(res.user))
            .catch(() => setToken(null)) // stale/expired token — clear it silently
            .finally(() => setIsCheckingSession(false));
    }, []);

    const login = useCallback(async (username, password) => {
        const res = await apiLogin(username, password);
        setToken(res.token);
        setUser(res.user);
        return res.user;
    }, []);

    const register = useCallback(async (username, password) => {
        const res = await apiRegister(username, password);
        setToken(res.token);
        setUser(res.user);
        return res.user;
    }, []);

    const logout = useCallback(() => {
        setToken(null);
        setUser(null);
    }, []);

    return (
        <AuthContext.Provider value={{ user, isLoggedIn: !!user, isCheckingSession, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
    return ctx;
}