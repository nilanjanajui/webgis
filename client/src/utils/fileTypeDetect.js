/**
 * fileTypeDetect.js
 * Detects the format of an uploaded file from its name/extension.
 * Returns a normalized type string consumed by the parse pipeline.
 */

export const FILE_TYPES = {
  SHAPEFILE: "shapefile",  // .zip containing .shp/.dbf/.prj
  CSV: "csv",
  EXCEL: "excel",          // .xlsx / .xls
  GEOJSON: "geojson",      // .geojson or .json
  UNKNOWN: "unknown",
};

/**
 * Detects file type from a File object.
 * @param {File} file
 * @returns {string} One of FILE_TYPES values
 */
export function detectFileType(file) {
  if (!file?.name) return FILE_TYPES.UNKNOWN;

  const name = file.name.toLowerCase();

  if (name.endsWith(".zip")) return FILE_TYPES.SHAPEFILE;
  if (name.endsWith(".csv")) return FILE_TYPES.CSV;
  if (name.endsWith(".xlsx") || name.endsWith(".xls")) return FILE_TYPES.EXCEL;
  if (name.endsWith(".geojson") || name.endsWith(".json")) return FILE_TYPES.GEOJSON;

  // MIME type fallback
  const mime = file.type || "";
  if (mime.includes("zip")) return FILE_TYPES.SHAPEFILE;
  if (mime.includes("csv") || mime.includes("text/plain")) return FILE_TYPES.CSV;
  if (mime.includes("spreadsheet") || mime.includes("excel")) return FILE_TYPES.EXCEL;
  if (mime.includes("json")) return FILE_TYPES.GEOJSON;

  return FILE_TYPES.UNKNOWN;
}

/**
 * Returns a human-readable format label for display in the upload UI.
 * @param {string} fileType - One of FILE_TYPES values
 * @returns {string}
 */
export function describeFileType(fileType) {
  const labels = {
    [FILE_TYPES.SHAPEFILE]: "Shapefile (.zip)",
    [FILE_TYPES.CSV]: "CSV Spreadsheet",
    [FILE_TYPES.EXCEL]: "Excel Spreadsheet",
    [FILE_TYPES.GEOJSON]: "GeoJSON / JSON",
    [FILE_TYPES.UNKNOWN]: "Unknown Format",
  };
  return labels[fileType] || "Unknown Format";
}
