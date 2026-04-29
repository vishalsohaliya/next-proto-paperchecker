import { useMemo } from 'react';
import { STATIC_ASSESSMENT_META, STATIC_QUESTIONS } from '../data/staticRubric.js';

function parseGiven(raw) {
  if (raw === '' || raw == null) return null;
  const n = Number.parseFloat(String(raw).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

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

export default function MarkingSidebar({ givenById, onGivenChange, collapsed, onToggleCollapse }) {
  const totals = useMemo(() => {
    let max = 0;
    let given = 0;
    for (const q of STATIC_QUESTIONS) {
      max += q.maxMarks;
      const g = parseGiven(givenById[q.id]);
      if (g != null) given += Math.min(g, q.maxMarks);
    }
    return { max, given };
  }, [givenById]);

  if (collapsed) {
    return (
      <aside className="markingSidebar markingSidebar--collapsed" aria-label="Marking rubric (collapsed)">
        <div className="markingSidebar__strip">
          <button
            type="button"
            className="sidebar__toggleBtn"
            onClick={onToggleCollapse}
            title="Expand marking panel"
          >
            <ChevronRight />
          </button>
          <span className="sidebar__stripLabel">Marking</span>
          <span className="markingSidebar__stripScore">
            {totals.given.toFixed(totals.given % 1 ? 1 : 0)}/{totals.max}
          </span>
        </div>
      </aside>
    );
  }

  return (
    <aside className="markingSidebar" aria-label="Marking rubric">
      <div className="markingSidebar__head">
        <div className="markingSidebar__headRow">
          <div className="markingSidebar__headText">
            <p className="markingSidebar__eyebrow">Assessment</p>
            <h1 className="markingSidebar__title">{STATIC_ASSESSMENT_META.title}</h1>
          </div>
          <button
            type="button"
            className="sidebar__toggleBtn"
            onClick={onToggleCollapse}
            title="Collapse marking panel"
          >
            <ChevronLeft />
          </button>
        </div>
        <p className="markingSidebar__meta">{STATIC_ASSESSMENT_META.subject}</p>
        <p className="markingSidebar__roll">Roll: {STATIC_ASSESSMENT_META.candidateRoll}</p>
        <p className="markingSidebar__hint">{STATIC_ASSESSMENT_META.examinerNote}</p>
      </div>

      <div className="markingSidebar__list">
        {STATIC_QUESTIONS.map((q) => {
          const raw = givenById[q.id] ?? '';
          const parsed = parseGiven(raw);
          const clamped = parsed != null ? Math.min(parsed, q.maxMarks) : null;
          const over = parsed != null && parsed > q.maxMarks;

          return (
            <div key={q.id} className="markingQ">
              <div className="markingQ__top">
                <span className="markingQ__label">{q.label}</span>
                <span className="markingQ__max">/{q.maxMarks}</span>
              </div>
              <div className="markingQ__row">
                <label className="markingQ__givenLabel" htmlFor={`given-${q.id}`}>
                  Given
                </label>
                <input
                  id={`given-${q.id}`}
                  className={`markingQ__input ${over ? 'markingQ__input--warn' : ''}`}
                  type="text"
                  inputMode="decimal"
                  placeholder="0"
                  value={raw}
                  onChange={(e) => onGivenChange(q.id, e.target.value)}
                  aria-invalid={over}
                />
                {clamped != null && !over ? (
                  <span className="markingQ__ok" aria-hidden>
                    ✓
                  </span>
                ) : null}
              </div>
              {over ? <p className="markingQ__warn">Exceeds max for this question.</p> : null}
            </div>
          );
        })}
      </div>

      <div className="markingSidebar__footer">
        <div className="markingTotals">
          <span className="markingTotals__label">Total awarded</span>
          <span className="markingTotals__value">
            {totals.given.toFixed(totals.given % 1 ? 1 : 0)} / {totals.max}
          </span>
        </div>
      </div>
    </aside>
  );
}
