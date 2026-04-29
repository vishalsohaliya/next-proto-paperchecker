import { useEffect, useRef } from 'react';
import { renderPdfPageThumbnailToCanvas } from '../lib/pdfRender.js';

function ThumbCell({ pdfDoc, pageIndex1, isActive, onSelect, rotation }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c || !pdfDoc) return undefined;
    let cancelled = false;
    (async () => {
      await renderPdfPageThumbnailToCanvas(pdfDoc, pageIndex1, c, rotation ?? 0);
      if (cancelled) return;
    })();
    return () => {
      cancelled = true;
    };
  }, [pdfDoc, pageIndex1, rotation]);

  return (
    <button
      type="button"
      className={`pdfThumb ${isActive ? 'pdfThumb--active' : ''}`}
      onClick={() => onSelect(pageIndex1)}
      title={`Page ${pageIndex1}${rotation ? ` · ${rotation}°` : ''}`}
    >
      <canvas ref={canvasRef} className="pdfThumb__canvas" />
      <span className="pdfThumb__badge">{pageIndex1}</span>
      {rotation ? <span className="pdfThumb__rotBadge">{rotation}°</span> : null}
    </button>
  );
}

export default function PdfThumbnails({ pdfDoc, pageCount, currentPage, onSelectPage, pageRotations }) {
  if (!pdfDoc || pageCount < 2) return null;

  return (
    <div className="pdfThumbs" role="tablist" aria-label="Page thumbnails">
      {Array.from({ length: pageCount }, (_, i) => (
        <ThumbCell
          key={i + 1}
          pdfDoc={pdfDoc}
          pageIndex1={i + 1}
          rotation={pageRotations?.[i] ?? 0}
          isActive={currentPage === i + 1}
          onSelect={onSelectPage}
        />
      ))}
    </div>
  );
}
