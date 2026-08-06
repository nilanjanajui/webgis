/**
 * PointForm.jsx
 * Floating form to manually add a single Point feature to the map.
 * The user clicks the map to place the point, then fills in the fields.
 * On submit the feature is added to the active layer (or a new layer).
 */

import { useState, useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import { useLayersStore } from "../../state/layersStore";
import { CATEGORY_OPTIONS, getCategoryColor } from "../../constants/categoryColors";
import { createFeature as apiCreateFeature } from "../../services/api";

export default function PointForm({ isActive, onClose }) {
  const map = useMap();
  const { addLayer, layers, activeLayerId, setSelectedFeature } = useLayersStore();

  const [pendingLatLng, setPendingLatLng] = useState(null); // where user clicked
  const [form, setForm] = useState({ name: "", category: "Building", descr: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const previewMarkerRef = useRef(null);

  // Listen for map clicks while active
  useEffect(() => {
    if (!isActive) {
      cleanup();
      return;
    }
    map.getContainer().style.cursor = "cell";
    const onClick = (e) => setPendingLatLng(e.latlng);
    map.on("click", onClick);
    return () => {
      map.off("click", onClick);
      map.getContainer().style.cursor = "";
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  // Show preview marker when user clicks
  useEffect(() => {
    if (previewMarkerRef.current) {
      map.removeLayer(previewMarkerRef.current);
      previewMarkerRef.current = null;
    }
    if (!pendingLatLng) return;

    const color = getCategoryColor(form.category);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22">
      <circle cx="11" cy="11" r="8" fill="${color}" stroke="#fff" stroke-width="2.5" opacity="0.85"/>
      <circle cx="11" cy="11" r="3" fill="#fff" opacity="0.9"/>
    </svg>`;
    const icon = L.divIcon({ html: svg, className: "", iconSize: [22, 22], iconAnchor: [11, 11] });
    previewMarkerRef.current = L.marker([pendingLatLng.lat, pendingLatLng.lng], { icon }).addTo(map);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingLatLng, form.category]);

  function cleanup() {
    if (previewMarkerRef.current) {
      map.removeLayer(previewMarkerRef.current);
      previewMarkerRef.current = null;
    }
    setPendingLatLng(null);
    setForm({ name: "", category: "Building", descr: "" });
    setError(null);
  }

  const handleClose = () => {
    cleanup();
    onClose?.();
  };

  const handleSubmit = async (persist) => {
    if (!pendingLatLng) { setError("Click the map to place a point first."); return; }
    if (!form.name.trim()) { setError("Name is required."); return; }

    setError(null);
    setSaving(true);

    const id = crypto.randomUUID ? crypto.randomUUID() : `feat_${Date.now()}`;
    const newFeature = {
      id,
      feature_id: id.slice(0, 8),
      name: form.name.trim(),
      category: form.category,
      descr: form.descr,
      geometry: { type: "Point", coordinates: [pendingLatLng.lng, pendingLatLng.lat] },
      layerId: activeLayerId || "manual",
      isPersisted: persist,
    };

    try {
      // Check if active layer exists, otherwise create a new one
      const targetLayer = layers.find((l) => l.id === activeLayerId);
      if (targetLayer) {
        // Patch existing layer in store (add feature)
        // The store doesn't expose a direct addFeature — we rebuild the layer
        addLayer({
          ...targetLayer,
          features: [...(targetLayer.features || []), newFeature],
          recordCount: (targetLayer.recordCount || 0) + 1,
        });
      } else {
        addLayer({
          id: `layer_manual_${Date.now()}`,
          name: "Manual Points",
          geometryType: "Point",
          isPersisted: persist,
          isVisible: true,
          color: getCategoryColor(form.category),
          features: [newFeature],
          recordCount: 1,
        });
      }

      if (persist) {
        await apiCreateFeature({ ...newFeature, latitude: pendingLatLng.lat, longitude: pendingLatLng.lng });
      }

      setSelectedFeature(id);
      handleClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!isActive) return null;

  return (
    <div className="point-form" id="point-form">
      <div className="point-form__header">
        <span className="point-form__title">Add Point</span>
        <button className="modal-close" onClick={handleClose} aria-label="Cancel">✕</button>
      </div>

      {!pendingLatLng ? (
        <p className="point-form__hint">Click on the map to place the point.</p>
      ) : (
        <>
          <p className="point-form__coords">
            {pendingLatLng.lat.toFixed(6)}, {pendingLatLng.lng.toFixed(6)}
          </p>

          <div className="point-form__fields">
            <label htmlFor="pf-name">Name *</label>
            <input
              id="pf-name"
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Feature name"
              autoFocus
            />

            <label htmlFor="pf-cat">Category</label>
            <select
              id="pf-cat"
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            >
              {CATEGORY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>

            <label htmlFor="pf-desc">Description</label>
            <input
              id="pf-desc"
              type="text"
              value={form.descr}
              onChange={(e) => setForm((f) => ({ ...f, descr: e.target.value }))}
              placeholder="Optional description"
            />
          </div>

          {error && <p className="point-form__error">{error}</p>}

          <div className="preview-actions" style={{ padding: "0.75rem 0 0" }}>
            <button className="btn btn--secondary" onClick={handleClose} disabled={saving}>Cancel</button>
            <button className="btn btn--ghost" onClick={() => handleSubmit(false)} disabled={saving}>View Only</button>
            <button className="btn btn--primary" onClick={() => handleSubmit(true)} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
