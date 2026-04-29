import { useLayoutEffect } from 'react';
import DocumentPage from './DocumentPage.jsx';
import AnnotationLayer from './AnnotationLayer.jsx';

export default function PaperPageBlock({
  mode,
  pdfDoc,
  imageFile,
  pageIndex1,
  pageW,
  pageH,
  zoom,
  tool,
  stampUrl,
  onStampConsumed,
  initialJson,
  selectionStyle,
  shapeStyle,
  fabricReloadToken,
  annotationRef,
  bgCanvasRef,
  brightness,
  contrast,
  onPageSize,
  showPageChrome,
  pageLabel,
  rotation,
}) {
  useLayoutEffect(() => {
    const bg = bgCanvasRef?.current;
    if (!bg || !pageW || !pageH) return;
    bg.style.width = `${pageW * zoom}px`;
    bg.style.height = `${pageH * zoom}px`;
    annotationRef?.current?.calcOffset();
  }, [zoom, pageW, pageH, bgCanvasRef, annotationRef]);

  const filter = `brightness(${brightness}%) contrast(${contrast}%)`;
  const annotationKey = `ann-${pageIndex1}-${pageW}x${pageH}-${fabricReloadToken}`;
  const ready = pageW > 0 && pageH > 0;

  return (
    <div className="paperPageBlock">
      {showPageChrome && pageLabel ? (
        <div className="paperPageBlock__chrome">
          <span className="paperPageBlock__chromeLabel">{pageLabel}</span>
        </div>
      ) : null}
      <div className="paperPageBlock__sheet">
        <div className="docFilterWrap" style={{ filter }}>
          <DocumentPage
            mode={mode}
            pdfDoc={pdfDoc}
            pageIndex1={pageIndex1}
            imageFile={pageIndex1 === 1 ? imageFile : null}
            onPageSize={onPageSize}
            bgCanvasRef={bgCanvasRef}
            rotation={rotation ?? 0}
          >
            {ready ? (
              <AnnotationLayer
                key={annotationKey}
                ref={annotationRef}
                width={pageW}
                height={pageH}
                tool={tool}
                stampUrl={stampUrl}
                onStampConsumed={onStampConsumed}
                zoom={zoom}
                initialJson={initialJson}
                selectionStyle={selectionStyle}
                shapeStyle={shapeStyle}
              />
            ) : null}
          </DocumentPage>
        </div>
      </div>
    </div>
  );
}
