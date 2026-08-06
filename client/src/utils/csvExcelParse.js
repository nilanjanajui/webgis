/**
 * csvExcelParse.js
 * Parses CSV files using papaparse and Excel (.xlsx/.xls) files using the xlsx library.
 * Returns a plain array of row objects: [{ column: value, ... }, ...]
 */

import Papa from "papaparse";
import * as XLSX from "xlsx";

/**
 * Parse a CSV File into an array of row objects.
 * @param {File} file
 * @returns {Promise<Array<Object>>}
 */
export function parseCSV(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,          // Use first row as keys
      skipEmptyLines: true,
      dynamicTyping: true,   // Auto-cast numbers
      complete: (results) => {
        if (results.errors.length > 0) {
          console.warn("CSV parse warnings:", results.errors);
        }
        resolve(results.data);
      },
      error: (err) => reject(new Error(`CSV parse error: ${err.message}`)),
    });
  });
}

/**
 * Parse an Excel (.xlsx/.xls) File into an array of row objects.
 * Reads the first sheet by default.
 * @param {File} file
 * @returns {Promise<Array<Object>>}
 */
export async function parseExcel(file) {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: "array" });

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error("Excel file contains no sheets.");

  const worksheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(worksheet, {
    defval: "",    // Empty cells become empty string, not undefined
    raw: false,    // Format numbers as strings first; fieldMatcher handles casting
  });

  return rows;
}
