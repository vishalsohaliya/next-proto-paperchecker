import { Canvas } from 'fabric';
import { PDFDocument } from 'pdf-lib';
import { renderPdfPageToCanvas } from './pdfRender.js';

/**
 * Return the base logical size of a canvas by dividing its backing-store pixel dimensions by
 * devicePixelRatio.  This is correct regardless of any CSS zoom/transform applied externally:
 * the HTML-attribute width/height always reflects the actual pixel count, never the CSS display size.
 */
function getLogicalCanvasSize(canvas) {
  const dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;
  const w = Math.round(canvas.width / dpr);
  const h = Math.round(canvas.height / dpr);
  if (w > 0 && h > 0) return { w, h };
  // Fallback: read CSS style (e.g. freshly-created canvases with no DPR scaling)
  const sw = canvas.style?.width;
  const sh = canvas.style?.height;
  const sw_ = sw ? parseFloat(sw) : NaN;
  const sh_ = sh ? parseFloat(sh) : NaN;
  if (!Number.isNaN(sw_) && sw_ > 0 && !Number.isNaN(sh_) && sh_ > 0) {
    return { w: Math.round(sw_), h: Math.round(sh_) };
  }
  return { w: canvas.width, h: canvas.height };
}

function dataUrlToUint8Array(dataUrl) {
  const base64 = dataUrl.split(',')[1];
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

/** Composite background canvas + Fabric layer into one PNG data URL (logical/CSS pixel size). */
export async function mergeLayersToPngDataUrl(backgroundCanvas, fabricCanvas) {
  const { w, h } = getLogicalCanvasSize(backgroundCanvas);
  const out = document.createElement('canvas');
  out.width = w;
  out.height = h;
  const ctx = out.getContext('2d');
  ctx.drawImage(
    backgroundCanvas,
    0,
    0,
    backgroundCanvas.width,
    backgroundCanvas.height,
    0,
    0,
    w,
    h,
  );
  const fabData = fabricCanvas.toDataURL({ format: 'png', multiplier: 1, enableRetinaScaling: false });
  await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, w, h);
      resolve();
    };
    img.onerror = reject;
    img.src = fabData;
  });
  return out.toDataURL('image/png');
}

/**
 * Export only the current view as PNG (download). Original files stay untouched.
 */
export function downloadDataUrl(filename, dataUrl) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  a.click();
}

/**
 * Build a new PDF (bytes) where each page is a flat image: PDF background + annotations.
 * Uses an offscreen Fabric canvas per page so we never merge onto the interactive canvas.
 */
export async function buildMergedPdfBytes(pdfDocument, pagesFabricJson) {
  const outPdf = await PDFDocument.create();
  for (let i = 1; i <= pdfDocument.numPages; i++) {
    const c = document.createElement('canvas');
    await renderPdfPageToCanvas(pdfDocument, i, c);
    const { w, h } = getLogicalCanvasSize(c);
    const fab = new Canvas(document.createElement('canvas'), { width: w, height: h });
    const json = pagesFabricJson[i - 1] ?? { objects: [] };
    await fab.loadFromJSON(json);
    fab.requestRenderAll();
    const mergedUrl = await mergeLayersToPngDataUrl(c, fab);
    fab.dispose();
    const pngBytes = dataUrlToUint8Array(mergedUrl);
    const img = await outPdf.embedPng(pngBytes);
    const page = outPdf.addPage([w, h]);
    page.drawImage(img, { x: 0, y: 0, width: w, height: h });
  }
  return outPdf.save();
}

/** Single-page image document → one-page PDF with merged PNG. */
export async function buildMergedPdfFromImage(backgroundCanvas, fabricCanvas) {
  const mergedUrl = await mergeLayersToPngDataUrl(backgroundCanvas, fabricCanvas);
  const pngBytes = dataUrlToUint8Array(mergedUrl);
  const outPdf = await PDFDocument.create();
  const img = await outPdf.embedPng(pngBytes);
  const { w, h } = getLogicalCanvasSize(backgroundCanvas);
  const page = outPdf.addPage([w, h]);
  page.drawImage(img, { x: 0, y: 0, width: w, height: h });
  return outPdf.save();
}
