import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Circle, CircleX, Download, FileUp, Flag, MousePointer2, Plus, RefreshCw, Square, SquareArrowOutUpRight, Trash2, Users } from 'lucide-react';
import Header from '../components/shared/Header.jsx';
import Footer from '../components/shared/Footer.jsx';
import AlertBox from '../components/simulation/AlertBox.jsx';
import { configureHighDpiCanvas, getCanvasPointFromEvent, parseNumberOrDefault } from '../utils/utilities.js';
import { loadScenarioFile } from '../utils/scenarioLoader.js';
import { ENTITY_LABELS, ENTITY_TYPES, OBSTACLE_SHAPE_LABELS, OBSTACLE_SHAPE_TYPES } from '../utils/constants.js';
import '../styles/simulation.css';

const CANVAS_WIDTH = 500;
const CANVAS_HEIGHT = 500;
const DEFAULT_AGENT_RADIUS = 5;
const ENTITY_ICONS = {
  [ENTITY_TYPES.AGENT]: Users,
  [ENTITY_TYPES.OBSTACLE]: Square,
  [ENTITY_TYPES.LEADER]: Flag,
  [ENTITY_TYPES.EXIT]: Flag,
};
const DEFAULT_POLYGON_VERTICES = [
  { x: '180', y: '220' },
  { x: '320', y: '220' },
  { x: '320', y: '260' },
  { x: '180', y: '260' },
];

// Entity factory helpers:
// Create plain serializable objects for the Scenario Builder canvas. These are
// not the runtime Agent/Obstacle classes used by Simulation.jsx.
function createId(prefix, count) {
  return `${prefix}_${count + 1}`;
}

// Stable key used by undo/redo. User-facing names can change, so history should
// not depend on ids like "Agent_1".
function createScenarioEntityKey(prefix) {
  if (globalThis.crypto?.randomUUID) {
    return `${prefix}_${globalThis.crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function getScenarioEntityKey(entity) {
  return entity._scenarioBuilderKey ?? entity.id;
}

function removeScenarioBuilderKey(entity) {
  const { _scenarioBuilderKey, ...serializableEntity } = entity;
  return serializableEntity;
}

function cloneScenarioEntity(entity) {
  return globalThis.structuredClone
    ? globalThis.structuredClone(entity)
    : JSON.parse(JSON.stringify(entity));
}

function areScenarioEntitiesEqual(firstEntity, secondEntity) {
  return JSON.stringify(firstEntity) === JSON.stringify(secondEntity);
}

function getSelectedEntityLabel(entity) {
  if (!entity) return '';
  if (entity.kind === 'agent') return ENTITY_LABELS[ENTITY_TYPES.AGENT];
  if (entity.kind === 'obstacle') return ENTITY_LABELS[ENTITY_TYPES.OBSTACLE];
  return entity.kind;
}

function createAgent(count, config = {}) {
  return {
    _scenarioBuilderKey: createScenarioEntityKey('agent'),
    kind: 'agent',
    id: createId('Agent', count),
    x: config.x ?? 250,
    y: config.y ?? 250,
    radius: DEFAULT_AGENT_RADIUS,
    angle: config.angle ?? 0,
    speed: config.speed ?? 1.5,
    colorHex: config.colorHex ?? '#000000',
    fovRadius: 100,
    fovAngle: 150,
    showFOV: config.showFOV ?? true,
  };
}

function createCircleObstacle(count, config = {}) {
  return {
    _scenarioBuilderKey: createScenarioEntityKey('obstacle'),
    kind: 'obstacle',
    shapeType: 'circle',
    id: config.id || createId('Circle_Obstacle', count),
    color: config.color ?? '#ACAD9D',
    center: config.center ?? { x: 250, y: 250 },
    radius: config.radius ?? 50,
  };
}

function createPolygonObstacle(count, config = {}) {
  return {
    _scenarioBuilderKey: createScenarioEntityKey('obstacle'),
    kind: 'obstacle',
    shapeType: 'polygon',
    id: config.id || createId('Polygon_Obstacle', count),
    color: config.color ?? '#ACAD9D',
    vertices: config.vertices ?? DEFAULT_POLYGON_VERTICES.map((vertex) => ({
      x: Number(vertex.x),
      y: Number(vertex.y),
    })),
  };
}

// Validation and display helpers used by create forms and edit inputs.
function parseRequiredNumber(value, label) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    throw new Error(`${label} must be a number.`);
  }
  return numericValue;
}

function formatEditableNumber(value) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return value;
  return Number(numericValue.toFixed(2)).toString();
}

function clampCanvasPoint(point) {
  return {
    x: Math.min(CANVAS_WIDTH, Math.max(0, point.x)),
    y: Math.min(CANVAS_HEIGHT, Math.max(0, point.y)),
  };
}

function isTextEditingTarget(target) {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    target.isContentEditable
  );
}

// Ray casting works for triangles, rectangles, trapezoids, and concave polygons.
// A horizontal ray starts at the pointer and toggles inside/outside each time it
// crosses a polygon edge. An odd crossing count means the pointer is inside.
function isPointInsidePolygon(point, vertices) {
  let isInside = false;

  for (let currentIndex = 0, previousIndex = vertices.length - 1;
    currentIndex < vertices.length;
    previousIndex = currentIndex, currentIndex += 1) {
    const current = vertices[currentIndex];
    const previous = vertices[previousIndex];
    const crossesPointerY = current.y > point.y !== previous.y > point.y;

    if (crossesPointerY) {
      const crossingX = current.x
        + ((point.y - current.y) * (previous.x - current.x)) / (previous.y - current.y);
      if (point.x < crossingX) isInside = !isInside;
    }
  }

  return isInside;
}

function getDistanceToSegment(point, start, end) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared === 0) return Math.hypot(point.x - start.x, point.y - start.y);

  const projection = ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared;
  const clampedProjection = Math.max(0, Math.min(1, projection));
  const closestX = start.x + clampedProjection * dx;
  const closestY = start.y + clampedProjection * dy;
  return Math.hypot(point.x - closestX, point.y - closestY);
}

// Edge tolerance makes very thin polygons and border clicks easier to select.
function isPointNearPolygonEdge(point, vertices, tolerance = 6) {
  return vertices.some((vertex, index) => (
    getDistanceToSegment(point, vertex, vertices[(index + 1) % vertices.length]) <= tolerance
  ));
}

// draws the handles
function drawObstacleVertexHandles(ctx, obstacle) {
  const points = obstacle.shapeType === 'circle'
    ? [
        { x: obstacle.center.x, y: obstacle.center.y - obstacle.radius },
        { x: obstacle.center.x + obstacle.radius, y: obstacle.center.y },
        { x: obstacle.center.x, y: obstacle.center.y + obstacle.radius },
        { x: obstacle.center.x - obstacle.radius, y: obstacle.center.y },
      ]
    : obstacle.vertices;

  points.forEach((point) => {
    ctx.beginPath();
    ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#4f86d7';
    ctx.lineWidth = 2;
    ctx.stroke();
  });
}

// Drawing helpers are used by both real entities and form previews.
function drawObstacleEntity(ctx, obstacle, { isSelected = false, isPreview = false } = {}) {
  ctx.save();
  ctx.globalAlpha = isPreview ? 0.45 : 1;
  ctx.fillStyle = obstacle.color;
  ctx.strokeStyle = isPreview ? '#4f86d7' : (isSelected ? '#4f86d7' : '#222');
  ctx.lineWidth = isSelected ? 3 : 2;
  if (isPreview) ctx.setLineDash([8, 6]);

  if (obstacle.shapeType === 'circle') {
    ctx.beginPath();
    ctx.arc(obstacle.center.x, obstacle.center.y, obstacle.radius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

  } else {
    ctx.beginPath();
    ctx.moveTo(obstacle.vertices[0].x, obstacle.vertices[0].y);
    obstacle.vertices.slice(1).forEach((vertex) => ctx.lineTo(vertex.x, vertex.y));
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

  }

  if (isSelected && !isPreview) {
    drawObstacleVertexHandles(ctx, obstacle);
  }

  ctx.restore();
}

function drawAgentEntity(ctx, agent, { isSelected = false, isPreview = false } = {}) {
  const angle = -agent.angle * Math.PI / 180;

  ctx.save();
  ctx.globalAlpha = isPreview ? 0.55 : 1;
  if (isPreview) ctx.setLineDash([7, 5]);

  if (agent.showFOV) {
    ctx.beginPath();
    ctx.moveTo(agent.x, agent.y);
    ctx.arc(
      agent.x,
      agent.y,
      agent.fovRadius,
      angle - (agent.fovAngle * Math.PI / 180) / 2,
      angle + (agent.fovAngle * Math.PI / 180) / 2
    );
    ctx.closePath();
    ctx.fillStyle = 'rgba(79, 134, 215, 0.12)';
    ctx.fill();
  }

  ctx.beginPath();
  ctx.arc(agent.x, agent.y, agent.radius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.strokeStyle = isPreview ? '#4f86d7' : (isSelected ? '#4f86d7' : agent.colorHex);
  ctx.lineWidth = isSelected ? 3 : 2;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(agent.x, agent.y);
  ctx.lineTo(
    agent.x + Math.cos(angle) * agent.radius * 2,
    agent.y + Math.sin(angle) * agent.radius * 2
  );
  ctx.stroke();
  ctx.restore();
}

function drawAgentRangePreview(ctx, range) {
  ctx.save();
  ctx.fillStyle = 'rgba(79, 134, 215, 0.08)';
  ctx.strokeStyle = '#4f86d7';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 6]);
  ctx.strokeRect(range.xMin, range.yMin, range.xMax - range.xMin, range.yMax - range.yMin);
  ctx.fillRect(range.xMin, range.yMin, range.xMax - range.xMin, range.yMax - range.yMin);
  ctx.restore();
}

function generateRandomAgentPosition(count, range, config, startIndex = 0) {
  return Array.from({ length: count }, (_, index) => {
    const x = range.xMin + Math.random() * (range.xMax - range.xMin);
    const y = range.yMin + Math.random() * (range.yMax - range.yMin);

    return createAgent(startIndex + index, {
      x,
      y,
      speed: config.speed,
      angle: config.heading,
      colorHex: config.colorHex,
      showFOV: config.showFOV,
    });
  });
}

function drawScenario(ctx, agents, obstacles, selectedKey, preview = null) {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // 1. Draw the helper grid.
  ctx.save();
  ctx.strokeStyle = '#eef0f4';
  ctx.lineWidth = 1;
  for (let tick = 50; tick < CANVAS_WIDTH; tick += 50) {
    ctx.beginPath();
    ctx.moveTo(tick, 0);
    ctx.lineTo(tick, CANVAS_HEIGHT);
    ctx.moveTo(0, tick);
    ctx.lineTo(CANVAS_WIDTH, tick);
    ctx.stroke();
  }
  ctx.restore();

  // 2. Draw obstacles before agents so agents stay visually on top.
  obstacles.forEach((obstacle) => {
    drawObstacleEntity(ctx, obstacle, {
      isSelected: selectedKey === `obstacle:${obstacle.id}`,
    });
  });

  // 3. Draw agents, including optional FOV and a short heading pointer.
  agents.forEach((agent) => {
    drawAgentEntity(ctx, agent, {
      isSelected: selectedKey === `agent:${agent.id}`,
    });
  });

  // 4. Draw active create-form preview last so users can compare before create.
  if (preview?.type === 'agent') {
    drawAgentRangePreview(ctx, preview.range);
    preview.agents.forEach((agent) => drawAgentEntity(ctx, agent, { isPreview: true }));
  } else if (preview?.type === 'obstacle') {
    drawObstacleEntity(ctx, preview.obstacle, { isPreview: true });
  }
}

// Canvas hit-test workflow:
// handlePointerDown() calls this after converting mouse coordinates into canvas
// coordinates. Agents are checked first so they win when overlapping obstacles.
function findEntityAt(point, agents, obstacles) {
  for (let i = agents.length - 1; i >= 0; i -= 1) {
    const agent = agents[i];
    if (Math.hypot(point.x - agent.x, point.y - agent.y) <= agent.radius + 8) {
      return { type: 'agent', id: agent.id };
    }
  }

  for (let i = obstacles.length - 1; i >= 0; i -= 1) {
    const obstacle = obstacles[i];
    if (obstacle.shapeType === 'circle') {
      if (Math.hypot(point.x - obstacle.center.x, point.y - obstacle.center.y) <= obstacle.radius + 4) {
        return { type: 'obstacle', id: obstacle.id };
      }
    } else if (
      isPointInsidePolygon(point, obstacle.vertices)
      || isPointNearPolygonEdge(point, obstacle.vertices)
    ) {
      return { type: 'obstacle', id: obstacle.id };
    }
  }

  return null;
}

// Does exactly the same thing as findEntityAt(), but we look for vertices right now
function findObstacleVertexAt(point, obstacles, selected) {
  if (selected?.type !== 'obstacle') return null;

  // Find the selected one in obstacles array.
  const selectedObstacle = obstacles.find((obstacle) => obstacle.id === selected.id);
  if (!selectedObstacle) return null;

  // Circle obstacles expose four resize handles. Dragging any handle updates
  // the radius based on the handle's distance from the circle center.
  if (selectedObstacle.shapeType === 'circle') {
    const { x, y } = selectedObstacle.center;
    const radius = selectedObstacle.radius;

    const handles = [
      { handle: 'top', x, y: y - radius },
      { handle: 'right', x: x + radius, y },
      { handle: 'bottom', x, y: y + radius },
      { handle: 'left', x: x - radius, y },
    ];

    const found = handles.find((handle) => (
      Math.hypot(point.x - handle.x, point.y - handle.y) <= 8
    ));

    return found
      ? { mode: 'circle-resize', obstacleId: selectedObstacle.id, handle: found.handle }
      : null;
  }

  // Polygon obstacles expose their real vertices as draggable handles.
  const vertexIndex = selectedObstacle.vertices.findIndex((vertex) => (
    Math.hypot(point.x - vertex.x, point.y - vertex.y) <= 8
  ));

  if (vertexIndex === -1) return null;

  return {
    mode: 'polygon-vertex',
    obstacleId: selectedObstacle.id,
    vertexIndex,
  };
}

export default function ScenarioBuilder() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const dragRef = useRef(null);
  const selectedItemCardRef = useRef(null);
  const activeConfigurationRef = useRef(null); // For scroll into view
  const scenarioFileInputRef = useRef(null);
  const [showWelcomeAlert, setShowWelcomeAlert] = useState(true); // Welcome alert
  const [pendingNavigation, setPendingNavigation] = useState(null);
  const [importAlert, setImportAlert] = useState(null);

  // Scenario data currently lives only in memory. Route exit actions first set
  // a pending destination so the user can confirm they exported their JSON.
  function requestScenarioExit(destination) {
    setPendingNavigation(destination);
  }

  function continueScenarioExit() {
    if (!pendingNavigation) return;
    navigate('/loading', { state: pendingNavigation });
  }

  // Mutable mirrors of React state for event handlers.
  // Keyboard listeners and undo/redo callbacks need the latest collections even
  // when they run outside the current render cycle.
  const agentsRef = useRef([]);
  const obstaclesRef = useRef([]);
  const selectedRef = useRef(null);

  // History workflow:
  // - create actions undo by removing the created entity.
  // - delete actions undo by restoring the removed entity.
  // - update actions undo by swapping edited geometry back to its previous copy.
  // Redo performs the inverse operation again.
  const undoStackRef = useRef([]);
  const redoStackRef = useRef([]);

  // Canvas state: arrays here are the source of truth for drawScenario().
  const [agents, setAgents] = useState([]);
  const [obstacles, setObstacles] = useState([]);
  const [selected, setSelected] = useState(null);

  // Creation form state. Clicking an outer "Create ..." button sets
  // activeConfiguration, which reveals the matching form below that button.
  const [agentDraft, setAgentDraft] = useState({
    count: '1',
    xMin: '0',
    xMax: String(CANVAS_WIDTH),
    yMin: '0',
    yMax: String(CANVAS_HEIGHT),
    speed: '1.5',
    heading: '0',
    colorHex: '#000000',
    showFOV: true,
  });
  const [circleDraft, setCircleDraft] = useState({
    name: '',
    color: '#ACAD9D',
    centerX: '250',
    centerY: '250',
    radius: '50',
  });
  const [polygonDraft, setPolygonDraft] = useState({
    name: '',
    color: '#ACAD9D',
    vertices: DEFAULT_POLYGON_VERTICES,
  });
  // Stores the draft agents generated by the first "Create Agent" click or by
  // "Refresh". These are drawn as preview first, then committed unchanged by
  // createConfiguredAgents().
  const [previewAgents, setPreviewAgents] = useState([]);
  const [configurationError, setConfigurationError] = useState('');
  const [activeConfiguration, setActiveConfiguration] = useState(null);

  // selected is a lightweight pointer; selectedEntity is the full editable
  // object found from the current agents/obstacles arrays.
  const selectedKey = selected ? `${selected.type}:${selected.id}` : null;
  const selectedEntity = useMemo(() => {
    if (!selected) return null;
    return selected.type === 'agent'
      ? agents.find((agent) => agent.id === selected.id)
      : obstacles.find((obstacle) => obstacle.id === selected.id);
  }, [agents, obstacles, selected]);

  // Preview workflow:
  // For agents, activePreview does not generate positions. It only exposes the
  // already-saved previewAgents to drawScenario(), so preview and actual create
  // use the exact same draft objects.
  // For obstacles, the preview is rebuilt directly from the current form values.
  const activePreview = useMemo(() => {
    try {
      if (activeConfiguration === 'agent') {
        const xMin = parseRequiredNumber(agentDraft.xMin, 'X minimum');
        const xMax = parseRequiredNumber(agentDraft.xMax, 'X maximum');
        const yMin = parseRequiredNumber(agentDraft.yMin, 'Y minimum');
        const yMax = parseRequiredNumber(agentDraft.yMax, 'Y maximum');

        if (xMin < 0 || xMax > CANVAS_WIDTH || xMin > xMax) return null;
        if (yMin < 0 || yMax > CANVAS_HEIGHT || yMin > yMax) return null;
        if (previewAgents.length === 0) return null;

        return {
          type: 'agent',
          range: { xMin, xMax, yMin, yMax },
          agents: previewAgents,
        };
      }

      if (activeConfiguration === 'circleObstacle') {
        const { center, radius } = parseCircleDraft();
        return {
          type: 'obstacle',
          obstacle: createCircleObstacle(0, {
            id: 'Circle_Preview',
            color: circleDraft.color,
            center,
            radius,
          }),
        };
      }

      if (activeConfiguration === 'polygonObstacle') {
        return {
          type: 'obstacle',
          obstacle: createPolygonObstacle(0, {
            id: 'Polygon_Preview',
            color: polygonDraft.color,
            vertices: parsePolygonDraft(),
          }),
        };
      }
    } catch {
      return null;
    }

    return null;
  }, [activeConfiguration, agentDraft.xMin, agentDraft.xMax, agentDraft.yMin, agentDraft.yMax, circleDraft, polygonDraft, previewAgents]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctxRef.current = ctx;
    configureHighDpiCanvas(canvas, ctx, CANVAS_WIDTH, CANVAS_HEIGHT);
  }, []);

  // Redraw the canvas any time entities or selected highlight changes.
  useEffect(() => {
    if (!ctxRef.current) return;
    drawScenario(ctxRef.current, agents, obstacles, selectedKey, activePreview);
  }, [activePreview, agents, obstacles, selectedKey]);

  // Keep refs synchronized with state for keyboard shortcuts and history.
  useEffect(() => {
    agentsRef.current = agents;
  }, [agents]);

  useEffect(() => {
    obstaclesRef.current = obstacles;
  }, [obstacles]);

  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  // When the user clicks an entity, scroll the edit box into view.
  useEffect(() => {
    if (!selectedEntity) return;
    selectedItemCardRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }, [selectedEntity]);

  // When a create form opens, scroll that configuration box to the top.
  useEffect(() => {
    if (!activeConfiguration) return;
    window.requestAnimationFrame(() => {
      activeConfigurationRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
  }, [activeConfiguration]);

  // Agent preview stays live while the Agent configuration is open. Any change
  // to count/range/speed/heading/color/FOV regenerates the draft preview batch.
  useEffect(() => {
    if (activeConfiguration !== 'agent') return;
    refreshAgentPreview();
  }, [
    activeConfiguration,
    agentDraft.colorHex,
    agentDraft.count,
    agentDraft.heading,
    agentDraft.showFOV,
    agentDraft.speed,
    agentDraft.xMax,
    agentDraft.xMin,
    agentDraft.yMax,
    agentDraft.yMin,
  ]);

  function recordCreatedEntity(type, entity) {
    undoStackRef.current.push({ action: 'create', type, key: getScenarioEntityKey(entity) });
    redoStackRef.current = [];
  }

  function addAgentEntities(nextAgents) {
    setAgents((currentAgents) => [...currentAgents, ...nextAgents]);
    nextAgents.forEach((agent) => recordCreatedEntity('agent', agent));
  }

  function addObstacleEntity(obstacle) {
    setObstacles((currentObstacles) => [...currentObstacles, obstacle]);
    recordCreatedEntity('obstacle', obstacle);
  }

  function recordUpdatedEntity(type, beforeEntity, afterEntity) {
    if (!beforeEntity || !afterEntity || areScenarioEntitiesEqual(beforeEntity, afterEntity)) {
      return;
    }

    undoStackRef.current.push({
      action: 'update',
      type,
      before: beforeEntity,
      after: afterEntity,
    });
    redoStackRef.current = [];
  }

  // Undo workflow:
  // - Undo a create: find the created entity, move it to redo, remove it.
  // - Undo a delete: restore the stored entity, move a delete marker to redo.
  const undoLastAction = useCallback(() => {
    while (undoStackRef.current.length > 0) {
      const historyItem = undoStackRef.current.pop();

      if (historyItem.action === 'create') {
        const currentCollection = historyItem.type === 'agent'
          ? agentsRef.current
          : obstaclesRef.current;
        const currentEntity = currentCollection.find((entity) => getScenarioEntityKey(entity) === historyItem.key);

        if (!currentEntity) continue;

        redoStackRef.current.push({ action: 'create', type: historyItem.type, entity: currentEntity });

        if (historyItem.type === 'agent') {
          setAgents((currentAgents) => currentAgents.filter((agent) => getScenarioEntityKey(agent) !== historyItem.key));
        } else {
          setObstacles((currentObstacles) => currentObstacles.filter((obstacle) => getScenarioEntityKey(obstacle) !== historyItem.key));
        }

        const currentSelection = selectedRef.current;
        if (currentSelection?.type === historyItem.type && currentSelection.id === currentEntity.id) {
          setSelected(null);
        }
        return;
      }

      if (historyItem.action === 'delete') {
        const entityKey = getScenarioEntityKey(historyItem.entity);
        redoStackRef.current.push({ action: 'delete', type: historyItem.type, key: entityKey });

        if (historyItem.type === 'agent') {
          setAgents((currentAgents) => [...currentAgents, historyItem.entity]);
        } else {
          setObstacles((currentObstacles) => [...currentObstacles, historyItem.entity]);
        }

        setSelected({ type: historyItem.type, id: historyItem.entity.id });
        return;
      }

      if (historyItem.action === 'update') {
        redoStackRef.current.push(historyItem);

        if (historyItem.type === 'agent') {
          setAgents((currentAgents) => currentAgents.map((agent) => (
            getScenarioEntityKey(agent) === getScenarioEntityKey(historyItem.before)
              ? historyItem.before
              : agent
          )));
        } else {
          setObstacles((currentObstacles) => currentObstacles.map((obstacle) => (
            getScenarioEntityKey(obstacle) === getScenarioEntityKey(historyItem.before)
              ? historyItem.before
              : obstacle
          )));
        }

        setSelected({ type: historyItem.type, id: historyItem.before.id });
        return;
      }
    }
  }, []);

  // Redo workflow:
  // - Redo a create: add the stored entity again.
  // - Redo a delete: find the restored entity and remove it again.
  // - Redo an update: swap the edited entity back to its newer copy.
  const redoLastAction = useCallback(() => {
    const historyItem = redoStackRef.current.pop();
    if (!historyItem) return;

    if (historyItem.action === 'create') {
      if (historyItem.type === 'agent') {
        setAgents((currentAgents) => [...currentAgents, historyItem.entity]);
      } else {
        setObstacles((currentObstacles) => [...currentObstacles, historyItem.entity]);
      }

      undoStackRef.current.push({
        action: 'create',
        type: historyItem.type,
        key: getScenarioEntityKey(historyItem.entity),
      });
      return;
    }

    if (historyItem.action === 'delete') {
      const currentCollection = historyItem.type === 'agent'
        ? agentsRef.current
        : obstaclesRef.current;
      const currentEntity = currentCollection.find((entity) => getScenarioEntityKey(entity) === historyItem.key);

      if (!currentEntity) return;

      undoStackRef.current.push({ action: 'delete', type: historyItem.type, entity: currentEntity });

      if (historyItem.type === 'agent') {
        setAgents((currentAgents) => currentAgents.filter((agent) => getScenarioEntityKey(agent) !== historyItem.key));
      } else {
        setObstacles((currentObstacles) => currentObstacles.filter((obstacle) => getScenarioEntityKey(obstacle) !== historyItem.key));
      }

      const currentSelection = selectedRef.current;
      if (currentSelection?.type === historyItem.type && currentSelection.id === currentEntity.id) {
        setSelected(null);
      }
    }

    if (historyItem.action === 'update') {
      if (historyItem.type === 'agent') {
        setAgents((currentAgents) => currentAgents.map((agent) => (
          getScenarioEntityKey(agent) === getScenarioEntityKey(historyItem.after)
            ? historyItem.after
            : agent
        )));
      } else {
        setObstacles((currentObstacles) => currentObstacles.map((obstacle) => (
          getScenarioEntityKey(obstacle) === getScenarioEntityKey(historyItem.after)
            ? historyItem.after
            : obstacle
        )));
      }

      undoStackRef.current.push(historyItem);
      setSelected({ type: historyItem.type, id: historyItem.after.id });
    }
  }, []);

  // Global keyboard workflow:
  // - Cmd/Ctrl+Z and redo shortcuts call the history functions above.
  // - Delete/Backspace deletes the selected canvas entity, except when the user is actively editing an input.
  useEffect(() => {
    function handleKeyDown(event) {
      const isModifierPressed = event.metaKey || event.ctrlKey;
      const key = event.key.toLowerCase();

      const isUndo = key === 'z' && !event.shiftKey;
      const isRedo = (key === 'z' && event.shiftKey) || key === 'y';
      const isDelete = key === 'delete' || key === 'backspace';

      if (isModifierPressed && (isUndo || isRedo)) {
        event.preventDefault();
        if (isUndo) {
          undoLastAction();
        } else {
          redoLastAction();
        }
        return;
      }

      if (isDelete && !isTextEditingTarget(event.target) && selectedRef.current) {
        event.preventDefault();
        deleteSelected();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [redoLastAction, undoLastAction]);

  // Selection workflow:
  // Pointer down chooses an entity and starts a drag operation if one was hit.
  function handlePointerDown(event) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const point = getCanvasPointFromEvent(event, canvas);

    // Obstacle Vertex Hit
    const vertexHit = findObstacleVertexAt(point, obstacles, selected);

    if (vertexHit) {
      const obstacleBeforeDrag = obstacles.find((obstacle) => obstacle.id === vertexHit.obstacleId);
      dragRef.current = {
        ...vertexHit,
        before: obstacleBeforeDrag ? cloneScenarioEntity(obstacleBeforeDrag) : null,
      };
      return;
    }

    const hit = findEntityAt(point, agents, obstacles);
    setSelected(hit);
    const entityBeforeDrag = hit?.type === 'agent'
      ? agents.find((agent) => agent.id === hit.id)
      : obstacles.find((obstacle) => obstacle.id === hit?.id);
    dragRef.current = hit
      ? {
          ...hit,
          previous: point,
          before: entityBeforeDrag ? cloneScenarioEntity(entityBeforeDrag) : null,
        }
      : null;
  }

  // Drag workflow:
  // - Vertex drags edit obstacle geometry directly.
  // - Entity drags move selected agents/circles/polygons as a whole.
  function handlePointerMove(event) {
    const drag = dragRef.current;
    const canvas = canvasRef.current;
    if (!drag || !canvas) return;

    const point = getCanvasPointFromEvent(event, canvas);
    const clampedPoint = clampCanvasPoint(point);

    if (drag.mode === 'polygon-vertex') {
      setObstacles((currentObstacles) => currentObstacles.map((obstacle) => (
        obstacle.id === drag.obstacleId
          ? {
              ...obstacle,
              vertices: obstacle.vertices.map((vertex, index) => (
                index === drag.vertexIndex ? clampedPoint : vertex
              )),
            }
          : obstacle
      )));
      return;
    }

    if (drag.mode === 'circle-resize') {
      setObstacles((currentObstacles) => currentObstacles.map((obstacle) => {
        if (obstacle.id !== drag.obstacleId || obstacle.shapeType !== 'circle') {
          return obstacle;
        }

        const rawRadius = Math.hypot(
          clampedPoint.x - obstacle.center.x,
          clampedPoint.y - obstacle.center.y
        );
        const maxRadius = Math.max(1, Math.min(
          obstacle.center.x,
          CANVAS_WIDTH - obstacle.center.x,
          obstacle.center.y,
          CANVAS_HEIGHT - obstacle.center.y
        ));

        return {
          ...obstacle,
          radius: Math.min(Math.max(1, rawRadius), maxRadius),
        };
      }));
      return;
    }

    const dx = point.x - drag.previous.x;
    const dy = point.y - drag.previous.y;
    dragRef.current = { ...drag, previous: point };

    if (drag.type === 'agent') {
      setAgents((currentAgents) => currentAgents.map((agent) => (
        agent.id === drag.id
          ? {
              ...agent,
              x: Math.min(CANVAS_WIDTH, Math.max(0, agent.x + dx)),
              y: Math.min(CANVAS_HEIGHT, Math.max(0, agent.y + dy)),
            }
          : agent
      )));
    } else {
      setObstacles((currentObstacles) => currentObstacles.map((obstacle) => {
        if (obstacle.id !== drag.id) return obstacle;
        if (obstacle.shapeType === 'circle') {
          return {
            ...obstacle,
            center: {
              x: Math.min(CANVAS_WIDTH, Math.max(0, obstacle.center.x + dx)),
              y: Math.min(CANVAS_HEIGHT, Math.max(0, obstacle.center.y + dy)),
            },
          };
        }
        return {
          ...obstacle,
          vertices: obstacle.vertices.map((vertex) => ({
            x: Math.min(CANVAS_WIDTH, Math.max(0, vertex.x + dx)),
            y: Math.min(CANVAS_HEIGHT, Math.max(0, vertex.y + dy)),
          })),
        };
      }));
    }
  }

  function handlePointerUp() {
    const drag = dragRef.current;
    if (drag?.before) {
      const currentCollection = drag.type === 'agent' ? agentsRef.current : obstaclesRef.current;
      const entityId = drag.id ?? drag.obstacleId;
      const after = currentCollection.find((entity) => entity.id === entityId);
      recordUpdatedEntity(drag.type ?? 'obstacle', drag.before, after ? cloneScenarioEntity(after) : null);
    }

    dragRef.current = null;
  }

  function updateSelected(updates) {
    if (!selected) return;
    if (selected.type === 'agent') {
      setAgents((currentAgents) => currentAgents.map((agent) => (
        agent.id === selected.id ? { ...agent, ...updates } : agent
      )));
    } else {
      setObstacles((currentObstacles) => currentObstacles.map((obstacle) => (
        obstacle.id === selected.id ? { ...obstacle, ...updates } : obstacle
      )));
    }
  }

  // Name edits can change the public id, so selected must be updated too.
  // Undo/redo still works because it uses _scenarioBuilderKey.
  function renameSelected(nextId) {
    if (!selected) return;
    updateSelected({ id: nextId });
    setSelected({ ...selected, id: nextId });
  }

  // Delete workflow:
  // The button and keyboard Delete both call this. The removed entity is stored
  // as a delete history action so undo can put it back.
  function deleteSelected() {
    const currentSelection = selectedRef.current;
    if (!currentSelection) return;

    const currentCollection = currentSelection.type === 'agent' ? agentsRef.current : obstaclesRef.current;
    const currentEntity = currentCollection.find((entity) => entity.id === currentSelection.id);
    if (!currentEntity) return;

    undoStackRef.current.push({ action: 'delete', type: currentSelection.type, entity: currentEntity });
    redoStackRef.current = [];

    if (currentSelection.type === 'agent') {
      setAgents((currentAgents) => currentAgents.filter((agent) => agent.id !== currentSelection.id));
    } else {
      setObstacles((currentObstacles) => currentObstacles.filter((obstacle) => obstacle.id !== currentSelection.id));
    }
    setSelected(null);
  }

  // Export strips internal builder keys so downloaded JSON stays clean.
  function handleExport() {
    const scenario = {
      version: 1,
      canvas: { width: CANVAS_WIDTH, height: CANVAS_HEIGHT },
      agents: agents.map(removeScenarioBuilderKey),
      obstacles: obstacles.map(removeScenarioBuilderKey),
    };
    const blob = new Blob([JSON.stringify(scenario, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'agent-scenario.json';
    link.click();
    URL.revokeObjectURL(url);
  }

  async function handleImportScenario(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      const scenario = await loadScenarioFile(file, {
        canvasWidth: CANVAS_WIDTH,
        canvasHeight: CANVAS_HEIGHT,
      });
      const importedAgents = scenario.agents.map((agent) => ({
        ...agent,
        _scenarioBuilderKey: createScenarioEntityKey('agent'),
      }));
      const importedObstacles = scenario.obstacles.map((obstacle) => ({
        ...obstacle,
        _scenarioBuilderKey: createScenarioEntityKey('obstacle'),
      }));

      // Replace the current in-memory scenario and reset editor-only history.
      agentsRef.current = importedAgents;
      obstaclesRef.current = importedObstacles;
      setAgents(importedAgents);
      setObstacles(importedObstacles);
      setSelected(null);
      setActiveConfiguration(null);
      setPreviewAgents([]);
      undoStackRef.current = [];
      redoStackRef.current = [];
      setImportAlert({
        type: 'default',
        title: 'Scenario Imported',
        primary: `Loaded ${importedAgents.length} agents and ${importedObstacles.length} obstacles.`,
        secondary: 'You can now continue editing this scenario.',
      });
    } catch (error) {
      setImportAlert({
        type: 'warning',
        title: 'Unable to Import Scenario',
        primary: error.message,
        secondary: 'Choose a valid scenario JSON file and try again.',
      });
    }
  }
  
  function updateAgentDraft(updates) {
    setAgentDraft((currentDraft) => ({ ...currentDraft, ...updates }));
    setConfigurationError('');
  }

  function updateCircleDraft(updates) {
    setCircleDraft((currentDraft) => ({ ...currentDraft, ...updates }));
    setConfigurationError('');
  }

  function updatePolygonDraft(updates) {
    setPolygonDraft((currentDraft) => ({ ...currentDraft, ...updates }));
    setConfigurationError('');
  }

  function parseAgentDraft() {
    const count = parseRequiredNumber(agentDraft.count, 'Number of agents');
    const xMin = parseRequiredNumber(agentDraft.xMin, 'X minimum');
    const xMax = parseRequiredNumber(agentDraft.xMax, 'X maximum');
    const yMin = parseRequiredNumber(agentDraft.yMin, 'Y minimum');
    const yMax = parseRequiredNumber(agentDraft.yMax, 'Y maximum');
    const speed = parseRequiredNumber(agentDraft.speed, 'Initial speed');
    const heading = parseRequiredNumber(agentDraft.heading, 'Initial heading');

    if (!Number.isInteger(count) || count < 1) {
      throw new Error('Number of agents must be a whole number greater than 0.');
    }
    if (xMin < 0 || xMax > CANVAS_WIDTH || xMin > xMax) {
      throw new Error(`X range must be within 0-${CANVAS_WIDTH} and min cannot exceed max.`);
    }
    if (yMin < 0 || yMax > CANVAS_HEIGHT || yMin > yMax) {
      throw new Error(`Y range must be within 0-${CANVAS_HEIGHT} and min cannot exceed max.`);
    }
    if (speed < 0) {
      throw new Error('Initial speed cannot be negative.');
    }

    return {
      count,
      range: { xMin, xMax, yMin, yMax },
      config: {
        speed,
        heading,
        colorHex: agentDraft.colorHex,
        showFOV: agentDraft.showFOV,
      },
    };
  }

  function refreshAgentPreview() {
    try {
      const { count, range, config } = parseAgentDraft();
      // This is the only place random agent positions are generated. The result
      // is stored in previewAgents so drawing and final creation stay identical.
      setPreviewAgents(generateRandomAgentPosition(count, range, config, agentsRef.current.length));
      setConfigurationError('');
    } catch (error) {
      setPreviewAgents([]);
      setConfigurationError(error.message);
    }
  }

  // Agent form workflow:
  // 1. Outer "Create Agent" calls openAgentConfiguration().
  // 2. The live preview effect calls refreshAgentPreview(), which fills previewAgents.
  // 3. drawScenario() draws previewAgents as faded preview agents.
  // 4. Refresh manually calls refreshAgentPreview() again to replace previewAgents.
  // 5. Inner "Create" commits the current previewAgents into the real agents array.
  function createConfiguredAgents() {
    try {
      if (previewAgents.length === 0) {
        throw new Error('Generate a preview before creating agents.');
      }

      addAgentEntities(previewAgents);
      setPreviewAgents([]);
      setConfigurationError('');
      setActiveConfiguration(null);
    } catch (error) {
      setConfigurationError(error.message);
    }
  }

  // Circle/polygon parsing is shared by form validation and creation.
  function parseCircleDraft() {
    const centerX = parseRequiredNumber(circleDraft.centerX, 'Circle center X');
    const centerY = parseRequiredNumber(circleDraft.centerY, 'Circle center Y');
    const radius = parseRequiredNumber(circleDraft.radius, 'Circle radius');

    if (radius <= 0) {
      throw new Error('Circle radius must be a positive number.');
    }
    if (
      centerX - radius < 0 ||
      centerX + radius > CANVAS_WIDTH ||
      centerY - radius < 0 ||
      centerY + radius > CANVAS_HEIGHT
    ) {
      throw new Error('Circle obstacle must fit inside the canvas.');
    }

    return { center: { x: centerX, y: centerY }, radius };
  }

  function parsePolygonDraft() {
    if (!Array.isArray(polygonDraft.vertices) || polygonDraft.vertices.length < 3) {
      throw new Error('Polygon obstacles need at least 3 vertices.');
    }

    return polygonDraft.vertices.map((vertex, index) => {
      const x = parseRequiredNumber(vertex.x, `Vertex ${index + 1} X`);
      const y = parseRequiredNumber(vertex.y, `Vertex ${index + 1} Y`);
      if (x < 0 || x > CANVAS_WIDTH || y < 0 || y > CANVAS_HEIGHT) {
        throw new Error(`Vertex ${index + 1} must be inside the canvas.`);
      }
      return { x, y };
    });
  }

  // Obstacle form workflow:
  // The outer obstacle button opens the form. Inner "Create" validates geometry,
  // creates one obstacle, records history, then closes the form.
  function createConfiguredCircleObstacle() {
    try {
      const { center, radius } = parseCircleDraft();
      addObstacleEntity(createCircleObstacle(obstaclesRef.current.length, {
        id: circleDraft.name.trim() || undefined,
        color: circleDraft.color,
        center,
        radius,
      }));
      setConfigurationError('');
      setActiveConfiguration(null);
    } catch (error) {
      setConfigurationError(error.message);
    }
  }

  function createConfiguredPolygonObstacle() {
    try {
      addObstacleEntity(createPolygonObstacle(obstaclesRef.current.length, {
        id: polygonDraft.name.trim() || undefined,
        color: polygonDraft.color,
        vertices: parsePolygonDraft(),
      }));
      setConfigurationError('');
      setActiveConfiguration(null);
    } catch (error) {
      setConfigurationError(error.message);
    }
  }

  function updatePolygonVertex(index, field, value) {
    updatePolygonDraft({
      vertices: polygonDraft.vertices.map((vertex, vertexIndex) => (
        vertexIndex === index ? { ...vertex, [field]: value } : vertex
      )),
    });
  }

  function addPolygonVertex() {
    const lastVertex = polygonDraft.vertices[polygonDraft.vertices.length - 1] ?? { x: '250', y: '250' };
    updatePolygonDraft({
      vertices: [
        ...polygonDraft.vertices,
        {
          x: String(Math.min(CANVAS_WIDTH, Number(lastVertex.x) + 20 || 250)),
          y: String(Math.min(CANVAS_HEIGHT, Number(lastVertex.y) + 20 || 250)),
        },
      ],
    });
  }

  function deletePolygonVertex(index) {
    if (polygonDraft.vertices.length <= 3) {
      setConfigurationError('Polygon obstacles need at least 3 vertices.');
      return;
    }
    updatePolygonDraft({
      vertices: polygonDraft.vertices.filter((_, vertexIndex) => vertexIndex !== index),
    });
  }

  function updateSelectedPolygonVertex(index, field, value) {
    if (!selectedEntity || selectedEntity.shapeType !== 'polygon') return;

    updateSelected({
      vertices: selectedEntity.vertices.map((vertex, vertexIndex) => (
        vertexIndex === index
          ? {
              ...vertex,
              [field]: clampCanvasPoint({
                ...vertex,
                [field]: parseNumberOrDefault(value, vertex[field]),
              })[field],
            }
          : vertex
      )),
    });
  }

  function addSelectedPolygonVertex() {
    if (!selectedEntity || selectedEntity.shapeType !== 'polygon') return;

    const lastVertex = selectedEntity.vertices[selectedEntity.vertices.length - 1] ?? { x: 250, y: 250 };
    updateSelected({
      vertices: [
        ...selectedEntity.vertices,
        clampCanvasPoint({
          x: lastVertex.x + 20,
          y: lastVertex.y + 20,
        }),
      ],
    });
  }

  function deleteSelectedPolygonVertex(index) {
    if (!selectedEntity || selectedEntity.shapeType !== 'polygon') return;
    if (selectedEntity.vertices.length <= 3) return;

    updateSelected({
      vertices: selectedEntity.vertices.filter((_, vertexIndex) => vertexIndex !== index),
    });
  }

  // Configuration panel workflow:
  // Outer create buttons call openConfiguration(key). renderConfigurationPanel()
  // only returns content for that active key, so only one create form is visible.
  function openConfiguration(key) {
    setActiveConfiguration(key);
    setConfigurationError('');
  }

  function openAgentConfiguration() {
    // First click on "Create Agent": open the form and generate the first
    // preview batch through the live preview effect.
    setActiveConfiguration('agent');
  }

  function closeConfiguration() {
    setActiveConfiguration(null);
    setConfigurationError('');
    setPreviewAgents([]);
  }

  function renderConfigurationPanel(key, children) {
    if (activeConfiguration !== key) return null;

    return (
      <div ref={activeConfigurationRef} className="scenario-configuration-box">
        {children}
      </div>
    );
  }

  // These render helpers are the visible forms opened by renderEntityCreationControls().
  // Their bottom Create/Cancel row mirrors the main Simulation add-card workflow.
  function renderAgentConfiguration() {
    return (
      <div className="scenario-inline-configuration">
        <div className="input-group">
          <label>Number of Agents</label>
          <input
            type="number"
            min="1"
            value={agentDraft.count}
            onChange={(event) => updateAgentDraft({ count: event.target.value })}
          />
        </div>

        <div className="input-row">
          <div className="input-group">
            <label>X Min</label>
            <input type="number" min="0" max={CANVAS_WIDTH} value={agentDraft.xMin} onChange={(event) => updateAgentDraft({ xMin: event.target.value })} />
          </div>
          <div className="input-group">
            <label>X Max</label>
            <input type="number" min="0" max={CANVAS_WIDTH} value={agentDraft.xMax} onChange={(event) => updateAgentDraft({ xMax: event.target.value })} />
          </div>
        </div>

        <div className="input-row">
          <div className="input-group">
            <label>Y Min</label>
            <input type="number" min="0" max={CANVAS_HEIGHT} value={agentDraft.yMin} onChange={(event) => updateAgentDraft({ yMin: event.target.value })} />
          </div>
          <div className="input-group">
            <label>Y Max</label>
            <input type="number" min="0" max={CANVAS_HEIGHT} value={agentDraft.yMax} onChange={(event) => updateAgentDraft({ yMax: event.target.value })} />
          </div>
        </div>

        <div className="input-row">
          <div className="input-group">
            <label>Initial Speed</label>
            <input type="number" min="0" step="0.1" value={agentDraft.speed} onChange={(event) => updateAgentDraft({ speed: event.target.value })} />
          </div>
          <div className="input-group">
            <label>Initial Heading</label>
            <input type="number" value={agentDraft.heading} onChange={(event) => updateAgentDraft({ heading: event.target.value })} />
          </div>
        </div>

        <div className="input-group">
          <label>Color</label>
          <input type="color" value={agentDraft.colorHex} onChange={(event) => updateAgentDraft({ colorHex: event.target.value })} />
        </div>

        <div className="input-group">
          <label>
            <input type="checkbox" checked={agentDraft.showFOV} onChange={(event) => updateAgentDraft({ showFOV: event.target.checked })} />
            Show FOV
          </label>
        </div>

        <div className="btn-row">
          <button className="btn-primary icon-button" onClick={createConfiguredAgents}>
            <Plus className="button-icon" size={16} aria-hidden="true" />
            Create
          </button>
          <button className="btn-secondary icon-button" onClick={refreshAgentPreview}>
            <RefreshCw className="button-icon" size={16} aria-hidden="true" />
            Refresh
          </button>
          <button className="btn-secondary icon-button" onClick={closeConfiguration}>
            <CircleX className="button-icon" size={16} aria-hidden="true" />
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // For Circle Obstacles
  function renderCircleObstacleConfiguration() {
    return (
      <div className="scenario-inline-configuration obstacle-shape-editor">
        <div className="input-group">
          <label>Obstacle Name</label>
          <input type="text" placeholder="e.g. Circle_Obstacle_1" value={circleDraft.name} onChange={(event) => updateCircleDraft({ name: event.target.value })} />
        </div>

        <div className="input-group">
          <label>Color</label>
          <input type="color" value={circleDraft.color} onChange={(event) => updateCircleDraft({ color: event.target.value })} />
        </div>

        <div className="input-row">
          <div className="input-group">
            <label>Center X</label>
            <input type="number" min="0" max={CANVAS_WIDTH} value={circleDraft.centerX} onChange={(event) => updateCircleDraft({ centerX: event.target.value })} />
          </div>
          <div className="input-group">
            <label>Center Y</label>
            <input type="number" min="0" max={CANVAS_HEIGHT} value={circleDraft.centerY} onChange={(event) => updateCircleDraft({ centerY: event.target.value })} />
          </div>
        </div>

        <div className="input-group">
          <label>Radius</label>
          <input type="number" min="1" max={Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / 2} value={circleDraft.radius} onChange={(event) => updateCircleDraft({ radius: event.target.value })} />
        </div>

        <div className="btn-row">
          <button className="btn-primary icon-button" onClick={createConfiguredCircleObstacle}>
            <Plus className="button-icon" size={16} aria-hidden="true" />
            Create
          </button>
          <button className="btn-secondary icon-button" onClick={closeConfiguration}>
            <CircleX className="button-icon" size={16} aria-hidden="true" />
            Cancel
          </button>
        </div>
      </div>
    );
  }

  function renderPolygonObstacleConfiguration() {
    return (
      <div className="scenario-inline-configuration obstacle-shape-editor">
        <div className="input-group">
          <label>Obstacle Name</label>
          <input type="text" placeholder="e.g. Polygon_Obstacle_1" value={polygonDraft.name} onChange={(event) => updatePolygonDraft({ name: event.target.value })} />
        </div>

        <div className="input-group">
          <label>Color</label>
          <input type="color" value={polygonDraft.color} onChange={(event) => updatePolygonDraft({ color: event.target.value })} />
        </div>

        <div className="obstacle-vertices-editor">
          {polygonDraft.vertices.map((vertex, index) => (
            <div className="obstacle-vertex-row" key={index}>
              <span className="obstacle-vertex-label">Vertex {index + 1}</span>
              <div className="input-group">
                <label>X</label>
                <input type="number" min="0" max={CANVAS_WIDTH} value={vertex.x} onChange={(event) => updatePolygonVertex(index, 'x', event.target.value)} />
              </div>
              <div className="input-group">
                <label>Y</label>
                <input type="number" min="0" max={CANVAS_HEIGHT} value={vertex.y} onChange={(event) => updatePolygonVertex(index, 'y', event.target.value)} />
              </div>
              <button
                className="btn-secondary icon-only-button obstacle-vertex-delete"
                onClick={() => deletePolygonVertex(index)}
                disabled={polygonDraft.vertices.length <= 3}
                aria-label={`Delete vertex ${index + 1}`}
                title={polygonDraft.vertices.length <= 3 ? 'Polygon needs at least 3 vertices' : `Delete vertex ${index + 1}`}
              >
                <Trash2 size={15} aria-hidden="true" />
              </button>
            </div>
          ))}
          <button className="btn-secondary icon-button" onClick={addPolygonVertex}>
            <Plus className="button-icon" size={16} aria-hidden="true" />
            Add Vertex
          </button>
        </div>

        <div className="btn-row">
          <button className="btn-primary icon-button" onClick={createConfiguredPolygonObstacle}>
            <Plus className="button-icon" size={16} aria-hidden="true" />
            Create
          </button>
          <button className="btn-secondary icon-button" onClick={closeConfiguration}>
            <CircleX className="button-icon" size={16} aria-hidden="true" />
            Cancel
          </button>
        </div>
      </div>
    );
  }

  function renderEntityCreationControls(entityType) {
    if (entityType === ENTITY_TYPES.AGENT) {
      return (
        <>
          <button className="btn-primary icon-button" onClick={openAgentConfiguration}>
            <Plus className="button-icon" size={16} aria-hidden="true" />
            <Users className="button-icon" size={16} aria-hidden="true" />
            Create Agent
          </button>
          {renderConfigurationPanel('agent', renderAgentConfiguration())}
        </>
      );
    }

    if (entityType === ENTITY_TYPES.OBSTACLE) {
      return (
        <>
          {Object.values(OBSTACLE_SHAPE_TYPES).map((shapeType) => {
            const isCircle = shapeType === OBSTACLE_SHAPE_TYPES.CIRCLE;
            const ShapeIcon = isCircle ? Circle : Square;
            const label = `${OBSTACLE_SHAPE_LABELS[shapeType]} Obstacle`;

            return (
              <div className="scenario-entity-action" key={shapeType}>
                <button
                  className="btn-secondary icon-button"
                  onClick={() => openConfiguration(isCircle ? 'circleObstacle' : 'polygonObstacle')}
                >
                  <Plus className="button-icon" size={16} aria-hidden="true" />
                  <ShapeIcon className="button-icon" size={16} aria-hidden="true" />
                  {label}
                </button>
                {renderConfigurationPanel(
                  isCircle ? 'circleObstacle' : 'polygonObstacle',
                  isCircle ? renderCircleObstacleConfiguration() : renderPolygonObstacleConfiguration()
                )}
              </div>
            );
          })}
        </>
      );
    }

    return (
      <>
        <button className="btn-secondary icon-button" disabled>
          <Plus className="button-icon" size={16} aria-hidden="true" />
          Create {ENTITY_LABELS[entityType]}
        </button>
      </>
    );
  }

  return (
    <div className="simulation-page">
      <Header title="Scenario Configuration" />
      
      {/* Welcome Alert */}
      {showWelcomeAlert && (
          <AlertBox
            title="Welcome to the Scenario Builder!"
            primMessage="This is where you can create and configure entities for your agent-based simulations. After you are satisfied with your scenario, you can export it as a JSON file to use in your simulations."
            secMessage={(
              <>
                Don&apos;t know where to start?{' '}
                <Link
                  to="/loading"
                  state={{ from: 'Scenario Builder', to: 'Tutorial', path: '/tutorial' }}
                >Check out the tutorial.</Link>
              </>
            )}
            confirmLabel="Get Started"
            cancelLabel="Close"
            permanentDismiss
            dismissStorageKey="scenario-builder-welcome-dismissed"
            onConfirm={() => setShowWelcomeAlert(false)}
            onCancel={() => setShowWelcomeAlert(false)}
          />
        )}

      {pendingNavigation && (
        <AlertBox
          title="Wait! Before You Leave..."
          primMessage="Did you save your scenario? Your changes will not be saved unless you download them as a JSON file."
          secMessage="If you already downloaded it, you're all set and can ignore this reminder."
          type="warning"
          confirmLabel="Continue Anyway"
          cancelLabel="Stay Here"
          onConfirm={continueScenarioExit}
          onCancel={() => setPendingNavigation(null)}
        />
      )}

      {importAlert && (
        <AlertBox
          title={importAlert.title}
          primMessage={importAlert.primary}
          secMessage={importAlert.secondary}
          type={importAlert.type}
          confirmLabel="OK"
          cancelLabel="Close"
          onConfirm={() => setImportAlert(null)}
          onCancel={() => setImportAlert(null)}
        />
      )}

      <div className="simulation-container scenario-builder-container">
        <div className="canvas-section scenario-canvas-section">
          <canvas
            ref={canvasRef}
            className="simulation-canvas scenario-builder-canvas"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          />
        </div>

        <div className="control-panel scenario-builder-panel">
          <div className="scenario-panel-topbar">
            <button className="btn-secondary scenario-home-button icon-button" onClick={() => requestScenarioExit({
              from: 'Scenario Builder', to: 'Home Page', path: '/',
            })}>
              <ArrowLeft className="button-icon" size={16} aria-hidden="true" />
              Home
            </button>
            <h2 className="scenario-dashboard-title">Dashboard</h2>
          </div>

          <div className="panel-card">
            <h2 className="panel-section-title">Scenario Management</h2>
            <div className="scenario-count-row">
              <span>{agents.length} Agents</span>
              <span>{obstacles.length} Obstacles</span>
            </div>
            <div className="input-group">
              <label>Continue editing:</label>
              <input
                ref={scenarioFileInputRef}
                type="file"
                accept="application/json,.json"
                hidden
                onChange={handleImportScenario}
              />
              <button
                className="btn-secondary icon-button"
                type="button"
                onClick={() => scenarioFileInputRef.current?.click()}
              >
                <FileUp className="button-icon" size={16} aria-hidden="true" />
                Import Scenario JSON
              </button>
            </div>
            <div className="input-group">
              <label>Save for later / Ready to go:</label>
              <button className="btn-secondary icon-button" onClick={handleExport}>
                <Download className="button-icon" size={16} aria-hidden="true" />
                Export Scenario JSON
              </button>
            </div>
            <div className="input-group">
              <label>Test your scenario:</label>
              <button className="btn-primary icon-button" onClick={() => requestScenarioExit({
                from: 'Scenario Builder', to: 'Main Simulation', path: '/simulation',
              })}>
                Open Simulation
                <SquareArrowOutUpRight className="button-icon" size={16} aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="panel-card">
            <h2 className="panel-section-title title-with-icon">
              <MousePointer2 className="section-title-icon" size={18} aria-hidden="true" />
              Entities
            </h2>
            <div className="scenario-entity-list">
              {/* Entity buttons are generated from ENTITY_TYPES so new entity
                  types appear here automatically when constants.js grows. */}
              {Object.values(ENTITY_TYPES).map((entityType) => {
                const EntityIcon = ENTITY_ICONS[entityType] ?? Square;

                return (
                  <section className="scenario-entity-section" key={entityType}>
                    <h3 className="scenario-entity-heading">
                      <EntityIcon className="section-title-icon" size={16} aria-hidden="true" />
                      {ENTITY_LABELS[entityType]}
                    </h3>
                    {renderEntityCreationControls(entityType)}
                  </section>
                );
              })}
            </div>
            {configurationError && (
              <p className="scenario-configuration-error">{configurationError}</p>
            )}
          </div>

          <div ref={selectedItemCardRef} className="panel-card">
            <h2 className="panel-section-title">
              {selectedEntity
                ? `Selected Entity: ${getSelectedEntityLabel(selectedEntity)}`
                : 'Entity Editor'}
            </h2>
            {!selectedEntity && <p className="scenario-empty-state">Select or drag an item on the canvas.</p>}

            {selectedEntity?.kind === 'agent' && (
              <>
                <div className="input-group">
                  <label>Name</label>
                  <input value={selectedEntity.id} onChange={(event) => renameSelected(event.target.value)} />
                </div>
                <div className="input-row">
                  <div className="input-group">
                    <label>X</label>
                    <input type="number" value={formatEditableNumber(selectedEntity.x)} onChange={(event) => updateSelected({ x: parseNumberOrDefault(event.target.value, selectedEntity.x) })} />
                  </div>
                  <div className="input-group">
                    <label>Y</label>
                    <input type="number" value={formatEditableNumber(selectedEntity.y)} onChange={(event) => updateSelected({ y: parseNumberOrDefault(event.target.value, selectedEntity.y) })} />
                  </div>
                </div>
                <div className="input-row">
                  <div className="input-group">
                    <label>Angle</label>
                    <input type="number" value={formatEditableNumber(selectedEntity.angle)} onChange={(event) => updateSelected({ angle: parseNumberOrDefault(event.target.value, selectedEntity.angle) })} />
                  </div>
                  <div className="input-group">
                    <label>Speed</label>
                    <input type="number" value={formatEditableNumber(selectedEntity.speed)} onChange={(event) => updateSelected({ speed: parseNumberOrDefault(event.target.value, selectedEntity.speed) })} />
                  </div>
                </div>
                <div className="input-group">
                  <label>Color</label>
                  <input type="color" value={selectedEntity.colorHex} onChange={(event) => updateSelected({ colorHex: event.target.value })} />
                </div>
              </>
            )}

            {selectedEntity?.kind === 'obstacle' && (
              <>
                <div className="input-group">
                  <label>Name</label>
                  <input value={selectedEntity.id} onChange={(event) => renameSelected(event.target.value)} />
                </div>
                <div className="input-group">
                  <label>Color</label>
                  <input type="color" value={selectedEntity.color} onChange={(event) => updateSelected({ color: event.target.value })} />
                </div>
                {selectedEntity.shapeType === 'circle' && (
                  <>
                    <div className="input-row">
                      <div className="input-group">
                        <label>Center X</label>
                        <input type="number" value={formatEditableNumber(selectedEntity.center.x)} onChange={(event) => updateSelected({ center: { ...selectedEntity.center, x: parseNumberOrDefault(event.target.value, selectedEntity.center.x) } })} />
                      </div>
                      <div className="input-group">
                        <label>Center Y</label>
                        <input type="number" value={formatEditableNumber(selectedEntity.center.y)} onChange={(event) => updateSelected({ center: { ...selectedEntity.center, y: parseNumberOrDefault(event.target.value, selectedEntity.center.y) } })} />
                      </div>
                    </div>
                    <div className="input-group">
                      <label>Radius</label>
                      <input type="number" value={formatEditableNumber(selectedEntity.radius)} onChange={(event) => updateSelected({ radius: parseNumberOrDefault(event.target.value, selectedEntity.radius) })} />
                    </div>
                  </>
                )}
                {selectedEntity.shapeType === 'polygon' && (
                  <div className="obstacle-vertices-editor scenario-selected-vertices-editor">
                    {selectedEntity.vertices.map((vertex, index) => (
                      <div className="obstacle-vertex-row" key={`${selectedEntity.id}-vertex-${index}`}>
                        <span className="obstacle-vertex-label">Vertex {index + 1}</span>
                        <div className="input-group">
                          <label>X</label>
                          <input
                            type="number"
                            min="0"
                            max={CANVAS_WIDTH}
                            value={formatEditableNumber(vertex.x)}
                            onChange={(event) => updateSelectedPolygonVertex(index, 'x', event.target.value)}
                          />
                        </div>
                        <div className="input-group">
                          <label>Y</label>
                          <input
                            type="number"
                            min="0"
                            max={CANVAS_HEIGHT}
                            value={formatEditableNumber(vertex.y)}
                            onChange={(event) => updateSelectedPolygonVertex(index, 'y', event.target.value)}
                          />
                        </div>
                        <button
                          className="btn-secondary icon-only-button obstacle-vertex-delete"
                          onClick={() => deleteSelectedPolygonVertex(index)}
                          disabled={selectedEntity.vertices.length <= 3}
                          aria-label={`Delete vertex ${index + 1}`}
                          title={selectedEntity.vertices.length <= 3 ? 'Polygon needs at least 3 vertices' : `Delete vertex ${index + 1}`}
                        >
                          <Trash2 size={15} aria-hidden="true" />
                        </button>
                      </div>
                    ))}
                    <button className="btn-secondary icon-button" onClick={addSelectedPolygonVertex}>
                      <Plus className="button-icon" size={16} aria-hidden="true" />
                      Add Vertex
                    </button>
                  </div>
                )}
              </>
            )}

            {selectedEntity && (
              <button className="btn-danger icon-button" onClick={deleteSelected}>
                <Trash2 className="button-icon" size={16} aria-hidden="true" />
                Delete Selected
              </button>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
