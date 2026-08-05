/**
 * shapefileParse.js
 * Parses a Shapefile .zip (containing .shp + .dbf + optional .prj)
 * into a GeoJSON FeatureCollection using the shpjs library.
 *
 * IMPORTANT — coordinate order:
 *   shpjs returns [longitude, latitude] — this matches GeoJSON spec.
 *   Do NOT flip coordinates here. The single conversion point is in utils/geo.js (backend).
 */

import shpjs from "shpjs";

/**
 * Parse a Shapefile zip File object into a GeoJSON FeatureCollection.
 * @param {File} file - A .zip File object
 * @returns {Promise<GeoJSONFeatureCollection>}
 */
export async function parseShapefile(file) {
  const arrayBuffer = await file.arrayBuffer();
  const geojson = await shpjs(arrayBuffer);

  // shpjs may return a single FeatureCollection or an array (multi-layer zip)
  // Normalize to single FeatureCollection
  if (Array.isArray(geojson)) {
    // Flatten all features from all layers
    const features = geojson.flatMap((fc) => fc.features || []);
    return {
      type: "FeatureCollection",
      features,
    };
  }

  return geojson;
}
