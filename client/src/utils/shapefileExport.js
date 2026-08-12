/**
 * shapefileExport.js
 * Exports all visible features from layersStore to a Shapefile .zip download.
 * Uses shp-write to generate the shapefile bundle.
 *
 * DBF column name limit: 10 characters max — uses internal field names from fieldLabels.
 *
 * shp-write is dynamically imported inside exportShapefile() rather than at
 * the top of this file, so it's only fetched when someone actually clicks
 * "Export Shapefile" — keeps it out of the initial page-load bundle.
 */

/**
 * Convert a feature's geometry to a GeoJSON Feature object.
 * Ensures [longitude, latitude] coordinate order (GeoJSON spec).
 */
function toGeoJSONFeature(feature) {
  return {
    type: "Feature",
    geometry: feature.geometry,
    properties: {
      point_id: (feature.feature_id || feature.id || "").toString().slice(0, 10),
      point_name: (feature.name || "").slice(0, 100),
      category: (feature.category || "").slice(0, 10),
      descr: (feature.descr || feature.description || "").slice(0, 100),
      layer_id: (feature.layerId || "").slice(0, 10),
    },
  };
}

/**
 * Export all visible features from a list of layers as a Shapefile .zip.
 * @param {Array} layers - Layer objects from layersStore
 * @param {string} [filename="export"] - Base filename without extension
 */
export async function exportShapefile(layers, filename = "export") {
  const visibleLayers = layers.filter((l) => l.isVisible && l.features?.length);

  if (!visibleLayers.length) {
    alert("No visible features to export.");
    return;
  }

  // Flatten all features
  const features = visibleLayers.flatMap((l) =>
    (l.features || []).filter((f) => f.geometry).map(toGeoJSONFeature)
  );

  if (!features.length) {
    alert("No features with valid geometry to export.");
    return;
  }

  const geojson = { type: "FeatureCollection", features };

  const options = {
    folder: filename,
    filename,
    outputType: "blob",
    compression: "DEFLATE",
    types: {
      point: filename,
      polygon: filename,
      line: filename,
    },
  };

  try {
    const shpwrite = (await import("@mapbox/shp-write")).default;
    const blob = await shpwrite.zip(geojson, options);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.zip`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Shapefile export failed:", err);
    alert(`Export failed: ${err.message}`);
  }
}