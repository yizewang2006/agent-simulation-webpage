import { useEffect, useRef } from 'react';
import { ENTITY_TYPES } from '../../utils/constants.js';
import {
  findEntityAt,
  findObstacleEditHandle,
  getLookAtCursorAngle,
} from '../../utils/canvasInteractionUtilities.js';
import {
  configureHighDpiCanvas,
  getCanvasPointFromEvent,
} from '../../utils/utilities.js';
import {
  SCENARIO_CANVAS_HEIGHT,
  SCENARIO_CANVAS_WIDTH,
} from '../../utils/scenarioBuilderEntityUtilities.js';
import styles from '../../styles/3rd-gen/simulation.module.css';

function drawAgent(ctx, agent, { isPreview = false, isSelected = false } = {}) {
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
  ctx.strokeStyle = isPreview || isSelected ? '#4f86d7' : agent.colorHex;
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

function drawObstacle(ctx, obstacle, { isPreview = false, isSelected = false } = {}) {
  ctx.save();
  ctx.globalAlpha = isPreview ? 0.45 : 1;
  ctx.fillStyle = obstacle.color;
  ctx.strokeStyle = isPreview || isSelected ? '#4f86d7' : '#222222';
  ctx.lineWidth = isSelected ? 3 : 2;
  if (isPreview) ctx.setLineDash([8, 6]);

  ctx.beginPath();
  if (obstacle.shapeType === 'circle') {
    ctx.arc(
      obstacle.center.x,
      obstacle.center.y,
      obstacle.radius,
      0,
      Math.PI * 2
    );
  } else {
    ctx.moveTo(obstacle.vertices[0].x, obstacle.vertices[0].y);
    obstacle.vertices.slice(1).forEach((vertex) => ctx.lineTo(vertex.x, vertex.y));
    ctx.closePath();
  }
  ctx.fill();
  ctx.stroke();

  if (isSelected && !isPreview) {
    const handles = obstacle.center
      ? [
          { x: obstacle.center.x, y: obstacle.center.y - obstacle.radius },
          { x: obstacle.center.x + obstacle.radius, y: obstacle.center.y },
          { x: obstacle.center.x, y: obstacle.center.y + obstacle.radius },
          { x: obstacle.center.x - obstacle.radius, y: obstacle.center.y },
        ]
      : obstacle.vertices;

    handles.forEach((handle) => {
      ctx.beginPath();
      ctx.arc(handle.x, handle.y, 5, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = '#4f86d7';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  }

  ctx.restore();
}

function drawScenario(
  ctx,
  agents,
  obstacles,
  selection,
  previewAgents,
  previewRange,
  previewObstacle
) {
  ctx.clearRect(0, 0, SCENARIO_CANVAS_WIDTH, SCENARIO_CANVAS_HEIGHT);

  ctx.save();
  ctx.strokeStyle = '#eef0f4';
  ctx.lineWidth = 1;
  for (let tick = 50; tick < SCENARIO_CANVAS_WIDTH; tick += 50) {
    ctx.beginPath();
    ctx.moveTo(tick, 0);
    ctx.lineTo(tick, SCENARIO_CANVAS_HEIGHT);
    ctx.moveTo(0, tick);
    ctx.lineTo(SCENARIO_CANVAS_WIDTH, tick);
    ctx.stroke();
  }
  ctx.restore();

  obstacles.forEach((obstacle) => drawObstacle(ctx, obstacle, {
    isSelected:
      selection?.entityType === ENTITY_TYPES.OBSTACLE
      && selection.id === obstacle.id,
  }));
  agents.forEach((agent) => drawAgent(ctx, agent, {
    isSelected:
      selection?.entityType === ENTITY_TYPES.AGENT
      && selection.id === agent.id,
  }));

  if (previewRange) {
    ctx.save();
    ctx.fillStyle = 'rgba(79, 134, 215, 0.08)';
    ctx.strokeStyle = '#4f86d7';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.strokeRect(
      previewRange.xMin,
      previewRange.yMin,
      previewRange.xMax - previewRange.xMin,
      previewRange.yMax - previewRange.yMin
    );
    ctx.fillRect(
      previewRange.xMin,
      previewRange.yMin,
      previewRange.xMax - previewRange.xMin,
      previewRange.yMax - previewRange.yMin
    );
    ctx.restore();
  }

  previewAgents.forEach((agent) => drawAgent(ctx, agent, { isPreview: true }));
  if (previewObstacle) drawObstacle(ctx, previewObstacle, { isPreview: true });
}

export default function ScenarioBuilderCanvas({
  agents,
  obstacles,
  selection,
  onSelectEntity,
  onMoveEntity,
  onLookAtAgent,
  onEditObstacle,
  lookAtAgentId,
  onToggleLookAtAgent,
  onCancelLookAtAgent,
  onBeginEntityEdit,
  onEndEntityEdit,
  previewAgents,
  previewRange,
  previewObstacle,
}) {
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const dragRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    contextRef.current = context;
    configureHighDpiCanvas(
      canvas,
      context,
      SCENARIO_CANVAS_WIDTH,
      SCENARIO_CANVAS_HEIGHT
    );
  }, []);

  useEffect(() => {
    if (!contextRef.current) return;
    drawScenario(
      contextRef.current,
      agents,
      obstacles,
      selection,
      previewAgents,
      previewRange,
      previewObstacle
    );
  }, [agents, obstacles, selection, previewAgents, previewRange, previewObstacle]);

  // This function selects an Entity and starts dragging it.
  function handlePointerDown(event) {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const point = getCanvasPointFromEvent(event, canvas);
    const selectedObstacle = selection?.entityType === ENTITY_TYPES.OBSTACLE
      ? obstacles.find((obstacle) => obstacle.id === selection.id)
      : null;
    const editHandle = selectedObstacle
      ? findObstacleEditHandle(point, selectedObstacle)
      : null;

    if (editHandle) {
      onCancelLookAtAgent();
      onBeginEntityEdit(ENTITY_TYPES.OBSTACLE, selectedObstacle.id);
      dragRef.current = {
        ...editHandle,
        obstacleId: selectedObstacle.id,
        pointerId: event.pointerId,
      };
      event.currentTarget.setPointerCapture(event.pointerId);
      event.preventDefault();
      return;
    }

    const entity = findEntityAt(point, [...obstacles, ...agents]);

    if (
      lookAtAgentId
      && entity?.id !== lookAtAgentId
    ) {
      onCancelLookAtAgent();
    }

    if (!entity) {
      onSelectEntity(null);
      dragRef.current = null;
      return;
    }

    onSelectEntity({ entityType: entity.entityType, id: entity.id });
    if (entity.id === lookAtAgentId) {
      dragRef.current = null;
      return;
    }

    onBeginEntityEdit(entity.entityType, entity.id);
    dragRef.current = {
      entityType: entity.entityType,
      id: entity.id,
      previous: point,
      pointerId: event.pointerId,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
  }

  // This function moves the selected Entity with the pointer.
  function handlePointerMove(event) {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const point = getCanvasPointFromEvent(event, canvas);
    const lookAtAgent = agents.find((agent) => agent.id === lookAtAgentId);
    if (lookAtAgent && (point.x !== lookAtAgent.x || point.y !== lookAtAgent.y)) {
      onLookAtAgent(lookAtAgent.id, getLookAtCursorAngle(lookAtAgent, point));
    }

    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    if (drag.mode) {
      onEditObstacle(drag.obstacleId, drag, point);
      event.preventDefault();
      return;
    }

    const dx = point.x - drag.previous.x;
    const dy = point.y - drag.previous.y;
    drag.previous = point;
    onMoveEntity(drag.entityType, drag.id, dx, dy);
    event.preventDefault();
  }

  // This function ends the current Entity drag.
  function handlePointerUp(event) {
    const drag = dragRef.current;
    if (drag?.pointerId !== event.pointerId) return;

    onEndEntityEdit(
      drag.mode ? ENTITY_TYPES.OBSTACLE : drag.entityType,
      drag.mode ? drag.obstacleId : drag.id
    );
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  // This function toggles Look At Cursor for a double-clicked Agent.
  function handleDoubleClick(event) {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const point = getCanvasPointFromEvent(event, canvas);
    const agent = findEntityAt(point, agents);
    if (!agent) return;

    onToggleLookAtAgent(agent.id);
    dragRef.current = null;
    event.preventDefault();
  }

  return (
    <figure className={styles.canvasWrapper}>
      <figcaption className={styles.canvasSize}>
        Scenario Size: {SCENARIO_CANVAS_WIDTH} × {SCENARIO_CANVAS_HEIGHT}
      </figcaption>

      <div className={styles.canvasFrame}>
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          aria-label="Scenario editing canvas"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onDoubleClick={handleDoubleClick}
        />
      </div>
    </figure>
  );
}
