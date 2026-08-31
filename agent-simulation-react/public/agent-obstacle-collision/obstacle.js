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
      edges.push({
        p1: vertices[i],
        p2: vertices[(i + 1) % vertices.length]
      });
    }
    return edges;
  }
 
  _computeCentroid(vertices) {
    let cx = 0, cy = 0;
    for (const v of vertices) { cx += v.x; cy += v.y; }
    return { x: cx / vertices.length, y: cy / vertices.length };
  }
 
  // ─────────────────────────────────────────────
  // Draw polygon
  // ─────────────────────────────────────────────
  draw() {
    const ctx = this.ctx;
    if (!this.vertices.length) return;
 
    ctx.beginPath();
    ctx.moveTo(this.vertices[0].x, this.vertices[0].y);
    for (let i = 1; i < this.vertices.length; i++) {
      ctx.lineTo(this.vertices[i].x, this.vertices[i].y);
    }
    ctx.closePath();
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.strokeStyle = "#222";
    ctx.lineWidth = 2;
    ctx.stroke();
 
    ctx.fillStyle = "#fff";
    ctx.font = "bold 11px Roboto, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(this.ID, this.centroid.x, this.centroid.y);
  }
 
  // ─────────────────────────────────────────────
  // SWEPT CIRCLE vs EDGE (rectangular capsule strip)
  //
  // Finds the earliest time t >= 0 at which a circle
  // of radius r, centered at (cx,cy) moving at (vx,vy),
  // first contacts the infinite line through p1→p2,
  // with the contact point lying within the segment.
  //
  // Approach: the circle touches the line when the
  // perpendicular (signed) distance from the center
  // to the line equals ±r.  This is a linear equation
  // in t, so there are at most two candidate times
  // (one per side).  We keep the smallest valid one.
  // ─────────────────────────────────────────────
  _sweptCircleVsSegment(cx, cy, vx, vy, r, p1, p2) {
    const ex = p2.x - p1.x;
    const ey = p2.y - p1.y;
    const len2 = ex * ex + ey * ey;
    if (len2 < 1e-10) return null;
    const len = Math.sqrt(len2);
 
    // Unit normal perpendicular to the edge
    const nx = -ey / len;
    const ny =  ex / len;
 
    // Signed distance of circle center from the edge line
    const relX = cx - p1.x;
    const relY = cy - p1.y;
    const dist = relX * nx + relY * ny;
 
    // Rate of change of that signed distance
    const vn = vx * nx + vy * ny;
 
    // If moving parallel to the edge, no edge-face contact
    if (Math.abs(vn) < 1e-10) return null;
 
    let minT = Infinity;
 
    // Test contact from both sides of the edge (dist = +r and dist = -r)
    for (const sign of [1, -1]) {
      const t = (sign * r - dist) / vn;
      if (t < -1e-6) continue; // contact is in the past
 
      const tc = Math.max(0, t);
 
      // Position of circle center at contact time, relative to p1
      const hx = relX + vx * tc;
      const hy = relY + vy * tc;
 
      // Project onto the edge to verify contact is within the segment
      const proj = (hx * ex + hy * ey) / len2;
      if (proj < 0 || proj > 1) continue;
 
      if (tc < minT) minT = tc;
    }
 
    return minT === Infinity ? null : minT;
  }
 
  // ─────────────────────────────────────────────
  // SWEPT CIRCLE vs VERTEX (semicircular capsule cap)
  //
  // Finds the earliest time t >= 0 at which the moving
  // circle first touches the point vertex.
  //
  // Approach: |C + t·V − P|² = r²  expands into a
  // quadratic in t.  We return the smaller positive root
  // (first entry into contact).
  // ─────────────────────────────────────────────
  _sweptCircleVsPoint(cx, cy, vx, vy, r, p) {
    const fx = cx - p.x;
    const fy = cy - p.y;
 
    // Quadratic: a·t² + b·t + c = 0
    const a = vx * vx + vy * vy;          // |V|²  (always > 0 here)
    const b = 2 * (fx * vx + fy * vy);    // 2·(F·V)
    const c = fx * fx + fy * fy - r * r;  // |F|² − r²
 
    const disc = b * b - 4 * a * c;
    if (disc < 0) return null; // no real intersection
 
    const sqrtDisc = Math.sqrt(disc);
 
    // Smaller root = first contact
    const t1 = (-b - sqrtDisc) / (2 * a);
    if (t1 >= -1e-6) return Math.max(0, t1);
 
    // Larger root = already inside, use second exit point flipped to entry
    const t2 = (-b + sqrtDisc) / (2 * a);
    if (t2 >= -1e-6) return Math.max(0, t2);
 
    return null;
  }
 
  // ─────────────────────────────────────────────
  // CORE: getCollisionTime
  //
  // Correct swept-circle vs convex polygon.
  // Models the agent as a circle of radius `agent.radius`
  // moving at velocity (agent.dx, agent.dy) px/s.
  //
  // Algorithm (Minkowski sum / capsule decomposition):
  //   For each edge  → _sweptCircleVsSegment  (face hit)
  //   For each vertex→ _sweptCircleVsPoint    (corner hit)
  //
  // Returns the earliest collision time in seconds,
  // or Infinity if no collision.
  // ─────────────────────────────────────────────
  getCollisionTime(agent) {
    const vx = agent.dx;
    const vy = agent.dy;
    if (vx === 0 && vy === 0) return Infinity;
 
    const cx = agent.position.x;
    const cy = agent.position.y;
    const r  = agent.radius;
 
    let minT = Infinity;
 
    // Edge (face) contacts
    for (const edge of this.edges) {
      const t = this._sweptCircleVsSegment(cx, cy, vx, vy, r, edge.p1, edge.p2);
      if (t !== null && t < minT) minT = t;
    }
 
    // Vertex (corner) contacts
    for (const vertex of this.vertices) {
      const t = this._sweptCircleVsPoint(cx, cy, vx, vy, r, vertex);
      if (t !== null && t < minT) minT = t;
    }
 
    return minT; // seconds  (vx/vy are px/s, distances are px, so t = px / (px/s) = s)
  }
 
  // ─────────────────────────────────────────────
  // getCollisionPoint
  // ─────────────────────────────────────────────
  getCollisionPoint(agent) {
    const t = this.getCollisionTime(agent);
    if (t === Infinity) return null;
    return {
      x: agent.position.x + agent.dx * t,
      y: agent.position.y + agent.dy * t,
      time: t
    };
  }
 
  // ─────────────────────────────────────────────
  // isCollidingWith
  // ─────────────────────────────────────────────
  isCollidingWith(agent) {
    const px = agent.position.x;
    const py = agent.position.y;
    for (const edge of this.edges) {
      if (this._pointToSegmentDist(px, py, edge.p1, edge.p2) < agent.radius)
        return true;
    }
    if (this._pointInPolygon(px, py)) return true;
    return false;
  }
 
  // ─────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────
  _pointToSegmentDist(px, py, p1, p2) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return Math.hypot(px - p1.x, py - p1.y);
    let t = ((px - p1.x) * dx + (py - p1.y) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (p1.x + t * dx), py - (p1.y + t * dy));
  }
 
  _pointInPolygon(px, py) {
    let inside = false;
    const v = this.vertices;
    for (let i = 0, j = v.length - 1; i < v.length; j = i++) {
      const xi = v[i].x, yi = v[i].y;
      const xj = v[j].x, yj = v[j].y;
      const intersect = yi > py !== yj > py &&
        px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  }
}
 
// ─────────────────────────────────────────────────────────────────
// ObstacleManager
// ─────────────────────────────────────────────────────────────────
export class ObstacleManager {
  constructor() { this.obstacles = []; }
 
  add(obstacle) { this.obstacles.push(obstacle); }
 
  // Draws all obstacles and logs collisions — no direction change
  update(agents, simTime) {
    for (const obstacle of this.obstacles) {
      obstacle.draw();
      for (const agent of agents) {
        if (obstacle.isCollidingWith(agent)) {
          // Log with 1-second cooldown to prevent log spam
          const t = parseFloat(simTime.toFixed(1));
          const lastLog = agent.collisionLog?.[agent.collisionLog.length - 1];
          const alreadyLogged = lastLog?.with === obstacle.ID && t - lastLog?.time < 1.0;
          if (!alreadyLogged && agent.collisionLog) {
            agent.collisionLog.push({ with: obstacle.ID, time: t });
          }
          // NO resolveCollision call — agent keeps its direction and speed
        }
      }
    }
  }
 
  getPredictedCollisions(agent) {
    const results = [];
    for (const obstacle of this.obstacles) {
      const hit = obstacle.getCollisionPoint(agent);
      if (hit && hit.time < 10) {
        results.push({
          obstacleName: obstacle.ID,
          time: hit.time,
          x: hit.x,
          y: hit.y
        });
      }
    }
    return results.sort((a, b) => a.time - b.time);
  }
}