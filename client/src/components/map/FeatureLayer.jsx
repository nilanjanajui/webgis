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
  const size = selected ? 26 : 22;
  const shadowFilter = selected
    ? `filter="drop-shadow(0 4px 8px rgba(18,94,76,0.5))"`
    : `filter="drop-shadow(0 2px 4px rgba(0,0,0,0.25))"`;

  const pulseRing = selected
    ? `<circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 2}" fill="none" stroke="#125E4C" stroke-width="2.5" opacity="0.8"/>`
    : "";

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" ${shadowFilter}>
      ${pulseRing}
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 4}" fill="${color}" stroke="#FFFFFF" stroke-width="2.5"/>
      <circle cx="${size / 2}" cy="${size / 2}" r="3" fill="#FFFFFF" opacity="0.9"/>
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
  return {
    color: selected ? "#125E4C" : color,
    weight: selected ? 3.5 : 2.5,
    opacity: selected ? 1 : 0.85,
    fillColor: color,
    fillOpacity: selected ? 0.35 : 0.18,
    dashArray: selected ? "6, 6" : undefined,
  };
}

export default function FeatureLayer({ layer }) {
  const map = useMap();
  const { selectedFeatureId, setSelectedFeature } = useLayersStore();
  const groupRef = useRef(null);

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

      leafletLayer.bindTooltip(feature.name || feature.feature_id || "Feature", {
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