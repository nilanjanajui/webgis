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

/** Map Dock Controls & Telemetry Overlay */
function MapDockOverlay({ mapTileType, setMapTileType }) {
  const map = useMap();

  const handleResetView = () => {
    map.flyTo(DEFAULT_CENTER, DEFAULT_ZOOM, { duration: 1.2 });
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => { });
    } else {
      document.exitFullscreen().catch(() => { });
    }
  };

  return (
    <>
      <div className="map-overlay-dock" id="map-dock">
        <button
          className={`map-dock-btn ${mapTileType === "google-street" ? "map-dock-btn--active" : ""}`}
          onClick={() => setMapTileType("google-street")}
          title="Street Vector Basemap"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
            <line x1="8" y1="2" x2="8" y2="18" />
            <line x1="16" y1="6" x2="16" y2="22" />
          </svg>
          <span>Streets</span>
        </button>

        <button
          className={`map-dock-btn ${mapTileType === "google-sat" ? "map-dock-btn--active" : ""}`}
          onClick={() => setMapTileType("google-sat")}
          title="Satellite Imagery"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 2a14.5 14.5 0 000 20M2 12h20" />
          </svg>
          <span>Satellite</span>
        </button>

        <button
          className="map-dock-btn"
          onClick={handleResetView}
          title="Reset Map Bounds"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
          <span>Reset View</span>
        </button>

        <button
          className="map-dock-btn"
          onClick={handleToggleFullscreen}
          title="Toggle Fullscreen Mode"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3" />
          </svg>
          <span>Fullscreen</span>
        </button>
      </div>

      <div className="map-telemetry-hud" id="map-telemetry-hud">
        <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#10B981", boxShadow: "0 0 8px #10B981" }} />
        <span>SPATIAL ENGINE: 60 FPS</span>
      </div>
    </>
  );
}

export default function MapView({ isDrawingBoundary, isAddingPoint, onBoundaryDrawEnd, onPointFormClose }) {
  const { layers, theme } = useLayersStore();
  const [mapReady, setMapReady] = useState(false);
  const [mapTileType, setMapTileType] = useState("auto"); // "auto" | "google-street" | "google-sat"

  const getTileUrl = () => {
    if (mapTileType === "google-sat") {
      return "https://mt1.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}"; // Satellite Hybrid
    }
    return "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"; // Street Map
  };

  const isDarkModeTile = mapTileType === "google-sat" ? false : theme === "dark";

  return (
    <div className="map-view" id="map-view">
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        zoomControl={false}
        preferCanvas={true}
        style={{ width: "100%", height: "100%" }}
        whenReady={() => setMapReady(true)}
        id="leaflet-map"
      >
        <TileLayer
          key={`${theme}-${mapTileType}`}
          url={getTileUrl()}
          attribution="&copy; Google Maps"
          maxZoom={20}
          className={isDarkModeTile ? "map-tile-layer" : "map-tile-layer-light"}
        />

        <MapInstancePublisher />
        <ZoomControl position="bottomright" />
        <CoordinateTracker />

        {/* Floating Map Dock & Telemetry HUD */}
        {mapReady && (
          <MapDockOverlay
            mapTileType={mapTileType === "auto" ? (theme === "dark" ? "google-street" : "google-street") : mapTileType}
            setMapTileType={setMapTileType}
          />
        )}

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