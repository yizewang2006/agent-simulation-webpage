import { useState, useEffect, useRef, useCallback } from 'react';
import { CircleObstacle, PolygonObstacle } from '../../models/obstacle.js';
import { ENTITY_TYPES, OBSTACLE_SHAPE_TYPES } from '../../utils/constants.js';
import { createEntityID } from '../../utils/utilities.js';
import { CirclePlus, CircleX, SquarePlus, Trash2 } from 'lucide-react';

const DEFAULT_POLYGON_VERTICES = [
  { x: '180', y: '220' },
  { x: '320', y: '220' },
  { x: '320', y: '260' },
  { x: '180', y: '260' },
];

export default function ObstacleCard({ ctxRef, obstaclesArrayRef, obstaclePreviewRef, canvasWidth, canvasHeight, onObstaclesChanged, onClose }) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#ACAD9D');
  const [shapeType, setShapeType] = useState('polygon');
  const [vertices, setVertices] = useState(DEFAULT_POLYGON_VERTICES);
  const [circleCenterX, setCircleCenterX] = useState(250);
  const [circleCenterY, setCircleCenterY] = useState(250);
  const [circleRadius, setCircleRadius] = useState(45);
  const [error, setError] = useState('');
  const cardRef = useRef(null);

  useEffect(() => {
    cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  function handleAddVertex() {
    const lastVertex = vertices[vertices.length - 1] ?? { x: '250', y: '250' };
    const nextX = String(Math.min(canvasWidth, Number(lastVertex.x) + 20 || 250));
    const nextY = String(Math.min(canvasHeight, Number(lastVertex.y) + 20 || 250));
    setVertices([...vertices, { x: nextX, y: nextY }]);
    setError('');
  }

  function handleUpdateVertex(index, field, value) {
    setVertices(vertices.map((vertex, vertexIndex) => (
      vertexIndex === index ? { ...vertex, [field]: value } : vertex
    )));
  }

  function handleDeleteVertex(index) {
    if (vertices.length <= 3) {
      setError('Polygon obstacles need at least 3 vertices.');
      return;
    }

    setVertices(vertices.filter((_, vertexIndex) => vertexIndex !== index));
    setError('');
  }

  const parseVertices = useCallback(() => {
    if (!Array.isArray(vertices) || vertices.length < 3) {
      throw new Error('Obstacle needs at least 3 vertices.');
    }

    vertices.forEach((vertex, index) => {
      const x = Number(vertex.x);
      const y = Number(vertex.y);
      if (!Number.isFinite(x) || !Number.isFinite(y)) {
        throw new Error(`Vertex ${index + 1} needs numeric x and y values.`);
      }
      if (x < 0 || x > canvasWidth || y < 0 || y > canvasHeight) {
        throw new Error(`Vertex ${index + 1} is outside the canvas.`);
      }
    });

    return vertices.map((vertex) => ({
      x: Number(vertex.x),
      y: Number(vertex.y),
    }));
  }, [vertices, canvasWidth, canvasHeight]);

  const parseCircle = useCallback(() => {
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
  }, [circleCenterX, circleCenterY, circleRadius, canvasWidth, canvasHeight]);

  useEffect(() => {
    if (!obstaclePreviewRef) return;

    // Keep the canvas preview in sync with the current form values. Invalid
    // drafts are hidden until the user enters enough valid geometry again.
    try {
      if (shapeType === 'circle') {
        const { center, radius } = parseCircle();
        obstaclePreviewRef.current = {
          shapeType: OBSTACLE_SHAPE_TYPES.CIRCLE,
          center,
          radius,
        };
      } else {
        obstaclePreviewRef.current = {
          shapeType: OBSTACLE_SHAPE_TYPES.POLYGON,
          vertices: parseVertices(),
        };
      }
    } catch {
      obstaclePreviewRef.current = null;
    }

    return () => {
      obstaclePreviewRef.current = null;
    };
  }, [shapeType, obstaclePreviewRef, parseCircle, parseVertices]);

  function handleCreateObstacle() {
    try {
      const ctx = ctxRef.current;
      if (!ctx) throw new Error('Canvas context is not ready.');

      const obstacleName = name.trim() || `Obstacle_${obstaclesArrayRef.current.length + 1}`;
      let obstacle;

      if (shapeType === 'circle') {
        const { center, radius } = parseCircle();
        obstacle = new CircleObstacle(
          createEntityID(ENTITY_TYPES.OBSTACLE),
          obstacleName,
          center,
          radius,
          color,
          ctx
        );
      } else {
        const vertices = parseVertices();
        obstacle = new PolygonObstacle(
          createEntityID(ENTITY_TYPES.OBSTACLE),
          obstacleName,
          vertices,
          color,
          ctx
        );
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

      <div className="obstacle-shape-editor">
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
            <div className="obstacle-vertices-editor">
              {vertices.map((vertex, index) => (
                <div key={index} className="obstacle-vertex-row">
                  <span className="obstacle-vertex-label">Vertex {index + 1}</span>
                  <div className="input-group">
                    <label>X</label>
                    <input
                      type="number"
                      min={0}
                      max={canvasWidth}
                      value={vertex.x}
                      onChange={(e) => handleUpdateVertex(index, 'x', e.target.value)}
                    />
                  </div>
                  <div className="input-group">
                    <label>Y</label>
                    <input
                      type="number"
                      min={0}
                      max={canvasHeight}
                      value={vertex.y}
                      onChange={(e) => handleUpdateVertex(index, 'y', e.target.value)}
                    />
                  </div>
                  <button
                    className="btn-secondary icon-only-button obstacle-vertex-delete"
                    onClick={() => handleDeleteVertex(index)}
                    disabled={vertices.length <= 3}
                    aria-label={`Delete vertex ${index + 1}`}
                    title={vertices.length <= 3 ? 'Polygon needs at least 3 vertices' : `Delete vertex ${index + 1}`}
                  >
                    <Trash2 size={15} aria-hidden="true" />
                  </button>
                </div>
              ))}
              <button className="btn-secondary icon-button" onClick={handleAddVertex}>
                <CirclePlus className="button-icon" size={16} aria-hidden="true" />
                Add Vertex
              </button>
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
      </div>

      {error && (
        <p style={{ margin: 0, color: '#b00020', fontSize: 13 }}>{error}</p>
      )}

      <div className="input-row">
        <button className="btn-primary icon-button" onClick={handleCreateObstacle}>
          <SquarePlus className="button-icon" size={16} aria-hidden="true" />
          Create Obstacle
        </button>
        <button className="btn-secondary icon-button" onClick={onClose}>
          <CircleX className="button-icon" size={16} aria-hidden="true" />
          Cancel
        </button>
      </div>
    </div>
  );
}
