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

// Obstacle & Dragging Utilities
// Ray casting works for triangles, rectangles, trapezoids, and concave polygons.
// A horizontal ray starts at the pointer and toggles inside/outside each time it
// crosses a polygon edge. An odd crossing count means the pointer is inside.
export function isPointInsidePolygon(point, vertices) {
  let isInside = false;

  for (let currentIndex = 0, previousIndex = vertices.length - 1;
    currentIndex < vertices.length;
    previousIndex = currentIndex, currentIndex += 1) {
    const current = vertices[currentIndex];
    const previous = vertices[previousIndex];
    const crossesPointerY = current.y > point.y !== previous.y > point.y;

    if (crossesPointerY) {
      const crossingX = current.x
        + ((point.y - current.y) * (previous.x - current.x)) / (previous.y - current.y);
      if (point.x < crossingX) isInside = !isInside;
    }
  }

  return isInside;
}

export function getDistanceToSegment(point, start, end) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared === 0) return Math.hypot(point.x - start.x, point.y - start.y);

  const projection = ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared;
  const clampedProjection = Math.max(0, Math.min(1, projection));
  const closestX = start.x + clampedProjection * dx;
  const closestY = start.y + clampedProjection * dy;
  return Math.hypot(point.x - closestX, point.y - closestY);
}

// Edge tolerance makes very thin polygons and border clicks easier to select.
export function isPointNearPolygonEdge(point, vertices, tolerance = 6) {
  return vertices.some((vertex, index) => (
    getDistanceToSegment(point, vertex, vertices[(index + 1) % vertices.length]) <= tolerance
  ));
}
