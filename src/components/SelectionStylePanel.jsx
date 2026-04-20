const PRESETS = [
  { name: 'Indigo', borderColor: '#6366f1', cornerColor: '#6366f1', cornerStrokeColor: '#ffffff' },
  { name: 'Rose', borderColor: '#f43f5e', cornerColor: '#f43f5e', cornerStrokeColor: '#ffffff' },
  { name: 'Emerald', borderColor: '#10b981', cornerColor: '#10b981', cornerStrokeColor: '#ffffff' },
  { name: 'Amber', borderColor: '#f59e0b', cornerColor: '#f59e0b', cornerStrokeColor: '#ffffff' },
  { name: 'Violet', borderColor: '#8b5cf6', cornerColor: '#8b5cf6', cornerStrokeColor: '#ffffff' },
  { name: 'Classic', borderColor: '#62b3ff', cornerColor: '#62b3ff', cornerStrokeColor: '#ffffff' },
];

const DASH_OPTIONS = [
  { label: 'Solid', value: null },
  { label: 'Dashed', value: [8, 4] },
  { label: 'Dotted', value: [2, 4] },
  { label: 'Long', value: [16, 6] },
];

function toHex(color) {
  if (!color) return '#ffffff';
  if (color.startsWith('#')) return color.slice(0, 7);
  const m = color.match(/\d+/g);
  if (!m || m.length < 3) return '#6366f1';
  return '#' + m.slice(0, 3).map((n) => parseInt(n).toString(16).padStart(2, '0')).join('');
}

export default function SelectionStylePanel({ style, onChange, onClose }) {
  const set = (key, val) => onChange({ ...style, [key]: val });

  return (
    <div className="ss-panel">
      <div className="ss-header">
        <span className="ss-header-icon">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="3" cy="3" r="2" fill="currentColor" stroke="none" />
            <circle cx="21" cy="3" r="2" fill="currentColor" stroke="none" />
            <circle cx="3" cy="21" r="2" fill="currentColor" stroke="none" />
            <circle cx="21" cy="21" r="2" fill="currentColor" stroke="none" />
            <circle cx="12" cy="3" r="1.5" fill="currentColor" stroke="none" />
            <circle cx="12" cy="21" r="1.5" fill="currentColor" stroke="none" />
            <circle cx="3" cy="12" r="1.5" fill="currentColor" stroke="none" />
            <circle cx="21" cy="12" r="1.5" fill="currentColor" stroke="none" />
          </svg>
        </span>
        <span className="ss-title">Selection Style</span>
        <button className="ss-close" onClick={onClose} title="Close">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="ss-body">
        <div className="ss-section-label">Presets</div>
        <div className="ss-presets">
          {PRESETS.map((p) => (
            <button
              key={p.name}
              className={`ss-preset-dot ${style.borderColor === p.borderColor ? 'is-active' : ''}`}
              style={{ background: p.borderColor }}
              title={p.name}
              onClick={() => onChange({ ...style, ...p })}
            />
          ))}
        </div>

        <div className="ss-divider" />

        <div className="ss-section-label">Border</div>

        <div className="ss-field">
          <span className="ss-field-label">Color</span>
          <label className="ss-color-wrap">
            <span className="ss-color-swatch" style={{ background: style.borderColor }} />
            <span className="ss-color-hex">{toHex(style.borderColor)}</span>
            <input
              type="color"
              value={toHex(style.borderColor)}
              onChange={(e) => set('borderColor', e.target.value)}
              className="ss-color-input"
            />
          </label>
        </div>

        <div className="ss-field">
          <span className="ss-field-label">Line style</span>
          <div className="ss-chip-group">
            {DASH_OPTIONS.map((d) => (
              <button
                key={d.label}
                className={`ss-chip ${JSON.stringify(style.borderDashArray) === JSON.stringify(d.value) ? 'is-active' : ''}`}
                onClick={() => set('borderDashArray', d.value)}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        <div className="ss-divider" />

        <div className="ss-section-label">Handles</div>

        <div className="ss-field">
          <span className="ss-field-label">Fill color</span>
          <label className="ss-color-wrap">
            <span className="ss-color-swatch" style={{ background: style.cornerColor }} />
            <span className="ss-color-hex">{toHex(style.cornerColor)}</span>
            <input
              type="color"
              value={toHex(style.cornerColor)}
              onChange={(e) => set('cornerColor', e.target.value)}
              className="ss-color-input"
            />
          </label>
        </div>

        <div className="ss-field">
          <span className="ss-field-label">Outline color</span>
          <label className="ss-color-wrap">
            <span className="ss-color-swatch" style={{ background: style.cornerStrokeColor || '#ffffff' }} />
            <span className="ss-color-hex">{toHex(style.cornerStrokeColor || '#ffffff')}</span>
            <input
              type="color"
              value={toHex(style.cornerStrokeColor || '#ffffff')}
              onChange={(e) => set('cornerStrokeColor', e.target.value)}
              className="ss-color-input"
            />
          </label>
        </div>

        <div className="ss-field">
          <span className="ss-field-label">Shape</span>
          <div className="ss-toggle-pair">
            <button
              className={`ss-toggle-btn ${style.cornerStyle === 'rect' ? 'is-active' : ''}`}
              onClick={() => set('cornerStyle', 'rect')}
            >
              ■ Square
            </button>
            <button
              className={`ss-toggle-btn ${style.cornerStyle === 'circle' ? 'is-active' : ''}`}
              onClick={() => set('cornerStyle', 'circle')}
            >
              ● Circle
            </button>
          </div>
        </div>

        <div className="ss-field">
          <span className="ss-field-label">
            Size&nbsp;<span className="ss-value-badge">{style.cornerSize}px</span>
          </span>
          <input
            type="range"
            min={6}
            max={20}
            step={1}
            value={style.cornerSize}
            onChange={(e) => set('cornerSize', Number(e.target.value))}
            className="ss-range"
          />
        </div>

        <div className="ss-field ss-field--row">
          <span className="ss-field-label">Transparent fill</span>
          <button
            className={`ss-switch ${style.transparentCorners ? 'is-active' : ''}`}
            onClick={() => set('transparentCorners', !style.transparentCorners)}
            role="switch"
            aria-checked={style.transparentCorners}
          >
            <span className="ss-switch-thumb" />
          </button>
        </div>
      </div>
    </div>
  );
}
