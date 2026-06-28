import { useState, useEffect, useRef } from 'react';
import { CircleObstacle, PolygonObstacle } from '../js_files/obstacle.js';

// JSON formatted presets for common polygons (rectangle & triangle)

const RECTANGLE_TEMPLATE = `[
  { "x": 180, "y": 220 },
  { "x": 320, "y": 220 },
  { "x": 320, "y": 260 },
  { "x": 180, "y": 260 }
]`;

const TRIANGLE_TEMPLATE = `[
  { "x": 250, "y": 180 },
  { "x": 330, "y": 320 },
  { "x": 170, "y": 320 }
]`;

export default function ObstacleCard({ ctxRef, obstaclesArrayRef, canvasWidth, canvasHeight, onObstaclesChanged, onClose }) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#ACAD9D');
  const [shapeType, setShapeType] = useState('polygon');
  const [verticesText, setVerticesText] = useState(RECTANGLE_TEMPLATE);
  const [circleCenterX, setCircleCenterX] = useState(250);
  const [circleCenterY, setCircleCenterY] = useState(250);
  const [circleRadius, setCircleRadius] = useState(45);
  const [error, setError] = useState('');
  const cardRef = useRef(null);

  useEffect(() => {
    cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  function handleUseRectangleTemplate() {
    setVerticesText(RECTANGLE_TEMPLATE);
    setError('');
  }

  function handleUseTriangleTemplate() {
    setVerticesText(TRIANGLE_TEMPLATE);
    setError('');
  }

  // Temporary function to parse JSON vertices
  function parseVertices() {
    const parsedVertices = JSON.parse(verticesText);
    if (!Array.isArray(parsedVertices) || parsedVertices.length < 3) {
      throw new Error('Obstacle needs at least 3 vertices.');
    }

    parsedVertices.forEach((vertex, index) => {
      const x = Number(vertex.x);
      const y = Number(vertex.y);
      if (!Number.isFinite(x) || !Number.isFinite(y)) {
        throw new Error(`Vertex ${index + 1} needs numeric x and y values.`);
      }
      if (x < 0 || x > canvasWidth || y < 0 || y > canvasHeight) {
        throw new Error(`Vertex ${index + 1} is outside the canvas.`);
      }
    });

    return parsedVertices.map((vertex) => ({
      x: Number(vertex.x),
      y: Number(vertex.y),
    }));
  }

  function parseCircle() {
    const x = Number(circleCenterX);
    const y = Number(circleCenterY);
    const radius = Number(circleRadius);

    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      throw new Error('Circle center needs numeric x and y values.');
    }
    if (!Number.isFinite(radius) || radius <= 0) {
      throw new Error('Circle radius must be a positive number.');
    }
    if (x - radius < 0 || x + radius > canvasWidth || y - radius < 0 || y + radius > canvasHeight) {
      throw new Error('Circle must fit inside the canvas.');
    }

    return { center: { x, y }, radius };
  }

  function handleCreateObstacle() {
    try {
      const ctx = ctxRef.current;
      if (!ctx) throw new Error('Canvas context is not ready.');

      const obstacleName = name.trim() || `Obstacle_${obstaclesArrayRef.current.length + 1}`;
      let obstacle;

      if (shapeType === 'circle') {
        const { center, radius } = parseCircle();
        obstacle = new CircleObstacle(obstacleName, center, radius, color, ctx);
      } else {
        const vertices = parseVertices();
        obstacle = new PolygonObstacle(obstacleName, vertices, color, ctx);
      }

      obstaclesArrayRef.current.push(obstacle);
      onObstaclesChanged([...obstaclesArrayRef.current]);
      onClose();
    } catch (err) {
      setError(err.message);
    }
  }

  // HTML page
  return (
    <div ref={cardRef} className="panel-card panel-card-highlight">
      <h2 className="panel-section-title">Create Obstacle</h2>

      <div className="input-group">
        <label>Obstacle Name</label>
        <input type="text" placeholder="e.g. Wall_01" value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      <div className="input-group">
        <label>Color</label>
        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
      </div>

      <div className="input-group">
        <label>Shape</label>
        <div className="radio-group">
          <label className="radio-option">
            <input
              type="radio"
              name="obstacle-shape"
              value="polygon"
              checked={shapeType === 'polygon'}
              onChange={() => {
                setShapeType('polygon');
                setError('');
              }}
            />
            Polygon
          </label>
          <label className="radio-option">
            <input
              type="radio"
              name="obstacle-shape"
              value="circle"
              checked={shapeType === 'circle'}
              onChange={() => {
                setShapeType('circle');
                setError('');
              }}
            />
            Circle
          </label>
        </div>
      </div>

      {shapeType === 'polygon' ? (
        <>
          <div className="input-row">
            <button className="btn-secondary" onClick={handleUseRectangleTemplate}>Rectangle</button>
            <button className="btn-secondary" onClick={handleUseTriangleTemplate}>Triangle</button>
          </div>

          <div className="input-group">
            <label>Vertices JSON</label>
            <textarea
              value={verticesText}
              onChange={(e) => setVerticesText(e.target.value)}
              rows={8}
              style={{ resize: 'vertical', minHeight: 130 }}
            />
          </div>
        </>
      ) : (
        <>
          <div className="input-row">
            <div className="input-group">
              <label>Center X</label>
              <input type="number" min={0} max={canvasWidth} value={circleCenterX} onChange={(e) => setCircleCenterX(e.target.value)} />
            </div>
            <div className="input-group">
              <label>Center Y</label>
              <input type="number" min={0} max={canvasHeight} value={circleCenterY} onChange={(e) => setCircleCenterY(e.target.value)} />
            </div>
          </div>

          <div className="input-group">
            <label>Radius</label>
            <input type="number" min={1} max={Math.min(canvasWidth, canvasHeight) / 2} value={circleRadius} onChange={(e) => setCircleRadius(e.target.value)} />
          </div>
        </>
      )}

      {error && (
        <p style={{ margin: 0, color: '#b00020', fontSize: 13 }}>{error}</p>
      )}

      <div className="input-row">
        <button className="btn-primary" onClick={handleCreateObstacle}>Create Obstacle</button>
        <button className="btn-secondary" onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}
