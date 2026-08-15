/**
 * MeasureTool.jsx
 * Dynamic map measurement tool with live mouse cursor tracking (rubberband line).
 * Supports double-click OR ESC key completion to stop tracking cursor and lock measurement.
 * Supports separate modes:
 *  - "distance": Measure linear polyline distance with real-time cursor tracking tooltips.
 *  - "area": Measure polygon surface area with real-time cursor tracking rubberband fill.
 */

import { useState, useCallback, useEffect } from "react";
import { useMap, useMapEvents, Polyline, Polygon, Marker, Tooltip } from "react-leaflet";
import L from "leaflet";

/** Earth radius in meters */
const EARTH_RADIUS = 6371000;

/** Calculate Haversine distance between two [lat, lng] points in meters */
function calculateHaversineDistance([lat1, lng1], [lat2, lng2]) {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS * c;
}

/** Calculate spherical polygon area in square meters */
function calculatePolygonArea(latLngs) {
  if (latLngs.length < 3) return 0;
  let total = 0;
  const numPoints = latLngs.length;

  for (let i = 0; i < numPoints; i++) {
    const [lat1, lng1] = latLngs[i];
    const [lat2, lng2] = latLngs[(i + 1) % numPoints];
    const p1 = (lng1 * Math.PI) / 180;
    const p2 = (lng2 * Math.PI) / 180;
    const q1 = (lat1 * Math.PI) / 180;
    const q2 = (lat2 * Math.PI) / 180;
    total += (p2 - p1) * (2 + Math.sin(q1) + Math.sin(q2));
  }

  const area = (Math.abs(total) * EARTH_RADIUS * EARTH_RADIUS) / 2;
  return area;
}

/** Format distance nicely (m or km) */
function formatDistance(meters) {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(2)} km`;
  }
  return `${Math.round(meters)} m`;
}

/** Format area nicely (m² or km²) */
function formatArea(sqMeters) {
  if (sqMeters >= 1000000) {
    return `${(sqMeters / 1000000).toFixed(2)} km²`;
  }
  return `${Math.round(sqMeters).toLocaleString()} m²`;
}

export default function MeasureTool({ isActive, measureMode = "distance", initialPoints = [], onClose }) {
  const map = useMap();
  const [points, setPoints] = useState([]);
  const [cursorPos, setCursorPos] = useState(null);
  const [isFinished, setIsFinished] = useState(false);

  const initialPointsKey = (initialPoints || []).map((p) => p.join(",")).join(";");

  // Sync initialPoints when provided and fit map bounds
  useEffect(() => {
    if (isActive && initialPoints && initialPoints.length >= 3) {
      setPoints(initialPoints);
      setIsFinished(true);
      try {
        const bounds = L.latLngBounds(initialPoints);
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 17 });
        }
      } catch (_) {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, initialPointsKey, map]);

  // Disable map doubleClickZoom while measuring tool is active
  useEffect(() => {
    if (isActive) {
      map.doubleClickZoom.disable();
    }
    return () => {
      try {
        map.doubleClickZoom.enable();
      } catch (_) {}
    };
  }, [isActive, map]);

  // Handle ESC key press to stop tracking cursor or close measure tool
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape" || e.key === "Esc" || e.keyCode === 27) {
        if (!isFinished && points.length > 0) {
          setIsFinished(true);
          setCursorPos(null);
        } else {
          onClose?.();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isActive, isFinished, points.length, onClose]);

  useMapEvents({
    click(e) {
      if (!isActive) return;
      if (isFinished) {
        // Start new measurement on click after finished
        setPoints([[e.latlng.lat, e.latlng.lng]]);
        setIsFinished(false);
      } else {
        setPoints((prev) => [...prev, [e.latlng.lat, e.latlng.lng]]);
      }
    },
    dblclick(e) {
      if (!isActive) return;
      if (e.originalEvent) {
        e.originalEvent.preventDefault();
        e.originalEvent.stopPropagation();
      }
      setIsFinished(true);
      setCursorPos(null);
    },
    mousemove(e) {
      if (!isActive || isFinished) return;
      setCursorPos([e.latlng.lat, e.latlng.lng]);
    },
    mouseleave() {
      setCursorPos(null);
    },
  });

  const handleClear = useCallback(() => {
    setPoints([]);
    setCursorPos(null);
    setIsFinished(false);
  }, []);

  if (!isActive) return null;

  // Calculate locked segment lengths
  let totalDistance = 0;
  const segments = [];
  for (let i = 0; i < points.length - 1; i++) {
    const d = calculateHaversineDistance(points[i], points[i + 1]);
    totalDistance += d;
    const midLat = (points[i][0] + points[i + 1][0]) / 2;
    const midLng = (points[i][1] + points[i + 1][1]) / 2;
    segments.push({
      mid: [midLat, midLng],
      dist: d,
    });
  }

  // Live cursor tracking rubberband calculations
  let liveSegmentDist = 0;
  let liveTotalDist = totalDistance;
  let liveArea = 0;

  if (!isFinished && points.length > 0 && cursorPos) {
    const lastPoint = points[points.length - 1];
    liveSegmentDist = calculateHaversineDistance(lastPoint, cursorPos);
    liveTotalDist = totalDistance + liveSegmentDist;

    if (measureMode === "area" && points.length >= 2) {
      const candidatePoints = [...points, cursorPos];
      liveArea = calculatePolygonArea(candidatePoints);
    }
  }

  const polygonArea = points.length >= 3 ? calculatePolygonArea(points) : 0;

  // Calculate centroid for locked area tooltip
  let centroid = null;
  if (points.length >= 3 && measureMode === "area") {
    const sumLat = points.reduce((acc, p) => acc + p[0], 0);
    const sumLng = points.reduce((acc, p) => acc + p[1], 0);
    centroid = [sumLat / points.length, sumLng / points.length];
  }

  const nodeIcon = L.divIcon({
    className: "measure-node-icon",
    html: `<div class="measure-node-dot"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });

  const cursorIcon = L.divIcon({
    className: "measure-cursor-icon",
    html: `<div class="measure-node-dot measure-node-dot--cursor"></div>`,
    iconSize: [10, 10],
    iconAnchor: [5, 5],
  });

  return (
    <>
      {/* Locked geometry */}
      {measureMode === "area" && points.length >= 3 ? (
        <Polygon
          positions={points}
          pathOptions={{
            color: "#06B6D4",
            fillColor: "#06B6D4",
            fillOpacity: 0.25,
            weight: 3,
            dashArray: "6, 6",
          }}
        />
      ) : points.length >= 2 ? (
        <Polyline
          positions={points}
          pathOptions={{
            color: "#06B6D4",
            weight: 3,
            dashArray: "6, 6",
          }}
        />
      ) : null}

      {/* Live Rubberband Line / Polygon following cursor (only when NOT finished) */}
      {!isFinished && points.length > 0 && cursorPos && (
        <>
          {measureMode === "area" && points.length >= 2 ? (
            <Polygon
              positions={[...points, cursorPos]}
              pathOptions={{
                color: "#F59E0B",
                fillColor: "#F59E0B",
                fillOpacity: 0.2,
                weight: 2,
                dashArray: "4, 4",
              }}
            />
          ) : (
            <Polyline
              positions={[points[points.length - 1], cursorPos]}
              pathOptions={{
                color: "#F59E0B",
                weight: 2,
                dashArray: "4, 4",
              }}
            />
          )}
        </>
      )}

      {/* Markers at each placed vertex */}
      {points.map((pt, idx) => (
        <Marker key={idx} position={pt} icon={nodeIcon} />
      ))}

      {/* Midpoint segment tooltips */}
      {segments.map((seg, idx) => (
        <Marker key={`seg-${idx}`} position={seg.mid} opacity={0}>
          <Tooltip permanent direction="center" className="measure-tooltip">
            {formatDistance(seg.dist)}
          </Tooltip>
        </Marker>
      ))}

      {/* Locked Area tooltip at centroid */}
      {centroid && polygonArea > 0 && (
        <Marker position={centroid} opacity={0}>
          <Tooltip permanent direction="center" className="measure-tooltip measure-tooltip--area">
            Area: {formatArea(polygonArea)}
          </Tooltip>
        </Marker>
      )}

      {/* Live Cursor Tracking Tooltip */}
      {!isFinished && points.length > 0 && cursorPos && (
        <Marker position={cursorPos} icon={cursorIcon}>
          <Tooltip permanent direction="right" offset={[10, 0]} className="measure-tooltip measure-tooltip--cursor">
            {measureMode === "area" && points.length >= 2
              ? `Live Area: ${formatArea(liveArea)} (+${formatDistance(liveSegmentDist)})`
              : `+${formatDistance(liveSegmentDist)} (Total: ${formatDistance(liveTotalDist)})`}
          </Tooltip>
        </Marker>
      )}

      {/* Floating measurement control panel */}
      <div className="measure-panel" id="measure-floating-panel">
        <div className="measure-panel__header">
          <span>{measureMode === "area" ? "📐 Measure Surface Area" : "📏 Measure Distance"}</span>
          <button className="measure-panel__close" onClick={onClose}>✕</button>
        </div>

        <div className="measure-panel__body">
          <p className="measure-panel__instruction">
            {isFinished
              ? "Measurement complete! Click map to start a new track."
              : points.length === 0
              ? `Click map to start tracking. Double-click or press ESC to stop.`
              : `Click to add points. Double-click or press ESC to stop tracking.`}
          </p>

          <div className="measure-panel__stats">
            <div className="measure-stat">
              <span className="measure-stat__label">Points Placed</span>
              <span className="measure-stat__value">{points.length}</span>
            </div>
            <div className="measure-stat">
              <span className="measure-stat__label">Total Distance</span>
              <span className="measure-stat__value">{formatDistance(totalDistance)}</span>
            </div>
            {measureMode === "area" && (
              <div className="measure-stat">
                <span className="measure-stat__label">Polygon Area</span>
                <span className="measure-stat__value">{formatArea(polygonArea)}</span>
              </div>
            )}
          </div>
        </div>

        <div className="measure-panel__actions">
          <button
            className="btn btn--secondary btn--sm"
            onClick={handleClear}
            disabled={points.length === 0}
            id="measure-clear-btn"
          >
            Clear
          </button>
          <button
            className="btn btn--primary btn--sm"
            onClick={onClose}
            id="measure-done-btn"
          >
            Done
          </button>
        </div>
      </div>
    </>
  );
}
