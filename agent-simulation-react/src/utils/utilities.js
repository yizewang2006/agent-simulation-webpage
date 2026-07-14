export function parseNumberCap(value) {
  if (value === '' || value === null || value === undefined) return Infinity;
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : Infinity;
}

export function parseNumberOrDefault(value, fallback) {
  if (value === '' || value === null || value === undefined) return fallback;
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function getCanvasLogicalWidth(canvas, fallback = 0) {
  return canvas?.logicalWidth ?? canvas?.width ?? fallback;
}

export function getCanvasLogicalHeight(canvas, fallback = 0) {
  return canvas?.logicalHeight ?? canvas?.height ?? fallback;
}

// Better image quality
export function configureHighDpiCanvas(canvas, ctx, logicalWidth, logicalHeight) {
  const pixelRatio = window.devicePixelRatio || 1;
  canvas.logicalWidth = logicalWidth;
  canvas.logicalHeight = logicalHeight;
  canvas.width = Math.round(logicalWidth * pixelRatio);
  canvas.height = Math.round(logicalHeight * pixelRatio);
  canvas.style.width = `${logicalWidth}px`;
  canvas.style.height = `${logicalHeight}px`;
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
}

export function getCanvasPointFromEvent(event, canvas) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = getCanvasLogicalWidth(canvas) / rect.width;
  const scaleY = getCanvasLogicalHeight(canvas) / rect.height;

  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY,
  };
}
