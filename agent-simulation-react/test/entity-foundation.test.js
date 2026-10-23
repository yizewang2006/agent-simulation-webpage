import assert from 'node:assert/strict';
import test from 'node:test';

import { Agent } from '../src/models/agent.js';
import { getEntityCenterPoint } from '../src/models/behavior.js';
import { Obstacle } from '../src/models/obstacle.js';
import { CircleShape, PolygonShape } from '../src/models/shapes.js';
import {
  findRuntimeEntityAt,
  getDraggedRuntimeEntityGeometry,
} from '../src/utils/runtimeCanvasInteractionUtilities.js';

const canvas = { logicalWidth: 100, logicalHeight: 100 };

test('all runtime Entities expose the same position structure', () => {
  const agent = new Agent(false, 10, 20, 5, 1, 2, '#000000', 100, Math.PI, 0, 'agent-1', 'Agent 1', canvas);
  const circle = Obstacle.createCircle('obstacle-1', 'Circle', { x: 30, y: 40 }, 5, '#FF4444');
  const polygon = Obstacle.createPolygon('obstacle-2', 'Polygon', [
    { x: 0, y: 0 },
    { x: 6, y: 0 },
    { x: 0, y: 6 },
  ], '#FF4444');

  assert.deepEqual(getEntityCenterPoint(agent), { x: 10, y: 20 });
  assert.deepEqual(getEntityCenterPoint(circle), { x: 30, y: 40 });
  assert.deepEqual(getEntityCenterPoint(polygon), { x: 2, y: 2 });
});

test('Polygon Shape stores local vertices and calculates world vertices', () => {
  const polygon = Obstacle.createPolygon('obstacle-2', 'Polygon', [
    { x: 0, y: 0 },
    { x: 6, y: 0 },
    { x: 0, y: 6 },
  ]);

  assert.deepEqual(polygon.shapes[0].vertices, [
    { x: -2, y: -2 },
    { x: 4, y: -2 },
    { x: -2, y: 4 },
  ]);
  assert.deepEqual(
    polygon.shapes[0].getWorldVertices(polygon.transform),
    [{ x: 0, y: 0 }, { x: 6, y: 0 }, { x: 0, y: 6 }]
  );
  assert.deepEqual(polygon.getBounds(), {
    minX: 0,
    minY: 0,
    maxX: 6,
    maxY: 6,
  });
});

test('Entity calculations include every Shape', () => {
  const obstacle = new Obstacle(
    'obstacle-3',
    'Compound',
    { x: 50, y: 50 },
    [
      new CircleShape(5, { x: -10, y: 0 }),
      new PolygonShape([
        { x: 5, y: -5 },
        { x: 15, y: -5 },
        { x: 10, y: 5 },
      ]),
    ]
  );

  assert.equal(obstacle.containsPoint({ x: 40, y: 50 }), true);
  assert.equal(obstacle.containsPoint({ x: 60, y: 50 }), true);
  assert.deepEqual(obstacle.getBounds(), {
    minX: 35,
    minY: 45,
    maxX: 65,
    maxY: 55,
  });
});

test('Agent movement updates shared transform and velocity state', () => {
  const agent = new Agent(false, 99, 98, 5, 3, 4, '#000000', 100, Math.PI, 0, 'agent-1', 'Agent 1', canvas);

  agent.move();

  assert.deepEqual(agent.transform.position, { x: 2, y: 2 });
  assert.deepEqual(agent.velocity, { x: 3, y: 4 });
  assert.equal(agent.transform.rotation, Math.atan2(4, 3));
});

test('Agent decisions update shared rotation and velocity state together', () => {
  const agent = new Agent(false, 10, 20, 5, 1, 0, '#000000', 100, Math.PI, 0, 'agent-1', 'Agent 1', canvas);

  agent.applyDecision({
    activeBehaviorGroups: {},
    finalAngle: Math.PI / 2,
    finalSpeed: 2,
    finalSteeringAngle: Math.PI / 2,
  });

  assert.equal(agent.transform.rotation, Math.PI / 2);
  assert.equal(agent.runtimeState.steeringRotation, Math.PI / 2);
  assert.ok(Math.abs(agent.velocity.x) < Number.EPSILON * 10);
  assert.equal(agent.velocity.y, 2);
});

test('runtime Canvas interaction reads the shared transform', () => {
  const agent = new Agent(false, 10, 20, 5, 0, 0, '#000000', 100, Math.PI, 0, 'agent-1', 'Agent 1', canvas);

  assert.equal(findRuntimeEntityAt({ x: 10, y: 20 }, [agent]), agent);
  assert.deepEqual(
    getDraggedRuntimeEntityGeometry(agent, 15, -5, 100, 100),
    { position: { x: 25, y: 15 } }
  );
});
