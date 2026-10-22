import { isPointInsidePolygon, isPointNearPolygonEdge } from './utilities.js';
import { ENTITY_TYPES, OBSTACLE_SHAPE_TYPES } from './constants.js';

// This function finds the topmost runtime Entity at the clicked location.
export function findRuntimeEntityAt(point, entities) {
  for (let index = entities.length - 1; index >= 0; index -= 1) {
    const entity = entities[index];

    if (
      entity.entityType === ENTITY_TYPES.AGENT
      && Math.hypot(
        point.x - entity.transform.position.x,
        point.y - entity.transform.position.y
      ) <= entity.radius + 4
    ) {
      return entity;
    }

    if (entity.entityType === ENTITY_TYPES.OBSTACLE) {
      if (
        entity.shapeType === OBSTACLE_SHAPE_TYPES.CIRCLE
        && Math.hypot(
          point.x - entity.transform.position.x,
          point.y - entity.transform.position.y
        ) <= entity.radius + 4
      ) {
        return entity;
      }

      if (
        entity.vertices
        && (
          isPointInsidePolygon(point, entity.vertices)
          || isPointNearPolygonEdge(point, entity.vertices)
        )
      ) {
        return entity;
      }
    }
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

  if (entity.shapeType === OBSTACLE_SHAPE_TYPES.CIRCLE) {
    return {
      position: {
        x: Math.min(
          canvasWidth - entity.radius,
          Math.max(entity.radius, entity.transform.position.x + dx)
        ),
        y: Math.min(
          canvasHeight - entity.radius,
          Math.max(entity.radius, entity.transform.position.y + dy)
        ),
      },
    };
  }

  const xValues = entity.vertices.map((vertex) => vertex.x);
  const yValues = entity.vertices.map((vertex) => vertex.y);
  const boundedDx = Math.min(
    canvasWidth - Math.max(...xValues),
    Math.max(-Math.min(...xValues), dx)
  );
  const boundedDy = Math.min(
    canvasHeight - Math.max(...yValues),
    Math.max(-Math.min(...yValues), dy)
  );

  return {
    vertices: entity.vertices.map((vertex) => ({
      x: vertex.x + boundedDx,
      y: vertex.y + boundedDy,
    })),
  };
}

// This function calculates the Canvas angle from a runtime Entity to the cursor.
export function getRuntimeLookAtCursorAngle(entity, point) {
  return Math.atan2(
    point.y - entity.transform.position.y,
    point.x - entity.transform.position.x
  );
}
