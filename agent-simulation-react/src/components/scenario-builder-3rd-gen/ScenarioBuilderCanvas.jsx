import { useEffect, useRef } from 'react';
import { configureHighDpiCanvas } from '../../utils/utilities.js';
import {
  SCENARIO_CANVAS_HEIGHT,
  SCENARIO_CANVAS_WIDTH,
} from '../../utils/scenarioBuilderAgents.js';
import styles from '../../styles/3rd-gen/simulation.module.css';

function drawAgent(ctx, agent, isPreview) {
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
  ctx.strokeStyle = isPreview ? '#4f86d7' : agent.colorHex;
  ctx.lineWidth = 2;
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

function drawObstacle(ctx, obstacle, isPreview) {
  ctx.save();
  ctx.globalAlpha = isPreview ? 0.45 : 1;
  ctx.fillStyle = obstacle.color;
  ctx.strokeStyle = isPreview ? '#4f86d7' : '#222222';
  ctx.lineWidth = 2;
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
  ctx.restore();
}

function drawScenario(
  ctx,
  agents,
  obstacles,
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

  obstacles.forEach((obstacle) => drawObstacle(ctx, obstacle, false));
  agents.forEach((agent) => drawAgent(ctx, agent, false));

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

  previewAgents.forEach((agent) => drawAgent(ctx, agent, true));
  if (previewObstacle) drawObstacle(ctx, previewObstacle, true);
}

export default function ScenarioBuilderCanvas({
  agents,
  obstacles,
  previewAgents,
  previewRange,
  previewObstacle,
}) {
  const canvasRef = useRef(null);
  const contextRef = useRef(null);

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
      previewAgents,
      previewRange,
      previewObstacle
    );
  }, [agents, obstacles, previewAgents, previewRange, previewObstacle]);

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
        />
      </div>
    </figure>
  );
}
