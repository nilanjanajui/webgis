/**
 * exportToPdf.js
 * Captures the current Leaflet map (fitted to boundary extent if available)
 * and generates a formatted print-layout PDF containing:
 *   - Title block (project name, date)
 *   - Map image
 *   - North arrow
 *   - Scale bar
 *   - Legend table
 *
 * Uses html2canvas to screenshot the map div and jsPDF to build the PDF.
 */

import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import L from "leaflet";
import { getCategoryColor } from "../constants/categoryColors";
import { describeGeometry } from "./geometryLabel";

const PAGE = { w: 297, h: 210 }; // A4 landscape in mm
const MARGIN = 12;

/**
 * Export the map as a print-layout PDF.
 *
 * @param {Object} opts
 * @param {string}  opts.title         - Map title for the print layout
 * @param {Array}   opts.layers        - Layer objects from layersStore
 * @param {Object}  opts.mapEl         - DOM element of the Leaflet map container
 * @param {Object}  [opts.boundary]    - GeoJSON boundary geometry (for extent fitting)
 * @param {Object}  [opts.mapInstance]  - Leaflet map instance for programmatic view changes
 */
export async function exportToPdf({ title = "WebGIS Map", layers, mapEl, boundary, mapInstance }) {
  if (!mapEl) { alert("Map not ready."); return; }

  // ── 0. Critical extent rule: fit map to boundary before capture ────────
  let previousView = null;
  if (boundary && mapInstance) {
    // Save current view so we can restore it after capture
    previousView = {
      center: mapInstance.getCenter(),
      zoom: mapInstance.getZoom(),
    };
    const boundaryBounds = L.geoJSON(boundary).getBounds();
    mapInstance.fitBounds(boundaryBounds, { animate: false, padding: [20, 20] });
    // Wait for tiles to load at the new zoom level
    await new Promise((resolve) => setTimeout(resolve, 800));
  }

  // ── 1. Capture the map ────────────────────────────────────────────────────
  const canvas = await html2canvas(mapEl, {
    useCORS: true,
    allowTaint: false,
    logging: false,
    scale: 2,
  });

  const mapImgData = canvas.toDataURL("image/png");

  // Restore original view after capture
  if (previousView && mapInstance) {
    mapInstance.setView(previousView.center, previousView.zoom, { animate: false });
  }

  // ── 2. Build PDF ──────────────────────────────────────────────────────────
  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  const W = PAGE.w;
  const H = PAGE.h;
  const M = MARGIN;

  // Background
  pdf.setFillColor(247, 245, 240); // --color-paper
  pdf.rect(0, 0, W, H, "F");

  // ── Title block (left strip) ───────────────────────────────────────────
  const titleW = 45;
  pdf.setFillColor(43, 43, 40); // --color-ink
  pdf.rect(0, 0, titleW, H, "F");

  pdf.setTextColor(247, 245, 240);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(13);
  pdf.text(title, M - 4, M + 4, { maxWidth: titleW - M });

  pdf.setFontSize(7);
  pdf.setFont("helvetica", "normal");
  pdf.text(new Date().toLocaleDateString("en-GB"), M - 4, H - M);

  // ── Map image (centre) ────────────────────────────────────────────────
  const mapX = titleW + 4;
  const legendW = 48;
  const mapW = W - mapX - legendW - 6;
  const mapH = H - M * 2;
  const mapY = M;

  // Maintain aspect ratio
  const aspect = canvas.width / canvas.height;
  let imgW = mapW;
  let imgH = mapW / aspect;
  if (imgH > mapH) { imgH = mapH; imgW = mapH * aspect; }

  pdf.setDrawColor(200, 196, 186); // --color-fog
  pdf.setLineWidth(0.3);
  pdf.rect(mapX, mapY, imgW, imgH);
  pdf.addImage(mapImgData, "PNG", mapX, mapY, imgW, imgH);

  // ── North arrow ────────────────────────────────────────────────────────
  const naX = mapX + imgW - 14;
  const naY = mapY + 4;
  pdf.setFillColor(255, 255, 255);
  pdf.circle(naX, naY + 5, 6, "F");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(7);
  pdf.setTextColor(43, 43, 40);
  pdf.text("N", naX - 1.5, naY + 2);
  pdf.setLineWidth(0.6);
  pdf.setDrawColor(29, 110, 90); // teal
  pdf.line(naX, naY + 3, naX, naY + 8);

  // ── Scale bar (very rough — uses fixed 10 km) ─────────────────────────
  const sbX = mapX + 6;
  const sbY = mapY + imgH - 8;
  const sbW = 30;
  pdf.setFillColor(43, 43, 40);
  pdf.rect(sbX, sbY, sbW / 2, 2, "F");
  pdf.setFillColor(255, 255, 255);
  pdf.rect(sbX + sbW / 2, sbY, sbW / 2, 2, "F");
  pdf.setDrawColor(43, 43, 40);
  pdf.setLineWidth(0.2);
  pdf.rect(sbX, sbY, sbW, 2);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(6);
  pdf.setTextColor(43, 43, 40);
  pdf.text("0", sbX - 1, sbY - 1);
  pdf.text("10 km", sbX + sbW - 4, sbY - 1);

  // ── Legend panel (right strip) ─────────────────────────────────────────
  const lgX = W - legendW - 2;
  const lgY = M;

  pdf.setFillColor(232, 228, 220); // --color-mist
  pdf.rect(lgX, lgY, legendW, mapH, "F");

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  pdf.setTextColor(43, 43, 40);
  pdf.text("Legend", lgX + 4, lgY + 6);

  let ly = lgY + 12;
  const visibleLayers = layers.filter((l) => l.isVisible && l.features?.length);

  for (const layer of visibleLayers) {
    if (ly > H - M - 6) break;
    const color = getCategoryColor(layer.geometryType) || layer.color || "#5B6B66";
    const [r, g, b] = hexToRgb(color);

    pdf.setFillColor(r, g, b);
    pdf.circle(lgX + 6, ly, 2.5, "F");
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(6.5);
    pdf.setTextColor(43, 43, 40);
    pdf.text(
      `${layer.name} (${describeGeometry(layer.geometryType)})`,
      lgX + 11, ly + 0.8,
      { maxWidth: legendW - 14 }
    );
    pdf.setTextColor(91, 107, 102);
    pdf.text(`${layer.recordCount} features`, lgX + 11, ly + 4.5);
    ly += 12;
  }

  // ── Save ───────────────────────────────────────────────────────────────
  const safeTitle = title.replace(/[^a-z0-9_\-]/gi, "_");
  pdf.save(`${safeTitle}_${new Date().toISOString().slice(0, 10)}.pdf`);
}

/** Convert #rrggbb to [r, g, b] */
function hexToRgb(hex) {
  const clean = hex.replace("#", "");
  const num = parseInt(clean, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}