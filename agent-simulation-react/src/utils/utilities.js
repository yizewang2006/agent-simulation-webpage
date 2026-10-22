import { ENTITY_ID_PREFIXES } from './constants.js';

const buildDate = new Date(import.meta.env?.VITE_BUILD_DATE);

export const updatedDate = Number.isNaN(buildDate.getTime())
  ? 'not long ago'
  : new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(buildDate);

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

// ENTITIES

// Creates a unique ID for each entity
export function createEntityID(entityType) {
  const prefix = ENTITY_ID_PREFIXES[entityType];

  if (!prefix) {
    throw new Error(`Unsupported entity type: ${entityType}`);
  }

  return `${prefix}-${crypto.randomUUID().toUpperCase()}`;
}

// For display: show a partial ID
export function formatID(id) {
  return id.split('-').slice(0, 2).join('-');
}

// GRAPHICS
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

// Store information (triggered when playing)
export function storeScenarioInformation(refs = {}) {
  const scenarioData = {};

  // Save values that can change while the simulation is playing.
  Object.entries(refs).forEach(([entityType, ref]) => {
    scenarioData[entityType] = ref.current.map((entity) => {
      const centerPoint = entity.transform.position;

      return {
        entity,
        x: centerPoint.x,
        y: centerPoint.y,
        velocity: { ...entity.velocity },
        rotation: entity.transform.rotation,
        steeringRotation: entity.runtimeState.steeringRotation,
      };
    });
  });

  return scenarioData;
}

// Reset Scenario function
export function resetScenario(scenarioData = {}) {
  if (!scenarioData) return;

  // Restore the existing instances so Entity methods and canvas refs remain.
  Object.values(scenarioData).forEach((entities) => {
    entities.forEach((savedEntity) => {
      const { entity } = savedEntity;

      entity.transform.position.x = savedEntity.x;
      entity.transform.position.y = savedEntity.y;
      entity.velocity = { ...savedEntity.velocity };
      entity.transform.rotation = savedEntity.rotation;
      entity.runtimeState.steeringRotation = savedEntity.steeringRotation;
    });
  });
}
