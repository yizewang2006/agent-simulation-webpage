export const SCENARIO_CANVAS_WIDTH = 500;
export const SCENARIO_CANVAS_HEIGHT = 500;
export const MAX_SCENARIO_AGENTS = 500;

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

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
  if (values.fovAngle === '' || config.fovAngle < 0 || config.fovAngle > 360) {
    throw new Error('FOV Angle must be between 0 and 360 degrees.');
  }

  return config;
}

export function createAgentDrafts(config) {
  return Array.from({ length: config.count }, () => ({
    kind: 'agent',
    x: randomBetween(config.xMin, config.xMax),
    y: randomBetween(config.yMin, config.yMax),
    radius: 5,
    angle: randomBetween(config.angleMin, config.angleMax),
    speed: randomBetween(config.speedMin, config.speedMax),
    colorHex: config.colorHex,
    fovRadius: 100,
    fovAngle: config.fovAngle,
    showFOV: config.showFOV,
  }));
}

export function getAgentCreationKey(config) {
  return JSON.stringify(config);
}

export function getAgentPreviewRange(config) {
  return {
    xMin: config.xMin,
    xMax: config.xMax,
    yMin: config.yMin,
    yMax: config.yMax,
  };
}
