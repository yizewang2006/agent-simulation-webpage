import {
  isPointInsidePolygon,
  isPointNearPolygonEdge,
} from './utilities.js';
import { ENTITY_TYPES } from './constants.js';

// This function finds the topmost Entity at the clicked location.
export function findEntityAt(point, entities) {
  for (let index = entities.length - 1; index >= 0; index -= 1) {
    const entity = entities[index];

    if (
      entity.entityType === ENTITY_TYPES.AGENT
      && Math.hypot(point.x - entity.x, point.y - entity.y) <= entity.radius + 4
    ) {
      return entity;
    }

    if (entity.entityType === ENTITY_TYPES.OBSTACLE) {
      if (
        entity.center
        && Math.hypot(
          point.x - entity.center.x,
          point.y - entity.center.y
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

// This function calculates the geometry after dragging an entire Entity.
export function getDraggedEntityGeometry(
  entity,
  dx,
  dy,
  canvasWidth,
  canvasHeight
) {
  if (entity.entityType === ENTITY_TYPES.AGENT) {
    return {
      x: Math.min(canvasWidth, Math.max(0, entity.x + dx)),
      y: Math.min(canvasHeight, Math.max(0, entity.y + dy)),
    };
  }

  if (entity.center) {
    return {
      center: {
        x: Math.min(
          canvasWidth - entity.radius,
          Math.max(entity.radius, entity.center.x + dx)
        ),
        y: Math.min(
          canvasHeight - entity.radius,
          Math.max(entity.radius, entity.center.y + dy)
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

// This function calculates the Canvas angle from an Entity to the cursor.
export function getLookAtCursorAngle(entity, point) {
  return Math.atan2(point.y - entity.y, point.x - entity.x);
}

// This function finds a resize handle on the selected Obstacle.
export function findObstacleEditHandle(point, obstacle) {
  if (obstacle.center) {
    const handles = [
      { x: obstacle.center.x, y: obstacle.center.y - obstacle.radius },
      { x: obstacle.center.x + obstacle.radius, y: obstacle.center.y },
      { x: obstacle.center.x, y: obstacle.center.y + obstacle.radius },
      { x: obstacle.center.x - obstacle.radius, y: obstacle.center.y },
    ];

    return handles.some((handle) => (
      Math.hypot(point.x - handle.x, point.y - handle.y) <= 8
    ))
      ? { mode: 'circle-resize' }
      : null;
  }

  const vertexIndex = obstacle.vertices.findIndex((vertex) => (
    Math.hypot(point.x - vertex.x, point.y - vertex.y) <= 8
  ));

  return vertexIndex === -1
    ? null
    : { mode: 'polygon-vertex', vertexIndex };
}

// This function calculates the geometry after editing an Obstacle handle.
export function getEditedObstacleGeometry(
  obstacle,
  editHandle,
  point,
  canvasWidth,
  canvasHeight
) {
  const boundedPoint = {
    x: Math.min(canvasWidth, Math.max(0, point.x)),
    y: Math.min(canvasHeight, Math.max(0, point.y)),
  };

  if (editHandle.mode === 'polygon-vertex') {
    return {
      vertices: obstacle.vertices.map((vertex, index) => (
        index === editHandle.vertexIndex ? boundedPoint : vertex
      )),
    };
  }

  const radius = Math.hypot(
    boundedPoint.x - obstacle.center.x,
    boundedPoint.y - obstacle.center.y
  );
  const maxRadius = Math.max(1, Math.min(
    obstacle.center.x,
    canvasWidth - obstacle.center.x,
    obstacle.center.y,
    canvasHeight - obstacle.center.y
  ));

  return {
    radius: Math.min(Math.max(1, radius), maxRadius),
  };
}
