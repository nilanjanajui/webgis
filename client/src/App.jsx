/**
 * App.jsx — root layout
 *
 * Dev B owns:
 *  - LayersProvider wrapping the full app
 *  - LeftSidebar upload section + layer list
 *  - RightSidebar shell (AttributeTable tab)
 *
 * Dev A owns (slots marked with TODO-DEV-A):
 *  - MapView (the center panel)
 *  - Legend component (passed into RightSidebar)
 *  - FeatureDetails component (passed into RightSidebar)
 *  - LeftSidebar tool buttons (draw boundary, manual point)
 */

import { useState } from "react";
import { LayersProvider, useLayersStore } from "./state/layersStore";
import UploadControl from "./components/upload/UploadControl";
import RightSidebar from "./components/layout/RightSidebar";
import { getCategoryColor } from "./constants/categoryColors";
import "./index.css";

// ─── Layer List (inside left sidebar) ────────────────────────────────────────

function LayerList() {
  const {
    layers,
    activeLayerId,
    setActiveLayer,
    toggleLayerVisibility,
  } = useLayersStore();

  if (layers.length === 0) {
    return (
      <p style={{ fontSize: "0.78rem", color: "var(--color-fog)", textAlign: "center", padding: "0.5rem 0" }}>
        No layers yet. Upload a file to add one.
      </p>
    );
  }

  return (
    <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "0.15rem" }}>
      {layers.map((layer) => (
        <li
          key={layer.id}
          className={`layer-item ${activeLayerId === layer.id ? "layer-item--active" : ""}`}
          onClick={() => setActiveLayer(layer.id)}
          id={`layer-item-${layer.id}`}
        >
          <span
            className="layer-item__swatch"
            style={{ background: getCategoryColor(layer.geometryType) }}
          />
          <span className="layer-item__name">{layer.name}</span>
          <span className="layer-item__count">{layer.recordCount}</span>
          {layer.isPersisted ? (
            <span title="Saved to project" style={{ fontSize: "0.65rem", color: "var(--color-teal)" }}>●</span>
          ) : (
            <span title="View only (session)" style={{ fontSize: "0.65rem", color: "var(--color-amber)" }}>◌</span>
          )}
          <button
            className="layer-item__vis-btn"
            onClick={(e) => { e.stopPropagation(); toggleLayerVisibility(layer.id); }}
            aria-label={layer.isVisible ? "Hide layer" : "Show layer"}
            id={`layer-vis-${layer.id}`}
            title={layer.isVisible ? "Hide" : "Show"}
          >
            {layer.isVisible ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            )}
          </button>
        </li>
      ))}
    </ul>
  );
}

// ─── Inner App (has access to store) ─────────────────────────────────────────

function AppInner() {
  return (
    <div className="app-layout" id="app-layout">
      {/* ── Top header ── */}
      <header className="app-header" id="app-header">
        <span className="app-header__logo">WebGIS</span>
        <span className="app-header__badge">Field Survey</span>
      </header>

      {/* ── Three-panel body ── */}
      <div className="app-body" id="app-body">

        {/* ── Left sidebar (Dev B: upload + layers) ── */}
        <aside className="left-sidebar" id="left-sidebar" aria-label="Tools panel">
          <div className="left-sidebar__section">
            <p className="left-sidebar__section-title">Upload Data</p>
            <UploadControl />
          </div>

          <div className="left-sidebar__section" style={{ flex: 1, minHeight: 0 }}>
            <p className="left-sidebar__section-title">Layers</p>
            <LayerList />
          </div>

          {/* TODO-DEV-A: Add drawing tools (BoundaryDrawTool, manual point button) below */}
          <div className="left-sidebar__section" style={{ opacity: 0.4, pointerEvents: "none" }}>
            <p className="left-sidebar__section-title">Map Tools</p>
            <p style={{ fontSize: "0.75rem", color: "var(--color-slate)" }}>
              Dev A — boundary draw, point tool, exports
            </p>
          </div>
        </aside>

        {/* ── Map center (Dev A) ── */}
        {/* TODO-DEV-A: Replace <div class="map-placeholder"> with <MapView /> */}
        <div className="map-placeholder" id="map-placeholder">
          Map view — Dev A
        </div>

        {/* ── Right sidebar (Dev B: RightSidebar shell + AttributeTable) ── */}
        {/* TODO-DEV-A: Pass LegendComponent and FeatureDetailsComponent props when ready */}
        <RightSidebar />
      </div>
    </div>
  );
}

// ─── Root export ──────────────────────────────────────────────────────────────

export default function App() {
  return (
    <LayersProvider>
      <AppInner />
    </LayersProvider>
  );
}
