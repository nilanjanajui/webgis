/**
 * Geometry type utilities.
 * Normalizes GeoJSON geometry type strings into clean UI-friendly labels.
 */

const GEOMETRY_LABEL_MAP = {
  point: "Point",
  multipoint: "Multipoint",
  linestring: "Polyline",
  multilinestring: "Polyline",
  polygon: "Polygon",
  multipolygon: "Polygon",
  geometrycollection: "Mixed",
};

/**
 * Returns a human-readable geometry label for UI display.
 * @param {string} type - Raw GeoJSON geometry type string
 * @returns {string} Cleaned label ("Point", "Polyline", "Polygon", etc.)
 */
export function describeGeometry(type) {
  if (!type) return "Unknown";
  return GEOMETRY_LABEL_MAP[type.toLowerCase()] || type;
}

/**
 * Infers geometry type from an array of GeoJSON features.
 * Returns the dominant type, or "Mixed" if more than one type exists.
 * @param {Array} features - GeoJSON feature array
 * @returns {string}
 */
export function inferGeometryType(features) {
  if (!features || features.length === 0) return "Unknown";
  const types = new Set(
    features
      .map((f) => f?.geometry?.type)
      .filter(Boolean)
      .map((t) => describeGeometry(t))
  );
  if (types.size === 1) return [...types][0];
  return "Mixed";
}
