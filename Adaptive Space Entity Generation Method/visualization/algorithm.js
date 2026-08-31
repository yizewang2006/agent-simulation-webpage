/**
 * Adaptive space entity generation — Section 3.2 pipeline.
 * Per-category clustering by overlapping wedges → envelope → key headings → gap-fill.
 */

function agentTangentWedge(origin, agent) {
  const [start, end] = Geo.circleTangentAngles(
    origin,
    agent,
    agent.radius + origin.radius
  );
  return { start, end };
}

function circleTangentWedge(origin, obs) {
  const [start, end] = Geo.circleTangentAngles(
    origin,
    obs,
    obs.radius + origin.radius
  );
  return { start, end };
}

function wallTangentWedge(origin, wall) {
  const corners = [
    { x: wall.x, y: wall.y },
    { x: wall.x + wall.width, y: wall.y },
    { x: wall.x + wall.width, y: wall.y + wall.height },
    { x: wall.x, y: wall.y + wall.height },
  ];
  const [start, end] = Geo.rectangleTangentAngles(origin, corners, origin.radius);
  return { start, end };
}

/**
 * Compute each entity's occupied wedge, cluster by wedge overlap, then one
 * envelope wedge per cluster (outermost left/right tangents).
 */
function occupiedFromClusters(origin, entities, wedgeFn, category, mergeGap) {
  if (!entities.length) return [];

  const items = entities.map((entity) => ({
    entity,
    wedge: wedgeFn(origin, entity),
  }));

  const clusters = Geo.clusterByOverlappingWedges(items, mergeGap);
  const segments = [];

  for (const cluster of clusters) {
    const wedges = cluster.map((entity) => wedgeFn(origin, entity));
    const envelope = Geo.envelopeClusterWedges(wedges);
    if (envelope) {
      segments.push({ ...envelope, category, occupied: true });
    } else {
      wedges.forEach((w) =>
        segments.push({ ...w, category, occupied: true })
      );
    }
  }

  return segments;
}

function occupiedForAgents(origin, agents, mergeGap) {
  const neighbors = agents.filter((a) => a.id !== origin.id);
  return occupiedFromClusters(
    origin,
    neighbors,
    agentTangentWedge,
    "agent",
    mergeGap
  );
}

function occupiedForCircles(origin, circles, mergeGap) {
  return occupiedFromClusters(
    origin,
    circles,
    circleTangentWedge,
    "obstacle",
    mergeGap
  );
}

function occupiedForWalls(origin, walls, mergeGap) {
  return occupiedFromClusters(
    origin,
    walls,
    wallTangentWedge,
    "wall",
    mergeGap
  );
}

function categoryKeyHeadings(origin, agents, circles, walls, mergeGap) {
  const occupiedByCat = {
    agent: occupiedForAgents(origin, agents, mergeGap),
    obstacle: occupiedForCircles(origin, circles, mergeGap),
    wall: occupiedForWalls(origin, walls, mergeGap),
  };

  // Key headings = left/right boundaries of each cluster envelope (per category)
  const keyByCat = {};
  for (const [name, occupied] of Object.entries(occupiedByCat)) {
    keyByCat[name] = Geo.keyHeadingsFromOccupied(occupied);
  }

  return { keyByCat, occupiedByCat };
}

/** Sidebar helper: union of category envelopes with FOV edge positions. */
function unionOccupiedWedges(origin, occupiedByCat, mergeGap, fovDistance) {
  const allOccupied = [
    ...occupiedByCat.agent,
    ...occupiedByCat.obstacle,
    ...occupiedByCat.wall,
  ];
  const occupiedUnion = Geo.mergeOccupiedSegments(allOccupied, mergeGap);

  const occupiedWedges = occupiedUnion.map((seg, i) => {
    const startPoint = Geo.pointAtAngle(origin, seg.start, fovDistance);
    const endPoint = Geo.pointAtAngle(origin, seg.end, fovDistance);
    return {
      id: `w${i + 1}`,
      start: seg.start,
      end: seg.end,
      startPoint,
      endPoint,
    };
  });

  return { occupiedUnion, occupiedWedges };
}

function generateSpaceEntities(world) {
  const {
    origin,
    agents,
    circles,
    walls,
    fovDistance,
    headingInterval,
    mergeGap,
  } = world;

  const { keyByCat, occupiedByCat } = categoryKeyHeadings(
    origin,
    agents,
    circles,
    walls,
    mergeGap
  );

  // Merge all category envelopes → final occupied angular intervals
  const { occupiedUnion, occupiedWedges } = unionOccupiedWedges(
    origin,
    occupiedByCat,
    mergeGap,
    fovDistance
  );

  // Figure 1c: key headings = left/right edges of each merged occupied wedge
  const combined = Geo.keyHeadingsFromOccupied(occupiedUnion);

  // Figure 1d: gap-fill only inside empty (free-space) intervals — never inside occupied
  const finalHeadings = Geo.fillHeadingGaps(
    combined,
    occupiedUnion,
    headingInterval
  );

  const isKeyHeading = (heading) =>
    combined.some((k) => {
      const d = Math.abs(heading - k) % 360;
      return Math.min(d, 360 - d) < 1e-4;
    });

  // Figure 1e: space entities = candidate free-space directions on the FOV
  const spaceEntities = finalHeadings.map((heading, i) => {
    const pos = Geo.pointAtAngle(origin, heading, fovDistance);
    return {
      index: i + 1,
      label: `s${i + 1}`,
      heading,
      x: pos.x,
      y: pos.y,
      isKey: isKeyHeading(heading),
    };
  });

  return {
    keyByCat,
    occupiedByCat,
    occupiedUnion,
    occupiedWedges,
    combined,
    outerKeyHeadings: combined,
    finalHeadings,
    spaceEntities,
  };
}

window.Algorithm = { generateSpaceEntities };
