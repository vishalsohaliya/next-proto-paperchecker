export default function Toolbar({
  tool,
  onTool,
  onUploadClick,
  onStampClick,
  onSaveJson,
  onLoadJsonClick,
  onExportPng,
  onExportPdf,
  docLoaded,
  pageLabel,
  onPrev,
  onNext,
  zoom,
  onZoom,
  selectionStyle,
  showStylePanel,
  onToggleStylePanel,
  shapeStyle,
  showShapePanel,
  onToggleShapePanel,
}) {
  return (
    <header className="toolbar">
      <button type="button" className="toolbar-btn toolbar-btn--primary" onClick={onUploadClick}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        Upload
      </button>

      <span className="toolbar-sep" />

      <div className="toolbar-group" role="group" aria-label="Tools">
        <button
          type="button"
          className={`toolbar-btn ${tool === 'select' ? 'is-active' : ''}`}
          onClick={() => onTool('select')}
          title="Select (V)"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 3l14 9-7 1-4 7z" />
          </svg>
          Select
        </button>
        <button
          type="button"
          className={`toolbar-btn ${tool === 'text' ? 'is-active' : ''}`}
          onClick={() => onTool('text')}
          title="Add text (T)"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="4 7 4 4 20 4 20 7" />
            <line x1="9" y1="20" x2="15" y2="20" />
            <line x1="12" y1="4" x2="12" y2="20" />
          </svg>
          Text
        </button>
        <button
          type="button"
          className={`toolbar-btn ${tool === 'draw' ? 'is-active' : ''}`}
          onClick={() => onTool('draw')}
          title="Freehand draw (D)"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 19l7-7 3 3-7 7-3-3z" />
            <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
            <path d="M2 2l7.586 7.586" />
            <circle cx="11" cy="11" r="2" />
          </svg>
          Draw
        </button>
        <button
          type="button"
          className={`toolbar-btn ${tool === 'rect' ? 'is-active' : ''}`}
          onClick={() => onTool('rect')}
          title="Rectangle (R)"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
          </svg>
          Rect
        </button>
        <button
          type="button"
          className={`toolbar-btn ${tool === 'circle' ? 'is-active' : ''}`}
          onClick={() => onTool('circle')}
          title="Circle (C)"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
          </svg>
          Circle
        </button>
        <button
          type="button"
          className={`toolbar-btn ${tool === 'stamp' ? 'is-active' : ''}`}
          onClick={onStampClick}
          title="Stamp image"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          Image
        </button>
      </div>

      <span className="toolbar-sep" />

      <button
        type="button"
        className={`toolbar-btn toolbar-btn--style ${showStylePanel ? 'is-active' : ''}`}
        onClick={onToggleStylePanel}
        title="Configure selection style"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="3" cy="3" r="1.5" fill="currentColor" stroke="none" />
          <circle cx="21" cy="3" r="1.5" fill="currentColor" stroke="none" />
          <circle cx="3" cy="21" r="1.5" fill="currentColor" stroke="none" />
          <circle cx="21" cy="21" r="1.5" fill="currentColor" stroke="none" />
        </svg>
        Selection
        <span
          className="toolbar-style-dot"
          style={{ background: selectionStyle?.borderColor ?? '#6366f1' }}
        />
      </button>

      <button
        type="button"
        className={`toolbar-btn toolbar-btn--style ${showShapePanel ? 'is-active' : ''}`}
        onClick={onToggleShapePanel}
        title="Configure shape fill and border"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="12" cy="12" r="4" fill="currentColor" stroke="none" opacity="0.45" />
        </svg>
        Shape
        <span
          className="toolbar-style-dot"
          style={{ background: shapeStyle?.stroke ?? '#2563eb' }}
        />
      </button>

      <span className="toolbar-sep" />

      <div className="toolbar-group">
        <button type="button" className="toolbar-btn" onClick={onSaveJson} disabled={!docLoaded}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
            <polyline points="17 21 17 13 7 13 7 21" />
            <polyline points="7 3 7 8 15 8" />
          </svg>
          Save
        </button>
        <button type="button" className="toolbar-btn" onClick={onLoadJsonClick} disabled={!docLoaded}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Load
        </button>
      </div>

      <span className="toolbar-sep" />

      <div className="toolbar-group toolbar-zoom">
        <button type="button" className="toolbar-btn toolbar-btn--icon" onClick={() => onZoom(zoom - 0.1)} disabled={!docLoaded} title="Zoom out">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
            <line x1="8" y1="11" x2="14" y2="11" />
          </svg>
        </button>
        <span className="toolbar-zoom-val">{Math.round(zoom * 100)}%</span>
        <button type="button" className="toolbar-btn toolbar-btn--icon" onClick={() => onZoom(zoom + 0.1)} disabled={!docLoaded} title="Zoom in">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
            <line x1="11" y1="8" x2="11" y2="14" />
            <line x1="8" y1="11" x2="14" y2="11" />
          </svg>
        </button>
      </div>

      <span className="toolbar-sep" />

      <div className="toolbar-group">
        <button type="button" className="toolbar-btn" onClick={onExportPng} disabled={!docLoaded}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          PNG
        </button>
        <button type="button" className="toolbar-btn" onClick={onExportPdf} disabled={!docLoaded}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="9" y1="15" x2="15" y2="15" />
          </svg>
          PDF
        </button>
      </div>

      {pageLabel ? (
        <>
          <span className="toolbar-sep" />
          <div className="toolbar-group toolbar-pager">
            <button type="button" className="toolbar-btn toolbar-btn--icon" onClick={onPrev} title="Previous page">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <span className="toolbar-zoom-val">{pageLabel}</span>
            <button type="button" className="toolbar-btn toolbar-btn--icon" onClick={onNext} title="Next page">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </>
      ) : null}

      <span className="toolbar-sep" />
      <span className="toolbar-hint">Del removes selected</span>
    </header>
  );
}
