/**
 * LeftSidebar.jsx
 * Full left sidebar combining Dev B's upload + layer list with Dev A's
 * map tool buttons: Draw Boundary, Add Point, Export SHP, Export PDF.
 *
 * Tool state (isDrawingBoundary, isAddingPoint) is lifted to App.jsx
 * so MapView can react to it — passed in as props.
 */

import { useState } from "react";
import UploadControl from "../upload/UploadControl";
import { useLayersStore } from "../../state/layersStore";
import { useAuth } from "../../state/authStore";
import { getCategoryColor } from "../../constants/categoryColors";
import { describeGeometry } from "../../utils/geometryLabel";
import { exportShapefile } from "../../utils/shapefileExport";
import { exportToPdf } from "../../utils/exportToPdf";
import { boundaryThroughAllPoints } from "../../utils/convexHull";
import { saveBoundary as apiSaveBoundary, getFeatures, getBoundary } from "../../services/api";

// ── Layer list ────────────────────────────────────────────────────────────────

function LayerList() {
  const { layers, activeLayerId, setActiveLayer, toggleLayerVisibility, removeLayer } = useLayersStore();
  const [deletingId, setDeletingId] = useState(null);

  if (!layers.length) {
    return <p className="sidebar-empty">No layers yet. Upload a file to add one.</p>;
  }

  const handleDelete = async (e, layer) => {
    e.stopPropagation();
    const label = layer.isPersisted
      ? `Delete "${layer.name}"? This removes it from the database permanently.`
      : `Remove "${layer.name}" from this session?`;
    if (!window.confirm(label)) return;

    setDeletingId(layer.id);
    try {
      await removeLayer(layer.id);
    } catch (err) {
      alert(`Couldn't delete layer: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <ul className="layer-list">
      {layers.map((layer) => (
        <li
          key={layer.id}
          className={`layer-item ${activeLayerId === layer.id ? "layer-item--active" : ""}`}
          onClick={() => setActiveLayer(layer.id)}
          id={`layer-item-${layer.id}`}
        >
          <span className="layer-item__swatch" style={{ background: getCategoryColor(layer.geometryType) }} />
          <span className="layer-item__name">{layer.name}</span>
          <span className="layer-item__count">{layer.recordCount}</span>
          {layer.isPersisted
            ? <span title="Saved" className="layer-item__dot layer-item__dot--saved">●</span>
            : <span title="View only" className="layer-item__dot layer-item__dot--session">◌</span>}
          <button
            className="layer-item__vis-btn"
            onClick={(e) => { e.stopPropagation(); toggleLayerVisibility(layer.id); }}
            aria-label={layer.isVisible ? "Hide layer" : "Show layer"}
            id={`layer-vis-${layer.id}`}
            title={layer.isVisible ? "Hide" : "Show"}
          >
            {layer.isVisible
              ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
              : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
            }
          </button>
          <button
            className="layer-item__delete-btn"
            onClick={(e) => handleDelete(e, layer)}
            aria-label={`Delete ${layer.name}`}
            id={`layer-delete-${layer.id}`}
            title="Delete layer"
            disabled={deletingId === layer.id}
          >
            {deletingId === layer.id
              ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="spin"><path d="M21 12a9 9 0 11-3-6.7" /></svg>
              : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
            }
          </button>
        </li>
      ))}
    </ul>
  );
}

// ── Tool button ───────────────────────────────────────────────────────────────

function ToolBtn({ id, icon, label, active, onClick, variant = "default", disabled = false }) {
  return (
    <button
      id={id}
      className={`tool-btn tool-btn--${variant} ${active ? "tool-btn--active" : ""}`}
      onClick={onClick}
      title={label}
      aria-pressed={active}
      disabled={disabled}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function LeftSidebar({
  isDrawingBoundary,
  onToggleBoundaryDraw,
  isAddingPoint,
  onToggleAddPoint,
  mapElRef,
}) {
  const { layers, boundaryLayer, boundaryVisible, mapInstance, addLayer, setBoundary, toggleBoundaryVisibility } = useLayersStore();
  const { isLoggedIn } = useAuth();
  const [isLoadingSaved, setIsLoadingSaved] = useState(false);
  const [loadError, setLoadError] = useState(null);

  const handleLoadSaved = async () => {
    setIsLoadingSaved(true);
    setLoadError(null);
    try {
      const [features, boundary] = await Promise.all([getFeatures(), getBoundary()]);

      if (!features || features.length === 0) {
        setLoadError("No saved data found yet.");
        return;
      }

      const grouped = {};
      for (const f of features) {
        const lid = f.layerId || "unassigned";
        if (!grouped[lid]) grouped[lid] = [];
        grouped[lid].push(f);
      }

      Object.entries(grouped).forEach(([layerId, feats]) => {
        const geometryType = feats[0]?.geometry?.type || "Unknown";
        addLayer({
          id: layerId,
          name: `Saved ${describeGeometry(geometryType)} Layer`,
          geometryType,
          isPersisted: true,
          isVisible: true,
          color: "#1D6E5A",
          features: feats.map((f) => ({ ...f, id: f._id || f.feature_id, isPersisted: true })),
          recordCount: feats.length,
        });
      });

      if (boundary?.geometry) {
        setBoundary(boundary.geometry);
      }
    } catch (err) {
      setLoadError(err.message);
    } finally {
      setIsLoadingSaved(false);
    }
  };

  const pointCount = layers
    .flatMap((l) => l.features || [])
    .filter((f) => f.geometry?.type === "Point").length;

  const handleGenerateBoundary = async () => {
    const points = layers
      .flatMap((l) => l.features || [])
      .filter((f) => f.geometry?.type === "Point")
      .map((f) => f.geometry.coordinates); // [lng, lat]

    const polygon = boundaryThroughAllPoints(points);
    if (!polygon) return; // fewer than 3 distinct points — nothing to enclose

    setBoundary(polygon);
    apiSaveBoundary(polygon).catch(console.error);
  };

  const handleExportShp = () => {
    let layersToExport = [...layers];

    if (boundaryVisible && boundaryLayer) {
      layersToExport.push({
        id: "boundary_layer_export",
        name: "Area Boundary",
        geometryType: "Polygon",
        isVisible: true,
        features: [
          {
            type: "Feature",
            geometry: boundaryLayer,
            properties: {
              Point_ID: "BOUND_1",
              Point_Name: "Area Boundary",
              Category: "Boundary",
              Description: "Faculty of Science Area Boundary Polygon",
            },
          },
        ],
      });
    }

    exportShapefile(layersToExport, "webgis_export");
  };

  const handleExportPdf = () =>
    exportToPdf({
      title: "WebGIS Field Survey",
      layers,
      mapEl: mapElRef?.current,
      boundary: boundaryLayer,
      mapInstance,
    });

  return (
    <aside className="left-sidebar" id="left-sidebar" aria-label="Tools panel">

      {/* Upload section */}
      <div className="left-sidebar__section">
        <p className="left-sidebar__section-title">Upload Data</p>
        <UploadControl />
      </div>

      {/* Load previously saved data — on demand, not automatic */}
      <div className="left-sidebar__section">
        <p className="left-sidebar__section-title">Project Data</p>
        <button
          className="tool-btn"
          id="tool-load-saved"
          onClick={handleLoadSaved}
          disabled={isLoadingSaved}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-3-6.7" /><polyline points="21 3 21 9 15 9" /></svg>
          <span>{isLoadingSaved ? "Loading…" : "Load Saved Data"}</span>
        </button>
        {loadError && (
          <div className="upload-control__error" role="alert" id="load-saved-error">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
            </svg>
            {loadError}
          </div>
        )}
      </div>

      {/* Layer list */}
      <div className="left-sidebar__section left-sidebar__section--grow">
        <p className="left-sidebar__section-title">Layers</p>
        <LayerList />
      </div>

      {/* Map tools */}
      <div className="left-sidebar__section">
        <p className="left-sidebar__section-title">Map Tools</p>
        <div className="tool-btn-group">
          <ToolBtn
            id="tool-draw-boundary"
            icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="3 11 22 2 13 21 11 13 3 11" /></svg>}
            label={!isLoggedIn ? "Log In to Draw Boundary" : isDrawingBoundary ? "Drawing… (dbl-click to finish)" : "Draw Boundary"}
            active={isDrawingBoundary}
            onClick={onToggleBoundaryDraw}
            variant={isDrawingBoundary ? "active" : "default"}
            disabled={!isLoggedIn}
          />
          <ToolBtn
            id="tool-add-point"
            icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5" /><line x1="12" y1="2" x2="12" y2="7" /><line x1="12" y1="17" x2="12" y2="22" /><line x1="2" y1="12" x2="7" y2="12" /><line x1="17" y1="12" x2="22" y2="12" /></svg>}
            label={!isLoggedIn ? "Log In to Add Point" : "Add Point"}
            active={isAddingPoint}
            onClick={onToggleAddPoint}
            disabled={!isLoggedIn}
          />
          <ToolBtn
            id="tool-generate-boundary"
            icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3l4 15 5-6 6-5-15-4z" /></svg>}
            label={!isLoggedIn ? "Log In to Generate Boundary" : pointCount < 3 ? "Generate Boundary (needs 3+ points)" : "Generate Boundary from Points"}
            onClick={handleGenerateBoundary}
            disabled={!isLoggedIn || pointCount < 3}
          />
          <ToolBtn
            id="tool-toggle-boundary"
            icon={boundaryVisible
              ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
              : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
            }
            label={!boundaryLayer ? "No Boundary Yet" : boundaryVisible ? "Hide Boundary" : "Show Boundary"}
            active={boundaryVisible && !!boundaryLayer}
            onClick={toggleBoundaryVisibility}
            disabled={!boundaryLayer}
          />
        </div>
      </div>

      {/* Export section */}
      <div className="left-sidebar__section">
        <p className="left-sidebar__section-title">Export</p>
        <div className="tool-btn-group">
          <ToolBtn
            id="tool-export-shp"
            icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>}
            label="Export Shapefile"
            onClick={handleExportShp}
          />
          <ToolBtn
            id="tool-export-pdf"
            icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="12" y1="18" x2="12" y2="12" /><line x1="9" y1="15" x2="15" y2="15" /></svg>}
            label="Export PDF"
            onClick={handleExportPdf}
          />
        </div>
      </div>
    </aside>
  );
}