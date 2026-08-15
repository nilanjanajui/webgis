/**
 * ConfirmationPreview.jsx
 * Modal shown after a file is parsed. Displays:
 *  - Detected file type, geometry type, and record count
 *  - Preview table of first 5 rows / features
 *  - FieldMismatchWarning if auto-matching found problems
 *  - "Save to Project" (writes to MongoDB via API) vs "View Only" (session state) choice
 */

import { useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { useLayersStore } from "../../state/layersStore";
import { useAuth } from "../../state/authStore";
import { applyMapping } from "../../utils/fieldMatcher";
import { rowsToGeoJSON } from "../../utils/rowsToGeoJSON";
import { describeFileType } from "../../utils/fileTypeDetect";
import { getFieldLabel } from "../../constants/fieldLabels";
import { createBatchFeatures } from "../../services/api";
import FieldMismatchWarning from "./FieldMismatchWarning";

function generateLayerId() {
  return `layer_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

function buildLayerFromGeoJSON(geojson, file, layerId, isPersisted) {
  return {
    id: layerId,
    name: file.name.replace(/\.[^/.]+$/, ""), // strip extension
    geometryType: geojson.features[0]?.geometry?.type || "Unknown",
    isPersisted,
    isVisible: true,
    color: "#FF3B30",
    features: geojson.features.map((f, index) => {
      const props = f.properties || {};
      return {
        feature_id: props.feature_id || props.point_id || props.Point_ID || props.ID || props.id || `SHP_${index + 1}`,
        name: props.name || props.point_name || props.Point_Name || props.Name || `Feature ${index + 1}`,
        category: props.category || props.Category || "Default",
        descr: props.descr || props.description || props.Description || "Uploaded vector geometry",
        ...props,
        id: props.id || `feat_${Math.random().toString(36).slice(2)}`,
        geometry: f.geometry,
        layerId,
        isPersisted,
      };
    }),
    recordCount: geojson.features.length,
  };
}

export default function ConfirmationPreview({ previewData, onClose }) {
  const { addLayer } = useLayersStore();
  const { isLoggedIn } = useAuth();
  const [userMapping, setUserMapping] = useState(previewData.matchResult?.mapping || {});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const { file, fileType, geojson, rawRows, matchResult, geometryType, recordCount } = previewData;

  const isSingleShpNoDbf =
    file?.name?.toLowerCase().endsWith(".shp") &&
    geojson?.features?.every((f) => !f.properties || Object.keys(f.properties).length === 0);

  // Build preview rows for the table
  const previewRows = (() => {
    if (geojson) {
      return geojson.features.slice(0, 5).map((f, index) => {
        const props = f.properties || {};
        return {
          feature_id: props.feature_id || props.point_id || props.Point_ID || props.ID || props.id || `SHP_${index + 1}`,
          name: props.name || props.point_name || props.Point_Name || props.Name || `Feature ${index + 1}`,
          category: props.category || props.Category || "Default",
          descr: props.descr || props.description || props.Description || "Uploaded vector geometry",
          ...props,
        };
      });
    }
    if (rawRows) {
      const mapped = rawRows.slice(0, 5).map((r) => applyMapping(r, userMapping));
      return mapped;
    }
    return [];
  })();

  const previewColumns = previewRows.length > 0 ? Object.keys(previewRows[0]) : [];

  // ─── Confirm handler ──────────────────────────────────────────────────────

  const handleConfirm = useCallback(
    async (persist) => {
      setIsSaving(true);
      setSaveError(null);
      const layerId = generateLayerId();

      try {
        let finalGeoJSON = geojson;

        // Tabular path: apply mapping + convert to GeoJSON
        if (rawRows) {
          const normalizedRows = rawRows.map((r) => applyMapping(r, userMapping));
          const { featureCollection } = rowsToGeoJSON(normalizedRows, layerId);
          finalGeoJSON = featureCollection;
        }

        if (finalGeoJSON.features.length === 0) {
          throw new Error("No valid features found. Check that your file has latitude/longitude columns.");
        }

        const layer = buildLayerFromGeoJSON(finalGeoJSON, file, layerId, persist);

        if (persist) {
          // Write to MongoDB via API
          const featuresPayload = layer.features.map((f) => ({
            ...f,
            geometry: f.geometry,
            layerId,
          }));
          await createBatchFeatures(featuresPayload);
          layer.isPersisted = true;
          layer.features = layer.features.map((f) => ({ ...f, isPersisted: true }));
        }

        addLayer(layer);
        onClose();
      } catch (err) {
        setSaveError(err.message);
      } finally {
        setIsSaving(false);
      }
    },
    [geojson, rawRows, userMapping, file, addLayer, onClose]
  );

  return createPortal(
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="preview-title" id="confirmation-preview-modal">
      <div className="modal-panel">
        {/* Header */}
        <div className="modal-header">
          <h2 id="preview-title">Upload Preview</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close preview" id="preview-close-btn">✕</button>
        </div>

        {/* Meta info */}
        <div className="preview-meta">
          <span className="badge badge--type">{describeFileType(fileType)}</span>
          <span className="badge badge--geometry">{geometryType}</span>
          <span className="badge badge--count">{recordCount.toLocaleString()} records</span>
        </div>

        {/* Single .shp notice */}
        {isSingleShpNoDbf && (
          <div className="field-match field-match--warn" id="single-shp-notice" style={{ background: "rgba(6, 182, 212, 0.1)", borderColor: "rgba(6, 182, 212, 0.4)", color: "var(--color-fg)" }}>
            <div className="field-match__header">
              <span className="field-match__icon">ℹ️</span>
              <strong>Standalone .shp file uploaded (Geometry coordinates only)</strong>
            </div>
            <p className="field-match__info" style={{ marginTop: "4px", color: "var(--color-slate-300)" }}>
              ESRI <code>.shp</code> files store map shapes but do not contain attribute table text. Default IDs and names have been assigned. To import your original attribute table columns, select the matching <strong>.dbf</strong> file alongside .shp or upload a <strong>.zip</strong> shapefile.
            </p>
          </div>
        )}

        {/* Field mismatch warning */}
        {matchResult && (
          <FieldMismatchWarning
            matchResult={matchResult}
            rawHeaders={rawRows ? Object.keys(rawRows[0] || {}) : []}
            userMapping={userMapping}
            onMappingChange={setUserMapping}
          />
        )}

        {/* Preview table */}
        {previewRows.length > 0 && (
          <div className="preview-table-wrapper">
            <p className="preview-table-label">First {previewRows.length} rows</p>
            <div className="preview-table-scroll">
              <table className="preview-table" id="upload-preview-table">
                <thead>
                  <tr>
                    {previewColumns.map((col) => (
                      <th key={col}>{getFieldLabel(col)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row, i) => (
                    <tr key={i}>
                      {previewColumns.map((col) => (
                        <td key={col}>{row[col] ?? "—"}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Error */}
        {saveError && (
          <div className="preview-error" role="alert">{saveError}</div>
        )}

        {/* Action buttons */}
        <div className="preview-actions">
          <button
            className="btn btn--secondary"
            onClick={onClose}
            disabled={isSaving}
            id="preview-cancel-btn"
          >
            Cancel
          </button>
          <button
            className="btn btn--ghost"
            onClick={() => handleConfirm(false)}
            disabled={isSaving}
            id="preview-view-only-btn"
          >
            {isSaving ? "Loading…" : "View Only"}
          </button>
          <button
            className="btn btn--primary"
            onClick={() => handleConfirm(true)}
            disabled={isSaving || !isLoggedIn}
            id="preview-save-btn"
            title={!isLoggedIn ? "Log in to save to the project" : undefined}
          >
            {isSaving ? "Saving…" : !isLoggedIn ? "Log In to Save" : "Save to Project"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}