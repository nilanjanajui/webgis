/**
 * ConfirmationPreview.jsx
 * Modal shown after a file is parsed. Displays:
 *  - Detected file type, geometry type, and record count
 *  - Preview table of first 5 rows / features
 *  - FieldMismatchWarning if auto-matching found problems
 *  - "Save to Project" (writes to MongoDB via API) vs "View Only" (session state) choice
 */

import { useState, useCallback } from "react";
import { useLayersStore } from "../../state/layersStore";
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
    color: "#1D6E5A",
    features: geojson.features.map((f) => ({
      ...f.properties,
      id: f.properties?.id || `feat_${Math.random().toString(36).slice(2)}`,
      geometry: f.geometry,
      layerId,
      isPersisted,
    })),
    recordCount: geojson.features.length,
  };
}

export default function ConfirmationPreview({ previewData, onClose }) {
  const { addLayer } = useLayersStore();
  const [userMapping, setUserMapping] = useState(previewData.matchResult?.mapping || {});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const { file, fileType, geojson, rawRows, matchResult, geometryType, recordCount } = previewData;

  // Build preview rows for the table
  const previewRows = (() => {
    if (geojson) {
      return geojson.features.slice(0, 5).map((f) => f.properties || {});
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
          const featuresPayload = finalGeoJSON.features.map((f) => ({
            ...f.properties,
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

  return (
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
            disabled={isSaving}
            id="preview-save-btn"
          >
            {isSaving ? "Saving…" : "Save to Project"}
          </button>
        </div>
      </div>
    </div>
  );
}
