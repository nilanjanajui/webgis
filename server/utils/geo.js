/**
 * Converts human-readable [latitude, longitude] arrays into GeoJSON-required [longitude, latitude] arrays.
 * Works recursively for Points, LineStrings, and Polygons.
 */
function toGeoJSONCoords(coords) {
  if (!Array.isArray(coords)) return coords;
  
  // If it's a simple pair of numbers, swap them (assuming it's [lat, lng])
  if (coords.length === 2 && typeof coords[0] === 'number') {
    return [coords[1], coords[0]];
  }

  // Recursive call for nested arrays (LineStrings, Polygons)
  return coords.map(toGeoJSONCoords);
}

/**
 * Converts GeoJSON-required [longitude, latitude] arrays back to human-readable [latitude, longitude].
 */
function fromGeoJSONCoords(coords) {
  if (!Array.isArray(coords)) return coords;
  
  // If it's a simple pair of numbers, swap them (assuming it's [lng, lat])
  if (coords.length === 2 && typeof coords[0] === 'number') {
    return [coords[1], coords[0]];
  }

  // Recursive call for nested arrays (LineStrings, Polygons)
  return coords.map(fromGeoJSONCoords);
}

module.exports = {
  toGeoJSONCoords,
  fromGeoJSONCoords
};
