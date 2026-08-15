/**
 * HeatmapLayer.jsx
 * Interactive point density heatmap visualization layer.
 * Renders smooth intensity circles with gradient color ramp (Cyan → Yellow → Magenta/Red)
 * based on spatial feature concentration.
 */

import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

export default function HeatmapLayer({ features, isEnabled }) {
  const map = useMap();
  const layerGroupRef = useRef(null);

  useEffect(() => {
    if (!isEnabled || !features || !features.length) {
      if (layerGroupRef.current) {
        layerGroupRef.current.clearLayers();
        map.removeLayer(layerGroupRef.current);
        layerGroupRef.current = null;
      }
      return;
    }

    if (layerGroupRef.current) {
      layerGroupRef.current.clearLayers();
      map.removeLayer(layerGroupRef.current);
    }

    const group = L.layerGroup();
    const pointFeatures = features.filter((f) => f.geometry?.type === "Point");

    for (const feat of pointFeatures) {
      const [lng, lat] = feat.geometry.coordinates;
      if (isNaN(lat) || isNaN(lng)) continue;

      // Outer heat glow circle
      const outerGlow = L.circle([lat, lng], {
        radius: 350, // 350 meters radius glow
        color: "transparent",
        fillColor: "#EC4899", // Magenta pink
        fillOpacity: 0.35,
      });

      // Inner heat intensity core
      const innerCore = L.circle([lat, lng], {
        radius: 120, // 120 meters core
        color: "transparent",
        fillColor: "#F59E0B", // Amber yellow
        fillOpacity: 0.7,
      });

      group.addLayer(outerGlow);
      group.addLayer(innerCore);
    }

    group.addTo(map);
    layerGroupRef.current = group;

    return () => {
      if (layerGroupRef.current) {
        layerGroupRef.current.clearLayers();
        map.removeLayer(layerGroupRef.current);
        layerGroupRef.current = null;
      }
    };
  }, [features, isEnabled, map]);

  return null;
}
