/**
 * SpatialAnalytics.jsx
 * Spatial analytics & telemetry summary panel for the active layer.
 * Displays:
 *  - Category breakdown with visual progress bars and percentage shares
 *  - Spatial Bounding Box Extent (North, South, East, West coordinates)
 *  - Calculated Centroid Telemetry (Center of mass)
 *  - Geometry breakdown (Point, Polygon, LineString counts)
 */

import { useMemo } from "react";
import { useLayersStore } from "../../state/layersStore";
import { getCategoryColor } from "../../constants/categoryColors";

export default function SpatialAnalytics() {
  const { activeLayer } = useLayersStore();
  const features = activeLayer?.features || [];

  // Calculate Category Stats
  const categoryStats = useMemo(() => {
    if (!features.length) return [];
    const counts = {};
    for (const f of features) {
      const cat = f.category || "Unassigned";
      counts[cat] = (counts[cat] || 0) + 1;
    }
    const total = features.length;
    return Object.entries(counts).map(([name, count]) => ({
      name,
      count,
      percent: Math.round((count / total) * 100),
      color: getCategoryColor(name),
    }));
  }, [features]);

  // Calculate Spatial Bounding Box & Centroid
  const spatialExtent = useMemo(() => {
    if (!features.length) return null;
    let minLat = Infinity,
      maxLat = -Infinity,
      minLng = Infinity,
      maxLng = -Infinity;
    let sumLat = 0,
      sumLng = 0,
      validPointCount = 0;

    for (const f of features) {
      if (!f.geometry) continue;
      if (f.geometry.type === "Point") {
        const [lng, lat] = f.geometry.coordinates;
        if (!isNaN(lat) && !isNaN(lng)) {
          minLat = Math.min(minLat, lat);
          maxLat = Math.max(maxLat, lat);
          minLng = Math.min(minLng, lng);
          maxLng = Math.max(maxLng, lng);
          sumLat += lat;
          sumLng += lng;
          validPointCount++;
        }
      }
    }

    if (validPointCount === 0 || minLat === Infinity) return null;

    return {
      north: maxLat.toFixed(5),
      south: minLat.toFixed(5),
      east: maxLng.toFixed(5),
      west: minLng.toFixed(5),
      centroidLat: (sumLat / validPointCount).toFixed(5),
      centroidLng: (sumLng / validPointCount).toFixed(5),
    };
  }, [features]);

  // Geometry Breakdown
  const geomBreakdown = useMemo(() => {
    if (!features.length) return { points: 0, polygons: 0, lines: 0 };
    let points = 0,
      polygons = 0,
      lines = 0;
    for (const f of features) {
      const type = f.geometry?.type || "Point";
      if (type.includes("Point")) points++;
      else if (type.includes("Polygon")) polygons++;
      else if (type.includes("Line")) lines++;
    }
    return { points, polygons, lines };
  }, [features]);

  if (!activeLayer) {
    return (
      <div className="analytics-panel analytics-panel--empty" id="analytics-empty">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: "var(--color-fog)" }}>
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
        <p>No active layer selected. Upload or select a layer to view spatial analytics telemetry.</p>
      </div>
    );
  }

  return (
    <div className="analytics-panel" id="spatial-analytics-panel">
      {/* Header telemetry summary */}
      <div className="analytics-section">
        <h3 className="analytics-title">Layer Telemetry Summary</h3>
        <div className="analytics-grid">
          <div className="analytics-card">
            <span className="analytics-card__val">{features.length}</span>
            <span className="analytics-card__lbl">Total Features</span>
          </div>
          <div className="analytics-card">
            <span className="analytics-card__val">{geomBreakdown.points}</span>
            <span className="analytics-card__lbl">Points</span>
          </div>
          <div className="analytics-card">
            <span className="analytics-card__val">{geomBreakdown.polygons}</span>
            <span className="analytics-card__lbl">Polygons</span>
          </div>
          <div className="analytics-card">
            <span className="analytics-card__val">{categoryStats.length}</span>
            <span className="analytics-card__lbl">Categories</span>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="analytics-section">
        <h3 className="analytics-title">Category Distribution</h3>
        <div className="analytics-cat-list">
          {categoryStats.map((cat) => (
            <div key={cat.name} className="analytics-cat-item">
              <div className="analytics-cat-info">
                <span className="analytics-cat-name">
                  <span className="analytics-cat-dot" style={{ background: cat.color }} />
                  {cat.name}
                </span>
                <span className="analytics-cat-count">
                  {cat.count} ({cat.percent}%)
                </span>
              </div>
              <div className="analytics-progress-bg">
                <div
                  className="analytics-progress-fill"
                  style={{ width: `${cat.percent}%`, background: cat.color }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Spatial Extent Bounding Box */}
      {spatialExtent && (
        <div className="analytics-section">
          <h3 className="analytics-title">Geographic Extent & Centroid</h3>
          <div className="analytics-extent-box">
            <div className="extent-row extent-row--north">
              <span className="extent-lbl">North</span>
              <span className="extent-val">{spatialExtent.north}° N</span>
            </div>
            <div className="extent-row extent-row--mid">
              <span className="extent-val">{spatialExtent.west}° W</span>
              <span className="extent-center">
                Centroid<br />
                <strong>{spatialExtent.centroidLat}, {spatialExtent.centroidLng}</strong>
              </span>
              <span className="extent-val">{spatialExtent.east}° E</span>
            </div>
            <div className="extent-row extent-row--south">
              <span className="extent-lbl">South</span>
              <span className="extent-val">{spatialExtent.south}° S</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
