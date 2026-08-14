/**
 * rowsToGeoJSON.js
 * Converts normalized tabular row arrays (from CSV/Excel after fieldMatcher)
 * into a GeoJSON FeatureCollection of Point features.
 *
 * COORDINATE ORDER:
 *   GeoJSON spec: [longitude, latitude]
 *   Human columns: latitude first, longitude second
 *   This file enforces [lng, lat] in all geometry.coordinates output.
 */

// Use browser's built-in crypto.randomUUID (available in all modern browsers + Vite)
function generateId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `feat_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Convert a single normalized row to a GeoJSON Feature.
 * Returns null if latitude/longitude are missing or non-numeric.
 *
 * @param {Object} row - Normalized row (canonical field names)
 * @param {string} layerId
 * @returns {Object|null} GeoJSON Feature or null
 */
function rowToFeature(row, layerId) {
  const lat = parseFloat(row.latitude);
  const lng = parseFloat(row.longitude);

  if (isNaN(lat) || isNaN(lng)) return null;

  return {
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [lng, lat], // GeoJSON: [longitude, latitude]
    },
    properties: {
      id: generateId(),
      feature_id: row.point_id || "",
      name: row.point_name || row.name || "",
      category: row.category || "Default",
      descr: row.descr || row.description || "",
      layerId,
      isPersisted: false, // pipeline sets this after save/view decision
    },
  };
}

/**
 * Convert an array of normalized rows to a GeoJSON FeatureCollection.
 * Skips rows that lack valid coordinates and returns them separately
 * so the UI can warn the user.
 *
 * @param {Array<Object>} rows - Normalized rows from applyMapping()
 * @param {string} layerId
 * @returns {{
 *   featureCollection: GeoJSONFeatureCollection,
 *   skippedRows: Array<Object>,
 * }}
 */
export function rowsToGeoJSON(rows, layerId) {
  const features = [];
  const skippedRows = [];

  for (const row of rows) {
    const feature = rowToFeature(row, layerId);
    if (feature) {
      features.push(feature);
    } else {
      skippedRows.push(row);
    }
  }

  return {
    featureCollection: {
      type: "FeatureCollection",
      features,
    },
    skippedRows,
  };
}
