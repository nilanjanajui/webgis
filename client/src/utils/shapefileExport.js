/**
 * shapefileExport.js
 * Exports all visible features from layersStore to a Shapefile .zip download.
 * Uses @mapbox/shp-write to generate the shapefile bundle.
 *
 * DBF column name limit: 10 characters max.
 */

/**
 * Convert a feature's geometry to a standardized GeoJSON Feature object.
 * Extracts properties from both top-level feature keys and feature.properties,
 * ensuring DBF column name compatibility (max 10 chars).
 */
function toGeoJSONFeature(feature) {
  const props = { ...feature, ...(feature.properties || {}) };
  const cleanProps = {};

  // Standard assignment fields with fallback checks
  cleanProps.point_id = String(
    feature.feature_id ||
    feature.id ||
    props.Point_ID ||
    props.point_id ||
    props.ID ||
    props.id ||
    ""
  ).slice(0, 10);

  cleanProps.point_name = String(
    feature.name ||
    feature.point_name ||
    props.Point_Name ||
    props.point_name ||
    props.Name ||
    props.name ||
    ""
  ).slice(0, 100);

  cleanProps.category = String(
    feature.category ||
    props.Category ||
    props.category ||
    ""
  ).slice(0, 10);

  cleanProps.descr = String(
    feature.descr ||
    feature.description ||
    props.Description ||
    props.descr ||
    ""
  ).slice(0, 100);

  const SKIP_EXPORT_KEYS = new Set([
    "id", "layerId", "isPersisted", "geometry", "properties",
    "_id", "__v", "createdBy", "layer_type",
    "point_id", "point_name", "name", "category", "descr", "description"
  ]);

  // Copy any additional custom properties, truncating keys to 10 chars max for DBF
  for (const [key, val] of Object.entries(props)) {
    if (SKIP_EXPORT_KEYS.has(key)) continue;
    const dbfKey = key.slice(0, 10);
    if (!(dbfKey in cleanProps)) {
      if (val === null || val === undefined) {
        cleanProps[dbfKey] = "";
      } else if (typeof val === "object") {
        cleanProps[dbfKey] = JSON.stringify(val).slice(0, 100);
      } else {
        cleanProps[dbfKey] = String(val).slice(0, 100);
      }
    }
  }

  return {
    type: "Feature",
    geometry: feature.geometry,
    properties: cleanProps,
  };
}

/**
 * Export all visible features from a list of layers as a Shapefile .zip.
 * @param {Array} layers - Layer objects from layersStore
 * @param {string} [filename="export"] - Base filename without extension
 */
export async function exportShapefile(layers, filename = "webgis_export") {
  const visibleLayers = (layers || []).filter((l) => l.isVisible && l.features?.length);

  if (!visibleLayers.length) {
    alert("No visible features to export. Make sure your layer visibility is enabled in the left sidebar.");
    return;
  }

  // Flatten all features with valid geometry
  const features = visibleLayers.flatMap((l) =>
    (l.features || [])
      .filter((f) => f && f.geometry && f.geometry.type && f.geometry.coordinates)
      .map(toGeoJSONFeature)
  );

  if (!features.length) {
    alert("No features with valid geometry found to export.");
    return;
  }

  const geojson = { type: "FeatureCollection", features };

  const options = {
    folder: filename,
    filename,
    outputType: "blob",
    compression: "DEFLATE",
  };

  try {
    const mod = await import("@mapbox/shp-write");
    const shpwrite = mod.default || mod;
    const zipFn = typeof shpwrite === "function" ? shpwrite : (shpwrite.zip || mod.zip);

    if (typeof zipFn !== "function") {
      throw new Error("Shapefile writer library failed to load correctly.");
    }

    const zipData = await zipFn(geojson, options);

    let blob;
    if (zipData instanceof Blob) {
      blob = zipData;
    } else if (typeof zipData === "string") {
      const binaryString = atob(zipData);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      blob = new Blob([bytes.buffer], { type: "application/zip" });
    } else if (zipData instanceof ArrayBuffer || ArrayBuffer.isView(zipData)) {
      const buffer = zipData.buffer || zipData;
      blob = new Blob([buffer], { type: "application/zip" });
    } else {
      throw new Error("Unrecognized shapefile output format.");
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (err) {
    console.error("Shapefile export failed:", err);
    alert(`Export failed: ${err.message || err}`);
  }
}