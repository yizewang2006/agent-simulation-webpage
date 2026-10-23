import { ENTITY_TYPES, SHAPE_TYPES } from './constants.js';

// This function finds the topmost runtime Entity at the clicked location.
export function findRuntimeEntityAt(point, entities) {
  for (let index = entities.length - 1; index >= 0; index -= 1) {
    const entity = entities[index];

    if (entity.containsPoint(point, 4)) return entity;
  }

  return null;
}
// This function calculates the geometry after dragging an entire runtime Entity.
export function getDraggedRuntimeEntityGeometry(entity, dx, dy, canvasWidth, canvasHeight) {
  if (entity.entityType === ENTITY_TYPES.AGENT) {
    return {
      position: {
        x: Math.min(canvasWidth, Math.max(0, entity.transform.position.x + dx)),
        y: Math.min(canvasHeight, Math.max(0, entity.transform.position.y + dy)),
      },
    };
  }

  if (entity.shapes[0].type === SHAPE_TYPES.CIRCLE) {
    const radius = entity.shapes[0].radius;
    return {
      position: {
        x: Math.min(
          canvasWidth - radius,
          Math.max(radius, entity.transform.position.x + dx)
        ),
        y: Math.min(
          canvasHeight - radius,
          Math.max(radius, entity.transform.position.y + dy)
        ),
      },
    };
  }

  const vertices = entity.shapes[0].getWorldVertices(entity.transform);
  const xValues = vertices.map((vertex) => vertex.x);
  const yValues = vertices.map((vertex) => vertex.y);
  const boundedDx = Math.min(
    canvasWidth - Math.max(...xValues),
    Math.max(-Math.min(...xValues), dx)
  );
  const boundedDy = Math.min(
    canvasHeight - Math.max(...yValues),
    Math.max(-Math.min(...yValues), dy)
  );

  return {
    vertices: vertices.map((vertex) => ({
      x: vertex.x + boundedDx,
      y: vertex.y + boundedDy,
    })),
  };
}
