const MAX_WIDTH_PX = 1200;

/**
 * Draw the image file into an offscreen-style canvas so the background layer has fixed pixel size.
 * Fabric overlay will match these width/height exactly.
 */
export async function renderImageFileToCanvas(file, canvas) {
  const bitmap = await createImageBitmap(file);
  let w = bitmap.width;
  let h = bitmap.height;
  if (w > MAX_WIDTH_PX) {
    const r = MAX_WIDTH_PX / w;
    w = Math.round(w * r);
    h = Math.round(h * r);
  }
  canvas.style.width = '';
  canvas.style.height = '';
  const ctx = canvas.getContext('2d');
  canvas.width = w;
  canvas.height = h;
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();
  return { width: w, height: h };
}
