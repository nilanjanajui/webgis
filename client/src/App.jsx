/**
 * App.jsx — Root layout
 * Wires all components together with a sophisticated header, live status indicators,
 * Day/Night theme toggle, auth (login/logout), and responsive three-panel WebGIS layout.
 */

import { useState, useRef } from "react";
import { LayersProvider, useLayersStore } from "./state/layersStore";
import { AuthProvider, useAuth } from "./state/authStore";
import LeftSidebar from "./components/layout/LeftSidebar";
import MapView from "./components/layout/MapView";
import RightSidebar from "./components/layout/RightSidebar";
import Legend from "./components/panels/Legend";
import FeatureDetails from "./components/panels/FeatureDetails";
import AuthModal from "./components/auth/AuthModal";
import "./index.css";

function AppHeader() {
  const { layers, boundaryLayer, theme, toggleTheme, clearAll, addLayer } = useLayersStore();
  const { user, isLoggedIn, isCheckingSession, logout } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const totalFeatures = layers.reduce((acc, l) => acc + (l.recordCount || 0), 0);

  const handleLogout = () => {
    clearAll();
    logout();
  };

  // Quick Demo Preset for recruiters to explore GIS tools in 1 click!
  const loadRecruiterSampleData = () => {
    const layerId = `layer_demo_${Date.now()}`;
    const rawFeatures = [
      {
        id: `feat_${Math.random().toString(36).slice(2)}`,
        name: "New York Hub",
        category: "Metropolis",
        priority: "High",
        capacity: 8500,
        geometry: { type: "Point", coordinates: [-74.006, 40.7128] },
        layerId,
        isPersisted: false,
      },
      {
        id: `feat_${Math.random().toString(36).slice(2)}`,
        name: "London Station",
        category: "European Central",
        priority: "High",
        capacity: 9200,
        geometry: { type: "Point", coordinates: [-0.1278, 51.5074] },
        layerId,
        isPersisted: false,
      },
      {
        id: `feat_${Math.random().toString(36).slice(2)}`,
        name: "Tokyo Cyberport",
        category: "Asia-Pacific",
        priority: "Critical",
        capacity: 12000,
        geometry: { type: "Point", coordinates: [139.6917, 35.6895] },
        layerId,
        isPersisted: false,
      },
      {
        id: `feat_${Math.random().toString(36).slice(2)}`,
        name: "Paris Node",
        category: "European Central",
        priority: "Medium",
        capacity: 6400,
        geometry: { type: "Point", coordinates: [2.3522, 48.8566] },
        layerId,
        isPersisted: false,
      },
    ];

    addLayer({
      id: layerId,
      name: "Global Infrastructure Hubs (Demo)",
      geometryType: "Point",
      isPersisted: false,
      isVisible: true,
      color: "#06B6D4",
      features: rawFeatures,
      recordCount: rawFeatures.length,
    });
  };

  return (
    <header className="app-header" id="app-header">
      <div className="app-header__brand">
        <div className="app-header__logo-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
          </svg>
        </div>
        <span className="app-header__logo">
          WebGIS<span style={{ background: "var(--accent-gradient)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontWeight: 800 }}>PRO</span>
          <span className="app-header__badge">Spatial Analytics Engine v2.4</span>
        </span>
      </div>

      <div className="app-header__right">
        {/* Recruiter Quick Sample Data Preset */}
        <button
          className="theme-toggle-btn"
          onClick={loadRecruiterSampleData}
          title="Load sample spatial datasets instantly for evaluation"
          style={{ background: "rgba(6, 182, 212, 0.18)", borderColor: "rgba(6, 182, 212, 0.4)", color: "#22D3EE" }}
          id="recruiter-preset-btn"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          <span>Sample GIS Preset</span>
        </button>

        {/* Live Telemetry Status Bar */}
        <div className="app-header__status">
          <span style={{ fontWeight: 600, color: "#E2E8F0" }}>{layers.length} Layers</span>
          <span>·</span>
          <span style={{ fontWeight: 600, color: "#E2E8F0" }}>{totalFeatures} Features</span>
          <span>·</span>
          <span style={{ color: boundaryLayer ? "#10B981" : "#94A3B8", fontWeight: 600 }}>
            {boundaryLayer ? "Boundary Active" : "No Boundary"}
          </span>
          <span className="app-header__status-dot" title="Live Spatial Engine Online" />
        </div>

        {/* Auth / Account Controls */}
        {!isCheckingSession && (
          isLoggedIn ? (
            <button
              className="theme-toggle-btn"
              onClick={handleLogout}
              title={`Log out ${user.username}`}
              id="logout-btn"
              style={{ background: "rgba(255, 255, 255, 0.15)", borderColor: "rgba(255, 255, 255, 0.25)" }}
            >
              <div style={{ width: "18px", height: "18px", borderRadius: "50%", background: "var(--accent-gradient)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", fontWeight: 800, color: "#FFF" }}>
                {user.username.charAt(0).toUpperCase()}
              </div>
              <span>{user.username}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
            </button>
          ) : (
            <button
              className="theme-toggle-btn"
              onClick={() => setShowAuthModal(true)}
              id="login-btn"
              style={{ background: "var(--accent-gradient)", border: "none", boxShadow: "0 2px 10px rgba(6, 182, 212, 0.4)" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" /></svg>
              <span>Sign In / Join</span>
            </button>
          )
        )}

        {/* Day / Night Theme Toggle */}
        <button
          className="theme-toggle-btn"
          onClick={toggleTheme}
          title={`Switch to ${theme === "light" ? "Night" : "Day"} Mode`}
          aria-label="Toggle Day or Night theme"
          id="theme-toggle-btn"
        >
          {theme === "light" ? (
            <>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
              </svg>
              <span>Night</span>
            </>
          ) : (
            <>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
              <span>Day</span>
            </>
          )}
        </button>
      </div>

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </header>
  );
}

function AppInner() {
  const [isDrawingBoundary, setIsDrawingBoundary] = useState(false);
  const [isAddingPoint, setIsAddingPoint] = useState(false);
  const mapElRef = useRef(null);

  const handleToggleBoundaryDraw = () => {
    setIsAddingPoint(false);
    setIsDrawingBoundary((v) => !v);
  };

  const handleToggleAddPoint = () => {
    setIsDrawingBoundary(false);
    setIsAddingPoint((v) => !v);
  };

  return (
    <div className="app-layout" id="app-layout">
      {/* Top Header */}
      <AppHeader />

      {/* Three-panel body */}
      <div className="app-body" id="app-body">
        {/* Left sidebar */}
        <LeftSidebar
          isDrawingBoundary={isDrawingBoundary}
          onToggleBoundaryDraw={handleToggleBoundaryDraw}
          isAddingPoint={isAddingPoint}
          onToggleAddPoint={handleToggleAddPoint}
          mapElRef={mapElRef}
        />

        {/* Center Map View */}
        <div className="map-view-wrapper" ref={mapElRef} id="map-view-wrapper">
          <MapView
            isDrawingBoundary={isDrawingBoundary}
            isAddingPoint={isAddingPoint}
            onBoundaryDrawEnd={() => setIsDrawingBoundary(false)}
            onPointFormClose={() => setIsAddingPoint(false)}
          />
        </div>

        {/* Right sidebar */}
        <RightSidebar
          LegendComponent={Legend}
          FeatureDetailsComponent={FeatureDetails}
        />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <LayersProvider>
        <AppInner />
      </LayersProvider>
    </AuthProvider>
  );
}