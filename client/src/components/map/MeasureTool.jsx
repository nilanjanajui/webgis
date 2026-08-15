/**
 * MeasureTool.jsx
 * Interactive map measurement tool for distance (meters / kilometers)
 * and polygon area (square meters / square kilometers).
 *
 * Click points on the map to draw line segments.
 * Segments show midpoint distance labels, and total area is calculated if >= 3 points.
 */

import { useState, useCallback } from "react";
import { useMapEvents, Polyline, Polygon, Marker, Tooltip } from "react-leaflet";
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

export default function MeasureTool({ isActive, onClose }) {
  const [points, setPoints] = useState([]);

  useMapEvents({
    click(e) {
      if (!isActive) return;
      setPoints((prev) => [...prev, [e.latlng.lat, e.latlng.lng]]);
    },
  });

  const handleClear = useCallback(() => {
    setPoints([]);
  }, []);

  if (!isActive) return null;

  // Calculate segment lengths
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
      accum: totalDistance,
    });
  }

  const polygonArea = points.length >= 3 ? calculatePolygonArea(points) : 0;

  // Calculate centroid for area tooltip
  let centroid = null;
  if (points.length >= 3) {
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

  return (
    <>
      {/* Visual polyline / polygon */}
      {points.length >= 3 ? (
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

      {/* Markers at each point */}
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

      {/* Area tooltip at centroid */}
      {centroid && polygonArea > 0 && (
        <Marker position={centroid} opacity={0}>
          <Tooltip permanent direction="center" className="measure-tooltip measure-tooltip--area">
            Area: {formatArea(polygonArea)}
          </Tooltip>
        </Marker>
      )}

      {/* Floating measurement control panel */}
      <div className="measure-panel" id="measure-floating-panel">
        <div className="measure-panel__header">
          <span>📏 Spatial Measure Tool</span>
          <button className="measure-panel__close" onClick={onClose}>✕</button>
        </div>

        <div className="measure-panel__body">
          <p className="measure-panel__instruction">
            {points.length === 0
              ? "Click anywhere on the map to start measuring distance and area."
              : points.length === 1
              ? "Click a second point to measure distance."
              : `Click more points to draw polygon area.`}
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
            {points.length >= 3 && (
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
