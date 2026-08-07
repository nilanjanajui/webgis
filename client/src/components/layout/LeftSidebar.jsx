/**
 * LeftSidebar.jsx
 * Full left sidebar combining Dev B's upload + layer list with Dev A's
 * map tool buttons: Draw Boundary, Add Point, Export SHP, Export PDF.
 *
 * Tool state (isDrawingBoundary, isAddingPoint) is lifted to App.jsx
 * so MapView can react to it — passed in as props.
 */

import UploadControl from "../upload/UploadControl";
import { useLayersStore } from "../../state/layersStore";
import { getCategoryColor } from "../../constants/categoryColors";
import { describeGeometry } from "../../utils/geometryLabel";
import { exportShapefile } from "../../utils/shapefileExport";
import { exportToPdf } from "../../utils/exportToPdf";

// ── Layer list ────────────────────────────────────────────────────────────────

function LayerList() {
  const { layers, activeLayerId, setActiveLayer, toggleLayerVisibility } = useLayersStore();

  if (!layers.length) {
    return <p className="sidebar-empty">No layers yet. Upload a file to add one.</p>;
  }

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
        </li>
      ))}
    </ul>
  );
}

// ── Tool button ───────────────────────────────────────────────────────────────

function ToolBtn({ id, icon, label, active, onClick, variant = "default" }) {
  return (
    <button
      id={id}
      className={`tool-btn tool-btn--${variant} ${active ? "tool-btn--active" : ""}`}
      onClick={onClick}
      title={label}
      aria-pressed={active}
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
  const { layers, boundaryLayer, mapInstance } = useLayersStore();

  const handleExportShp = () => exportShapefile(layers, "webgis_export");

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
            label={isDrawingBoundary ? "Drawing… (dbl-click to finish)" : "Draw Boundary"}
            active={isDrawingBoundary}
            onClick={onToggleBoundaryDraw}
            variant={isDrawingBoundary ? "active" : "default"}
          />
          <ToolBtn
            id="tool-add-point"
            icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5" /><line x1="12" y1="2" x2="12" y2="7" /><line x1="12" y1="17" x2="12" y2="22" /><line x1="2" y1="12" x2="7" y2="12" /><line x1="17" y1="12" x2="22" y2="12" /></svg>}
            label="Add Point"
            active={isAddingPoint}
            onClick={onToggleAddPoint}
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
