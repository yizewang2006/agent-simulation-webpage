import assert from 'node:assert/strict';
import test from 'node:test';

import { Agent } from '../src/models/agent.js';
import { getEntityCenterPoint } from '../src/models/behavior.js';
import { Entity } from '../src/models/entity.js';
import { Obstacle } from '../src/models/obstacle.js';
import { CircleShape, PolygonShape } from '../src/models/shapes.js';
import {
  findRuntimeEntityAt,
  getDraggedRuntimeEntityPosition,
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

  agent.move(100, 100);

  assert.deepEqual(agent.transform.position, { x: 2, y: 2 });
  assert.deepEqual(agent.velocity, { x: 3, y: 4 });
  assert.equal(agent.transform.rotation, Math.atan2(4, 3));
});

test('Entity owns movement, static motion, and virtual offsets', () => {
  const movingEntity = new Entity(
    'entity-1',
    'Moving Entity',
    'test-entity',
    { x: 95, y: 20 },
    Math.PI / 4,
    { x: 8, y: 0 },
    [new CircleShape(5)]
  );
  movingEntity.move(100, 100);

  assert.deepEqual(movingEntity.transform.position, { x: 3, y: 20 });
  assert.equal(movingEntity.transform.rotation, Math.PI / 4);
  assert.deepEqual(movingEntity.getVirtualOffsets(100, 100), [{ x: 100, y: 0 }]);

  const staticEntity = new Entity(
    'entity-2',
    'Static Entity',
    'test-entity',
    { x: 30, y: 40 },
    0,
    { x: 0, y: 0 },
    [new CircleShape(5)]
  );
  staticEntity.move(100, 100);

  assert.deepEqual(staticEntity.transform.position, { x: 30, y: 40 });
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
  const polygon = Obstacle.createPolygon('obstacle-1', 'Polygon', [
    { x: 10, y: 10 },
    { x: 20, y: 10 },
    { x: 20, y: 20 },
    { x: 10, y: 20 },
  ]);

  assert.equal(findRuntimeEntityAt({ x: 10, y: 20 }, [agent]), agent);
  assert.deepEqual(
    getDraggedRuntimeEntityPosition(agent, { x: 25, y: 15 }, 100, 100),
    { x: 25, y: 15 }
  );
  assert.deepEqual(
    getDraggedRuntimeEntityPosition(agent, { x: -10, y: 120 }, 100, 100),
    { x: 5, y: 95 }
  );
  assert.deepEqual(
    getDraggedRuntimeEntityPosition(polygon, { x: -15, y: -15 }, 100, 100),
    { x: 5, y: 5 }
  );

  agent.transform.position = getDraggedRuntimeEntityPosition(
    agent,
    { x: 120, y: 20 },
    100,
    100
  );
  assert.deepEqual(
    getDraggedRuntimeEntityPosition(agent, { x: 99, y: 20 }, 100, 100),
    { x: 95, y: 20 }
  );
  assert.deepEqual(
    getDraggedRuntimeEntityPosition(agent, { x: 94, y: 20 }, 100, 100),
    { x: 94, y: 20 }
  );
});
