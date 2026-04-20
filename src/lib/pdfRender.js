import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// PDF.js must load its worker from a real URL (Vite bundles it as a separate asset).
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const MAX_PAGE_WIDTH_PX = 1400;
const MAX_DEVICE_PIXEL_RATIO = 3;

/**
 * Open a PDF from a File; returns the pdf.js document proxy.
 */
export function loadPdfFromFile(file) {
  return file.arrayBuffer().then((data) => pdfjsLib.getDocument({ data }).promise);
}

/**
 * Render one PDF page: high-DPI backing store + CSS-sized display (matches browser PDF sharpness).
 * Returns logical width/height in CSS pixels (Fabric overlay uses these same numbers).
 */
export async function renderPdfPageToCanvas(pdfDocument, pageNumber1Based, canvas) {
  const page = await pdfDocument.getPage(pageNumber1Based);
  const baseViewport = page.getViewport({ scale: 1 });
  const userScale = MAX_PAGE_WIDTH_PX / baseViewport.width;
  const cssViewport = page.getViewport({ scale: userScale });
  const cssW = cssViewport.width;
  const cssH = cssViewport.height;

  const dpr = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, MAX_DEVICE_PIXEL_RATIO);
  const renderViewport = page.getViewport({ scale: userScale * dpr });

  const ctx = canvas.getContext('2d', { alpha: false });
  canvas.width = Math.floor(renderViewport.width);
  canvas.height = Math.floor(renderViewport.height);
  canvas.style.width = `${cssW}px`;
  canvas.style.height = `${cssH}px`;

  await page.render({ canvasContext: ctx, viewport: renderViewport }).promise;
  return { width: cssW, height: cssH, scale: userScale, outputScale: dpr };
}
