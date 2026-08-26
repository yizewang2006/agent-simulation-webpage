import { ENTITY_TYPES } from './constants.js';

export const SCENARIO_CANVAS_WIDTH = 500;
export const SCENARIO_CANVAS_HEIGHT = 500;
export const MAX_SCENARIO_AGENTS = 500;

// This function parses and validates the Agent creation form.
export function parseAgentCreationValues(values) {
  const config = {
    count: Number(values.count),
    xMin: Number(values.xMin),
    xMax: Number(values.xMax),
    yMin: Number(values.yMin),
    yMax: Number(values.yMax),
    speedMin: Number(values.speedMin),
    speedMax: Number(values.speedMax),
    angleMin: Number(values.angleMin),
    angleMax: Number(values.angleMax),
    fovRadius: Number(values.fovRadius),
    fovAngle: Number(values.fovAngle),
    colorHex: values.color,
    showFOV: Boolean(values.showFOV),
  };

  const numericValues = [
    config.count,
    config.xMin,
    config.xMax,
    config.yMin,
    config.yMax,
    config.speedMin,
    config.speedMax,
    config.angleMin,
    config.angleMax,
    config.fovRadius,
    config.fovAngle,
  ];

  if (!numericValues.every(Number.isFinite)) {
    throw new Error('Complete every numeric Agent field.');
  }
  if (!Number.isInteger(config.count) || config.count < 1) {
    throw new Error('Number of Agents must be a whole number greater than zero.');
  }
  if (
    config.xMin < 0
    || config.xMax > SCENARIO_CANVAS_WIDTH
    || config.xMin > config.xMax
  ) {
    throw new Error(`X spawn range must stay between 0 and ${SCENARIO_CANVAS_WIDTH}, with Min no greater than Max.`);
  }
  if (
    config.yMin < 0
    || config.yMax > SCENARIO_CANVAS_HEIGHT
    || config.yMin > config.yMax
  ) {
    throw new Error(`Y spawn range must stay between 0 and ${SCENARIO_CANVAS_HEIGHT}, with Min no greater than Max.`);
  }
  if (config.speedMin < 0 || config.speedMin > config.speedMax) {
    throw new Error('Initial Speed Min must be non-negative and no greater than Max.');
  }
  if (config.angleMin > config.angleMax) {
    throw new Error('Initial Angle Min cannot be greater than Max.');
  }
  if (values.fovRadius === '' || config.fovRadius < 0) {
    throw new Error('FOV Radius must be non-negative.');
  }
  if (values.fovAngle === '' || config.fovAngle < 0 || config.fovAngle > 360) {
    throw new Error('FOV Angle must be between 0 and 360 degrees.');
  }

  return config;
}

// This function creates randomized Agent drafts for preview and creation.
export function createAgentDrafts(config) {
  return Array.from({ length: config.count }, () => ({
    entityType: ENTITY_TYPES.AGENT,
    x: config.xMin + Math.random() * (config.xMax - config.xMin),
    y: config.yMin + Math.random() * (config.yMax - config.yMin),
    radius: 5,
    angle: config.angleMin + Math.random() * (config.angleMax - config.angleMin),
    speed: config.speedMin + Math.random() * (config.speedMax - config.speedMin),
    colorHex: config.colorHex,
    fovRadius: config.fovRadius,
    fovAngle: config.fovAngle,
    showFOV: config.showFOV,
  }));
}

// This function returns the spawn range drawn behind an Agent preview.
export function getAgentPreviewRange(config) {
  return {
    xMin: config.xMin,
    xMax: config.xMax,
    yMin: config.yMin,
    yMax: config.yMax,
  };
}

// This function parses and validates the Obstacle creation form.
export function parseObstacleCreationValues(values) {
  const common = {
    entityType: ENTITY_TYPES.OBSTACLE,
    shapeType: values.shape,
    name: values.name.trim(),
    color: values.color,
  };

  if (values.shape === 'circle') {
    const center = {
      x: Number(values.centerX),
      y: Number(values.centerY),
    };
    const radius = Number(values.radius);

    if (!Number.isFinite(center.x) || !Number.isFinite(center.y)) {
      throw new Error('Circle Center X and Y must be valid numbers.');
    }
    if (!Number.isFinite(radius) || radius <= 0) {
      throw new Error('Circle Radius must be greater than zero.');
    }
    if (
      center.x - radius < 0
      || center.x + radius > SCENARIO_CANVAS_WIDTH
      || center.y - radius < 0
      || center.y + radius > SCENARIO_CANVAS_HEIGHT
    ) {
      throw new Error('The circle must fit completely inside the canvas.');
    }

    return { ...common, center, radius };
  }

  if (values.vertices.length < 3) {
    throw new Error('A polygon needs at least three vertices.');
  }

  const vertices = values.vertices.map((vertex, index) => {
    const x = Number(vertex.x);
    const y = Number(vertex.y);

    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      throw new Error(`Vertex ${index + 1} needs valid X and Y values.`);
    }
    if (
      x < 0
      || x > SCENARIO_CANVAS_WIDTH
      || y < 0
      || y > SCENARIO_CANVAS_HEIGHT
    ) {
      throw new Error(`Vertex ${index + 1} must stay inside the canvas.`);
    }

    return { x, y };
  });

  return { ...common, vertices };
}
