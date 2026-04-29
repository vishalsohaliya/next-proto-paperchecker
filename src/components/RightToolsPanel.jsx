function ChevronLeft() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

export default function RightToolsPanel({
  tool,
  onTool,
  onUploadClick,
  onSamplePdfClick,
  samplePdfBusy,
  onStampClick,
  onSaveJson,
  onLoadJsonClick,
  onExportPng,
  onExportPdf,
  docLoaded,
  zoom,
  onZoom,
  selectionStyle,
  showStylePanel,
  onToggleStylePanel,
  shapeStyle,
  showShapePanel,
  onToggleShapePanel,
  pdfViewMode,
  onPdfViewMode,
  pageCount,
  currentPage,
  onPrev,
  onNext,
  pageGoDraft,
  onPageGoDraft,
  onPageGoSubmit,
  brightness,
  onBrightness,
  contrast,
  onContrast,
  hasMultiPagePdf,
  isPdf,
  currentPageRotation,
  onRotate,
  rotateApplyAll,
  onRotateApplyAll,
  collapsed,
  onToggleCollapse,
}) {
  const canPager = docLoaded && hasMultiPagePdf && pdfViewMode === 'single';

  if (collapsed) {
    return (
      <aside className="rightRail rightRail--collapsed" aria-label="Annotation tools (collapsed)">
        <div className="rightRail__strip">
          <button type="button" className="sidebar__toggleBtn" onClick={onToggleCollapse} title="Expand tools panel">
            <ChevronLeft />
          </button>
          <div className="rightRail__stripActiveTool" title={`Active tool: ${tool}`}>
            <ToolGlyph name={tool} />
          </div>
          <span className="sidebar__stripLabel">Tools</span>
        </div>
      </aside>
    );
  }

  return (
    <aside className="rightRail" aria-label="Annotation tools">
      <div className="rightRail__scroll">
        <div className="rightRail__topBar">
          <span className="rightRail__topBarTitle">Tools</span>
          <button type="button" className="sidebar__toggleBtn" onClick={onToggleCollapse} title="Collapse tools panel">
            <ChevronRight />
          </button>
        </div>

        <p className="rightRail__sectionTitle">Document</p>
        <div className="rightRail__group">
          <button type="button" className="railBtn railBtn--dark" onClick={onUploadClick}>
            Upload PDF / image
          </button>
          <button
            type="button"
            className="railBtn"
            onClick={onSamplePdfClick}
            disabled={samplePdfBusy}
            title="Loads the GTU sample instructions PDF from link.txt"
          >
            {samplePdfBusy ? 'Loading…' : 'Load sample PDF'}
          </button>
        </div>

        <p className="rightRail__sectionTitle">Markup</p>
        <div className="rightRail__toolGrid" role="group" aria-label="Drawing tools">
          <RailTool icon="select" label="Select" active={tool === 'select'} onClick={() => onTool('select')} />
          <RailTool icon="text" label="Text" active={tool === 'text'} onClick={() => onTool('text')} />
          <RailTool icon="draw" label="Draw" active={tool === 'draw'} onClick={() => onTool('draw')} />
          <RailTool icon="rect" label="Rect" active={tool === 'rect'} onClick={() => onTool('rect')} />
          <RailTool icon="circle" label="Circle" active={tool === 'circle'} onClick={() => onTool('circle')} />
          <RailTool icon="line" label="Line" active={tool === 'line'} onClick={() => onTool('line')} />
          <RailTool icon="stamp" label="Image" active={tool === 'stamp'} onClick={onStampClick} />
          <RailTool icon="erase" label="Erase" active={tool === 'erase'} onClick={() => onTool('erase')} />
        </div>

        <div className="rightRail__styleRow">
          <button
            type="button"
            className={`railBtn railBtn--style ${showStylePanel ? 'is-active' : ''}`}
            onClick={onToggleStylePanel}
          >
            Selection
            <span className="railBtn__dot" style={{ background: selectionStyle?.borderColor ?? '#6366f1' }} />
          </button>
          <button
            type="button"
            className={`railBtn railBtn--style ${showShapePanel ? 'is-active' : ''}`}
            onClick={onToggleShapePanel}
          >
            Shape
            <span className="railBtn__dot" style={{ background: shapeStyle?.stroke ?? '#2563eb' }} />
          </button>
        </div>

        <p className="rightRail__sectionTitle">View</p>
        <div className="rightRail__segmented" role="group" aria-label="PDF page layout">
          <button
            type="button"
            className={`segBtn ${pdfViewMode === 'single' ? 'is-active' : ''}`}
            onClick={() => onPdfViewMode('single')}
            disabled={!docLoaded}
          >
            Single
          </button>
          <button
            type="button"
            className={`segBtn ${pdfViewMode === 'continuous' ? 'is-active' : ''}`}
            onClick={() => onPdfViewMode('continuous')}
            disabled={!docLoaded}
          >
            Scroll
          </button>
        </div>

        <div className="rightRail__sliders">
          <label className="railSlider">
            <span className="railSlider__label">Brightness</span>
            <input
              type="range"
              min="60"
              max="140"
              value={brightness}
              onChange={(e) => onBrightness(Number(e.target.value))}
              disabled={!docLoaded}
            />
            <span className="railSlider__val">{brightness}%</span>
          </label>
          <label className="railSlider">
            <span className="railSlider__label">Contrast</span>
            <input
              type="range"
              min="60"
              max="160"
              value={contrast}
              onChange={(e) => onContrast(Number(e.target.value))}
              disabled={!docLoaded}
            />
            <span className="railSlider__val">{contrast}%</span>
          </label>
        </div>

        <p className="rightRail__sectionTitle">Zoom</p>
        <div className="rightRail__zoomRow">
          <button type="button" className="railIconBtn" onClick={() => onZoom(zoom - 0.1)} disabled={!docLoaded} title="Zoom out">
            −
          </button>
          <span className="rightRail__zoomVal">{Math.round(zoom * 100)}%</span>
          <button type="button" className="railIconBtn" onClick={() => onZoom(zoom + 0.1)} disabled={!docLoaded} title="Zoom in">
            +
          </button>
        </div>

        {isPdf && docLoaded ? (
          <>
            <p className="rightRail__sectionTitle">Rotate</p>
            <div className="rightRail__rotateRow">
              <button
                type="button"
                className="railIconBtn railIconBtn--rotate"
                onClick={() => onRotate(-90)}
                title="Rotate left 90°"
              >
                <RotateCCWIcon />
              </button>
              <span className="rightRail__rotateVal">{currentPageRotation ?? 0}°</span>
              <button
                type="button"
                className="railIconBtn railIconBtn--rotate"
                onClick={() => onRotate(90)}
                title="Rotate right 90°"
              >
                <RotateCWIcon />
              </button>
            </div>
            {hasMultiPagePdf ? (
              <label className="rightRail__rotateAllRow">
                <input
                  type="checkbox"
                  className="rightRail__rotateAllCheck"
                  checked={rotateApplyAll}
                  onChange={(e) => onRotateApplyAll(e.target.checked)}
                />
                <span>Apply to all pages</span>
              </label>
            ) : null}
          </>
        ) : null}

        {hasMultiPagePdf ? (
          <>
            <p className="rightRail__sectionTitle">Pages</p>
            <div className="rightRail__group">
              {pdfViewMode === 'continuous' ? (
                <p className="rightRail__muted">Scroll mode — use thumbnails to navigate</p>
              ) : (
                <div className="rightRail__pageCtrls">
                  <button
                    type="button"
                    className="railIconBtn"
                    onClick={onPrev}
                    disabled={!canPager || currentPage <= 1}
                    aria-label="Previous page"
                  >
                    ‹
                  </button>
                  <form
                    className="rightRail__pageJump"
                    onSubmit={(e) => {
                      e.preventDefault();
                      onPageGoSubmit();
                    }}
                  >
                    <input
                      className="railPageInput"
                      type="text"
                      inputMode="numeric"
                      value={pageGoDraft}
                      onChange={(e) => onPageGoDraft(e.target.value)}
                      disabled={!canPager}
                      title="Current page — type a number and press ↵ to jump"
                    />
                    <span className="railPageSep">/{pageCount}</span>
                    <button type="submit" className="railPageGoBtn" disabled={!canPager} title="Jump to page">
                      ↵
                    </button>
                  </form>
                  <button
                    type="button"
                    className="railIconBtn"
                    onClick={onNext}
                    disabled={!canPager || currentPage >= pageCount}
                    aria-label="Next page"
                  >
                    ›
                  </button>
                </div>
              )}
            </div>
          </>
        ) : null}

        <p className="rightRail__sectionTitle">File</p>
        <div className="rightRail__fileGrid">
          <button type="button" className="railBtn" onClick={onSaveJson} disabled={!docLoaded}>
            Save JSON
          </button>
          <button type="button" className="railBtn" onClick={onLoadJsonClick} disabled={!docLoaded}>
            Load JSON
          </button>
          <button type="button" className="railBtn" onClick={onExportPng} disabled={!docLoaded}>
            Export PNG
          </button>
          <button type="button" className="railBtn" onClick={onExportPdf} disabled={!docLoaded}>
            Export PDF
          </button>
        </div>

        <p className="rightRail__hint">Delete / Backspace removes selected object. Erase tool clicks to remove.</p>
      </div>
    </aside>
  );
}

function RotateCCWIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  );
}

function RotateCWIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 12a9 9 0 1 1-9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
    </svg>
  );
}

function RailTool({ icon, label, active, onClick }) {
  return (
    <button type="button" className={`railTool ${active ? 'railTool--active' : ''}`} onClick={onClick} title={label}>
      <span className="railTool__ico" aria-hidden>
        <ToolGlyph name={icon} />
      </span>
      <span className="railTool__lbl">{label}</span>
    </button>
  );
}

function ToolGlyph({ name }) {
  const s = { width: 16, height: 16, display: 'block' };
  switch (name) {
    case 'select':
      return (
        <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 3l14 9-7 1-4 7z" />
        </svg>
      );
    case 'text':
      return (
        <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="4 7 4 4 20 4 20 7" />
          <line x1="9" y1="20" x2="15" y2="20" />
          <line x1="12" y1="4" x2="12" y2="20" />
        </svg>
      );
    case 'draw':
      return (
        <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 19l7-7 3 3-7 7-3-3z" />
          <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
        </svg>
      );
    case 'rect':
      return (
        <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" />
        </svg>
      );
    case 'circle':
      return (
        <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
        </svg>
      );
    case 'line':
      return (
        <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="5" y1="19" x2="19" y2="5" />
        </svg>
      );
    case 'stamp':
      return (
        <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      );
    case 'erase':
      return (
        <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 21h10" />
          <path d="M5 11l9-9a2 2 0 0 1 3 3l-9 9-4 1z" />
        </svg>
      );
    default:
      return null;
  }
}
