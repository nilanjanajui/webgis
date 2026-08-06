/**
 * API service layer.
 * All HTTP calls to the backend go through here.
 * Base URL reads from Vite env variable; falls back to localhost:5000.
 */

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

async function request(method, path, body = null) {
  const options = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`${BASE_URL}${path}`, options);

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || `HTTP ${res.status}`);
  }

  // 204 No Content
  if (res.status === 204) return null;
  return res.json();
}

// ─── Features ────────────────────────────────────────────────────────────────

/**
 * Fetch all persisted features from the database.
 * @returns {Promise<Array>}
 */
export async function getFeatures() {
  return request("GET", "/features");
}

/**
 * Create a single feature in the database.
 * @param {Object} feature - Feature object matching the agreed shape
 * @returns {Promise<Object>}
 */
export async function createFeature(feature) {
  return request("POST", "/features", feature);
}

/**
 * Create multiple features in one request (batch upload).
 * @param {Array} features
 * @returns {Promise<Array>}
 */
export async function createBatchFeatures(features) {
  return request("POST", "/features/batch", { features });
}

/**
 * Delete a single feature by its ID.
 * @param {string} id
 * @returns {Promise<null>}
 */
export async function deleteFeature(id) {
  return request("DELETE", `/features/${id}`);
}

// ─── Layers ──────────────────────────────────────────────────────────────────

/**
 * Delete all features belonging to a layer by layerId.
 * @param {string} layerId
 * @returns {Promise<null>}
 */
export async function deleteLayer(layerId) {
  return request("DELETE", `/features/layer/${layerId}`);
}

// ─── Boundary ────────────────────────────────────────────────────────────────

/**
 * Fetch the saved boundary polygon from the database.
 * @returns {Promise<Object|null>}
 */
export async function getBoundary() {
  return request("GET", "/boundary");
}

/**
 * Save or overwrite the boundary polygon.
 * @param {Object} geojsonPolygon - GeoJSON Polygon geometry
 * @returns {Promise<Object>}
 */
export async function saveBoundary(geojsonPolygon) {
  return request("POST", "/boundary", { geometry: geojsonPolygon });
}
