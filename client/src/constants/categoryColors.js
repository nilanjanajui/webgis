/**
 * Cartographic color palette and category color assignments.
 * Based on the WebGIS design system.
 */

export const PALETTE = {
  ink: "#2B2B28",
  paper: "#F7F5F0",
  teal: "#1D6E5A",
  coral: "#C85A3C",
  slate: "#5B6B66",
  amber: "#D68A2E",
  mist: "#E8E4DC",
  fog: "#C8C4BA",
};

/**
 * Category → color mapping.
 * Used for styling map markers and legend swatches.
 */
export const CATEGORY_COLORS = {
  Building: "#1D6E5A",       // teal
  "Access Point": "#C85A3C", // coral
  Landmark: "#D68A2E",       // amber
  Facility: "#5B6B66",       // slate
  Road: "#2B2B28",           // ink
  Boundary: "#1D6E5A",       // teal (boundary layer)
  Default: "#5B6B66",        // slate fallback
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
