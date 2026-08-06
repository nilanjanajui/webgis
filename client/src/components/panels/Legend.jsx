/**
 * Legend.jsx
 * Shows the colour legend for all currently visible layers.
 * Each entry shows the layer's colour swatch, name, geometry type, and record count.
 * Plugged into RightSidebar via the LegendComponent prop.
 */

import { useLayersStore } from "../../state/layersStore";
import { getCategoryColor, CATEGORY_COLORS } from "../../constants/categoryColors";
import { describeGeometry } from "../../utils/geometryLabel";

/** Geometry type icon as a small inline SVG */
function GeomIcon({ type }) {
  const t = (type || "").toLowerCase();
  if (t === "point" || t === "multipoint") {
    return (
      <svg width="12" height="12" viewBox="0 0 12 12">
        <circle cx="6" cy="6" r="4" fill="currentColor" />
      </svg>
    );
  }
  if (t === "polyline" || t === "linestring") {
    return (
      <svg width="14" height="8" viewBox="0 0 14 8">
        <path d="M1 7 L5 1 L9 5 L13 1" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
      </svg>
    );
  }
  // polygon
  return (
    <svg width="12" height="12" viewBox="0 0 12 12">
      <rect x="1" y="1" width="10" height="10" rx="1" fill="currentColor" opacity="0.3" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export default function Legend() {
  const { layers } = useLayersStore();
  const visibleLayers = layers.filter((l) => l.isVisible);

  return (
    <div className="legend" id="legend-panel">
      <p className="legend__title">Layer Legend</p>

      {visibleLayers.length === 0 && (
        <p className="legend__empty">No visible layers.</p>
      )}

      <ul className="legend__list">
        {visibleLayers.map((layer) => {
          const color = getCategoryColor(layer.geometryType) || layer.color || "#5B6B66";
          return (
            <li key={layer.id} className="legend__item" id={`legend-item-${layer.id}`}>
              <span
                className="legend__swatch"
                style={{ background: color, opacity: layer.geometryType?.toLowerCase().includes("poly") ? 0.5 : 1 }}
              />
              <div className="legend__info">
                <span className="legend__name">{layer.name}</span>
                <span className="legend__meta">
                  <span style={{ color }} className="legend__geom-icon">
                    <GeomIcon type={describeGeometry(layer.geometryType)} />
                  </span>
                  {describeGeometry(layer.geometryType)} · {layer.recordCount} features
                </span>
              </div>
              {layer.isPersisted ? (
                <span className="legend__persist-dot legend__persist-dot--saved" title="Saved to project" />
              ) : (
                <span className="legend__persist-dot legend__persist-dot--session" title="View only (session)" />
              )}
            </li>
          );
        })}
      </ul>

      {/* Category colour key */}
      <div className="legend__divider" />
      <p className="legend__subtitle">Category Colours</p>
      <ul className="legend__category-list">
        {Object.entries(CATEGORY_COLORS)
          .filter(([k]) => k !== "Default")
          .map(([cat, color]) => (
            <li key={cat} className="legend__cat-item">
              <span className="legend__cat-swatch" style={{ background: color }} />
              <span className="legend__cat-label">{cat}</span>
            </li>
          ))}
      </ul>
    </div>
  );
}
