import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const MAX_PAGE_WIDTH_PX = 1400;
const MAX_DEVICE_PIXEL_RATIO = 3;

export function loadPdfFromFile(file) {
  return file.arrayBuffer().then((data) => pdfjsLib.getDocument({ data }).promise);
}

export function loadPdfFromUrl(url) {
  return pdfjsLib.getDocument({ url, withCredentials: false }).promise;
}

export async function getPdfPageLogicalSize(pdfDocument, pageNumber1Based, rotation = 0) {
  const page = await pdfDocument.getPage(pageNumber1Based);
  const baseViewport = page.getViewport({ scale: 1, rotation });
  const userScale = MAX_PAGE_WIDTH_PX / baseViewport.width;
  const cssViewport = page.getViewport({ scale: userScale, rotation });
  return { width: cssViewport.width, height: cssViewport.height };
}

export async function prefetchPdfPageLogicalSizes(pdfDocument) {
  const n = pdfDocument.numPages;
  const dims = [];
  for (let i = 1; i <= n; i += 1) {
    dims.push(await getPdfPageLogicalSize(pdfDocument, i, 0));
  }
  return dims;
}

const THUMB_MAX = 112;

export async function renderPdfPageThumbnailToCanvas(pdfDocument, pageNumber1Based, canvas, rotation = 0) {
  const page = await pdfDocument.getPage(pageNumber1Based);
  const baseViewport = page.getViewport({ scale: 1, rotation });
  const scale = THUMB_MAX / Math.max(baseViewport.width, baseViewport.height);
  const cssViewport = page.getViewport({ scale, rotation });
  const cssW = cssViewport.width;
  const cssH = cssViewport.height;
  const dpr = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, MAX_DEVICE_PIXEL_RATIO);
  const renderViewport = page.getViewport({ scale: scale * dpr, rotation });
  const ctx = canvas.getContext('2d', { alpha: false });
  canvas.width = Math.floor(renderViewport.width);
  canvas.height = Math.floor(renderViewport.height);
  canvas.style.width = `${cssW}px`;
  canvas.style.height = `${cssH}px`;
  await page.render({ canvasContext: ctx, viewport: renderViewport }).promise;
  return { width: cssW, height: cssH };
}

/**
 * Render one PDF page at the given user rotation (0 | 90 | 180 | 270).
 * Returns logical CSS dimensions that the Fabric overlay must match.
 */
export async function renderPdfPageToCanvas(pdfDocument, pageNumber1Based, canvas, rotation = 0) {
  const page = await pdfDocument.getPage(pageNumber1Based);
  const baseViewport = page.getViewport({ scale: 1, rotation });
  const userScale = MAX_PAGE_WIDTH_PX / baseViewport.width;
  const cssViewport = page.getViewport({ scale: userScale, rotation });
  const cssW = cssViewport.width;
  const cssH = cssViewport.height;

  const dpr = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, MAX_DEVICE_PIXEL_RATIO);
  const renderViewport = page.getViewport({ scale: userScale * dpr, rotation });

  const ctx = canvas.getContext('2d', { alpha: false });
  canvas.width = Math.floor(renderViewport.width);
  canvas.height = Math.floor(renderViewport.height);

  await page.render({ canvasContext: ctx, viewport: renderViewport }).promise;
  return { width: cssW, height: cssH, scale: userScale, outputScale: dpr };
}
