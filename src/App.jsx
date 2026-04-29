import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import PaperPageBlock from './components/PaperPageBlock.jsx';
import SelectionStylePanel from './components/SelectionStylePanel.jsx';
import ShapeStylePanel from './components/ShapeStylePanel.jsx';
import RightToolsPanel from './components/RightToolsPanel.jsx';
import MarkingSidebar from './components/MarkingSidebar.jsx';
import PdfThumbnails from './components/PdfThumbnails.jsx';
import { loadPdfFromFile, loadPdfFromUrl, prefetchPdfPageLogicalSizes, getPdfPageLogicalSize } from './lib/pdfRender.js';
import { SAMPLE_PDF_URL } from './data/samplePdfUrl.js';
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

function createRefMap() {
  const map = new Map();
  return {
    get(index) {
      let r = map.get(index);
      if (!r) {
        r = { current: null };
        map.set(index, r);
      }
      return r;
    },
    clear() {
      map.clear();
    },
  };
}

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

  const [givenById, setGivenById] = useState({});
  const [pdfViewMode, setPdfViewMode] = useState('single');
  const [thumbsCollapsed, setThumbsCollapsed] = useState(false);
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [pageRotations, setPageRotations] = useState([]);
  const [rotateApplyAll, setRotateApplyAll] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [samplePdfBusy, setSamplePdfBusy] = useState(false);
  const [pageGoDraft, setPageGoDraft] = useState('1');

  const annotationRef = useRef(null);
  const bgCanvasRef = useRef(null);
  const annRefMap = useRef(createRefMap());
  const bgRefMap = useRef(createRefMap());
  const fileInputRef = useRef(null);
  const jsonInputRef = useRef(null);
  const stampInputRef = useRef(null);

  const flushSinglePageToState = useCallback(() => {
    const json = annotationRef.current?.toJSON();
    if (!json || !docType) return;
    setPagesFabric((prev) => {
      const next = [...prev];
      next[currentPage - 1] = json;
      return next;
    });
  }, [currentPage, docType]);

  const flushContinuousToState = useCallback(() => {
    if (!docType || pageCount < 1) return;
    setPagesFabric((prev) => {
      const next = [...prev];
      for (let i = 0; i < pageCount; i += 1) {
        const json = annRefMap.current.get(i).current?.toJSON?.();
        if (json) next[i] = json;
      }
      return next;
    });
  }, [docType, pageCount]);

  const handlePageSizeAt = useCallback(
    (pageIndex0) => (w, h) => {
      setPageDimensions((prev) => {
        const cur = prev[pageIndex0];
        if (cur?.width === w && cur?.height === h) return prev;
        const next = [...prev];
        next[pageIndex0] = { width: w, height: h };
        return next;
      });
      if (pdfViewMode === 'single' && pageIndex0 === currentPage - 1) {
        setPageW((pw) => (pw === w ? pw : w));
        setPageH((ph) => (ph === h ? ph : h));
      }
    },
    [pdfViewMode, currentPage],
  );

  useLayoutEffect(() => {
    const bg = bgCanvasRef.current;
    if (!bg || !pageW || !pageH) return;
    if (pdfViewMode !== 'single') return;
    bg.style.width = `${pageW * zoom}px`;
    bg.style.height = `${pageH * zoom}px`;
    annotationRef.current?.calcOffset();
  }, [zoom, pageW, pageH, pdfViewMode]);

  useLayoutEffect(() => {
    if (docType !== 'pdf') return;
    if (pdfViewMode !== 'continuous') return;
    if (!pageCount || pageDimensions.length < pageCount) return;
    for (let i = 0; i < pageCount; i += 1) {
      const bg = bgRefMap.current.get(i).current;
      const d = pageDimensions[i];
      if (!bg || !d?.width || !d?.height) continue;
      bg.style.width = `${d.width * zoom}px`;
      bg.style.height = `${d.height * zoom}px`;
      annRefMap.current.get(i).current?.calcOffset?.();
    }
  }, [docType, pdfViewMode, zoom, pageCount, pageDimensions]);

  useEffect(() => {
    setPageGoDraft(String(currentPage));
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
    setPdfViewMode('single');
    setPageRotations([]);
    setRotateApplyAll(false);
    setFabricReloadToken((t) => t + 1);
    annRefMap.current.clear();
    bgRefMap.current.clear();
  }, []);

  const applyPdfDocument = useCallback(async (pdf) => {
    const n = pdf.numPages;
    const dimsArr = await prefetchPdfPageLogicalSizes(pdf);
    const dims = dimsArr.map((d) => ({ width: d.width, height: d.height }));
    setPdfDoc(pdf);
    setDocType('pdf');
    setPageCount(n);
    setCurrentPage(1);
    setPagesFabric(Array.from({ length: n }, emptyFabric));
    setPageDimensions(dims);
    setPageW(dims[0]?.width ?? 0);
    setPageH(dims[0]?.height ?? 0);
    setPageRotations(Array.from({ length: n }, () => 0));
    setFabricReloadToken((t) => t + 1);
    annRefMap.current.clear();
    bgRefMap.current.clear();
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
      await applyPdfDocument(pdf);
    } else {
      setImageFile(file);
      setDocType('image');
      setPageCount(1);
      setCurrentPage(1);
      setPagesFabric([emptyFabric()]);
      setPageDimensions([null]);
      setPageW(0);
      setPageH(0);
    }
  };

  const handleSamplePdf = async () => {
    setSamplePdfBusy(true);
    try {
      resetDocument();
      const pdf = await loadPdfFromUrl(SAMPLE_PDF_URL);
      await applyPdfDocument(pdf);
    } catch (err) {
      console.error(err);
      alert(
        'Could not load the sample PDF (network or CORS). Upload the file locally instead, or host it with CORS enabled.',
      );
    } finally {
      setSamplePdfBusy(false);
    }
  };

  const collectPagesFabric = () => {
    const pages = [...pagesFabric];
    if (pdfViewMode === 'continuous' && docType === 'pdf' && pageCount > 0) {
      for (let i = 0; i < pageCount; i += 1) {
        const json = annRefMap.current.get(i).current?.toJSON?.();
        if (json) pages[i] = json;
      }
      return pages;
    }
    const live = annotationRef.current?.toJSON();
    if (live) pages[currentPage - 1] = live;
    return pages;
  };

  const handleSaveJson = () => {
    if (pdfViewMode === 'continuous') flushContinuousToState();
    else flushSinglePageToState();
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

  const applyPageChange = useCallback(
    (nextPage) => {
      const d = pageDimensions[nextPage - 1];
      if (d?.width) {
        setPageW(d.width);
        setPageH(d.height);
      } else {
        setPageW(0);
        setPageH(0);
      }
      setCurrentPage(nextPage);
    },
    [pageDimensions],
  );

  const goPrev = () => {
    if (pdfViewMode === 'continuous') return;
    flushSinglePageToState();
    applyPageChange(Math.max(1, currentPage - 1));
  };

  const goNext = () => {
    if (pdfViewMode === 'continuous') return;
    flushSinglePageToState();
    applyPageChange(Math.min(pageCount, currentPage + 1));
  };

  const handlePageGoSubmit = () => {
    if (pdfViewMode !== 'single' || docType !== 'pdf') return;
    const n = Number.parseInt(pageGoDraft, 10);
    if (!Number.isFinite(n)) return;
    const clamped = Math.min(pageCount, Math.max(1, n));
    flushSinglePageToState();
    applyPageChange(clamped);
  };

  const handleRotatePage = useCallback(
    async (delta) => {
      if (docType !== 'pdf' || !pdfDoc || pageCount < 1) return;

      if (pdfViewMode === 'continuous') flushContinuousToState();
      else flushSinglePageToState();

      const pagesToRotate = rotateApplyAll
        ? Array.from({ length: pageCount }, (_, i) => i)
        : [currentPage - 1];

      const newRotations = [...pageRotations];
      for (const idx of pagesToRotate) {
        newRotations[idx] = (((newRotations[idx] ?? 0) + delta) % 360 + 360) % 360;
      }

      const updates = await Promise.all(
        pagesToRotate.map((idx) =>
          getPdfPageLogicalSize(pdfDoc, idx + 1, newRotations[idx]).then((d) => ({ idx, d })),
        ),
      );

      setPageRotations(newRotations);

      setPageDimensions((prev) => {
        const next = [...prev];
        for (const { idx, d } of updates) next[idx] = d;
        return next;
      });

      const currentUpdated = updates.find((u) => u.idx === currentPage - 1);
      if (currentUpdated) {
        setPageW(currentUpdated.d.width);
        setPageH(currentUpdated.d.height);
      }

      setFabricReloadToken((t) => t + 1);
    },
    [
      docType,
      pdfDoc,
      pageCount,
      currentPage,
      pageRotations,
      rotateApplyAll,
      pdfViewMode,
      flushContinuousToState,
      flushSinglePageToState,
    ],
  );

  const handlePdfViewMode = (mode) => {
    if (mode === pdfViewMode) return;
    if (mode === 'continuous') {
      flushSinglePageToState();
    } else {
      flushContinuousToState();
      const d = pageDimensions[currentPage - 1];
      if (d?.width) {
        setPageW(d.width);
        setPageH(d.height);
      } else {
        setPageW(0);
        setPageH(0);
      }
    }
    setPdfViewMode(mode);
    setFabricReloadToken((t) => t + 1);
  };

  const handleStampFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (stampUrl) URL.revokeObjectURL(stampUrl);
    setStampUrl(URL.createObjectURL(file));
    setTool('stamp');
  };

  const consumeStamp = useCallback(() => {
    setStampUrl(null);
    setTool('select');
  }, []);

  const handleExportPng = async () => {
    const isCont = pdfViewMode === 'continuous' && docType === 'pdf';
    const bg = isCont ? bgRefMap.current.get(currentPage - 1).current : bgCanvasRef.current;
    const fabricCanvas = isCont
      ? annRefMap.current.get(currentPage - 1).current?.getFabric?.()
      : annotationRef.current?.getFabric?.();
    const w = isCont ? pageDimensions[currentPage - 1]?.width : pageW;
    const h = isCont ? pageDimensions[currentPage - 1]?.height : pageH;
    if (!bg || !w || !h) return;
    if (pdfViewMode === 'continuous') flushContinuousToState();
    else flushSinglePageToState();

    const prevW = bg.style.width;
    const prevH = bg.style.height;
    bg.style.width = `${w}px`;
    bg.style.height = `${h}px`;

    if (fabricCanvas) {
      fabricCanvas.setZoom(1);
      fabricCanvas.setDimensions({ width: w, height: h });
    }

    const url = await mergeLayersToPngDataUrl(bg, fabricCanvas);

    bg.style.width = prevW;
    bg.style.height = prevH;
    if (fabricCanvas) {
      fabricCanvas.setZoom(zoom);
      fabricCanvas.setDimensions({ width: w * zoom, height: h * zoom });
      fabricCanvas.requestRenderAll();
    }

    downloadDataUrl(`page-${currentPage}.png`, url);
  };

  const handleExportPdf = async () => {
    const isCont = pdfViewMode === 'continuous' && docType === 'pdf';
    const bg = bgCanvasRef.current;
    const fabricCanvas = annotationRef.current?.getFabric?.();
    if (!docType) return;
    if (isCont) flushContinuousToState();
    else flushSinglePageToState();
    const pages = collectPagesFabric();
    setPagesFabric(pages);
    let bytes;
    if (docType === 'pdf' && pdfDoc) {
      bytes = await buildMergedPdfBytes(pdfDoc, pages);
    } else if (docType === 'image' && bg && fabricCanvas && pageW) {
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
  const hasMultiPagePdf = docType === 'pdf' && pageCount > 1;
  const initialJson = pagesFabric[currentPage - 1] ?? emptyFabric();

  const selectThumbnailPage = (p) => {
    setCurrentPage(p);
    if (pdfViewMode === 'continuous') {
      document.getElementById(`doc-page-${p}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      flushSinglePageToState();
      const d = pageDimensions[p - 1];
      if (d?.width) {
        setPageW(d.width);
        setPageH(d.height);
      } else {
        setPageW(0);
        setPageH(0);
      }
    }
  };

  const renderCenter = () => {
    if (!docType) {
      return (
        <div className="centerEmpty">
          <h2 className="centerEmpty__title">Paper checker workspace</h2>
          <p className="centerEmpty__text">
            Load the sample instructions PDF (same URL as in link.txt), or upload a candidate answer sheet. Marking
            rubric on the left is static for now — wire it to your .NET API when ready.
          </p>
        </div>
      );
    }

    if (pdfViewMode === 'continuous' && docType === 'pdf') {
      return (
        <div className="continuousStack">
          {pageDimensions.map((dim, idx) => (
            <div key={idx} id={`doc-page-${idx + 1}`} className="continuousStack__page">
              <PaperPageBlock
                mode="pdf"
                pdfDoc={pdfDoc}
                imageFile={null}
                pageIndex1={idx + 1}
                pageW={dim?.width ?? 0}
                pageH={dim?.height ?? 0}
                zoom={zoom}
                tool={tool}
                stampUrl={stampUrl}
                onStampConsumed={consumeStamp}
                initialJson={pagesFabric[idx] ?? emptyFabric()}
                selectionStyle={selectionStyle}
                shapeStyle={shapeStyle}
                fabricReloadToken={fabricReloadToken}
                annotationRef={annRefMap.current.get(idx)}
                bgCanvasRef={bgRefMap.current.get(idx)}
                brightness={brightness}
                contrast={contrast}
                onPageSize={handlePageSizeAt(idx)}
                rotation={pageRotations[idx] ?? 0}
                showPageChrome
                pageLabel={`Page ${idx + 1} of ${pageCount}`}
              />
            </div>
          ))}
        </div>
      );
    }

    if (docType === 'image') {
      return (
        <PaperPageBlock
          mode="image"
          pdfDoc={null}
          imageFile={imageFile}
          pageIndex1={1}
          pageW={pageW}
          pageH={pageH}
          zoom={zoom}
          tool={tool}
          stampUrl={stampUrl}
          onStampConsumed={consumeStamp}
          initialJson={initialJson}
          selectionStyle={selectionStyle}
          shapeStyle={shapeStyle}
          fabricReloadToken={fabricReloadToken}
          annotationRef={annotationRef}
          bgCanvasRef={bgCanvasRef}
          brightness={brightness}
          contrast={contrast}
          onPageSize={handlePageSizeAt(0)}
          rotation={0}
          showPageChrome={false}
          pageLabel={null}
        />
      );
    }

    return (
      <PaperPageBlock
        mode="pdf"
        pdfDoc={pdfDoc}
        imageFile={null}
        pageIndex1={currentPage}
        pageW={pageW}
        pageH={pageH}
        zoom={zoom}
        tool={tool}
        stampUrl={stampUrl}
        onStampConsumed={consumeStamp}
        initialJson={initialJson}
        selectionStyle={selectionStyle}
        shapeStyle={shapeStyle}
        fabricReloadToken={fabricReloadToken}
        annotationRef={annotationRef}
        bgCanvasRef={bgCanvasRef}
        brightness={brightness}
        contrast={contrast}
        onPageSize={handlePageSizeAt(currentPage - 1)}
        rotation={pageRotations[currentPage - 1] ?? 0}
        showPageChrome={false}
        pageLabel={null}
      />
    );
  };

  return (
    <div className="appRoot">
      <input
        ref={fileInputRef}
        type="file"
        className="hiddenInput"
        accept=".pdf,application/pdf,image/png,image/jpeg,.png,.jpg,.jpeg"
        onChange={handleFile}
      />
      <input ref={jsonInputRef} type="file" className="hiddenInput" accept="application/json,.json" onChange={handleLoadJson} />
      <input ref={stampInputRef} type="file" className="hiddenInput" accept="image/png,image/jpeg,.png,.jpg,.jpeg" onChange={handleStampFile} />

      <header className="topBar">
        <div className="topBar__brand">
          <span className="topBar__logo" aria-hidden />
          <div>
            <div className="topBar__name">PaperChecker</div>
            <div className="topBar__tag">Annotation + marking prototype</div>
          </div>
        </div>
      </header>

      <div
        className="workspace"
        style={{ gridTemplateColumns: `${leftCollapsed ? '40px' : 'min(300px, 32vw)'} 1fr auto` }}
      >
        <MarkingSidebar
          givenById={givenById}
          onGivenChange={(id, v) => setGivenById((s) => ({ ...s, [id]: v }))}
          collapsed={leftCollapsed}
          onToggleCollapse={() => setLeftCollapsed((v) => !v)}
        />

        <section className="centerCol" aria-label="Document">
          <div className="centerCol__inner">
            {docType === 'pdf' && pdfViewMode === 'single' && pageW === 0 ? (
              <div className="centerLoading">
                <p>Loading page…</p>
              </div>
            ) : null}
            {renderCenter()}
          </div>
        </section>

        <div className="rightCol">
          {!rightCollapsed && hasMultiPagePdf ? (
            <div className={`thumbDock ${thumbsCollapsed ? 'thumbDock--collapsed' : ''}`}>
              <div className="thumbDock__header">
                <button
                  type="button"
                  className="thumbDock__toggleBtn"
                  onClick={() => setThumbsCollapsed((v) => !v)}
                  title={thumbsCollapsed ? 'Show page thumbnails' : 'Hide page thumbnails'}
                >
                  {thumbsCollapsed ? (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  ) : (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                  )}
                </button>
                {!thumbsCollapsed && <span className="thumbDock__label">Pages</span>}
              </div>
              {!thumbsCollapsed && (
                <PdfThumbnails
                  pdfDoc={pdfDoc}
                  pageCount={pageCount}
                  currentPage={currentPage}
                  onSelectPage={selectThumbnailPage}
                  pageRotations={pageRotations}
                />
              )}
            </div>
          ) : null}
          <RightToolsPanel
            tool={tool}
            onTool={setTool}
            onUploadClick={() => fileInputRef.current?.click()}
            onSamplePdfClick={handleSamplePdf}
            samplePdfBusy={samplePdfBusy}
            onStampClick={() => stampInputRef.current?.click()}
            onSaveJson={handleSaveJson}
            onLoadJsonClick={() => jsonInputRef.current?.click()}
            onExportPng={handleExportPng}
            onExportPdf={handleExportPdf}
            docLoaded={docLoaded}
            zoom={zoom}
            onZoom={(z) => setZoom(clampZoom(z))}
            selectionStyle={selectionStyle}
            showStylePanel={showStylePanel}
            onToggleStylePanel={() => setShowStylePanel((v) => !v)}
            shapeStyle={shapeStyle}
            showShapePanel={showShapePanel}
            onToggleShapePanel={() => setShowShapePanel((v) => !v)}
            pdfViewMode={pdfViewMode}
            onPdfViewMode={handlePdfViewMode}
            pageCount={pageCount}
            currentPage={currentPage}
            onPrev={goPrev}
            onNext={goNext}
            pageGoDraft={pageGoDraft}
            onPageGoDraft={setPageGoDraft}
            onPageGoSubmit={handlePageGoSubmit}
            brightness={brightness}
            onBrightness={setBrightness}
            contrast={contrast}
            onContrast={setContrast}
            hasMultiPagePdf={hasMultiPagePdf}
            isPdf={docType === 'pdf'}
            currentPageRotation={pageRotations[currentPage - 1] ?? 0}
            onRotate={handleRotatePage}
            rotateApplyAll={rotateApplyAll}
            onRotateApplyAll={setRotateApplyAll}
            collapsed={rightCollapsed}
            onToggleCollapse={() => setRightCollapsed((v) => !v)}
          />
        </div>
      </div>

      {showStylePanel && (
        <SelectionStylePanel
          style={selectionStyle}
          onChange={setSelectionStyle}
          onClose={() => setShowStylePanel(false)}
        />
      )}

      {showShapePanel && (
        <ShapeStylePanel style={shapeStyle} onChange={setShapeStyle} onClose={() => setShowShapePanel(false)} />
      )}
    </div>
  );
}
