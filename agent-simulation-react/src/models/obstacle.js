import { Entity } from './entity.js';
import { CircleShape, PolygonShape } from './shapes.js';
import { ENTITY_TYPES } from '../utils/constants.js';

// Obstacle keeps the simulation meaning. Shapes define what the Entity looks like.
export class Obstacle extends Entity {
  constructor(id, name, position, shapes, color = '#FF4444') {
    super(id, name, ENTITY_TYPES.OBSTACLE, position, 0, { x: 0, y: 0 }, shapes);
    this.color = color;
  }

  static createCircle(id, name, center, radius, color = '#FF4444') {
    return new Obstacle(
      id,
      name,
      center,
      [new CircleShape(radius)],
      color
    );
  }

  static createPolygon(id, name, vertices, color = '#FF4444') {
    const position = vertices.reduce(
      (sum, vertex) => ({ x: sum.x + vertex.x, y: sum.y + vertex.y }),
      { x: 0, y: 0 }
    );
    position.x /= vertices.length;
    position.y /= vertices.length;
    const localVertices = vertices.map((vertex) => ({
      x: vertex.x - position.x,
      y: vertex.y - position.y,
    }));
    return new Obstacle(id, name, position, [new PolygonShape(localVertices)], color);
  }

  draw(ctx) {
    super.draw(ctx, this.transform, { fill: this.color, stroke: '#222', lineWidth: 2 });
  }
}
