/**
 * Cartographic color palette and category color assignments.
 * Based on the WebGIS design system.
 */

export const PALETTE = {
  brightRed: "#FF3B30",
  orange: "#FF7A00",
  amber: "#FFB703",
  coral: "#FF4500",
  magenta: "#FF2D55",
  teal: "#00C49F",
};

/**
 * Category → color mapping.
 * Used for styling map markers and legend swatches.
 */
export const CATEGORY_COLORS = {
  Building: "#FF3B30",       // Bright Red
  "Access Point": "#FF7A00", // Bright Orange
  Landmark: "#FFB703",       // Bright Amber
  Facility: "#FF2D55",       // Vivid Magenta/Red
  Road: "#FF4500",           // Vivid Red-Orange
  Boundary: "#FF5722",       // Bright Coral Red
  Default: "#FF3B30",        // Vivid Red default fallback
};

/**
 * Returns the color for a given category string.
 * Falls back to Default if unrecognized.
 * @param {string} category
 * @returns {string} hex color
 */
export function getCategoryColor(category) {
  if (!category) return CATEGORY_COLORS.Default;
  return CATEGORY_COLORS[category] || CATEGORY_COLORS.Default;
}

/**
 * All known category options for dropdowns/filters.
 */
export const CATEGORY_OPTIONS = Object.keys(CATEGORY_COLORS).filter(
  (c) => c !== "Default"
);
