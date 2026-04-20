const STORAGE_KEY = 'annotationDraft';

/** Envelope: multi-page Fabric JSON kept separate from the binary document. */
export function buildEnvelope(docType, pageCount, pagesFabricJson) {
  return {
    version: 1,
    type: docType,
    pageCount,
    pages: pagesFabricJson.map((fabricJson, pageIndex) => ({
      pageIndex,
      fabric: fabricJson ?? { objects: [] },
    })),
  };
}

export function validateEnvelope(data) {
  if (!data || typeof data !== 'object') return null;
  if (data.version !== 1) return null;
  if (data.type !== 'pdf' && data.type !== 'image') return null;
  if (!Array.isArray(data.pages)) return null;
  for (const p of data.pages) {
    if (typeof p.pageIndex !== 'number' || !p.fabric || !Array.isArray(p.fabric.objects)) return null;
  }
  return data;
}

export function downloadJson(filename, obj) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function saveEnvelopeToLocalStorage(envelope) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope));
  } catch {
    /* ignore quota */
  }
}

export function loadEnvelopeFromLocalStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return validateEnvelope(JSON.parse(raw));
  } catch {
    return null;
  }
}
