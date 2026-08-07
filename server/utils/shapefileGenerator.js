/**
 * Stub for server-side shapefile generation.
 * In this project, exports are primarily generated client-side using shp-write.
 */
function generateShapefile(features) {
  // Logic to convert JSON to shapefile buffer/zip could go here
  throw new Error("Server-side shapefile generation not implemented. Use client-side generation.");
}

module.exports = {
  generateShapefile
};
