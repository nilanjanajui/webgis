/**
 * layersStore.js
 * Central application state for all layer data — both persisted (MongoDB) and
 * session-only (view-only) layers. Uses React Context + useReducer for
 * predictable state updates. Dev A's map components consume this store read-only;
 * Dev B's upload pipeline and attribute table write to it.
 */

import { createContext, useContext, useReducer, useCallback } from "react";
import { deleteLayer as apiDeleteLayer } from "../services/api";

// ─── Initial State ────────────────────────────────────────────────────────────

const initialState = {
  /** @type {Array<LayerObject>} All active layers (persisted + view-only) */
  layers: [],

  /** @type {string|null} Layer whose attributes are shown in the table */
  activeLayerId: null,

  /** @type {string|null} Currently selected feature ID (shared map ↔ table sync) */
  selectedFeatureId: null,

  /** @type {Object|null} Boundary GeoJSON polygon (owned by Dev A's BoundaryDrawTool) */
  boundaryLayer: null,
};

// ─── Action Types ─────────────────────────────────────────────────────────────

const ADD_LAYER = "ADD_LAYER";
const REMOVE_LAYER = "REMOVE_LAYER";
const TOGGLE_LAYER_VISIBILITY = "TOGGLE_LAYER_VISIBILITY";
const SET_ACTIVE_LAYER = "SET_ACTIVE_LAYER";
const SET_SELECTED_FEATURE = "SET_SELECTED_FEATURE";
const SET_BOUNDARY = "SET_BOUNDARY";
const MARK_LAYER_PERSISTED = "MARK_LAYER_PERSISTED";

// ─── Reducer ──────────────────────────────────────────────────────────────────

function reducer(state, action) {
  switch (action.type) {
    case ADD_LAYER: {
      // Prevent duplicate layer IDs
      const exists = state.layers.find((l) => l.id === action.payload.id);
      if (exists) return state;
      return {
        ...state,
        layers: [...state.layers, action.payload],
        activeLayerId: action.payload.id,
      };
    }

    case REMOVE_LAYER:
      return {
        ...state,
        layers: state.layers.filter((l) => l.id !== action.payload),
        activeLayerId:
          state.activeLayerId === action.payload
            ? null
            : state.activeLayerId,
        selectedFeatureId: null,
      };

    case TOGGLE_LAYER_VISIBILITY:
      return {
        ...state,
        layers: state.layers.map((l) =>
          l.id === action.payload
            ? { ...l, isVisible: !l.isVisible }
            : l
        ),
      };

    case SET_ACTIVE_LAYER:
      return { ...state, activeLayerId: action.payload, selectedFeatureId: null };

    case SET_SELECTED_FEATURE:
      return { ...state, selectedFeatureId: action.payload };

    case SET_BOUNDARY:
      return { ...state, boundaryLayer: action.payload };

    case MARK_LAYER_PERSISTED:
      return {
        ...state,
        layers: state.layers.map((l) =>
          l.id === action.payload.tempId
            ? { ...l, id: action.payload.newId, isPersisted: true }
            : l
        ),
      };

    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

const LayersContext = createContext(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

/**
 * Wrap your app root with <LayersProvider> to enable the store.
 */
export function LayersProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  /** Add a fully-formed layer object to the store. */
  const addLayer = useCallback((layer) => {
    dispatch({ type: ADD_LAYER, payload: layer });
  }, []);

  /**
   * Remove a layer from the store.
   * If the layer is persisted, also calls the API to delete it from the DB.
   */
  const removeLayer = useCallback(async (layerId) => {
    const layer = state.layers.find((l) => l.id === layerId);
    if (layer?.isPersisted) {
      await apiDeleteLayer(layerId).catch(console.error);
    }
    dispatch({ type: REMOVE_LAYER, payload: layerId });
  }, [state.layers]);

  /** Toggle a layer's map visibility on/off. */
  const toggleLayerVisibility = useCallback((layerId) => {
    dispatch({ type: TOGGLE_LAYER_VISIBILITY, payload: layerId });
  }, []);

  /** Set which layer's attributes are displayed in the AttributeTable. */
  const setActiveLayer = useCallback((layerId) => {
    dispatch({ type: SET_ACTIVE_LAYER, payload: layerId });
  }, []);

  /**
   * Set the selected feature ID.
   * Both the map (Dev A) and the attribute table (Dev B) read/write this.
   * Pass null to clear selection.
   */
  const setSelectedFeature = useCallback((featureId) => {
    dispatch({ type: SET_SELECTED_FEATURE, payload: featureId });
  }, []);

  /** Update/replace the boundary layer GeoJSON. Used by Dev A's BoundaryDrawTool. */
  const setBoundary = useCallback((geojson) => {
    dispatch({ type: SET_BOUNDARY, payload: geojson });
  }, []);

  // ─── Derived helpers ──────────────────────────────────────────────────────

  /** Returns the active layer object, or null. */
  const activeLayer = state.layers.find((l) => l.id === state.activeLayerId) || null;

  /** Returns all features across all visible layers — for map rendering (Dev A). */
  const allVisibleFeatures = state.layers
    .filter((l) => l.isVisible)
    .flatMap((l) => l.features || []);

  return (
    <LayersContext.Provider
      value={{
        // State
        layers: state.layers,
        activeLayerId: state.activeLayerId,
        selectedFeatureId: state.selectedFeatureId,
        boundaryLayer: state.boundaryLayer,
        activeLayer,
        allVisibleFeatures,

        // Actions
        addLayer,
        removeLayer,
        toggleLayerVisibility,
        setActiveLayer,
        setSelectedFeature,
        setBoundary,
      }}
    >
      {children}
    </LayersContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Consume the layers store in any component.
 * @returns {Object} store state + action dispatchers
 */
export function useLayersStore() {
  const ctx = useContext(LayersContext);
  if (!ctx) {
    throw new Error("useLayersStore must be used inside <LayersProvider>");
  }
  return ctx;
}
