const PRESETS = [
  { name: 'Blue', fill: '#2563eb', stroke: '#2563eb' },
  { name: 'Indigo', fill: '#6366f1', stroke: '#6366f1' },
  { name: 'Rose', fill: '#f43f5e', stroke: '#f43f5e' },
  { name: 'Emerald', fill: '#10b981', stroke: '#10b981' },
  { name: 'Amber', fill: '#f59e0b', stroke: '#f59e0b' },
  { name: 'Violet', fill: '#8b5cf6', stroke: '#8b5cf6' },
];

function toHex(color) {
  if (!color) return '#2563eb';
  if (color.startsWith('#')) return color.slice(0, 7);
  const m = color.match(/\d+/g);
  if (!m || m.length < 3) return '#2563eb';
  return '#' + m.slice(0, 3).map((n) => parseInt(n).toString(16).padStart(2, '0')).join('');
}

export default function ShapeStylePanel({ style, onChange, onClose }) {
  const set = (key, val) => onChange({ ...style, [key]: val });

  return (
    <div className="ss-panel sh-panel">
      <div className="ss-header">
        <span className="ss-header-icon">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="12" cy="12" r="4" fill="currentColor" stroke="none" opacity="0.4" />
          </svg>
        </span>
        <span className="ss-title">Shape Style</span>
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
              className={`ss-preset-dot ${style.stroke === p.stroke && style.fill === p.fill ? 'is-active' : ''}`}
              style={{ background: p.stroke }}
              title={p.name}
              onClick={() => onChange({ ...style, fill: p.fill, stroke: p.stroke })}
            />
          ))}
        </div>

        <div className="ss-divider" />

        <div className="ss-section-label">Border</div>

        <div className="ss-field">
          <span className="ss-field-label">Color</span>
          <label className="ss-color-wrap">
            <span className="ss-color-swatch" style={{ background: style.stroke }} />
            <span className="ss-color-hex">{toHex(style.stroke)}</span>
            <input
              type="color"
              value={toHex(style.stroke)}
              onChange={(e) => set('stroke', e.target.value)}
              className="ss-color-input"
            />
          </label>
        </div>

        <div className="ss-field">
          <span className="ss-field-label">
            Width&nbsp;<span className="ss-value-badge">{style.strokeWidth}px</span>
          </span>
          <input
            type="range"
            min={1}
            max={8}
            step={1}
            value={style.strokeWidth}
            onChange={(e) => set('strokeWidth', Number(e.target.value))}
            className="ss-range"
          />
        </div>

        <div className="ss-divider" />

        <div className="ss-section-label">Fill</div>

        <div className="ss-field ss-field--row">
          <span className="ss-field-label">Transparent fill</span>
          <button
            className={`ss-switch ${style.transparentFill ? 'is-active' : ''}`}
            onClick={() => set('transparentFill', !style.transparentFill)}
            role="switch"
            aria-checked={style.transparentFill}
          >
            <span className="ss-switch-thumb" />
          </button>
        </div>

        {!style.transparentFill && (
          <>
            <div className="ss-field">
              <span className="ss-field-label">Color</span>
              <label className="ss-color-wrap">
                <span className="ss-color-swatch" style={{ background: style.fill }} />
                <span className="ss-color-hex">{toHex(style.fill)}</span>
                <input
                  type="color"
                  value={toHex(style.fill)}
                  onChange={(e) => set('fill', e.target.value)}
                  className="ss-color-input"
                />
              </label>
            </div>

            <div className="ss-field">
              <span className="ss-field-label">
                Opacity&nbsp;<span className="ss-value-badge">{Math.round(style.fillOpacity * 100)}%</span>
              </span>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={Math.round(style.fillOpacity * 100)}
                onChange={(e) => set('fillOpacity', Number(e.target.value) / 100)}
                className="ss-range"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
