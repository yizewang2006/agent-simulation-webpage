import assert from 'node:assert/strict';
import test from 'node:test';

import { Agent } from '../src/models/agent.js';
import { getEntityCenterPoint } from '../src/models/behavior.js';
import { CircleObstacle, PolygonObstacle } from '../src/models/obstacle.js';
import {
  findRuntimeEntityAt,
  getDraggedRuntimeEntityGeometry,
} from '../src/utils/runtimeCanvasInteractionUtilities.js';

const canvas = { logicalWidth: 100, logicalHeight: 100 };

test('all runtime Entities expose the same position structure', () => {
  const agent = new Agent(false, 10, 20, 5, 1, 2, '#000000', 100, Math.PI, 0, 'agent-1', 'Agent 1', null, canvas);
  const circle = new CircleObstacle('obstacle-1', 'Circle', { x: 30, y: 40 }, 5, '#FF4444', null);
  const polygon = new PolygonObstacle('obstacle-2', 'Polygon', [
    { x: 0, y: 0 },
    { x: 6, y: 0 },
    { x: 0, y: 6 },
  ], '#FF4444', null);

  assert.deepEqual(getEntityCenterPoint(agent), { x: 10, y: 20 });
  assert.deepEqual(getEntityCenterPoint(circle), { x: 30, y: 40 });
  assert.deepEqual(getEntityCenterPoint(polygon), { x: 2, y: 2 });
});

test('Agent movement updates shared transform and velocity state', () => {
  const agent = new Agent(false, 99, 98, 5, 3, 4, '#000000', 100, Math.PI, 0, 'agent-1', 'Agent 1', null, canvas);

  agent.move();

  assert.deepEqual(agent.transform.position, { x: 2, y: 2 });
  assert.deepEqual(agent.velocity, { x: 3, y: 4 });
  assert.equal(agent.transform.rotation, Math.atan2(4, 3));
});

test('Agent decisions update shared rotation and velocity state together', () => {
  const agent = new Agent(false, 10, 20, 5, 1, 0, '#000000', 100, Math.PI, 0, 'agent-1', 'Agent 1', null, canvas);

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
  const agent = new Agent(false, 10, 20, 5, 0, 0, '#000000', 100, Math.PI, 0, 'agent-1', 'Agent 1', null, canvas);

  assert.equal(findRuntimeEntityAt({ x: 10, y: 20 }, [agent]), agent);
  assert.deepEqual(
    getDraggedRuntimeEntityGeometry(agent, 15, -5, 100, 100),
    { position: { x: 25, y: 15 } }
  );
});
