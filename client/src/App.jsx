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
  const { layers, boundaryLayer, theme, toggleTheme, clearAll } = useLayersStore();
  const { user, isLoggedIn, isCheckingSession, logout } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const totalFeatures = layers.reduce((acc, l) => acc + (l.recordCount || 0), 0);

  const handleLogout = () => {
    clearAll();
    logout();
  };

  return (
    <header className="app-header" id="app-header">
      <div className="app-header__brand">
        <div className="app-header__logo-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
          </svg>
        </div>
        <span className="app-header__logo">
          WebGIS
          <span className="app-header__badge">Global Explorer</span>
        </span>
      </div>

      <div className="app-header__right">
        <div className="app-header__status">
          <span>{layers.length} Layers</span>
          <span>·</span>
          <span>{totalFeatures} Features</span>
          <span>·</span>
          <span style={{ color: boundaryLayer ? "#10B981" : "#94A3B8" }}>
            {boundaryLayer ? "Boundary Set" : "No Boundary"}
          </span>
          <span className="app-header__status-dot" title="System Ready" />
        </div>

        {/* Auth */}
        {!isCheckingSession && (
          isLoggedIn ? (
            <button
              className="theme-toggle-btn"
              onClick={handleLogout}
              title={`Log out ${user.username}`}
              id="logout-btn"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" /></svg>
              <span>{user.username}</span>
            </button>
          ) : (
            <button
              className="theme-toggle-btn"
              onClick={() => setShowAuthModal(true)}
              id="login-btn"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" /></svg>
              <span>Log In</span>
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