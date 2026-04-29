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
  rotation,
  children,
}) {
  const localCanvasRef = useRef(null);
  const onPageSizeRef = useRef(onPageSize);
  onPageSizeRef.current = onPageSize;

  useLayoutEffect(() => {
    let cancelled = false;
    const c = localCanvasRef.current;
    if (!c) return undefined;

    const run = async () => {
      if (mode === 'pdf' && pdfDoc) {
        const { width, height } = await renderPdfPageToCanvas(pdfDoc, pageIndex1, c, rotation ?? 0);
        if (!cancelled) onPageSizeRef.current?.(width, height);
      } else if (mode === 'image' && imageFile) {
        await renderImageFileToCanvas(imageFile, c);
        if (!cancelled) onPageSizeRef.current?.(c.width, c.height);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [mode, pdfDoc, pageIndex1, imageFile, rotation]);

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
