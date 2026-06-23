import { Entity } from "./entity.js";

export class Obstacle extends Entity {
  constructor(id, vertices, color = "#FF4444", ctx) {
    super(id);
    this.vertices = vertices;
    this.color = color;
    this.ctx = ctx;
    this.edges = this._buildEdges(vertices);
    this.centroid = this._computeCentroid(vertices);
  }

  _buildEdges(vertices) {
    const edges = [];
    for (let i = 0; i < vertices.length; i++) {
      edges.push({ p1: vertices[i], p2: vertices[(i + 1) % vertices.length] });
    }
    return edges;
  }

  _computeCentroid(vertices) {
    let cx = 0, cy = 0;
    for (const v of vertices) { cx += v.x; cy += v.y; }
    return { x: cx / vertices.length, y: cy / vertices.length };
  }

  draw() {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(this.vertices[0].x, this.vertices[0].y);
    for (let i = 1; i < this.vertices.length; i++) ctx.lineTo(this.vertices[i].x, this.vertices[i].y);
    ctx.closePath();
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.strokeStyle = "#222";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.fillText(this.ID, this.centroid.x, this.centroid.y);
  }

  // --- PREDICTION MATH ---
  getLinearCollision(agent, angle) {
    // turn an angle into a direction vector
    const vx = Math.cos(angle);
    const vy = Math.sin(angle);
    const { x: cx, y: cy } = agent.position;
    const r = agent.radius;
    let minT = Infinity;

    for (const edge of this.edges) {
      const t = this._sweptCircleVsSegment(cx, cy, vx, vy, r, edge.p1, edge.p2);
      if (t !== null && t > 0 && t < minT) minT = t;
    }
    for (const v of this.vertices) {
      const t = this._sweptCircleVsPoint(cx, cy, vx, vy, r, v);
      if (t !== null && t > 0 && t < minT) minT = t;
    }

    return minT === Infinity ? null : { x: cx + vx * minT, y: cy + vy * minT, t: minT };
  }

  // if hits at the edge
  // red circle stops at the wall
  // t = (r - currentDist) / speed
  _sweptCircleVsSegment(cx, cy, vx, vy, r, p1, p2) {
  const ex = p2.x - p1.x;
  const ey = p2.y - p1.y;
  const len2 = ex * ex + ey * ey;
  if (len2 < 1e-10) return null;

  // Unit normal perpendicular to the edge
  const len = Math.sqrt(len2);
  const nx = -ey / len;
  const ny = ex / len;

  // Signed distance of circle center from the edge line
  const relX = cx - p1.x;
  const relY = cy - p1.y;
  const dist = relX * nx + relY * ny;

  // Relative velocity component along the normal
  const vn = vx * nx + vy * ny;

  if (Math.abs(vn) < 1e-10) return null;

  // We want the point where the center is 'r' distance away from the line
  // There are two possible sides, we use the one the agent is approaching from
  const t = (dist > 0 ? (r - dist) : (-r - dist)) / vn;

  if (t < 0) return null;

  // Check if the contact point is actually within the line segment p1-p2
  const hx = cx + vx * t;
  const hy = cy + vy * t;
  
  // Project the contact center onto the edge to verify it's within bounds
  const proj = ((hx - p1.x) * ex + (hy - p1.y) * ey) / len2;
  
  if (proj >= 0 && proj <= 1) {
    return t;
  }

  return null;
}

// if hits a sharp corner
  _sweptCircleVsPoint(cx, cy, vx, vy, r, p) {
    const fx = cx - p.x, fy = cy - p.y;
    const a = vx * vx + vy * vy, b = 2 * (fx * vx + fy * vy), c = fx * fx + fy * fy - r * r;
    const disc = b * b - 4 * a * c;
    if (disc < 0) return null;
    const t = (-b - Math.sqrt(disc)) / (2 * a);
    return t > 0 ? t : null;
  }

//If that distance is less than the agent's radius, they are touching.
  isCollidingWith(agent) {
    const { x, y } = agent.position;
    for (const e of this.edges) {
      if (this._pointToSegmentDist(x, y, e.p1, e.p2) < agent.radius) return true;
    }
    return false;
  }
  _pointToSegmentDist(px, py, p1, p2) {
    const dx = p2.x - p1.x, dy = p2.y - p1.y;
    const l2 = dx * dx + dy * dy;
    let t = ((px - p1.x) * dx + (py - p1.y) * dy) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (p1.x + t * dx), py - (p1.y + t * dy));
  }
}

export class ObstacleManager {
  constructor() { this.obstacles = []; }
  add(obs) { this.obstacles.push(obs); }
  update(agent) {
    let hit = false;
    this.obstacles.forEach(o => {
      o.draw();
      if (o.isCollidingWith(agent)) hit = true;
    });
    agent.colorHex = hit ? "#FF4444" : agent.originalColor;
  }
}