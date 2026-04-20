import { useLayoutEffect, useRef } from 'react';
import { renderPdfPageToCanvas } from '../lib/pdfRender.js';
import { renderImageFileToCanvas } from '../lib/imageDocument.js';

/**
 * Background layer only (PDF.js or image). Fabric lives in a sibling overlay with identical pixel size.
 */
export default function DocumentPage({
  mode,
  pdfDoc,
  pageIndex1,
  imageFile,
  onPageSize,
  bgCanvasRef,
  children,
}) {
  const localCanvasRef = useRef(null);

  useLayoutEffect(() => {
    let cancelled = false;
    const c = localCanvasRef.current;
    if (!c) return undefined;

    const run = async () => {
      if (mode === 'pdf' && pdfDoc) {
        const { width, height } = await renderPdfPageToCanvas(pdfDoc, pageIndex1, c);
        if (!cancelled) onPageSize(width, height);
      } else if (mode === 'image' && imageFile) {
        await renderImageFileToCanvas(imageFile, c);
        if (!cancelled) onPageSize(c.width, c.height);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [mode, pdfDoc, pageIndex1, imageFile, onPageSize]);

  const setCanvasRef = (node) => {
    localCanvasRef.current = node;
    if (bgCanvasRef && typeof bgCanvasRef === 'object') {
      bgCanvasRef.current = node;
    }
  };

  return (
    <div className="layerStack">
      <canvas ref={setCanvasRef} className="bgCanvas" />
      {children}
    </div>
  );
}
