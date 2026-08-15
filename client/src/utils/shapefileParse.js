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
 * Parse a Shapefile (.zip, standalone .shp, or group of component files) into a GeoJSON FeatureCollection.
 * @param {File | File[] | FileList | Object} input - File object, list of component files, or shp object
 * @returns {Promise<GeoJSONFeatureCollection>}
 */
export async function parseShapefile(input) {
  let geojson = null;

  // Case 1: Array of files or FileList (e.g. user selected multiple files like .shp, .dbf, .prj)
  if (Array.isArray(input) || (typeof FileList !== "undefined" && input instanceof FileList)) {
    const fileArray = Array.from(input);
    const shpFile = fileArray.find((f) => f.name.toLowerCase().endsWith(".shp"));
    const zipFile = fileArray.find((f) => f.name.toLowerCase().endsWith(".zip"));

    if (zipFile) {
      const buffer = await zipFile.arrayBuffer();
      geojson = await shpjs(buffer);
    } else if (shpFile) {
      const baseName = shpFile.name.slice(0, -4).toLowerCase();
      const dbfFile = fileArray.find((f) => f.name.toLowerCase() === `${baseName}.dbf` || f.name.toLowerCase().endsWith(".dbf"));
      const prjFile = fileArray.find((f) => f.name.toLowerCase() === `${baseName}.prj` || f.name.toLowerCase().endsWith(".prj"));

      const shpBuffer = await shpFile.arrayBuffer();
      const dbfBuffer = dbfFile ? await dbfFile.arrayBuffer() : undefined;
      const prjBuffer = prjFile ? await prjFile.arrayBuffer() : undefined;

      const shapeObj = { shp: shpBuffer };
      if (dbfBuffer) shapeObj.dbf = dbfBuffer;
      if (prjBuffer) shapeObj.prj = prjBuffer;

      geojson = await shpjs(shapeObj);
    } else {
      throw new Error("No valid .shp or .zip file found among selected files.");
    }
  }
  // Case 2: Single File object (.zip or .shp)
  else if (input instanceof File || input instanceof Blob) {
    const fileName = input.name.toLowerCase();
    if (fileName.endsWith(".shp")) {
      const shpBuffer = await input.arrayBuffer();
      geojson = await shpjs({ shp: shpBuffer });
    } else {
      // .zip file
      const buffer = await input.arrayBuffer();
      geojson = await shpjs(buffer);
    }
  }
  // Case 3: Raw ArrayBuffer or shpjs object
  else if (input && typeof input === "object") {
    geojson = await shpjs(input);
  } else {
    throw new Error("Invalid shapefile input provided.");
  }

  // shpjs may return a single FeatureCollection or an array (multi-layer zip)
  // Normalize to single FeatureCollection
  if (Array.isArray(geojson)) {
    const features = geojson.flatMap((fc) => fc.features || []);
    return {
      type: "FeatureCollection",
      features,
    };
  }

  return geojson;
}
