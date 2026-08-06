/**
 * fieldMatcher.js
 * Auto-maps uploaded column headers to the agreed internal field names.
 * Returns a mapping object and a list of unmatched columns for FieldMismatchWarning.
 */

import { INTERNAL_FIELD_MAP } from "../constants/fieldLabels";

/** Canonical internal fields Dev B's pipeline produces */
export const CANONICAL_FIELDS = [
  "point_id",
  "point_name",
  "latitude",
  "longitude",
  "category",
  "descr",
];

/**
 * Try to match a single uploaded column header to a canonical internal field.
 * @param {string} header
 * @returns {string|null} internal field name or null if no match
 */
function matchHeader(header) {
  const normalized = header.trim().toLowerCase().replace(/[\s_\-\.]+/g, " ");
  return INTERNAL_FIELD_MAP[normalized] || null;
}

/**
 * Auto-map an array of uploaded column headers to canonical internal fields.
 *
 * @param {string[]} headers - Column headers from the uploaded file
 * @returns {{
 *   mapping: Object,          // { uploadedColumn: internalField } for matched columns
 *   unmatchedUploaded: string[],   // uploaded columns that couldn't be mapped
 *   unmatchedCanonical: string[],  // canonical fields that received no column
 * }}
 */
export function autoMatchFields(headers) {
  const mapping = {};
  const usedCanonical = new Set();

  for (const header of headers) {
    const matched = matchHeader(header);
    if (matched && !usedCanonical.has(matched)) {
      mapping[header] = matched;
      usedCanonical.add(matched);
    }
  }

  const unmatchedUploaded = headers.filter((h) => !mapping[h]);
  const unmatchedCanonical = CANONICAL_FIELDS.filter((f) => !usedCanonical.has(f));

  return { mapping, unmatchedUploaded, unmatchedCanonical };
}

/**
 * Apply a field mapping to a row object, returning a normalized row
 * with canonical field names as keys.
 *
 * @param {Object} row - Raw row from CSV/Excel
 * @param {Object} mapping - { uploadedColumn: internalField }
 * @returns {Object} Normalized row with canonical field names
 */
export function applyMapping(row, mapping) {
  const normalized = {};
  for (const [uploadedKey, internalKey] of Object.entries(mapping)) {
    normalized[internalKey] = row[uploadedKey] ?? "";
  }
  // Pass through any unmapped columns as-is
  for (const key of Object.keys(row)) {
    if (!mapping[key]) {
      normalized[key] = row[key];
    }
  }
  return normalized;
}
