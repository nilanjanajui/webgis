/**
 * FeatureLayer.jsx
 * Renders a single layer's GeoJSON features onto the Leaflet map.
 * Features vector styling for lines/polygons and custom SVG map pins with
 * category colors and selection highlight rings.
 */

import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import { useLayersStore } from "../../state/layersStore";
import { getCategoryColor } from "../../constants/categoryColors";

/**
 * Build a custom Leaflet marker icon with subtle shadow and selection glow.
 * Rendered as a base64 data-URI <img> (not raw inline <svg>) so that
 * html2canvas — used for PDF export — can actually capture it. html2canvas
 * has known gaps rendering inline SVG DOM nodes, especially ones using the
 * `filter` attribute; wrapping as an <img> avoids that entirely.
 */
function makeIcon(color, selected) {
  const size = selected ? 32 : 24;
  const fillColor = selected
    ? "#FF2D55"
    : color && color !== "#1D6E5A" && color !== "#5B6B66"
      ? color
      : "#FF3B30";

  const shadowFilter = selected
    ? `filter="drop-shadow(0 0 10px rgba(255, 45, 85, 0.95)) drop-shadow(0 4px 10px rgba(0,0,0,0.6))"`
    : `filter="drop-shadow(0 3px 6px rgba(0,0,0,0.45))"`;

  const pulseRing = selected
    ? `<circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 2}" fill="none" stroke="#FFD600" stroke-width="3" opacity="0.95"/>
       <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 5}" fill="none" stroke="#FF2D55" stroke-width="2.5" opacity="0.9"/>`
    : "";

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" ${shadowFilter}>
      ${pulseRing}
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 5}" fill="${fillColor}" stroke="#FFFFFF" stroke-width="3"/>
      <circle cx="${size / 2}" cy="${size / 2}" r="3.5" fill="#FFFFFF" opacity="0.95"/>
    </svg>`;

  const dataUrl = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;

  return L.divIcon({
    html: `<img src="${dataUrl}" width="${size}" height="${size}" style="display:block" alt="" />`,
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

/** Style factory for lines and polygons. */
function vectorStyle(color, selected) {
  const baseColor = color && color !== "#1D6E5A" && color !== "#5B6B66" ? color : "#FF3B30";
  return {
    color: selected ? "#FF2D55" : baseColor,
    weight: selected ? 4 : 2.5,
    opacity: selected ? 1 : 0.85,
    fillColor: selected ? "#FF2D55" : baseColor,
    fillOpacity: selected ? 0.45 : 0.25,
    dashArray: selected ? "6, 6" : undefined,
  };
}

function getPointDisplayName(feature) {
  if (!feature) return "Feature";
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

  return feature.feature_id || feature.point_id || "Feature";
}

export default function FeatureLayer({ layer }) {
  const map = useMap();
  const { selectedFeatureId, setSelectedFeature, activeLayerId } = useLayersStore();
  const groupRef = useRef(null);
  const prevActiveLayerIdRef = useRef(null);

  useEffect(() => {
    if (!layer.isVisible) {
      if (groupRef.current) {
        groupRef.current.clearLayers();
        map.removeLayer(groupRef.current);
        groupRef.current = null;
      }
      return;
    }

    // Clear previous group
    if (groupRef.current) {
      groupRef.current.clearLayers();
      map.removeLayer(groupRef.current);
    }

    const group = L.layerGroup();

    for (const feature of layer.features) {
      if (!feature.geometry) continue;
      const color = getCategoryColor(feature.category);
      const isSelected = feature.id === selectedFeatureId;
      let leafletLayer;

      if (feature.geometry.type === "Point") {
        const [lng, lat] = feature.geometry.coordinates;
        const icon = makeIcon(isSelected ? "#125E4C" : color, isSelected);
        leafletLayer = L.marker([lat, lng], { icon });
      } else {
        // LineString / Polygon / Multi*
        const geojsonFeature = {
          type: "Feature",
          geometry: feature.geometry,
          properties: {},
        };
        leafletLayer = L.geoJSON(geojsonFeature, {
          style: vectorStyle(isSelected ? "#125E4C" : color, isSelected),
        });
      }

      leafletLayer.bindTooltip(getPointDisplayName(feature), {
        permanent: false,
        direction: "top",
        className: "leaflet-tooltip-webgis",
      });

      leafletLayer.on("click", () => {
        setSelectedFeature(isSelected ? null : feature.id);
      });

      group.addLayer(leafletLayer);
    }

    group.addTo(map);
    groupRef.current = group;

    return () => {
      if (groupRef.current) {
        groupRef.current.clearLayers();
        map.removeLayer(groupRef.current);
        groupRef.current = null;
      }
    };
    // Re-render whenever visibility, features, or selection changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layer, layer.isVisible, selectedFeatureId]);

  // Auto-zoom map to layer features when file is uploaded or layer is selected
  useEffect(() => {
    if (!layer.isVisible || !layer.features?.length) return;
    if (activeLayerId !== layer.id) return;
    if (prevActiveLayerIdRef.current === activeLayerId) return;

    prevActiveLayerIdRef.current = activeLayerId;

    const points = [];
    for (const f of layer.features) {
      if (!f.geometry) continue;
      if (f.geometry.type === "Point") {
        const [lng, lat] = f.geometry.coordinates;
        if (!isNaN(lat) && !isNaN(lng)) points.push([lat, lng]);
      } else {
        try {
          const lBounds = L.geoJSON({ type: "Feature", geometry: f.geometry }).getBounds();
          if (lBounds.isValid()) {
            points.push(lBounds.getSouthWest());
            points.push(lBounds.getNorthEast());
          }
        } catch (_) { }
      }
    }

    if (points.length > 0) {
      if (points.length === 1) {
        map.setView(points[0], 16, { animate: true });
      } else {
        const bounds = L.latLngBounds(points);
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16, animate: true });
        }
      }
    }
  }, [activeLayerId, layer.id, layer.features, layer.isVisible, map]);

  // Pan/zoom to selected feature when selection changes from the table
  useEffect(() => {
    if (!selectedFeatureId || !layer.isVisible) return;
    const feature = layer.features.find((f) => f.id === selectedFeatureId);
    if (!feature?.geometry) return;

    if (feature.geometry.type === "Point") {
      const [lng, lat] = feature.geometry.coordinates;
      map.setView([lat, lng], Math.max(map.getZoom(), 16), { animate: true });
    } else {
      try {
        const bounds = L.geoJSON({ type: "Feature", geometry: feature.geometry }).getBounds();
        if (bounds.isValid()) map.fitBounds(bounds, { padding: [40, 40], animate: true });
      } catch (_) { }
    }
  }, [selectedFeatureId, layer, map]);

  return null; // Leaflet manages the DOM directly
}