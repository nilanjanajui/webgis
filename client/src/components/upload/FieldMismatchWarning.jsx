/**
 * FieldMismatchWarning.jsx
 * Shown inside ConfirmationPreview when auto field-matching left unresolved columns.
 * Lets the user manually map uploaded headers to canonical internal fields.
 */

import { CANONICAL_FIELDS } from "../../utils/fieldMatcher";
import { getFieldLabel } from "../../constants/fieldLabels";

export default function FieldMismatchWarning({
  matchResult,
  rawHeaders,
  userMapping,
  onMappingChange,
}) {
  const { unmatchedUploaded, unmatchedCanonical } = matchResult;

  // Nothing to warn about
  if (unmatchedUploaded.length === 0 && unmatchedCanonical.length === 0) {
    return (
      <div className="field-match field-match--ok" role="status" id="field-match-ok">
        <span className="field-match__icon">✓</span>
        All columns matched automatically.
      </div>
    );
  }

  const handleSelect = (uploadedCol, internalField) => {
    const updated = { ...userMapping };
    if (!internalField) {
      delete updated[uploadedCol];
    } else {
      // Remove any existing mapping to this internal field to avoid duplicates
      for (const key of Object.keys(updated)) {
        if (updated[key] === internalField) delete updated[key];
      }
      updated[uploadedCol] = internalField;
    }
    onMappingChange(updated);
  };

  return (
    <div className="field-match field-match--warn" id="field-mismatch-warning">
      <div className="field-match__header">
        <span className="field-match__icon">⚠</span>
        <strong>Some columns need manual mapping</strong>
      </div>

      {unmatchedCanonical.length > 0 && (
        <p className="field-match__info">
          Required fields not yet assigned:{" "}
          {unmatchedCanonical.map((f) => getFieldLabel(f)).join(", ")}
        </p>
      )}

      <div className="field-match__rows">
        {unmatchedUploaded.map((col) => (
          <div className="field-match__row" key={col} id={`field-match-row-${col}`}>
            <span className="field-match__col-name">{col}</span>
            <span className="field-match__arrow">→</span>
            <select
              className="field-match__select"
              value={userMapping[col] || ""}
              onChange={(e) => handleSelect(col, e.target.value)}
              aria-label={`Map column "${col}" to internal field`}
              id={`field-match-select-${col}`}
            >
              <option value="">— skip —</option>
              {CANONICAL_FIELDS.map((field) => (
                <option key={field} value={field}>
                  {getFieldLabel(field)} ({field})
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}
