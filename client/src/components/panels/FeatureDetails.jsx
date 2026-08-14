/**
 * FeatureDetails.jsx
 * Shows attribute details for the currently selected feature.
 * Switches to the Details tab automatically when a feature is selected.
 * Passed as FeatureDetailsComponent prop into RightSidebar.
 */

import { useLayersStore } from "../../state/layersStore";
import { getFieldLabel } from "../../constants/fieldLabels";
import { getCategoryColor } from "../../constants/categoryColors";
import { describeGeometry } from "../../utils/geometryLabel";

/** Fields to always skip in the detail view */
const SKIP = new Set(["id", "layerId", "isPersisted", "geometry"]);

/** Fields that contain coordinates — render in monospace */
const COORD_FIELDS = new Set(["latitude", "longitude"]);

function getPointDisplayName(feature) {
  if (!feature) return "Unnamed Feature";
  if (feature.name && String(feature.name).trim()) return String(feature.name).trim();
  if (feature.point_name && String(feature.point_name).trim()) return String(feature.point_name).trim();

  for (const [key, val] of Object.entries(feature)) {
    if (val === null || val === undefined || val === "") continue;
    const k = key.trim().toLowerCase().replace(/[\s_\-\.]+/g, "");
    if (
      [
        "name",
        "pointname",
        "pntname",
        "sitename",
        "location",
        "label",
        "title",
        "place",
        "station",
        "site"
      ].includes(k)
    ) {
      return String(val).trim();
    }
  }

  return feature.feature_id || feature.point_id || "Unnamed Feature";
}

export default function FeatureDetails() {
  const { layers, selectedFeatureId, setSelectedFeature } = useLayersStore();

  if (!selectedFeatureId) {
    return (
      <div className="feat-details feat-details--empty" id="feat-details-empty">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: "var(--color-fog)" }}>
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <p>Select a feature on the map or in the attribute table to view its details.</p>
      </div>
    );
  }

  // Find the selected feature across all layers
  let selectedFeature = null;
  let parentLayer = null;
  for (const layer of layers) {
    const f = (layer.features || []).find((f) => f.id === selectedFeatureId);
    if (f) { selectedFeature = f; parentLayer = layer; break; }
  }

  if (!selectedFeature) {
    return (
      <div className="feat-details feat-details--empty">
        <p>Feature not found.</p>
      </div>
    );
  }

  const color = getCategoryColor(selectedFeature.category);
  const visibleFields = Object.keys(selectedFeature).filter((k) => !SKIP.has(k));

  // Extract coords for the coordinate pill
  let coordText = null;
  if (selectedFeature.geometry?.type === "Point") {
    const [lng, lat] = selectedFeature.geometry.coordinates;
    coordText = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }

  return (
    <div className="feat-details" id="feature-details-panel">
      {/* Header */}
      <div className="feat-details__header" style={{ borderLeft: `4px solid ${color}` }}>
        <div>
          <p className="feat-details__name">{getPointDisplayName(selectedFeature)}</p>
          <p className="feat-details__meta">
            <span className="feat-details__cat-dot" style={{ background: color }} />
            {selectedFeature.category || "—"}
            {" · "}
            {describeGeometry(selectedFeature.geometry?.type)}
            {parentLayer && ` · ${parentLayer.name}`}
          </p>
        </div>
        <button
          className="feat-details__clear"
          onClick={() => setSelectedFeature(null)}
          aria-label="Clear selection"
          id="feat-details-clear"
          title="Clear selection"
        >
          ✕
        </button>
      </div>

      {/* Coordinate pill */}
      {coordText && (
        <div className="feat-details__coords" id="feat-details-coords">
          <span className="feat-details__coords-label">Coordinates</span>
          <span className="feat-details__coords-value">{coordText}</span>
        </div>
      )}

      {/* Attribute rows */}
      <ul className="feat-details__rows">
        {visibleFields.map((key) => (
          <li key={key} className="feat-details__row" id={`feat-detail-${key}`}>
            <span className="feat-details__key">{getFieldLabel(key)}</span>
            <span className={`feat-details__val ${COORD_FIELDS.has(key) ? "feat-details__val--mono" : ""}`}>
              {selectedFeature[key] ?? "—"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
