import {
  SCENARIO_CANVAS_HEIGHT,
  SCENARIO_CANVAS_WIDTH,
} from './scenarioBuilderAgents.js';

export function parseObstacleCreationValues(values) {
  const common = {
    kind: 'obstacle',
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
