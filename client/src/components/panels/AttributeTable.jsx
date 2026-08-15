/**
 * AttributeTable.jsx
 * Interactive attribute table for the active layer.
 * - Displays features with human-readable column labels
 * - Row click → sets selectedFeatureId (Dev A's map responds)
 * - Coordinate columns render in JetBrains Mono
 * - Supports column sorting and text search filtering
 */

import { useState, useMemo } from "react";
import { useLayersStore } from "../../state/layersStore";
import { getFieldLabel } from "../../constants/fieldLabels";

/** Columns to always render in monospace (coordinates). */
const COORD_COLUMNS = new Set(["latitude", "longitude", "geometry"]);

/** Columns to hide from the table (internal implementation details). */
const HIDDEN_COLUMNS = new Set(["layerId", "isPersisted", "geometry"]);

function getSortedFeatures(features, sortKey, sortDir) {
  if (!sortKey) return features;
  return [...features].sort((a, b) => {
    const aVal = a[sortKey] ?? "";
    const bVal = b[sortKey] ?? "";
    if (typeof aVal === "number" && typeof bVal === "number") {
      return sortDir === "asc" ? aVal - bVal : bVal - aVal;
    }
    return sortDir === "asc"
      ? String(aVal).localeCompare(String(bVal))
      : String(bVal).localeCompare(String(aVal));
  });
}

export default function AttributeTable() {
  const { activeLayer, selectedFeatureId, setSelectedFeature } = useLayersStore();

  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState("asc");
  const [search, setSearch] = useState("");

  const features = activeLayer?.features || [];

  // Derive visible columns from all features
  const columns = useMemo(() => {
    if (!features.length) return [];
    const keySet = new Set();
    features.forEach((f) => {
      Object.keys(f).forEach((k) => {
        if (!HIDDEN_COLUMNS.has(k) && k !== "id") {
          keySet.add(k);
        }
      });
    });
    return Array.from(keySet);
  }, [features]);

  // Filter by search query
  const filtered = useMemo(() => {
    if (!search.trim()) return features;
    const q = search.toLowerCase();
    return features.filter((f) =>
      columns.some((col) => String(f[col] ?? "").toLowerCase().includes(q))
    );
  }, [features, columns, search]);

  // Sort
  const sorted = useMemo(
    () => getSortedFeatures(filtered, sortKey, sortDir),
    [filtered, sortKey, sortDir]
  );

  const handleSort = (col) => {
    if (sortKey === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(col);
      setSortDir("asc");
    }
  };

  if (!activeLayer) {
    return (
      <div className="attr-table__empty" id="attr-table-empty">
        <p>No layer selected. Upload or select a layer to view its attributes.</p>
      </div>
    );
  }

  return (
    <div className="attr-table" id="attribute-table">
      {/* Toolbar */}
      <div className="attr-table__toolbar">
        <span className="attr-table__layer-name">{activeLayer.name}</span>
        <span className="attr-table__count">{sorted.length} / {features.length} features</span>
        <input
          className="attr-table__search"
          type="text"
          placeholder="Search…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search features"
          id="attr-table-search"
        />
      </div>

      {/* Table */}
      <div className="attr-table__scroll">
        <table className="attr-table__grid" id="attr-table-grid">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col}
                  className={`attr-table__th ${sortKey === col ? "attr-table__th--sorted" : ""}`}
                  onClick={() => handleSort(col)}
                  aria-sort={
                    sortKey === col
                      ? sortDir === "asc"
                        ? "ascending"
                        : "descending"
                      : "none"
                  }
                  id={`attr-table-col-${col}`}
                >
                  {getFieldLabel(col)}
                  {sortKey === col && (
                    <span className="attr-table__sort-icon">
                      {sortDir === "asc" ? " ↑" : " ↓"}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((feature) => (
              <tr
                key={feature.id}
                className={`attr-table__row ${
                  selectedFeatureId === feature.id ? "attr-table__row--selected" : ""
                }`}
                onClick={() =>
                  setSelectedFeature(
                    selectedFeatureId === feature.id ? null : feature.id
                  )
                }
                aria-selected={selectedFeatureId === feature.id}
                id={`attr-table-row-${feature.id}`}
              >
                {columns.map((col) => (
                  <td
                    key={col}
                    className={`attr-table__td ${
                      COORD_COLUMNS.has(col) ? "attr-table__td--mono" : ""
                    }`}
                  >
                    {feature[col] ?? "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {sorted.length === 0 && (
          <p className="attr-table__no-results" id="attr-table-no-results">
            No features match your search.
          </p>
        )}
      </div>
    </div>
  );
}
