/**
 * BoundaryDrawTool.jsx
 * Lets the user draw a single polygon boundary directly on the map using
 * Leaflet's native drawing capabilities (no leaflet-draw plugin needed —
 * we use a simple click-to-add-vertex approach).
 *
 * When done, the polygon GeoJSON is saved to layersStore.setBoundary()
 * and optionally persisted to the backend via api.saveBoundary().
 *
 * The boundary is rendered beneath all other feature layers.
 */

import { useEffect, useRef, useState } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import { useLayersStore } from "../../state/layersStore";
import { useAuth } from "../../state/authStore";
import { saveBoundary as apiSaveBoundary, createBatchFeatures } from "../../services/api";

/** Boundary style constants */
const BOUNDARY_STYLE = {
  color: "#F97316",
  weight: 3,
  opacity: 0.95,
  dashArray: "8 5",
  fillColor: "#f9741644",
  fillOpacity: 0.05,
};

const VERTEX_STYLE = {
  radius: 6,
  color: "#F97316",
  fillColor: "#ffffff",
  fillOpacity: 1,
  weight: 2.5,
};

export default function BoundaryDrawTool({ isDrawing, onDrawEnd }) {
  const map = useMap();
  const { boundaryLayer, boundaryVisible, setBoundary, addLayer, layers } = useLayersStore();
  const { isLoggedIn } = useAuth();

  const polylineRef = useRef(null);   // live preview polyline while drawing
  const verticesRef = useRef([]);     // [LatLng] of clicked vertices
  const markersRef = useRef([]);      // vertex circle markers
  const boundaryGLRef = useRef(null); // rendered final boundary polygon

  // ── Render saved boundary whenever boundaryLayer changes ──────────────────
  useEffect(() => {
    if (boundaryGLRef.current) {
      map.removeLayer(boundaryGLRef.current);
      boundaryGLRef.current = null;
    }
    if (!boundaryLayer || !boundaryVisible) return;

    try {
      const layer = L.geoJSON(
        { type: "Feature", geometry: boundaryLayer },
        { style: BOUNDARY_STYLE }
      );
      layer.addTo(map);
      boundaryGLRef.current = layer;
      // Fit map to boundary extent
      const bounds = layer.getBounds();
      if (bounds.isValid()) map.fitBounds(bounds, { padding: [30, 30] });
    } catch (_) { }

    return () => {
      if (boundaryGLRef.current) {
        map.removeLayer(boundaryGLRef.current);
        boundaryGLRef.current = null;
      }
    };
  }, [boundaryLayer, boundaryVisible, map]);

  // ── Drawing mode ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isDrawing) {
      cleanup();
      return;
    }

    map.doubleClickZoom.disable();
    map.getContainer().style.cursor = "crosshair";

    const onClick = (e) => {
      const latlng = e.latlng;
      verticesRef.current.push(latlng);

      // Vertex marker
      const marker = L.circleMarker(latlng, VERTEX_STYLE).addTo(map);
      markersRef.current.push(marker);

      // Update live preview polyline
      if (polylineRef.current) map.removeLayer(polylineRef.current);
      if (verticesRef.current.length > 1) {
        polylineRef.current = L.polyline(verticesRef.current, {
          color: "#F97316",
          weight: 2.5,
          dashArray: "6 4",
          opacity: 0.85,
        }).addTo(map);
      }
    };

    const onDblClick = (e) => {
      if (e.originalEvent) {
        e.originalEvent.preventDefault();
        e.originalEvent.stopPropagation();
      }
      finishPolygon();
    };

    map.on("click", onClick);
    map.on("dblclick", onDblClick);

    return () => {
      map.off("click", onClick);
      map.off("dblclick", onDblClick);
      map.doubleClickZoom.enable();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDrawing]);

  function cleanup() {
    map.getContainer().style.cursor = "";
    try { map.doubleClickZoom.enable(); } catch (_) { }
    if (polylineRef.current) { map.removeLayer(polylineRef.current); polylineRef.current = null; }
    markersRef.current.forEach((m) => map.removeLayer(m));
    markersRef.current = [];
    verticesRef.current = [];
  }

  async function finishPolygon() {
    const verts = verticesRef.current;

    // Deduplicate consecutive identical/near-identical vertices (e.g. from double-click event ordering)
    const uniqueVerts = [];
    for (const v of verts) {
      const last = uniqueVerts[uniqueVerts.length - 1];
      if (!last || Math.abs(last.lat - v.lat) > 0.000001 || Math.abs(last.lng - v.lng) > 0.000001) {
        uniqueVerts.push(v);
      }
    }

    if (uniqueVerts.length < 3) {
      cleanup();
      onDrawEnd?.();
      return;
    }

    // Build closed GeoJSON polygon — coordinates are [lng, lat]
    const coords = [...uniqueVerts.map((v) => [v.lng, v.lat])];
    coords.push(coords[0]); // close ring
    const polygon = { type: "Polygon", coordinates: [coords] };

    const boundaryLayerId = `layer_boundary_drawn_${Date.now()}`;
    const boundaryCount = (layers || []).filter((l) => l.name?.toLowerCase().includes("boundary")).length + 1;
    const boundaryLayerName = `Custom Boundary ${boundaryCount}`;

    const featureObj = {
      id: `feat_${Math.random().toString(36).slice(2)}`,
      name: boundaryLayerName,
      category: "Boundary",
      geometry: polygon,
      layerId: boundaryLayerId,
      isPersisted: isLoggedIn,
    };

    const newLayer = {
      id: boundaryLayerId,
      name: boundaryLayerName,
      geometryType: "Polygon",
      isPersisted: isLoggedIn,
      isVisible: true,
      color: "#F97316",
      features: [featureObj],
      recordCount: 1,
    };

    addLayer(newLayer);
    setBoundary(polygon);

    cleanup();
    onDrawEnd?.();

    // Persist to backend
    if (isLoggedIn) {
      try {
        await createBatchFeatures([
          {
            ...featureObj,
            layerName: boundaryLayerName,
          },
        ]);
        await apiSaveBoundary(polygon).catch(() => { });
      } catch (err) {
        console.error("Failed to save boundary to backend:", err);
      }
    }
  }

  return null;
}