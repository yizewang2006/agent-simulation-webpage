/**
 * Geometry helpers for adaptive space entity generation.
 * Angle convention: 0° = east, 90° = north (up on screen), CCW positive.
 * Uses canvas coordinates directly (y increases downward).
 */

/*
function positionToAngle(origin, target) {
  const dx = target.x - origin.x;
  const dy = target.y - origin.y;
  let angle;

  if (dy < 0) {
    if (dx < 0) angle = Math.abs((Math.atan(dx / dy) * 180) / Math.PI) + 90;
    else if (dx > 0) angle = Math.abs((Math.atan(dy / dx) * 180) / Math.PI);
    else angle = 90;
  } else if (dy > 0) {
    if (dx < 0) angle = Math.abs((Math.atan(dy / dx) * 180) / Math.PI) + 180;
    else if (dx > 0) angle = Math.abs((Math.atan(dx / dy) * 180) / Math.PI) + 270;
    else angle = 270;
  } else {
    angle = dx > 0 ? 0 : 180;
  }
  return (angle + 360) % 360;
}
*/
function positionToAngle(origin, target) {
  const dx = target.x - origin.x;
  const dy = origin.y - target.y;   // invert canvas y

  let angle = Math.atan2(dy, dx) * 180 / Math.PI;
  if (angle < 0) angle += 360;

  return angle;
}

function angleIncrease(start, end) {
  return (end - start + 360) % 360;
}

function pointAtAngle(origin, angleDeg, distance) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: origin.x + distance * Math.cos(rad),
    y: origin.y - distance * Math.sin(rad),
  };
}

function distanceBetween(a, b) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function circleTangentAngles(origin, center, combinedRadius) {
  const ac = distanceBetween(origin, center);
  if (ac <= combinedRadius + 0.2) {
    const heading = positionToAngle(origin, center);
    return [(heading - 90 + 360) % 360, (heading + 90) % 360];
  }

  const r = combinedRadius;
  const sinAlpha = r / ac;
  const cosAlpha = Math.sqrt(Math.max(0, 1 - sinAlpha * sinAlpha));

  const x1 =
    center.x +
    (r / ac) *
      ((origin.x - center.x) * sinAlpha + (origin.y - center.y) * cosAlpha);
  const y1 =
    center.y +
    (r / ac) *
      ((origin.y - center.y) * sinAlpha - (origin.x - center.x) * cosAlpha);

  const x2 =
    center.x +
    (r / ac) *
      ((origin.x - center.x) * sinAlpha - (origin.y - center.y) * cosAlpha);
  const y2 =
    center.y +
    (r / ac) *
      ((origin.y - center.y) * sinAlpha + (origin.x - center.x) * cosAlpha);

  let start = positionToAngle(origin, { x: x1, y: y1 });
  let end = positionToAngle(origin, { x: x2, y: y2 });

  if (angleIncrease(start, end) > angleIncrease(end, start)) [start, end] = [end, start];
  return [start, end];
}

function rectangleSilhouetteAngles(origin, corners) {
  const angles = [...new Set(corners.map((c) => positionToAngle(origin, c)))].sort(
    (a, b) => a - b
  );
  if (angles.length === 1) {
    const a = angles[0];
    return [(a - 5 + 360) % 360, (a + 5) % 360];
  }

  let maxGap = -1;
  let gapStart = 0;
  for (let i = 0; i < angles.length; i++) {
    const nxt = angles[(i + 1) % angles.length];
    const gap = angleIncrease(angles[i], nxt);
    if (gap > maxGap) {
      maxGap = gap;
      gapStart = angles[i];
    }
  }

  const idx = angles.indexOf(gapStart);
  let occStart = angles[(idx + 1) % angles.length];
  let occEnd = gapStart;
  if (angleIncrease(occStart, occEnd) > 184) [occStart, occEnd] = [occEnd, occStart];
  return [occStart, occEnd];
}

/**
 * Tangent bounds for a rectangle obstacle, accounting for the processing agent's radius.
 * The wall is expanded outward by agentRadius (Minkowski sum) before computing silhouette angles,
 * matching how circle obstacles use combinedRadius = obstacle.radius + agent.radius.
 */
function expandRectangleCorners(corners, agentRadius) {
  const xs = corners.map((c) => c.x);
  const ys = corners.map((c) => c.y);
  const minX = Math.min(...xs) - agentRadius;
  const maxX = Math.max(...xs) + agentRadius;
  const minY = Math.min(...ys) - agentRadius;
  const maxY = Math.max(...ys) + agentRadius;
  return [
    { x: minX, y: minY },
    { x: maxX, y: minY },
    { x: maxX, y: maxY },
    { x: minX, y: maxY },
  ];
}

function pointInExpandedRect(origin, corners) {
  const xs = corners.map((c) => c.x);
  const ys = corners.map((c) => c.y);
  return (
    origin.x >= Math.min(...xs) &&
    origin.x <= Math.max(...xs) &&
    origin.y >= Math.min(...ys) &&
    origin.y <= Math.max(...ys)
  );
}

function rectangleTangentAngles(origin, corners, agentRadius) {
  const expanded = expandRectangleCorners(corners, agentRadius);

  if (pointInExpandedRect(origin, expanded)) {
    const cx = (Math.min(...expanded.map((c) => c.x)) + Math.max(...expanded.map((c) => c.x))) / 2;
    const cy = (Math.min(...expanded.map((c) => c.y)) + Math.max(...expanded.map((c) => c.y))) / 2;
    const heading = positionToAngle(origin, { x: cx, y: cy });
    return [(heading - 90 + 360) % 360, (heading + 90) % 360];
  }

  return rectangleSilhouetteAngles(origin, expanded);
}

function clusterEntitiesByDistance(origin, entities, threshold) {
  const withDist = entities
    .map((e) => ({ entity: e, dist: distanceBetween(origin, e) }))
    .sort((a, b) => a.dist - b.dist);

  const clusters = [];
  for (const { entity, dist } of withDist) {
    let added = false;
    for (const cluster of clusters) {
      if (dist <= cluster.farthest + threshold) {
        cluster.entities.push(entity);
        cluster.farthest = Math.max(cluster.farthest, dist);
        added = true;
        break;
      }
    }
    if (!added) clusters.push({ entities: [entity], farthest: dist });
  }
  return clusters.map((c) => c.entities);
}

/** Split a possibly wrapping wedge into non-wrapping [start, end] pieces on [0, 360]. */
function wedgeToPieces(wedge) {
  if (wedge.start <= wedge.end) return [{ start: wedge.start, end: wedge.end }];
  return [
    { start: wedge.start, end: 360 },
    { start: 0, end: wedge.end },
  ];
}

/** True if two 1D intervals overlap or touch within mergeGap. */
function intervalsOverlapOrTouch(a, b, mergeGap = 0) {
  return a.start <= b.end + mergeGap && b.start <= a.end + mergeGap;
}

/**
 * True if two occupied angular wedges overlap (or touch within mergeGap),
 * including across the 0°/360° seam.
 */
function angularWedgesOverlap(a, b, mergeGap = 0) {
  const piecesA = wedgeToPieces(a);
  const piecesB = wedgeToPieces(b);

  for (const pa of piecesA) {
    for (const pb of piecesB) {
      if (intervalsOverlapOrTouch(pa, pb, mergeGap)) return true;
    }
  }

  // Near-seam touch when neither wedge wraps: e.g. [350, 358] and [1, 20]
  if (mergeGap > 0) {
    const gapAB = (360 - a.end + b.start + 360) % 360;
    const gapBA = (360 - b.end + a.start + 360) % 360;
    if (a.start <= a.end && b.start <= b.end) {
      if (gapAB <= mergeGap || gapBA <= mergeGap) return true;
    }
  }

  return false;
}

/**
 * Cluster items by overlapping occupied wedges (transitive).
 * @param {{ entity: object, wedge: { start, end } }[]} items
 * @param {number} mergeGap treat gaps ≤ this (°) as overlapping
 * @returns {object[][]} clusters of entities
 */
function clusterByOverlappingWedges(items, mergeGap = 0) {
  const n = items.length;
  if (!n) return [];

  const parent = Array.from({ length: n }, (_, i) => i);

  function find(i) {
    while (parent[i] !== i) {
      parent[i] = parent[parent[i]];
      i = parent[i];
    }
    return i;
  }

  function unite(i, j) {
    const ri = find(i);
    const rj = find(j);
    if (ri !== rj) parent[rj] = ri;
  }

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (angularWedgesOverlap(items[i].wedge, items[j].wedge, mergeGap)) {
        unite(i, j);
      }
    }
  }

  const groups = new Map();
  for (let i = 0; i < n; i++) {
    const root = find(i);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root).push(items[i].entity);
  }
  return [...groups.values()];
}

/** Outermost tangent bounds for a cluster — one continuous wedge, no crack between members. */
/*
function envelopeClusterWedges(wedges) {
  if (!wedges.length) return null;
  if (wedges.length === 1) return { start: wedges[0].start, end: wedges[0].end };

  const minStart = Math.min(...wedges.map((w) => w.start));
  const maxEnd = Math.max(...wedges.map((w) => w.end));

  if (angleIncrease(minStart, maxEnd) <= 184) {
    return { start: minStart, end: maxEnd };
  }
  return null;
}
*/
function envelopeClusterWedges(wedges) {
  if (!wedges.length) return null;
  if (wedges.length === 1)
    return { start: wedges[0].start, end: wedges[0].end };

  // unwrap wedges that cross 0°
  let intervals = [];

  wedges.forEach(w => {
    if (w.start <= w.end) {
      intervals.push({
        start: w.start,
        end: w.end
      });
    } else {
      intervals.push({
        start: w.start,
        end: w.end + 360
      });
    }
  });

  // shift intervals near zero if needed
  const min = Math.min(...intervals.map(i => i.start));
  const max = Math.max(...intervals.map(i => i.end));

  if (max - min > 180) {
    intervals = intervals.map(i => {
      if (i.start < 180) {
        return {
          start: i.start + 360,
          end: i.end + 360
        };
      }
      return i;
    });
  }

  const start = Math.min(...intervals.map(i => i.start));
  const end = Math.max(...intervals.map(i => i.end));

  return {
    start: start % 360,
    end: end % 360
  };
}

function normalizeSegment(seg) {
  if (seg.start <= seg.end) return [seg];
  return [
    { ...seg, start: seg.start, end: 359 },
    { ...seg, start: 0, end: seg.end },
  ];
}

/*
function mergeOccupiedSegments(segments, mergeGap = 2) {
  let pieces = [];
  segments.forEach((s) => pieces.push(...normalizeSegment(s)));
  pieces = pieces.filter((s) => s.occupied);
  if (!pieces.length) return [];

  pieces.sort((a, b) => a.start - b.start);
  const merged = [{ ...pieces[0] }];

  for (let i = 1; i < pieces.length; i++) {
    const top = merged[merged.length - 1];
    const seg = pieces[i];
    if (seg.start > top.end + mergeGap) merged.push({ ...seg });
    else if (seg.end > top.end) top.end = seg.end;
  }
  return merged;
}
*/

function mergeOccupiedSegments(segments, mergeGap = 2) {

  let pieces = [];

  segments.forEach(s => {
    pieces.push(...normalizeSegment(s));
  });

  pieces = pieces.filter(s => s.occupied);

  if (!pieces.length)
    return [];

  pieces.sort((a, b) => a.start - b.start);

  const merged = [];

  for (const seg of pieces) {

    if (!merged.length) {
      merged.push({ ...seg });
      continue;
    }

    const top = merged[merged.length - 1];

    if (seg.start <= top.end + mergeGap) {
      top.end = Math.max(top.end, seg.end);
    } else {
      merged.push({ ...seg });
    }
  }

  // NEW:
  // merge across 359° -> 0°
  if (merged.length > 1) {

    const first = merged[0];
    const last = merged[merged.length - 1];

    if ((360 - last.end + first.start) <= mergeGap) {

      first.start = last.start;
      merged.pop();
    }
  }

  return merged;
}

function occupiedToEmpty(occupied) {
  if (!occupied.length) return [{ start: 0, end: 359, occupied: false }];

  const empty = [];
  if (occupied[0].start > 0) empty.push({ start: 0, end: occupied[0].start, occupied: false });

  for (let i = 0; i < occupied.length - 1; i++) {
    empty.push({ start: occupied[i].end, end: occupied[i + 1].start, occupied: false });
  }

  if (occupied[occupied.length - 1].end < 359) {
    empty.push({ start: occupied[occupied.length - 1].end, end: 359, occupied: false });
  }

  return empty.filter((e) => e.start !== e.end);
}

function keyHeadingsFromOccupied(occupiedSegments) {
  /** Key headings = tangent boundaries where occupied meets empty (not 0°/359° seam artifacts). */
  const set = new Set();
  occupiedSegments.forEach((s) => {
    set.add(s.start);
    set.add(s.end);
  });
  return [...set].sort((a, b) => a - b);
}

function keyHeadingsFromEmpty(emptySegments) {
  const set = new Set();
  emptySegments.forEach((s) => {
    set.add(s.start);
    set.add(s.end);
  });
  return [...set].sort((a, b) => a - b);
}

function angleInOccupiedSegment(angle, seg) {
  const a = ((angle % 360) + 360) % 360;
  if (seg.start <= seg.end) return a >= seg.start && a <= seg.end;
  return a >= seg.start || a <= seg.end;
}

function angleInOccupied(angle, occupiedSegments) {
  return occupiedSegments.some((seg) => angleInOccupiedSegment(angle, seg));
}

/**
 * Midpoint of the CCW arc from startDeg to endDeg (endDeg may be start+span, possibly > 360).
 * Used to test whether the interval between consecutive key headings is occupied or free.
 */
function arcMidpoint(startDeg, endDeg) {
  const span = endDeg - startDeg;
  return ((startDeg + span / 2) % 360 + 360) % 360;
}

/**
 * Figure 1d — gap-fill only in free-space intervals.
 * Between consecutive key headings:
 *   - if the arc is occupied: keep boundaries only (no intermediates)
 *   - if the arc is empty: insert headings every `interval` from start toward end
 */
function fillHeadingGaps(keyHeadings, occupiedSegments, interval = 15) {
  if (!occupiedSegments) occupiedSegments = [];

  if (!keyHeadings.length) {
    // Entire FOV free — sample all around
    if (!occupiedSegments.length) {
      const filled = [];
      for (let h = 0; h < 360 - 1e-9; h += interval) filled.push(h);
      return filled;
    }
    return [];
  }

  const headings = [...new Set(keyHeadings)].sort((a, b) => a - b);
  const filled = [];

  for (let i = 0; i < headings.length; i++) {
    const start = headings[i];
    const end =
      headings[(i + 1) % headings.length] +
      (i === headings.length - 1 ? 360 : 0);

    filled.push(start);

    const mid = arcMidpoint(start, end);
    const occupied = angleInOccupied(mid, occupiedSegments);

    // Occupied interval: boundaries only — next key is added on the following iteration
    if (occupied) continue;

    // Free-space interval: step every headingInterval until the next key
    let current = start;
    while (current + interval < end - 1e-9) {
      current += interval;
      filled.push(current % 360);
    }
  }

  return [...new Set(filled)]
    .map((h) => ((h % 360) + 360) % 360)
    .sort((a, b) => a - b);
}

window.Geo = {
  positionToAngle,
  pointAtAngle,
  distanceBetween,
  circleTangentAngles,
  rectangleTangentAngles,
  expandRectangleCorners,
  clusterEntitiesByDistance,
  angularWedgesOverlap,
  clusterByOverlappingWedges,
  envelopeClusterWedges,
  mergeOccupiedSegments,
  occupiedToEmpty,
  keyHeadingsFromOccupied,
  keyHeadingsFromEmpty,
  angleInOccupied,
  fillHeadingGaps,
  angleIncrease,
};
