import { SHAPE_TYPES } from '../utils/constants.js';

function toWorldPoint(point, transform) {
  const cos = Math.cos(transform.rotation);
  const sin = Math.sin(transform.rotation);
  return {
    x: point.x * cos - point.y * sin + transform.position.x,
    y: point.x * sin + point.y * cos + transform.position.y,
  };
}

export class CircleShape {
  constructor(radius, center = { x: 0, y: 0 }) {
    this.type = SHAPE_TYPES.CIRCLE;
    this.radius = radius;
    this.center = center;
  }

  draw(ctx, transform, appearance) {
    const center = this.getWorldCenter(transform);
    ctx.beginPath();
    ctx.arc(center.x, center.y, this.radius, 0, Math.PI * 2);
    if (appearance.fill) {
      ctx.fillStyle = appearance.fill;
      ctx.fill();
    }
    if (appearance.stroke) {
      ctx.strokeStyle = appearance.stroke;
      ctx.lineWidth = appearance.lineWidth;
      ctx.stroke();
    }
    ctx.closePath();
  }

  getBoundingRadius() {
    return Math.hypot(this.center.x, this.center.y) + this.radius;
  }

  getWorldCenter(transform) {
    return toWorldPoint(this.center, transform);
  }

  getClosestPointTo(position, transform) {
    const center = this.getWorldCenter(transform);
    const dx = position.x - center.x;
    const dy = position.y - center.y;
    const distance = Math.hypot(dx, dy);
    if (distance === 0) return { x: center.x + this.radius, y: center.y };
    return {
      x: center.x + (dx / distance) * this.radius,
      y: center.y + (dy / distance) * this.radius,
    };
  }

  getBounds(transform) {
    const center = this.getWorldCenter(transform);
    return {
      minX: center.x - this.radius,
      minY: center.y - this.radius,
      maxX: center.x + this.radius,
      maxY: center.y + this.radius,
    };
  }

  containsPoint(point, transform, tolerance = 0) {
    const center = this.getWorldCenter(transform);
    return Math.hypot(point.x - center.x, point.y - center.y) <= this.radius + tolerance;
  }
}

export class PolygonShape {
  constructor(vertices) {
    this.type = SHAPE_TYPES.POLYGON;
    this.vertices = vertices;
  }

  draw(ctx, transform, appearance) {
    const vertices = this.getWorldVertices(transform);
    ctx.beginPath();
    ctx.moveTo(vertices[0].x, vertices[0].y);
    vertices.slice(1).forEach((vertex) => ctx.lineTo(vertex.x, vertex.y));
    ctx.closePath();
    if (appearance.fill) {
      ctx.fillStyle = appearance.fill;
      ctx.fill();
    }
    if (appearance.stroke) {
      ctx.strokeStyle = appearance.stroke;
      ctx.lineWidth = appearance.lineWidth;
      ctx.stroke();
    }
  }

  getBoundingRadius() {
    return this.vertices.reduce(
      (radius, vertex) => Math.max(radius, Math.hypot(vertex.x, vertex.y)),
      0
    );
  }

  getWorldVertices(transform) {
    return this.vertices.map((vertex) => toWorldPoint(vertex, transform));
  }

  getClosestPointTo(position, transform) {
    const vertices = this.getWorldVertices(transform);
    let closestPoint = null;
    let closestDistance = Infinity;
    vertices.forEach((vertex, index) => {
      const nextVertex = vertices[(index + 1) % vertices.length];
      const dx = nextVertex.x - vertex.x;
      const dy = nextVertex.y - vertex.y;
      const lengthSquared = dx * dx + dy * dy;
      const projection = lengthSquared === 0
        ? 0
        : ((position.x - vertex.x) * dx + (position.y - vertex.y) * dy) / lengthSquared;
      const amount = Math.max(0, Math.min(1, projection));
      const point = { x: vertex.x + amount * dx, y: vertex.y + amount * dy };
      const distance = Math.hypot(position.x - point.x, position.y - point.y);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestPoint = point;
      }
    });
    return closestPoint;
  }

  getBounds(transform) {
    const vertices = this.getWorldVertices(transform);
    return {
      minX: Math.min(...vertices.map((vertex) => vertex.x)),
      minY: Math.min(...vertices.map((vertex) => vertex.y)),
      maxX: Math.max(...vertices.map((vertex) => vertex.x)),
      maxY: Math.max(...vertices.map((vertex) => vertex.y)),
    };
  }

  containsPoint(point, transform, tolerance = 0) {
    const vertices = this.getWorldVertices(transform);
    let inside = false;
    for (let index = 0, previousIndex = vertices.length - 1; index < vertices.length; previousIndex = index, index += 1) {
      const vertex = vertices[index];
      const previous = vertices[previousIndex];
      const crosses = vertex.y > point.y !== previous.y > point.y
        && point.x < ((previous.x - vertex.x) * (point.y - vertex.y)) / (previous.y - vertex.y) + vertex.x;
      if (crosses) inside = !inside;
    }
    if (inside) return true;
    return vertices.some((vertex, index) => {
      const next = vertices[(index + 1) % vertices.length];
      const dx = next.x - vertex.x;
      const dy = next.y - vertex.y;
      const lengthSquared = dx * dx + dy * dy;
      const amount = lengthSquared === 0
        ? 0
        : Math.max(0, Math.min(1, ((point.x - vertex.x) * dx + (point.y - vertex.y) * dy) / lengthSquared));
      return Math.hypot(
        point.x - (vertex.x + amount * dx),
        point.y - (vertex.y + amount * dy)
      ) <= tolerance;
    });
  }
}

