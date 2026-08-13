/**
 * MapView.jsx
 * Leaflet map supporting Day/Night modes:
 *   - Day Mode: Standard OpenStreetMap base tiles
 *   - Night Mode: Esri World Imagery (Satellite View)
 * Includes mouse coordinate tracker, FeatureLayer rendering,
 * BoundaryDrawTool, and PointForm floating panel.
 *
 * Deliberately does NOT auto-load saved features/boundary from the backend
 * on mount — every visitor should see a clean map. Loading persisted data
 * is a manual action via LeftSidebar's "Load Saved Data" button.
 */

import { useState } from "react";
import { MapContainer, TileLayer, ZoomControl, useMapEvents, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import { useLayersStore } from "../../state/layersStore";
import FeatureLayer from "../map/FeatureLayer";
import BoundaryDrawTool from "../map/BoundaryDrawTool";
import PointForm from "../map/PointForm";

const DEFAULT_CENTER = [22.4710, 91.7877]; // University of Chittagong (CU)
const DEFAULT_ZOOM = 15;

/** Live mouse coordinate tracker widget */
function CoordinateTracker() {
  const [coords, setCoords] = useState(null);

  useMapEvents({
    mousemove(e) {
      setCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
    mouseleave() {
      setCoords(null);
    },
  });

  if (!coords) return null;

  return (
    <div className="coordinate-tracker" id="coordinate-tracker">
      <span className="coord-lat">LAT: {coords.lat.toFixed(5)}°</span>
      <span className="coord-lng">LNG: {coords.lng.toFixed(5)}°</span>
    </div>
  );
}

/** Publishes the Leaflet map instance to the global store */
function MapInstancePublisher() {
  const map = useMap();
  const { setMapInstance } = useLayersStore();

  useEffect(() => {
    setMapInstance(map);
    return () => setMapInstance(null);
  }, [map, setMapInstance]);

  return null;
}

export default function MapView({ isDrawingBoundary, isAddingPoint, onBoundaryDrawEnd, onPointFormClose }) {
  const { layers, theme } = useLayersStore();
  const [mapReady, setMapReady] = useState(false);

  return (
    <div className="map-view" id="map-view">
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        zoomControl={false}
        style={{ width: "100%", height: "100%" }}
        whenReady={() => setMapReady(true)}
        id="leaflet-map"
      >
        {/* Base Map Layer: Google Maps (CSS filters apply for dark mode) */}
        {theme === "dark" ? (
          <TileLayer
            key="google-map-dark"
            url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
            attribution="&copy; Google Maps"
            maxZoom={20}
            className="map-tile-layer"
          />
        ) : (
          <TileLayer
            key="google-map-light"
            url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
            attribution="&copy; Google Maps"
            maxZoom={20}
            className="map-tile-layer-light"
          />
        )}

        <MapInstancePublisher />
        <ZoomControl position="bottomright" />
        <CoordinateTracker />

        {/* Render visible feature layers */}
        {mapReady && layers.map((layer) => (
          <FeatureLayer key={layer.id} layer={layer} />
        ))}

        {/* Boundary drawing mode */}
        {mapReady && (
          <BoundaryDrawTool
            isDrawing={isDrawingBoundary}
            onDrawEnd={onBoundaryDrawEnd}
          />
        )}

        {/* Manual point creation form */}
        {mapReady && isAddingPoint && (
          <PointForm isActive={isAddingPoint} onClose={onPointFormClose} />
        )}
      </MapContainer>
    </div>
  );
}