import { ENTITY_ID_PREFIXES, ENTITY_TYPES, SHAPE_TYPES } from './constants.js';

// Checks if the scenario data is an Object, and throws an error if not. Returns the value if it is an Object.
function requireObject(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must be an object.`);
  }
  return value;
}

// Checks if the value is a finite number
function requireFiniteNumber(value, label) {
  const number = Number(value);
  if (!Number.isFinite(number)) throw new Error(`${label} must be a valid number.`);
  return number;
}

function requireNonEmptyString(value, label) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${label} must be a non-empty string.`);
  }
  return value.trim();
}

function requireEntityId(value, label, prefix) {
  const id = requireNonEmptyString(value, label);
  if (!id.startsWith(`${prefix}-`)) {
    throw new Error(`${label} must start with ${prefix}-.`);
  }
  return id;
}

// Check if the {x, y} point is within the canvas bounds
function requirePoint(value, label, canvasWidth, canvasHeight) {
  const point = requireObject(value, label);
  const x = requireFiniteNumber(point.x, `${label} X`);
  const y = requireFiniteNumber(point.y, `${label} Y`);
  if (x < 0 || x > canvasWidth || y < 0 || y > canvasHeight) {
    throw new Error(`${label} must be within the ${canvasWidth} × ${canvasHeight} canvas.`);
  }
  return { x, y };
}

// Converts the agent data to a standard format.
function normalizeAgent(agent, index, canvasWidth, canvasHeight) {
  requireObject(agent, `Agent ${index + 1}`);
  if (agent.entityType !== ENTITY_TYPES.AGENT) {
    throw new Error(`Agent ${index + 1} must have the Agent entity type.`);
  }
  const x = requireFiniteNumber(agent.x, `Agent ${index + 1} X`);
  const y = requireFiniteNumber(agent.y, `Agent ${index + 1} Y`);
  if (x < 0 || x > canvasWidth || y < 0 || y > canvasHeight) {
    throw new Error(`Agent ${index + 1} must be within the canvas.`);
  }
  const angle = requireFiniteNumber(agent.angle, `Agent ${index + 1} heading`);
  if (angle < 0 || angle > 360) {
    throw new Error(`Agent ${index + 1} heading must be between 0 and 360 degrees.`);
  }

  return {
    entityType: ENTITY_TYPES.AGENT,
    id: requireEntityId(
      agent.id,
      `Agent ${index + 1} ID`,
      ENTITY_ID_PREFIXES[ENTITY_TYPES.AGENT]
    ),
    name: requireNonEmptyString(agent.name, `Agent ${index + 1} name`),
    x,
    y,
    radius: Math.max(1, requireFiniteNumber(agent.radius ?? 5, `Agent ${index + 1} radius`)),
    angle,
    speed: Math.max(0, requireFiniteNumber(agent.speed ?? 1.5, `Agent ${index + 1} speed`)),
    colorHex: typeof agent.colorHex === 'string' ? agent.colorHex : '#000000',
    fovRadius: Math.max(0, requireFiniteNumber(agent.fovRadius ?? 100, `Agent ${index + 1} FOV radius`)),
    fovAngle: Math.max(0, requireFiniteNumber(agent.fovAngle ?? 150, `Agent ${index + 1} FOV angle`)),
    showFOV: agent.showFOV !== false,
  };
}

// Does the same thing for obstacles, but also checks the shape type and validates the properties accordingly.
function normalizeObstacle(obstacle, index, canvasWidth, canvasHeight) {
  requireObject(obstacle, `Obstacle ${index + 1}`);
  if (obstacle.entityType !== ENTITY_TYPES.OBSTACLE) {
    throw new Error(`Obstacle ${index + 1} must have the Obstacle entity type.`);
  }
  const isCircle = obstacle.shapeType === 'circle' || obstacle.shapeType === SHAPE_TYPES.CIRCLE;
  const isPolygon = obstacle.shapeType === 'polygon' || obstacle.shapeType === SHAPE_TYPES.POLYGON;
  if (!isCircle && !isPolygon) throw new Error(`Obstacle ${index + 1} has an unsupported shape type.`);

  // Base properties for both circle and polygon obstacles
  const base = {
    entityType: ENTITY_TYPES.OBSTACLE,
    id: requireEntityId(
      obstacle.id,
      `Obstacle ${index + 1} ID`,
      ENTITY_ID_PREFIXES[ENTITY_TYPES.OBSTACLE]
    ),
    name: requireNonEmptyString(obstacle.name, `Obstacle ${index + 1} name`),
    color: typeof obstacle.color === 'string' ? obstacle.color : '#ACAD9D',
  };

  if (isCircle) {
    const radius = requireFiniteNumber(obstacle.radius, `Obstacle ${index + 1} radius`);
    if (radius <= 0) throw new Error(`Obstacle ${index + 1} radius must be greater than 0.`);
    return {
      ...base,
      shapeType: 'circle',
      center: requirePoint(obstacle.center, `Obstacle ${index + 1} center`, canvasWidth, canvasHeight),
      radius,
    };
  }

  if (!Array.isArray(obstacle.vertices) || obstacle.vertices.length < 3) {
    throw new Error(`Obstacle ${index + 1} must contain at least 3 vertices.`);
  }
  return {
    ...base,
    shapeType: 'polygon',
    vertices: obstacle.vertices.map((vertex, vertexIndex) => (
      requirePoint(vertex, `Obstacle ${index + 1}, vertex ${vertexIndex + 1}`, canvasWidth, canvasHeight)
    )),
  };
}

// This function validates Scenario JSON and returns the current Scenario schema.
export function parseScenarioData(data, { canvasWidth = 500, canvasHeight = 500, maxAgents = 500 } = {}) {
  const scenario = requireObject(data, 'Scenario');
  const name = requireNonEmptyString(scenario.name, 'Scenario name');
  const canvas = requireObject(scenario.canvas, 'Scenario canvas');
  const width = requireFiniteNumber(canvas.width, 'Scenario canvas width');
  const height = requireFiniteNumber(canvas.height, 'Scenario canvas height');
  if (width !== canvasWidth || height !== canvasHeight) {
    throw new Error(`Scenario canvas must be ${canvasWidth} × ${canvasHeight}.`);
  }
  if (!Array.isArray(scenario.agents) || !Array.isArray(scenario.obstacles)) {
    throw new Error('Scenario JSON must contain agents and obstacles arrays.');
  }
  if (scenario.agents.length > maxAgents) {
    throw new Error(`Scenario contains ${scenario.agents.length} agents; the limit is ${maxAgents}.`);
  }

  const agents = scenario.agents.map((agent, index) => normalizeAgent(agent, index, canvasWidth, canvasHeight));
  const obstacles = scenario.obstacles.map((obstacle, index) => normalizeObstacle(obstacle, index, canvasWidth, canvasHeight));
  const entityIds = [...agents, ...obstacles].map((entity) => entity.id);
  if (new Set(entityIds).size !== entityIds.length) {
    throw new Error('Scenario entity IDs must be unique.');
  }

  return {
    name,
    canvas: { width, height },
    agents,
    obstacles,
  };
}

// This function reads and validates a Scenario JSON file.
export async function loadScenarioFile(file, options) {
  if (!file) throw new Error('Choose a scenario JSON file first.');
  if (!file.name.toLowerCase().endsWith('.json')) throw new Error('Scenario files must use the .json extension.'); // If the file is not JSON file, reject it.

  let data;
  try {
    data = JSON.parse(await file.text());
  } catch {
    throw new Error('The selected file does not contain valid JSON.');
  }
  return parseScenarioData(data, options);
}

// This function creates one validated Scenario document for export.
export function createScenarioDocument({ name, canvas, agents, obstacles }) {
  return parseScenarioData(
    { name, canvas, agents, obstacles },
    {
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
    }
  );
}

// This function downloads a Scenario document as a JSON file.
export function downloadScenarioFile(scenario) {
  const blob = new Blob(
    [JSON.stringify(scenario, null, 2)],
    { type: 'application/json' }
  );
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${scenario.name.replace(/[\\/]/g, '-')}.json`;
  link.click();
  URL.revokeObjectURL(url);
}
