/**
 * UploadControl.jsx
 * Drag-and-drop + click file upload widget for the left sidebar.
 * Handles file selection, type detection, parsing, field matching,
 * and opens the ConfirmationPreview modal.
 *
 * DIAGNOSTIC BUILD — console.log statements added at every stage.
 * Once we find where it breaks, strip these back out.
 */

import { useState, useRef, useCallback } from "react";
import { detectFileType, describeFileType, FILE_TYPES } from "../../utils/fileTypeDetect";
import { parseShapefile } from "../../utils/shapefileParse";
import { parseCSV, parseExcel } from "../../utils/csvExcelParse";
import { autoMatchFields, applyMapping } from "../../utils/fieldMatcher";
import { inferGeometryType } from "../../utils/geometryLabel";
import ConfirmationPreview from "./ConfirmationPreview";

export default function UploadControl() {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const inputRef = useRef(null);

  const processFile = useCallback(async (file) => {
    console.log("[upload] processFile() called with:", file?.name, file?.size, "bytes, type:", file?.type);

    setError(null);
    setIsLoading(true);

    try {
      const fileType = detectFileType(file);
      console.log("[upload] detectFileType() ->", fileType);

      if (fileType === FILE_TYPES.UNKNOWN) {
        throw new Error(
          "Unsupported file format. Please upload a .zip shapefile, .csv, .xlsx, or .geojson file."
        );
      }

      let geojson = null;
      let rawRows = null;
      let matchResult = null;

      if (fileType === FILE_TYPES.SHAPEFILE) {
        console.log("[upload] parsing as shapefile…");
        geojson = await parseShapefile(file);
        console.log("[upload] parseShapefile() returned:", geojson);
      } else if (fileType === FILE_TYPES.GEOJSON) {
        console.log("[upload] parsing as geojson…");
        const text = await file.text();
        geojson = JSON.parse(text);
        console.log("[upload] parsed geojson:", geojson);
        if (!geojson.features) throw new Error("Invalid GeoJSON: missing features array.");
      } else {
        console.log("[upload] parsing as tabular (csv/excel)…");
        // CSV or Excel → tabular rows
        rawRows =
          fileType === FILE_TYPES.CSV
            ? await parseCSV(file)
            : await parseExcel(file);

        console.log("[upload] parsed rows:", rawRows?.length, rawRows?.slice(0, 2));

        if (!rawRows || rawRows.length === 0) {
          throw new Error("The file appears to be empty.");
        }

        const headers = Object.keys(rawRows[0]);
        console.log("[upload] detected headers:", headers);
        matchResult = autoMatchFields(headers);
        console.log("[upload] field match result:", matchResult);
      }

      const nextPreviewData = {
        file,
        fileType,
        geojson,          // set for shapefile/geojson paths
        rawRows,          // set for csv/excel paths
        matchResult,      // set for csv/excel paths
        geometryType: geojson
          ? inferGeometryType(geojson.features)
          : "Point",      // tabular data → always Point
        recordCount: geojson
          ? geojson.features.length
          : rawRows?.length ?? 0,
      };

      console.log("[upload] setting previewData -> modal should open now:", nextPreviewData);
      setPreviewData(nextPreviewData);
    } catch (err) {
      console.error("[upload] processFile() threw:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
      console.log("[upload] processFile() finished, isLoading -> false");
    }
  }, []);

  // ─── Drag events ─────────────────────────────────────────────────────────

  const onDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const onDragLeave = () => setIsDragging(false);
  const onDrop = (e) => {
    e.preventDefault();
    console.log("[upload] onDrop fired. dataTransfer.files:", e.dataTransfer.files, "length:", e.dataTransfer.files?.length);
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    } else {
      console.warn("[upload] onDrop fired but no file was in dataTransfer.files — this is the bug if you see this line.");
    }
  };
  const onFileChange = (e) => {
    console.log("[upload] onFileChange fired. target.files:", e.target.files, "length:", e.target.files?.length);
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    } else {
      console.warn("[upload] onFileChange fired but no file was selected — dialog was likely cancelled.");
    }
    e.target.value = ""; // reset input so same file can be re-selected
  };

  return (
    <>
      <div
        className={`upload-control ${isDragging ? "upload-control--dragging" : ""} ${isLoading ? "upload-control--loading" : ""}`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => {
          console.log("[upload] dropzone clicked, isLoading:", isLoading);
          if (!isLoading) inputRef.current?.click();
        }}
        role="button"
        tabIndex={0}
        aria-label="Upload geographic data file"
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        id="upload-dropzone"
      >
        <input
          ref={inputRef}
          type="file"
          accept=".zip,.csv,.xlsx,.xls,.geojson,.json"
          style={{ display: "none" }}
          onChange={onFileChange}
          id="upload-file-input"
        />

        {isLoading ? (
          <div className="upload-control__spinner" aria-live="polite">
            <span className="spinner" />
            <p>Parsing file…</p>
          </div>
        ) : (
          <div className="upload-control__content">
            <div className="upload-control__icon" aria-hidden="true">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <p className="upload-control__label">
              <strong>Drop a file here</strong> or click to browse
            </p>
            <p className="upload-control__hint">
              Shapefile (.zip), CSV, Excel, GeoJSON
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="upload-control__error" role="alert" id="upload-error-message">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
          </svg>
          {error}
        </div>
      )}

      {previewData && (
        <ConfirmationPreview
          previewData={previewData}
          onClose={() => setPreviewData(null)}
        />
      )}
    </>
  );
}