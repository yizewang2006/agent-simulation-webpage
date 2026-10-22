import { useEffect, useRef, useState } from 'react';
import { CirclePlus, Trash2, UserPen } from 'lucide-react';
import { OBSTACLE_SHAPE_TYPES } from '../../utils/constants.js';

function getAgentColor(agent) {
  return agent?.colorHex ?? agent?.originalColor ?? agent?.color ?? '#000000';
}

function numberOrFallback(value, fallback) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
}

function getObstacleVertices(obstacle) {
  return obstacle?.vertices?.map((vertex) => ({
    x: String(vertex.x),
    y: String(vertex.y),
  })) ?? [];
}

// Combined editor for live simulation entities.
// Simulation.jsx passes selectedEntity as { type, entity }; this component
// chooses the correct editing branch while keeping one shared "Entity Editor"
// card for future entity types such as Leader and Exit.
export default function EntityEditor({
  selectedEntity,
  canvasWidth,
  canvasHeight,
  onApplyAgent,
  onApplyObstacle,
  onDeleteAgent,
  onDeleteObstacle,
  onDeselect,
}) {
  const [agentName, setAgentName] = useState('');
  const [agentColor, setAgentColor] = useState('#000000');
  const [showFOV, setShowFOV] = useState(false);
  const [fovAngle, setFovAngle] = useState('150');
  const [obstacleName, setObstacleName] = useState('');
  const [obstacleColor, setObstacleColor] = useState('#ACAD9D');
  const [circleCenterX, setCircleCenterX] = useState('250');
  const [circleCenterY, setCircleCenterY] = useState('250');
  const [circleRadius, setCircleRadius] = useState('45');
  const [vertices, setVertices] = useState([]);
  const [error, setError] = useState('');
  const cardRef = useRef(null);

  const selectedAgent = selectedEntity?.type === 'agent' ? selectedEntity.entity : null;
  const selectedObstacle = selectedEntity?.type === 'obstacle' ? selectedEntity.entity : null;

  // Selection workflow:
  // 1. User clicks "Edit" in Agent List or Obstacle List.
  // 2. Simulation.jsx updates selectedEntity.
  // 3. This effect copies the live object into local form state.
  // 4. The card scrolls into view so the edit controls are immediately visible.
  useEffect(() => {
    setError('');

    if (selectedAgent) {
      setAgentName(selectedAgent.name);
      setAgentColor(getAgentColor(selectedAgent));
      setShowFOV(Boolean(selectedAgent.showFOV));
      setFovAngle(String(Math.round((selectedAgent.fovAngle ?? 0) * 180 / Math.PI)));
      cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    if (selectedObstacle) {
      setObstacleName(selectedObstacle.name);
      setObstacleColor(selectedObstacle.color ?? '#ACAD9D');
      if (selectedObstacle.shapeType === OBSTACLE_SHAPE_TYPES.CIRCLE) {
        setCircleCenterX(String(selectedObstacle.transform.position.x));
        setCircleCenterY(String(selectedObstacle.transform.position.y));
        setCircleRadius(String(selectedObstacle.radius ?? 45));
      } else {
        setVertices(getObstacleVertices(selectedObstacle));
      }
      cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [selectedAgent, selectedObstacle]);

  // Agent apply workflow:
  // The Apply button calls this, then Simulation.jsx mutates the live Agent
  // object and refreshes the React roster state.
  function applyAgent() {
    onApplyAgent({
      name: agentName,
      color: agentColor,
      showFOV,
      fovAngle,
    });
  }

  // Circle validation mirrors the create-obstacle form: the circle must have a
  // positive radius and stay completely inside the simulation canvas.
  function parseCircle() {
    const centerX = numberOrFallback(circleCenterX, selectedObstacle.transform.position.x);
    const centerY = numberOrFallback(circleCenterY, selectedObstacle.transform.position.y);
    const radius = numberOrFallback(circleRadius, selectedObstacle.radius);

    if (radius <= 0) {
      throw new Error('Circle radius must be a positive number.');
    }
    if (
      centerX - radius < 0 ||
      centerX + radius > canvasWidth ||
      centerY - radius < 0 ||
      centerY + radius > canvasHeight
    ) {
      throw new Error('Circle obstacle must fit inside the canvas.');
    }

    return { center: { x: centerX, y: centerY }, radius };
  }

  // Polygon validation keeps the edited obstacle usable by collision logic:
  // at least 3 vertices, all numeric, all inside the canvas bounds.
  function parseVertices() {
    if (vertices.length < 3) {
      throw new Error('Polygon obstacles need at least 3 vertices.');
    }

    return vertices.map((vertex, index) => {
      const x = Number(vertex.x);
      const y = Number(vertex.y);
      if (!Number.isFinite(x) || !Number.isFinite(y)) {
        throw new Error(`Vertex ${index + 1} needs numeric X and Y values.`);
      }
      if (x < 0 || x > canvasWidth || y < 0 || y > canvasHeight) {
        throw new Error(`Vertex ${index + 1} must be inside the canvas.`);
      }
      return { x, y };
    });
  }

  // Obstacle apply workflow:
  // The Apply button builds one updates object. Simulation.jsx then writes that
  // data back onto the live CircleObstacle or PolygonObstacle instance.
  function applyObstacle() {
    try {
      const updates = {
        name: obstacleName.trim() || selectedObstacle.name,
        color: obstacleColor,
      };

      if (selectedObstacle.shapeType === OBSTACLE_SHAPE_TYPES.CIRCLE) {
        Object.assign(updates, parseCircle());
      } else {
        updates.vertices = parseVertices();
      }

      onApplyObstacle(updates);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }

  // Polygon vertex workflow:
  // Inputs edit local vertex draft state first. The live obstacle only changes
  // after the user presses Apply, which prevents partial invalid coordinates
  // from breaking collision/drawing code mid-edit.
  function updateVertex(index, field, value) {
    setVertices((currentVertices) => currentVertices.map((vertex, vertexIndex) => (
      vertexIndex === index ? { ...vertex, [field]: value } : vertex
    )));
  }

  function addVertex() {
    const lastVertex = vertices[vertices.length - 1] ?? { x: '250', y: '250' };
    setVertices((currentVertices) => [
      ...currentVertices,
      {
        x: String(Math.min(canvasWidth, Number(lastVertex.x) + 20 || 250)),
        y: String(Math.min(canvasHeight, Number(lastVertex.y) + 20 || 250)),
      },
    ]);
    setError('');
  }

  function deleteVertex(index) {
    if (vertices.length <= 3) {
      setError('Polygon obstacles need at least 3 vertices.');
      return;
    }
    setVertices((currentVertices) => currentVertices.filter((_, vertexIndex) => vertexIndex !== index));
    setError('');
  }

  return (
    <div ref={cardRef} className="panel-card">
      <h2 className="panel-section-title title-with-icon">
        <UserPen className="section-title-icon" size={18} aria-hidden="true" />
        Entity Editor
      </h2>

      {!selectedEntity && (
        <p className="scenario-empty-state">Select an agent or obstacle from the list to edit it.</p>
      )}

      {/* Agent branch: reused from the old AgentEditor, now under Entity Editor. */}
      {selectedAgent && (
        <>
          <div className="input-group">
            <label>Entity Type</label>
            <input value="Agent" disabled />
          </div>
          <div className="input-group">
            <label>Name</label>
            <input type="text" value={agentName} onChange={(event) => setAgentName(event.target.value)} />
          </div>
          <div className="input-group">
            <label>Color</label>
            <input type="color" value={agentColor} onChange={(event) => setAgentColor(event.target.value)} />
          </div>
          <div className="input-group">
            <label>
              <input type="checkbox" checked={showFOV} onChange={(event) => setShowFOV(event.target.checked)} />
              Show FOV
            </label>
          </div>
          <div className="input-group">
            <label>FOV Angle (deg)</label>
            <input type="number" min="0" max="360" value={fovAngle} onChange={(event) => setFovAngle(event.target.value)} />
          </div>
          <div className="btn-row">
            <button className="btn-primary" onClick={applyAgent}>Apply</button>
            <button className="btn-secondary" onClick={onDeselect}>Deselect</button>
          </div>
          {/* Delete Agent calls back to Simulation.jsx so the live agents ref and React roster stay in sync. */}
          <button className="btn-danger icon-button" onClick={onDeleteAgent}>
            <Trash2 className="button-icon" size={16} aria-hidden="true" />
            Delete Agent
          </button>
        </>
      )}

      {/* Obstacle branch: one card handles both circle and polygon obstacles. */}
      {selectedObstacle && (
        <>
          <div className="input-group">
            <label>Entity Type</label>
            <input value={selectedObstacle.shapeType === OBSTACLE_SHAPE_TYPES.CIRCLE ? 'Circle Obstacle' : 'Polygon Obstacle'} disabled />
          </div>
          <div className="input-group">
            <label>Name</label>
            <input type="text" value={obstacleName} onChange={(event) => setObstacleName(event.target.value)} />
          </div>
          <div className="input-group">
            <label>Color</label>
            <input type="color" value={obstacleColor} onChange={(event) => setObstacleColor(event.target.value)} />
          </div>

          {selectedObstacle.shapeType === OBSTACLE_SHAPE_TYPES.CIRCLE && (
            <>
              <div className="input-row">
                <div className="input-group">
                  <label>Center X</label>
                  <input type="number" value={circleCenterX} onChange={(event) => setCircleCenterX(event.target.value)} />
                </div>
                <div className="input-group">
                  <label>Center Y</label>
                  <input type="number" value={circleCenterY} onChange={(event) => setCircleCenterY(event.target.value)} />
                </div>
              </div>
              <div className="input-group">
                <label>Radius</label>
                <input type="number" min="1" value={circleRadius} onChange={(event) => setCircleRadius(event.target.value)} />
              </div>
            </>
          )}

          {selectedObstacle.shapeType === OBSTACLE_SHAPE_TYPES.POLYGON && (
            <div className="obstacle-vertices-editor">
              {vertices.map((vertex, index) => (
                <div className="obstacle-vertex-row" key={`${selectedObstacle.id}-vertex-${index}`}>
                  <span className="obstacle-vertex-label">Vertex {index + 1}</span>
                  <div className="input-group">
                    <label>X</label>
                    <input type="number" min="0" max={canvasWidth} value={vertex.x} onChange={(event) => updateVertex(index, 'x', event.target.value)} />
                  </div>
                  <div className="input-group">
                    <label>Y</label>
                    <input type="number" min="0" max={canvasHeight} value={vertex.y} onChange={(event) => updateVertex(index, 'y', event.target.value)} />
                  </div>
                  <button
                    className="btn-secondary icon-only-button obstacle-vertex-delete"
                    onClick={() => deleteVertex(index)}
                    disabled={vertices.length <= 3}
                    aria-label={`Delete vertex ${index + 1}`}
                    title={vertices.length <= 3 ? 'Polygon needs at least 3 vertices' : `Delete vertex ${index + 1}`}
                  >
                    <Trash2 size={15} aria-hidden="true" />
                  </button>
                </div>
              ))}
              <button className="btn-secondary icon-button" onClick={addVertex}>
                <CirclePlus className="button-icon" size={16} aria-hidden="true" />
                Add Vertex
              </button>
            </div>
          )}

          {error && <p className="scenario-configuration-error">{error}</p>}

          <div className="btn-row">
            <button className="btn-primary" onClick={applyObstacle}>Apply</button>
            <button className="btn-secondary" onClick={onDeselect}>Deselect</button>
          </div>
          <button className="btn-danger icon-button" onClick={onDeleteObstacle}>
            <Trash2 className="button-icon" size={16} aria-hidden="true" />
            Delete Obstacle
          </button>
        </>
      )}
    </div>
  );
}
