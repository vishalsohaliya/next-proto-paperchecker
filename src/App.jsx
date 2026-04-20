import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import Toolbar from './components/Toolbar.jsx';
import DocumentPage from './components/DocumentPage.jsx';
import AnnotationLayer from './components/AnnotationLayer.jsx';
import SelectionStylePanel from './components/SelectionStylePanel.jsx';
import ShapeStylePanel from './components/ShapeStylePanel.jsx';
import { loadPdfFromFile } from './lib/pdfRender.js';
import {
  buildEnvelope,
  validateEnvelope,
  downloadJson,
  saveEnvelopeToLocalStorage,
} from './lib/annotationSchema.js';
import {
  mergeLayersToPngDataUrl,
  downloadDataUrl,
  buildMergedPdfBytes,
  buildMergedPdfFromImage,
} from './lib/exportMerged.js';

const DEFAULT_SELECTION_STYLE = {
  borderColor: '#6366f1',
  cornerColor: '#6366f1',
  cornerStrokeColor: '#ffffff',
  cornerStyle: 'circle',
  cornerSize: 12,
  transparentCorners: false,
  borderDashArray: null,
};

const DEFAULT_SHAPE_STYLE = {
  stroke: '#2563eb',
  strokeWidth: 2,
  fill: '#2563eb',
  fillOpacity: 0.12,
  transparentFill: false,
};

const emptyFabric = () => ({ objects: [] });
const clampZoom = (z) => Math.min(3, Math.max(0.25, z));

export default function App() {
  const [docType, setDocType] = useState(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageW, setPageW] = useState(0);
  const [pageH, setPageH] = useState(0);
  const [pagesFabric, setPagesFabric] = useState([]);
  const [pageDimensions, setPageDimensions] = useState([]);
  const [tool, setTool] = useState('select');
  const [zoom, setZoom] = useState(1);
  const [stampUrl, setStampUrl] = useState(null);
  const [fabricReloadToken, setFabricReloadToken] = useState(0);
  const [selectionStyle, setSelectionStyle] = useState(DEFAULT_SELECTION_STYLE);
  const [showStylePanel, setShowStylePanel] = useState(false);
  const [shapeStyle, setShapeStyle] = useState(DEFAULT_SHAPE_STYLE);
  const [showShapePanel, setShowShapePanel] = useState(false);

  const annotationRef = useRef(null);
  const bgCanvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const jsonInputRef = useRef(null);
  const stampInputRef = useRef(null);

  // Scale background canvas CSS size to match current zoom — keeps both layers in sync
  useLayoutEffect(() => {
    const bg = bgCanvasRef.current;
    if (!bg || !pageW || !pageH) return;
    bg.style.width = `${pageW * zoom}px`;
    bg.style.height = `${pageH * zoom}px`;
    annotationRef.current?.calcOffset();
  }, [zoom, pageW, pageH]);

  const flushCurrentPageToState = useCallback(() => {
    const json = annotationRef.current?.toJSON();
    if (!json || !docType) return;
    setPagesFabric((prev) => {
      const next = [...prev];
      next[currentPage - 1] = json;
      return next;
    });
  }, [currentPage, docType]);

  const onPageSize = useCallback((w, h) => {
    setPageW(w);
    setPageH(h);
    setPageDimensions((prev) => {
      const next = [...prev];
      next[currentPage - 1] = { width: w, height: h };
      return next;
    });
  }, [currentPage]);

  const resetDocument = useCallback(() => {
    setStampUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setPdfDoc(null);
    setImageFile(null);
    setDocType(null);
    setPageCount(0);
    setCurrentPage(1);
    setPageW(0);
    setPageH(0);
    setPagesFabric([]);
    setPageDimensions([]);
    setTool('select');
    setZoom(1);
    setFabricReloadToken((t) => t + 1);
  }, []);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const name = file.name.toLowerCase();
    const isPdf = file.type === 'application/pdf' || name.endsWith('.pdf');

    resetDocument();

    if (isPdf) {
      const pdf = await loadPdfFromFile(file);
      const n = pdf.numPages;
      setPdfDoc(pdf);
      setDocType('pdf');
      setPageCount(n);
      setCurrentPage(1);
      setPagesFabric(Array.from({ length: n }, emptyFabric));
      setPageDimensions(Array.from({ length: n }, () => null));
    } else {
      setImageFile(file);
      setDocType('image');
      setPageCount(1);
      setCurrentPage(1);
      setPagesFabric([emptyFabric()]);
      setPageDimensions([null]);
    }
  };

  const collectPagesFabric = () => {
    const pages = [...pagesFabric];
    const live = annotationRef.current?.toJSON();
    if (live) pages[currentPage - 1] = live;
    return pages;
  };

  const handleSaveJson = () => {
    const pages = collectPagesFabric();
    setPagesFabric(pages);
    const dims =
      pageDimensions.length > 0
        ? pageDimensions.map((d, i) => ({ pageIndex: i, width: d?.width, height: d?.height }))
        : undefined;
    const envelope = {
      ...buildEnvelope(docType, pageCount, pages),
      pageDimensions: dims,
    };
    saveEnvelopeToLocalStorage(envelope);
    downloadJson('annotations.json', envelope);
  };

  const handleLoadJson = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !docType) return;
    let data;
    try {
      data = JSON.parse(await file.text());
    } catch {
      alert('Invalid JSON file');
      return;
    }
    const env = validateEnvelope(data);
    if (!env) {
      alert('Unrecognized annotation file format');
      return;
    }
    if (env.type !== docType) {
      alert(`Annotation file is for ${env.type} but current document is ${docType}`);
      return;
    }
    if (env.pageCount !== pageCount) {
      alert(`Page count mismatch (file ${env.pageCount}, document ${pageCount})`);
      return;
    }
    const sorted = [...env.pages].sort((a, b) => a.pageIndex - b.pageIndex).map((p) => p.fabric);
    setPagesFabric(sorted);
    if (Array.isArray(data.pageDimensions)) {
      setPageDimensions(data.pageDimensions.map((d) => ({ width: d.width, height: d.height })));
    }
    saveEnvelopeToLocalStorage({ ...env, pageDimensions: data.pageDimensions });
    setFabricReloadToken((t) => t + 1);
  };

  const goPrev = () => {
    flushCurrentPageToState();
    setPageW(0);
    setPageH(0);
    setCurrentPage((p) => Math.max(1, p - 1));
  };

  const goNext = () => {
    flushCurrentPageToState();
    setPageW(0);
    setPageH(0);
    setCurrentPage((p) => Math.min(pageCount, p + 1));
  };

  const handleStampFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (stampUrl) URL.revokeObjectURL(stampUrl);
    setStampUrl(URL.createObjectURL(file));
    setTool('stamp');
  };

  // Stable reference so AnnotationLayer's canvas-creation effect never re-fires on re-renders
  const consumeStamp = useCallback(() => {
    setStampUrl(null);
    setTool('select');
  }, []);

  const handleExportPng = async () => {
    const bg = bgCanvasRef.current;
    if (!bg || !pageW || !pageH) return;
    flushCurrentPageToState();

    // Export at base resolution regardless of current zoom
    const prevW = bg.style.width;
    const prevH = bg.style.height;
    bg.style.width = `${pageW}px`;
    bg.style.height = `${pageH}px`;

    const fabricCanvas = annotationRef.current?.getFabric?.();
    if (fabricCanvas) {
      fabricCanvas.setZoom(1);
      fabricCanvas.setDimensions({ width: pageW, height: pageH });
    }

    const url = await mergeLayersToPngDataUrl(bg, fabricCanvas);

    bg.style.width = prevW;
    bg.style.height = prevH;
    if (fabricCanvas) {
      fabricCanvas.setZoom(zoom);
      fabricCanvas.setDimensions({ width: pageW * zoom, height: pageH * zoom });
      fabricCanvas.requestRenderAll();
    }

    downloadDataUrl(`page-${currentPage}.png`, url);
  };

  const handleExportPdf = async () => {
    const bg = bgCanvasRef.current;
    const fabricCanvas = annotationRef.current?.getFabric?.();
    if (!docType || !pageW) return;
    const pages = collectPagesFabric();
    setPagesFabric(pages);
    let bytes;
    if (docType === 'pdf' && pdfDoc) {
      bytes = await buildMergedPdfBytes(pdfDoc, pages);
    } else if (docType === 'image' && bg && fabricCanvas) {
      // Export image doc at base resolution
      const prevW = bg.style.width;
      const prevH = bg.style.height;
      bg.style.width = `${pageW}px`;
      bg.style.height = `${pageH}px`;
      fabricCanvas.setZoom(1);
      fabricCanvas.setDimensions({ width: pageW, height: pageH });

      bytes = await buildMergedPdfFromImage(bg, fabricCanvas);

      bg.style.width = prevW;
      bg.style.height = prevH;
      fabricCanvas.setZoom(zoom);
      fabricCanvas.setDimensions({ width: pageW * zoom, height: pageH * zoom });
      fabricCanvas.requestRenderAll();
    } else return;

    const blob = new Blob([bytes], { type: 'application/pdf' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'annotated-export.pdf';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const docLoaded = Boolean(docType && pageCount > 0);
  const pageLabel =
    docType === 'pdf' && pageCount > 1 ? `Page ${currentPage} / ${pageCount}` : null;

  const initialJson = pagesFabric[currentPage - 1] ?? emptyFabric();
  const annotationKey = `ann-${currentPage}-${pageW}x${pageH}-${fabricReloadToken}`;

  return (
    <div className="app">
      <input
        ref={fileInputRef}
        type="file"
        className="hiddenInput"
        accept=".pdf,application/pdf,image/png,image/jpeg,.png,.jpg,.jpeg"
        onChange={handleFile}
      />
      <input ref={jsonInputRef} type="file" className="hiddenInput" accept="application/json,.json" onChange={handleLoadJson} />
      <input ref={stampInputRef} type="file" className="hiddenInput" accept="image/png,image/jpeg,.png,.jpg,.jpeg" onChange={handleStampFile} />

      <Toolbar
        tool={tool}
        onTool={setTool}
        onUploadClick={() => fileInputRef.current?.click()}
        onStampClick={() => stampInputRef.current?.click()}
        onSaveJson={handleSaveJson}
        onLoadJsonClick={() => jsonInputRef.current?.click()}
        onExportPng={handleExportPng}
        onExportPdf={handleExportPdf}
        docLoaded={docLoaded}
        pageLabel={pageLabel}
        onPrev={goPrev}
        onNext={goNext}
        zoom={zoom}
        onZoom={(z) => setZoom(clampZoom(z))}
        selectionStyle={selectionStyle}
        showStylePanel={showStylePanel}
        onToggleStylePanel={() => setShowStylePanel((v) => !v)}
        shapeStyle={shapeStyle}
        showShapePanel={showShapePanel}
        onToggleShapePanel={() => setShowShapePanel((v) => !v)}
      />

      {showStylePanel && (
        <SelectionStylePanel
          style={selectionStyle}
          onChange={setSelectionStyle}
          onClose={() => setShowStylePanel(false)}
        />
      )}

      {showShapePanel && (
        <ShapeStylePanel
          style={shapeStyle}
          onChange={setShapeStyle}
          onClose={() => setShowShapePanel(false)}
        />
      )}

      <main className="stageWrap">
        {!docType ? (
          <p className="hint">Upload a PDF or image to begin. Annotations stay on a separate Fabric layer.</p>
        ) : (
          <>
            {pageW === 0 || pageH === 0 ? (
              <p className="hint" style={{ marginBottom: '0.5rem' }}>Loading page…</p>
            ) : null}
            <DocumentPage
              mode={docType}
              pdfDoc={pdfDoc}
              pageIndex1={currentPage}
              imageFile={docType === 'image' ? imageFile : null}
              onPageSize={onPageSize}
              bgCanvasRef={bgCanvasRef}
            >
              {pageW > 0 && pageH > 0 ? (
                <AnnotationLayer
                  key={annotationKey}
                  ref={annotationRef}
                  width={pageW}
                  height={pageH}
                  tool={tool}
                  stampUrl={stampUrl}
                  onStampConsumed={consumeStamp}
                  zoom={zoom}
                  initialJson={initialJson}
                  selectionStyle={selectionStyle}
                  shapeStyle={shapeStyle}
                />
              ) : null}
            </DocumentPage>
          </>
        )}
      </main>
    </div>
  );
}
