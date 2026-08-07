/**
 * layersStore.jsx
 * Central application state for all layer data — both persisted (MongoDB) and
 * session-only (view-only) layers. Also manages application theme (Day/Night mode).
 */

import { createContext, useContext, useReducer, useCallback, useEffect } from "react";
import { deleteLayer as apiDeleteLayer } from "../services/api";

const getSavedTheme = () => {
  if (typeof window !== "undefined" && window.localStorage) {
    const saved = localStorage.getItem("webgis-theme");
    if (saved === "dark" || saved === "light") return saved;
  }
  return "light";
};

// ─── Initial State ────────────────────────────────────────────────────────────

const initialState = {
  layers: [],
  activeLayerId: null,
  selectedFeatureId: null,
  boundaryLayer: null,
  boundaryVisible: true,
  theme: getSavedTheme(),
  mapInstance: null,
};

// ─── Action Types ─────────────────────────────────────────────────────────────

const ADD_LAYER = "ADD_LAYER";
const REMOVE_LAYER = "REMOVE_LAYER";
const TOGGLE_LAYER_VISIBILITY = "TOGGLE_LAYER_VISIBILITY";
const SET_ACTIVE_LAYER = "SET_ACTIVE_LAYER";
const SET_SELECTED_FEATURE = "SET_SELECTED_FEATURE";
const SET_BOUNDARY = "SET_BOUNDARY";
const TOGGLE_BOUNDARY_VISIBILITY = "TOGGLE_BOUNDARY_VISIBILITY";
const TOGGLE_THEME = "TOGGLE_THEME";
const SET_MAP_INSTANCE = "SET_MAP_INSTANCE";

// ─── Reducer ──────────────────────────────────────────────────────────────────

function reducer(state, action) {
  switch (action.type) {
    case ADD_LAYER: {
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
        activeLayerId: state.activeLayerId === action.payload ? null : state.activeLayerId,
        selectedFeatureId: null,
      };

    case TOGGLE_LAYER_VISIBILITY:
      return {
        ...state,
        layers: state.layers.map((l) =>
          l.id === action.payload ? { ...l, isVisible: !l.isVisible } : l
        ),
      };

    case SET_ACTIVE_LAYER:
      return { ...state, activeLayerId: action.payload, selectedFeatureId: null };

    case SET_SELECTED_FEATURE:
      return { ...state, selectedFeatureId: action.payload };

    case SET_BOUNDARY:
      return { ...state, boundaryLayer: action.payload, boundaryVisible: true };

    case TOGGLE_BOUNDARY_VISIBILITY:
      return { ...state, boundaryVisible: !state.boundaryVisible };

    case TOGGLE_THEME: {
      const nextTheme = state.theme === "light" ? "dark" : "light";
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.setItem("webgis-theme", nextTheme);
      }
      return { ...state, theme: nextTheme };
    }

    case SET_MAP_INSTANCE:
      return { ...state, mapInstance: action.payload };

    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

const LayersContext = createContext(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function LayersProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Sync data-theme attribute on root html node whenever theme changes
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", state.theme);
  }, [state.theme]);

  const addLayer = useCallback((layer) => {
    dispatch({ type: ADD_LAYER, payload: layer });
  }, []);

  const removeLayer = useCallback(async (layerId) => {
    const layer = state.layers.find((l) => l.id === layerId);
    if (layer?.isPersisted) {
      await apiDeleteLayer(layerId).catch(console.error);
    }
    dispatch({ type: REMOVE_LAYER, payload: layerId });
  }, [state.layers]);

  const toggleLayerVisibility = useCallback((layerId) => {
    dispatch({ type: TOGGLE_LAYER_VISIBILITY, payload: layerId });
  }, []);

  const setActiveLayer = useCallback((layerId) => {
    dispatch({ type: SET_ACTIVE_LAYER, payload: layerId });
  }, []);

  const setSelectedFeature = useCallback((featureId) => {
    dispatch({ type: SET_SELECTED_FEATURE, payload: featureId });
  }, []);

  const setBoundary = useCallback((geojson) => {
    dispatch({ type: SET_BOUNDARY, payload: geojson });
  }, []);

  const toggleBoundaryVisibility = useCallback(() => {
    dispatch({ type: TOGGLE_BOUNDARY_VISIBILITY });
  }, []);

  const toggleTheme = useCallback(() => {
    dispatch({ type: TOGGLE_THEME });
  }, []);

  const setMapInstance = useCallback((map) => {
    dispatch({ type: SET_MAP_INSTANCE, payload: map });
  }, []);

  const activeLayer = state.layers.find((l) => l.id === state.activeLayerId) || null;

  const allVisibleFeatures = state.layers
    .filter((l) => l.isVisible)
    .flatMap((l) => l.features || []);

  return (
    <LayersContext.Provider
      value={{
        layers: state.layers,
        activeLayerId: state.activeLayerId,
        selectedFeatureId: state.selectedFeatureId,
        boundaryLayer: state.boundaryLayer,
        boundaryVisible: state.boundaryVisible,
        theme: state.theme,
        mapInstance: state.mapInstance,
        activeLayer,
        allVisibleFeatures,

        addLayer,
        removeLayer,
        toggleLayerVisibility,
        setActiveLayer,
        setSelectedFeature,
        setBoundary,
        toggleBoundaryVisibility,
        toggleTheme,
        setMapInstance,
      }}
    >
      {children}
    </LayersContext.Provider>
  );
}

export function useLayersStore() {
  const ctx = useContext(LayersContext);
  if (!ctx) {
    throw new Error("useLayersStore must be used inside <LayersProvider>");
  }
  return ctx;
}