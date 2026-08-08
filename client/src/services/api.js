/**
 * API service layer.
 * All HTTP calls to the backend go through here.
 * Base URL reads from Vite env variable; falls back to localhost:5000.
 */

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const TOKEN_KEY = "webgis-auth-token";

// ─── Token storage ──────────────────────────────────────────────────────────
// Simple localStorage read here (not React state) so every api.js call can
// attach it automatically, without every caller having to pass it in.

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request(method, path, body = null) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`${BASE_URL}${path}`, options);

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || err.error || `HTTP ${res.status}`);
  }

  // 204 No Content
  if (res.status === 204) return null;
  return res.json();
}

// ─── Auth ────────────────────────────────────────────────────────────────────

/**
 * Register a new account. Returns { token, user }.
 * @param {string} username
 * @param {string} password
 */
export async function register(username, password) {
  return request("POST", "/auth/register", { username, password });
}

/**
 * Log in to an existing account. Returns { token, user }.
 * @param {string} username
 * @param {string} password
 */
export async function login(username, password) {
  return request("POST", "/auth/login", { username, password });
}

/**
 * Validate the currently stored token and fetch the current user.
 * Used on page load to restore a session. Throws if the token is
 * missing/expired/invalid — caller should treat that as "logged out".
 */
export async function getCurrentUser() {
  return request("GET", "/auth/me");
}

// ─── Features ────────────────────────────────────────────────────────────────

/**
 * Fetch all persisted features from the database. Public — no login required.
 * @returns {Promise<Array>}
 */
export async function getFeatures() {
  return request("GET", "/features");
}

/**
 * Create a single feature in the database. Requires login.
 * @param {Object} feature - Feature object matching the agreed shape
 * @returns {Promise<Object>}
 */
export async function createFeature(feature) {
  return request("POST", "/features", feature);
}

/**
 * Create multiple features in one request (batch upload). Requires login.
 * @param {Array} features
 * @returns {Promise<Array>}
 */
export async function createBatchFeatures(features) {
  return request("POST", "/features/batch", { features });
}

/**
 * Delete a single feature by its ID. Requires login.
 * @param {string} id
 * @returns {Promise<null>}
 */
export async function deleteFeature(id) {
  return request("DELETE", `/features/${id}`);
}

// ─── Layers ──────────────────────────────────────────────────────────────────

/**
 * Delete all features belonging to a layer by layerId. Requires login.
 * @param {string} layerId
 * @returns {Promise<null>}
 */
export async function deleteLayer(layerId) {
  return request("DELETE", `/features/layer/${layerId}`);
}

// ─── Boundary ────────────────────────────────────────────────────────────────

/**
 * Fetch the saved boundary polygon from the database. Public — no login required.
 * @returns {Promise<Object|null>}
 */
export async function getBoundary() {
  return request("GET", "/boundary");
}

/**
 * Save or overwrite the boundary polygon. Requires login.
 * @param {Object} geojsonPolygon - GeoJSON Polygon geometry
 * @returns {Promise<Object>}
 */
export async function saveBoundary(geojsonPolygon) {
  return request("POST", "/boundary", { geometry: geojsonPolygon });
}