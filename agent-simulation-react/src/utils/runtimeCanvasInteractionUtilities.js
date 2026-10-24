// This function finds the topmost runtime Entity at the clicked location.
export function findRuntimeEntityAt(point, entities) {
  for (let index = entities.length - 1; index >= 0; index -= 1) {
    const entity = entities[index];

    if (entity.containsPoint(point, 4)) return entity;
  }

  return null;
}
// This function keeps an entire dragged runtime Entity inside the Canvas.
export function getDraggedRuntimeEntityPosition(entity, desiredPosition, canvasWidth, canvasHeight) {
  const bounds = entity.getBounds();
  return {
    x: Math.min(
      canvasWidth - (bounds.maxX - entity.transform.position.x),
      Math.max(-(bounds.minX - entity.transform.position.x), desiredPosition.x)
    ),
    y: Math.min(
      canvasHeight - (bounds.maxY - entity.transform.position.y),
      Math.max(-(bounds.minY - entity.transform.position.y), desiredPosition.y)
    ),
  };
}
