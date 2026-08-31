/**
 * Interactive canvas — drag agents/obstacles and see adaptive space entities update live.
 */

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const statsEl = document.getElementById("stats");
const sceneEditorEl = document.getElementById("sceneEditor");

const COLORS = {
  agentFill: "#3b82f6",
  agentStroke: "#1d4ed8",
  processingFill: "#ef4444",
  processingStroke: "#b91c1c",
  circleObsFill: "#1e293b",
  circleObsStroke: "#0f172a",
  wallFill: "#cbd5e1",
  wallStroke: "#16a34a",
  fov: "#64748b",
  fovFill: "rgba(100, 116, 139, 0.04)",
  segments: {
    agent: ["rgba(59, 130, 246, 0.45)", "#2563eb"],
    obstacle: ["rgba(239, 68, 68, 0.45)", "#dc2626"],
    wall: ["rgba(34, 197, 94, 0.45)", "#16a34a"],
  },
  keyHeading: "rgba(100, 116, 139, 0.55)",
  spaceArrow: "#ea580c",
  spaceKey: "#c2410c",
  grid: "#e8d585"
};

const display = {
  showSegments: true,
  showKeyHeadings: true,
  showSpaceEntities: true,
  showLabels: true,
};

let world = null;
let drag = null;
let algoResult = null;
let selectedSpaceIndex = null;

function cloneScenario(scenario) {
  return JSON.parse(JSON.stringify(scenario));
}

function initWorld(scenario) {
  const s = cloneScenario(scenario);
  world = {
    origin: { ...s.agent },
    agents: (s.neighbors.agents || []).map((a) => ({ ...a })),
    circles: (s.neighbors.circle_obstacles || []).map((o) => ({ ...o })),
    walls: (s.neighbors.rectangle_walls || []).map((w) => ({ ...w })),
    fovDistance: s.fov_distance || 120,
    headingInterval: s.heading_interval || 15,
    mergeGap: s.merge_gap || 2,
  };
}

function num(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function nextId(prefix, list) {
  const ids = new Set(list.map((e) => e.id));
  let i = 1;
  while (ids.has(`${prefix}${i}`)) i += 1;
  return `${prefix}${i}`;
}

function clampEntityBounds(entity, type) {
  if (type === "agent" || type === "circle") {
    const r = Math.max(2, num(entity.radius, 5));
    entity.radius = r;
    entity.x = clamp(num(entity.x, 0), r, canvas.width - r);
    entity.y = clamp(num(entity.y, 0), r, canvas.height - r);
    return;
  }

  if (type === "wall") {
    entity.width = Math.max(8, num(entity.width, 50));
    entity.height = Math.max(8, num(entity.height, 12));
    entity.x = clamp(num(entity.x, 0), 0, canvas.width - entity.width);
    entity.y = clamp(num(entity.y, 0), 0, canvas.height - entity.height);
  }
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function rowMarkup(type, entity, index) {
  const base = `data-type="${type}" data-index="${index}"`;
  const id = escapeHtml(entity.id);

  if (type === "wall") {
    return `
      <div class="scene-card scene-card--wall">
        <div class="scene-card-top">
          <input class="scene-name" ${base} data-field="id" value="${id}" aria-label="Name" />
          <button class="scene-del" ${base} data-action="delete" type="button">Delete</button>
        </div>
        <div class="scene-card-fields">
          <div class="scene-field">
            <span class="scene-label">Position</span>
            <div class="scene-pair">
              <label class="scene-sublabel">x<input ${base} data-field="x" type="number" value="${Math.round(entity.x)}" /></label>
              <label class="scene-sublabel">y<input ${base} data-field="y" type="number" value="${Math.round(entity.y)}" /></label>
            </div>
          </div>
          <div class="scene-field">
            <span class="scene-label">Size</span>
            <div class="scene-pair">
              <label class="scene-sublabel">w<input ${base} data-field="width" type="number" value="${Math.round(entity.width)}" /></label>
              <label class="scene-sublabel">h<input ${base} data-field="height" type="number" value="${Math.round(entity.height)}" /></label>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  const colorClass = type === "agent" ? "agent" : "obstacle";
  const radius = entity.radius || 5;
  return `
    <div class="scene-card scene-card--${colorClass}">
      <div class="scene-card-top">
        <input class="scene-name" ${base} data-field="id" value="${id}" aria-label="Name" />
        <button class="scene-del" ${base} data-action="delete" type="button">Delete</button>
      </div>
      <div class="scene-card-fields">
        <div class="scene-field">
          <span class="scene-label">Position</span>
          <div class="scene-pair">
            <label class="scene-sublabel">x<input ${base} data-field="x" type="number" value="${Math.round(entity.x)}" /></label>
            <label class="scene-sublabel">y<input ${base} data-field="y" type="number" value="${Math.round(entity.y)}" /></label>
          </div>
        </div>
        <div class="scene-field scene-field--size">
          <span class="scene-label">Size</span>
          <label class="scene-sublabel">r<input ${base} data-field="radius" type="number" value="${Math.round(radius)}" /></label>
        </div>
      </div>
    </div>
  `;
}

const SCENE_GROUP_META = {
  agent: { title: "Agents", swatch: "agent", hint: "A1, A2…" },
  circle: { title: "Obstacles", swatch: "obstacle", hint: "O1, O2…" },
  wall: { title: "Walls", swatch: "wall", hint: "W1, W2…" },
};

function groupMarkup(type, list) {
  const meta = SCENE_GROUP_META[type];
  const rows = list.length
    ? list.map((e, i) => rowMarkup(type, e, i)).join("")
    : `<div class="scene-empty">No ${meta.title.toLowerCase()} yet.</div>`;
  return `
    <div class="scene-group scene-group--${meta.swatch}">
      <div class="scene-group-head">
        <div class="scene-group-title">
          <span class="scene-swatch ${meta.swatch}"></span>
          ${meta.title}
          <span class="scene-group-hint">${meta.hint}</span>
        </div>
        <button class="scene-add" data-action="add" data-type="${type}" type="button">Add</button>
      </div>
      <div class="scene-list">${rows}</div>
    </div>
  `;
}

function renderSceneEditor() {
  sceneEditorEl.innerHTML = [
    groupMarkup("agent", world.agents),
    groupMarkup("circle", world.circles),
    groupMarkup("wall", world.walls),
  ].join("");
}

function addSceneEntity(type) {
  if (type === "agent") {
    const id = nextId("A", world.agents);
    world.agents.push({ id, x: world.origin.x + 40, y: world.origin.y, radius: 5 });
  } else if (type === "circle") {
    const id = nextId("O", world.circles);
    world.circles.push({ id, x: world.origin.x - 70, y: world.origin.y - 60, radius: 18 });
  } else if (type === "wall") {
    const id = nextId("W", world.walls);
    world.walls.push({ id, x: world.origin.x - 90, y: world.origin.y + 90, width: 90, height: 12 });
  }
  renderSceneEditor();
  refresh();
}

function deleteSceneEntity(type, index) {
  if (type === "agent") world.agents.splice(index, 1);
  else if (type === "circle") world.circles.splice(index, 1);
  else if (type === "wall") world.walls.splice(index, 1);
  renderSceneEditor();
  refresh();
}

function bindSceneEditor() {
  sceneEditorEl.addEventListener("click", (evt) => {
    const target = evt.target;
    if (!(target instanceof HTMLElement)) return;
    const action = target.dataset.action;
    if (!action) return;

    if (action === "add") {
      addSceneEntity(target.dataset.type);
      return;
    }

    if (action === "delete") {
      const index = Number(target.dataset.index);
      const type = target.dataset.type;
      if (!Number.isNaN(index) && type) deleteSceneEntity(type, index);
    }
  });

  sceneEditorEl.addEventListener("input", (evt) => {
    const target = evt.target;
    if (!(target instanceof HTMLInputElement)) return;
    const type = target.dataset.type;
    const index = Number(target.dataset.index);
    const field = target.dataset.field;
    if (!type || Number.isNaN(index) || !field) return;

    const list =
      type === "agent" ? world.agents :
      type === "circle" ? world.circles :
      world.walls;

    const entity = list[index];
    if (!entity) return;

    if (field === "id") {
      entity.id = target.value.trim() || entity.id;
      refresh();
      return;
    }

    entity[field] = num(target.value, entity[field] ?? 0);
    clampEntityBounds(entity, type);
    refresh();
  });
}

function recompute() {
  algoResult = Algorithm.generateSpaceEntities(world);
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function dist(x1, y1, x2, y2) {
  return Math.hypot(x2 - x1, y2 - y1);
}

function hitCircle(px, py, cx, cy, r, pad = 6) {
  return dist(px, py, cx, cy) <= r + pad;
}

function hitRect(px, py, wall) {
  return (
    px >= wall.x &&
    px <= wall.x + wall.width &&
    py >= wall.y &&
    py <= wall.y + wall.height
  );
}

function pickEntity(px, py) {
  const { origin, agents, circles, walls } = world;

  if (hitCircle(px, py, origin.x, origin.y, origin.radius, 8)) {
    return { type: "origin", target: origin };
  }

  for (let i = agents.length - 1; i >= 0; i--) {
    const a = agents[i];
    if (hitCircle(px, py, a.x, a.y, a.radius || 5)) {
      return { type: "agent", target: a, index: i };
    }
  }

  for (let i = circles.length - 1; i >= 0; i--) {
    const o = circles[i];
    if (hitCircle(px, py, o.x, o.y, o.radius)) {
      return { type: "circle", target: o, index: i };
    }
  }

  for (let i = walls.length - 1; i >= 0; i--) {
    const w = walls[i];
    if (hitRect(px, py, w)) {
      return { type: "wall", target: w, index: i };
    }
  }

  return null;
}

function pickSpaceEntity(px, py) {
  if (!display.showSpaceEntities || !algoResult) return null;

  const { origin, fovDistance } = world;
  const { spaceEntities } = algoResult;

  for (let i = spaceEntities.length - 1; i >= 0; i--) {
    const s = spaceEntities[i];
    const tip = Geo.pointAtAngle(origin, s.heading, fovDistance);
    const hitR = s.isKey ? 12 : 9;

    if (hitCircle(px, py, tip.x, tip.y, hitR, 0)) {
      return { index: i, entity: s };
    }

    if (display.showLabels) {
      const labelPt = headingToCanvasPoint(origin, s.heading, fovDistance + 14);
      if (hitCircle(px, py, labelPt.x, labelPt.y, 12, 0)) {
        return { index: i, entity: s };
      }
    }
  }

  return null;
}

function canvasPoint(evt) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (evt.clientX - rect.left) * scaleX,
    y: (evt.clientY - rect.top) * scaleY,
  };
}

function drawGrid() {
  ctx.strokeStyle = COLORS.grid;
  ctx.lineWidth = 1;
  for (let x = 0; x <= canvas.width; x += 50) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y <= canvas.height; y += 50) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
}

function drawArcSegment(origin, radius, startDeg, endDeg, fill, stroke) {
  const startRad = (-startDeg * Math.PI) / 180;
  const endRad = (-endDeg * Math.PI) / 180;
  ctx.beginPath();
  ctx.moveTo(origin.x, origin.y);
  ctx.arc(origin.x, origin.y, radius, startRad, endRad, true);
  ctx.closePath();
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

function headingToCanvasPoint(origin, heading, length) {
  return Geo.pointAtAngle(origin, heading, length);
}

function drawRay(origin, heading, length, color, dashed, lineWidth = 1) {
  const end = headingToCanvasPoint(origin, heading, length);
  ctx.beginPath();
  ctx.setLineDash(dashed ? [5, 5] : []);
  ctx.moveTo(origin.x, origin.y);
  ctx.lineTo(end.x, end.y);
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
  ctx.setLineDash([]);
  return end;
}

function drawArrow(origin, heading, length, color, lineWidth = 2) {
  const end = headingToCanvasPoint(origin, heading, length);
  const dx = end.x - origin.x;
  const dy = end.y - origin.y;
  const angle = Math.atan2(dy, dx);
  const headLen = 10;
  const headAngle = Math.PI / 7;

  ctx.beginPath();
  ctx.moveTo(origin.x, origin.y);
  ctx.lineTo(end.x, end.y);
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(end.x, end.y);
  ctx.lineTo(
    end.x - headLen * Math.cos(angle - headAngle),
    end.y - headLen * Math.sin(angle - headAngle)
  );
  ctx.lineTo(
    end.x - headLen * Math.cos(angle + headAngle),
    end.y - headLen * Math.sin(angle + headAngle)
  );
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();

  return end;
}

function drawCircleEntity(x, y, r, fill, stroke, label, highlight) {
  if (highlight) {
    ctx.beginPath();
    ctx.arc(x, y, r + 6, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(234, 88, 12, 0.6)";
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 3]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 2;
  ctx.stroke();

  if (label && display.showLabels) {
    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 11px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, x, y);
  }
}

function drawWall(wall, origin, agentRadius, highlight) {
  // Expanded boundary (wall + agent radius) — tangents aim at this, not the raw wall edge
  if (display.showSegments && origin) {
    const corners = [
      { x: wall.x, y: wall.y },
      { x: wall.x + wall.width, y: wall.y },
      { x: wall.x + wall.width, y: wall.y + wall.height },
      { x: wall.x, y: wall.y + wall.height },
    ];
    const expanded = Geo.expandRectangleCorners(corners, agentRadius);
    const pts = expanded;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.closePath();
    ctx.strokeStyle = "rgba(34, 197, 94, 0.45)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  if (highlight) {
    ctx.strokeStyle = "rgba(234, 88, 12, 0.7)";
    ctx.lineWidth = 3;
    ctx.setLineDash([4, 3]);
    ctx.strokeRect(wall.x - 2, wall.y - 2, wall.width + 4, wall.height + 4);
    ctx.setLineDash([]);
  }

  ctx.fillStyle = COLORS.wallFill;
  ctx.strokeStyle = COLORS.wallStroke;
  ctx.lineWidth = 2;
  ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
  ctx.strokeRect(wall.x, wall.y, wall.width, wall.height);

  if (display.showLabels) {
    ctx.fillStyle = "#14532d";
    ctx.font = "bold 11px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(wall.id, wall.x + wall.width / 2, wall.y + wall.height / 2);
  }
}

function render() {
  const { origin, agents, circles, walls, fovDistance } = world;
  const { occupiedByCat, outerKeyHeadings, spaceEntities } = algoResult;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGrid();

  // FOV circle fill + outline
  ctx.beginPath();
  ctx.arc(origin.x, origin.y, fovDistance, 0, Math.PI * 2);
  ctx.fillStyle = COLORS.fovFill;
  ctx.fill();
  ctx.strokeStyle = COLORS.fov;
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 4]);
  ctx.stroke();
  ctx.setLineDash([]);

  // Occupied segments (Figure 1b)
  if (display.showSegments) {
    for (const [cat, segments] of Object.entries(occupiedByCat)) {
      const [fill, stroke] = COLORS.segments[cat];
      segments.forEach((seg) =>
        drawArcSegment(origin, fovDistance, seg.start, seg.end, fill, stroke)
      );
    }
  }

  // Outer occupied boundary rays (Figure 1c — dashed)
  if (display.showKeyHeadings) {
    outerKeyHeadings.forEach((h) =>
      drawRay(origin, h, fovDistance, COLORS.keyHeading, true, 1)
    );
  }

  // Static entities (walls behind agents visually — draw walls first)
  walls.forEach((w) =>
    drawWall(w, origin, origin.radius, drag && drag.type === "wall" && drag.target === w)
  );

  circles.forEach((o) =>
    drawCircleEntity(
      o.x,
      o.y,
      o.radius,
      COLORS.circleObsFill,
      COLORS.circleObsStroke,
      o.id,
      drag && drag.type === "circle" && drag.target === o
    )
  );

  agents.forEach((a) =>
    drawCircleEntity(
      a.x,
      a.y,
      a.radius || 5,
      COLORS.agentFill,
      COLORS.agentStroke,
      a.id,
      drag && drag.type === "agent" && drag.target === a
    )
  );

  // Space entity arrows on FOV (Figure 1e)
  if (display.showSpaceEntities) {
    spaceEntities.forEach((s, i) => {
      const selected = i === selectedSpaceIndex;
      const color = s.isKey ? COLORS.spaceKey : COLORS.spaceArrow;
      const tip = drawArrow(
        origin,
        s.heading,
        fovDistance,
        color,
        selected ? 3 : s.isKey ? 2.5 : 1.5
      );

      if (selected) {
        ctx.beginPath();
        ctx.arc(tip.x, tip.y, s.isKey ? 11 : 9, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(234, 88, 12, 0.85)";
        ctx.lineWidth = 2.5;
        ctx.setLineDash([3, 3]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Tick on FOV boundary
      ctx.beginPath();
      ctx.arc(tip.x, tip.y, selected ? (s.isKey ? 6 : 5) : s.isKey ? 5 : 3.5, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      if (display.showLabels) {
        const labelPt = headingToCanvasPoint(origin, s.heading, fovDistance + 14);
        ctx.font = `${s.isKey || selected ? "bold " : ""}10px ui-monospace, monospace`;
        if (selected) {
          const pad = 3;
          const w = ctx.measureText(s.label).width + pad * 2;
          ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
          ctx.fillRect(labelPt.x - w / 2, labelPt.y - 7, w, 14);
          ctx.strokeStyle = "rgba(234, 88, 12, 0.85)";
          ctx.lineWidth = 1.5;
          ctx.strokeRect(labelPt.x - w / 2, labelPt.y - 7, w, 14);
        }
        ctx.fillStyle = color;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(s.label, labelPt.x, labelPt.y);
      }
    });
  }

  // Processing agent A on top
  drawCircleEntity(
    origin.x,
    origin.y,
    origin.radius,
    COLORS.processingFill,
    COLORS.processingStroke,
    origin.id,
    drag && drag.type === "origin"
  );

  // Heading indicator (small line showing agent facing — 0° = east)
  const faceEnd = headingToCanvasPoint(origin, 0, origin.radius + 12);
  ctx.beginPath();
  ctx.moveTo(origin.x, origin.y);
  ctx.lineTo(faceEnd.x, faceEnd.y);
  ctx.strokeStyle = COLORS.processingStroke;
  ctx.lineWidth = 2;
  ctx.stroke();

  updateStats();
}

function formatCoord(n) {
  return (Math.round(n * 10) / 10).toFixed(1);
}

function renderSelectedSpaceEntityTable(spaceEntity) {
  if (!spaceEntity) return "";

  const role = spaceEntity.isKey ? "occupied boundary" : "gap-fill";
  return `<table class="stats-table stats-table--selected"><thead><tr><th>Label</th><th>Type</th><th>X</th><th>Y</th><th>Heading</th></tr></thead><tbody><tr><td>${spaceEntity.label}</td><td>${role}</td><td>${formatCoord(spaceEntity.x)}</td><td>${formatCoord(spaceEntity.y)}</td><td>${formatCoord(spaceEntity.heading)}&deg;</td></tr></tbody></table>`;
}

function updateStats() {
  const { occupiedWedges, spaceEntities } = algoResult;
  const rows = occupiedWedges.length
    ? occupiedWedges
        .map(
          (w) =>
            `<tr><td>${w.id}</td><td>${formatCoord(w.start)}&deg;</td><td>${formatCoord(w.end)}&deg;</td><td>(${formatCoord(w.startPoint.x)}, ${formatCoord(w.startPoint.y)})</td><td>(${formatCoord(w.endPoint.x)}, ${formatCoord(w.endPoint.y)})</td></tr>`
        )
        .join("")
    : `<tr><td colspan="5" class="stats-empty">No occupied wedges</td></tr>`;

  const selected =
    selectedSpaceIndex != null ? spaceEntities[selectedSpaceIndex] : null;

  statsEl.innerHTML =
    `<table class="stats-table"><thead><tr><th>ID</th><th>Start</th><th>End</th><th>Start Point</th><th>End Point</th></tr></thead><tbody>${rows}</tbody></table>` +
    renderSelectedSpaceEntityTable(selected) +
    `<p class="stats-summary">Space entities: <strong>${spaceEntities.length}</strong></p>`;
}

function refresh() {
  recompute();
  render();
}

function onPointerDown(evt) {
  evt.preventDefault();
  const pt = canvasPoint(evt);

  const spacePick = pickSpaceEntity(pt.x, pt.y);
  if (spacePick) {
    canvas.setPointerCapture(evt.pointerId);
    selectedSpaceIndex = spacePick.index;
    drag = { type: "spaceSelect" };
    render();
    return;
  }

  selectedSpaceIndex = null;
  const picked = pickEntity(pt.x, pt.y);
  if (!picked) {
    render();
    return;
  }

  canvas.setPointerCapture(evt.pointerId);
  canvas.classList.add("dragging");
  drag = {
    ...picked,
    offsetX: pt.x - picked.target.x,
    offsetY: pt.y - picked.target.y,
  };

  if (picked.type === "wall") {
    drag.offsetX = pt.x - picked.target.x;
    drag.offsetY = pt.y - picked.target.y;
  }
}

function onPointerMove(evt) {
  const pt = canvasPoint(evt);

  if (!drag) {
    const overSpace = display.showSpaceEntities && pickSpaceEntity(pt.x, pt.y);
    canvas.style.cursor = overSpace ? "pointer" : "grab";
    return;
  }

  if (drag.type === "spaceSelect") return;

  evt.preventDefault();

  if (drag.type === "wall") {
    drag.target.x = clamp(pt.x - drag.offsetX, 0, canvas.width - drag.target.width);
    drag.target.y = clamp(pt.y - drag.offsetY, 0, canvas.height - drag.target.height);
  } else {
    drag.target.x = clamp(pt.x - drag.offsetX, 10, canvas.width - 10);
    drag.target.y = clamp(pt.y - drag.offsetY, 10, canvas.height - 10);
  }

  refresh();
}

function onPointerUp(evt) {
  if (!drag) return;
  if (drag.type === "spaceSelect") {
    drag = null;
    try {
      canvas.releasePointerCapture(evt.pointerId);
    } catch (_) {
      /* ignore */
    }
    return;
  }
  canvas.classList.remove("dragging");
  drag = null;
  renderSceneEditor();
  try {
    canvas.releasePointerCapture(evt.pointerId);
  } catch (_) {
    /* ignore */
  }
}

function bindControls() {
  const fovSlider = document.getElementById("fovSlider");
  const fovValue = document.getElementById("fovValue");
  const intervalSlider = document.getElementById("intervalSlider");
  const intervalValue = document.getElementById("intervalValue");

  fovSlider.value = world.fovDistance;
  fovValue.textContent = world.fovDistance;
  intervalSlider.value = world.headingInterval;
  intervalValue.textContent = world.headingInterval;

  fovSlider.addEventListener("input", () => {
    world.fovDistance = Number(fovSlider.value);
    fovValue.textContent = world.fovDistance;
    refresh();
  });

  intervalSlider.addEventListener("input", () => {
    world.headingInterval = Number(intervalSlider.value);
    intervalValue.textContent = world.headingInterval;
    refresh();
  });

  document.getElementById("showSegments").addEventListener("change", (e) => {
    display.showSegments = e.target.checked;
    render();
  });
  document.getElementById("showKeyHeadings").addEventListener("change", (e) => {
    display.showKeyHeadings = e.target.checked;
    render();
  });
  document.getElementById("showSpaceEntities").addEventListener("change", (e) => {
    display.showSpaceEntities = e.target.checked;
    render();
  });
  document.getElementById("showLabels").addEventListener("change", (e) => {
    display.showLabels = e.target.checked;
    render();
  });

  document.getElementById("reset").addEventListener("click", () => {
    selectedSpaceIndex = null;
    initWorld(window.DEFAULT_SCENARIO);
    fovSlider.value = world.fovDistance;
    fovValue.textContent = world.fovDistance;
    intervalSlider.value = world.headingInterval;
    intervalValue.textContent = world.headingInterval;
    renderSceneEditor();
    refresh();
  });
}

function init() {
  initWorld(window.DEFAULT_SCENARIO);
  bindSceneEditor();
  bindControls();
  renderSceneEditor();
  refresh();

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerUp);
}

init();
